const mongoose = require("mongoose");
const { AccountModel } = require("../models/Account.model");
const { ATMmodel } = require("../models/ATMCard.model");
const { UserModel } = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const { default: random } = require("random-int");
const {
    Account_LIMIT,
    CARD_TYPE
} = require("../utils/constant");
const { TransactionModel } = require("../models/Transactions.model");
const bcrypt = require("bcryptjs");

class ATMCardService {

    static addNewCard = async (user, body) => {

        const exist_atm = await ATMmodel.findOne({
            account: body.account,
            card_type: body.card_type
        });

        if (exist_atm) {
            throw new ApiError(
                400,
                "Card Already Exists"
            );
        }

        // Generate a 16-digit ATM card number
        const generateATMNO = () => {
            return (
                random(1000, 9999) +
                "" +
                random(1000, 9999) +
                "" +
                random(1000, 9999) +
                "" +
                random(1000, 9999)
            );
        };

        const cvv_no = random(100, 999);

        // Card expiry: 3 years
        const date = new Date();
        date.setFullYear(date.getFullYear() + 3);

        const expiry = date;

        // Hash PIN before storing
        const hashedPin = await bcrypt.hash(
            String(body.pin),
            10
        );

        // Hash CVV before storing
        const hashedCvv = await bcrypt.hash(
            String(cvv_no),
            10
        );

        const account = await AccountModel.findById(
            body.account
        );

        if (!account) {
            throw new ApiError(
                404,
                "Account Not Found"
            );
        }

        // Ensure the account belongs to the logged-in user
        if (
            account.user.toString() !==
            user.toString()
        ) {
            throw new ApiError(
                403,
                "Unauthorized: This account does not belong to you"
            );
        }

        await ATMmodel.create({
            account: body.account,
            card_no: generateATMNO(),
            card_type: body.card_type,
            cvv: hashedCvv,
            pin: hashedPin,
            expiry: expiry,
            user
        });

        // CVV is returned only once
        return {
            msg: "Card Generated :)",
            cvv: cvv_no
        };
    };


    static getATMById = async (user, id) => {

        const atmCard = await ATMmodel
            .findOne({
                _id: id,
                user: user
            })
            .select("-pin -cvv -user -account");

        if (!atmCard) {
            throw new ApiError(
                404,
                "Card Not Found"
            );
        }

        return atmCard;
    };


    static withdrawalByATM = async (
        user,
        id,
        body
    ) => {

        const amount_req = Number(body.amount);

        if (
            !Number.isFinite(amount_req) ||
            amount_req <= 0
        ) {
            throw new ApiError(
                400,
                "Invalid Withdrawal Amount"
            );
        }

        const user_exist =
            await UserModel.findById(user);

        if (!user_exist) {
            throw new ApiError(
                401,
                "Invalid User"
            );
        }

        const atm_details =
            await ATMmodel.findOne({
                _id: id,
                user: user
            });

        if (!atm_details) {
            throw new ApiError(
                404,
                "Card Details Not Found"
            );
        }

        // Check card expiry
        if (
            new Date() >
            new Date(atm_details.expiry)
        ) {
            throw new ApiError(
                400,
                "Card has expired. Please request a new card."
            );
        }

        const limits =
            CARD_TYPE[atm_details.card_type];

        if (!limits) {
            throw new ApiError(
                400,
                "Invalid Card Type"
            );
        }

        // Minimum withdrawal limit
        if (amount_req < limits.min) {
            throw new ApiError(
                400,
                `Minimum withdrawal amount is ${limits.min}`
            );
        }

        // Maximum withdrawal limit
        if (amount_req > limits.max) {
            throw new ApiError(
                400,
                `Maximum withdrawal amount is ${limits.max}`
            );
        }

        /*
         * Verify PIN before starting the financial
         * transaction.
         */
        const isPinValid =
            await bcrypt.compare(
                String(body.pin),
                atm_details.pin
            );

        if (!isPinValid) {

            await TransactionModel.create({
                type: "debit",
                account: atm_details.account,
                user: user,
                isSuccess: false,
                amount: amount_req,
                remark:
                    "Withdrawal failed: Invalid PIN entered"
            });

            throw new ApiError(
                401,
                "Invalid PIN"
            );
        }

        const session =
            await mongoose.startSession();

        try {

            let remainingBalance;

            await session.withTransaction(
                async () => {

                    /*
                     * Fetch the latest account balance
                     * inside the transaction.
                     */
                    const account =
                        await AccountModel.findOne({
                            _id: atm_details.account,
                            user: user
                        }).session(session);

                    if (!account) {
                        throw new ApiError(
                            404,
                            "Account Not Found"
                        );
                    }

                    /*
                     * Current account minimum balance
                     * requirement.
                     */
                    if (
                        account.ac_type === "current" &&
                        account.amount - amount_req <
                            Account_LIMIT.current
                    ) {

                        await TransactionModel.create(
                            [
                                {
                                    type: "debit",
                                    account: account._id,
                                    user: user,
                                    isSuccess: false,
                                    amount: amount_req,
                                    remark:
                                        "Withdrawal failed: Account minimum balance requirement"
                                }
                            ],
                            {
                                session
                            }
                        );

                        throw new ApiError(
                            400,
                            "Insufficient Balance: Account limit reached"
                        );
                    }

                    /*
                     * Atomic balance deduction.
                     *
                     * The condition amount >= amount_req
                     * prevents the account from going
                     * negative.
                     */
                    const updatedAccount =
                        await AccountModel.findOneAndUpdate(
                            {
                                _id: account._id,
                                user: user,
                                amount: {
                                    $gte: amount_req
                                }
                            },
                            {
                                $inc: {
                                    amount: -amount_req
                                }
                            },
                            {
                                new: true,
                                session
                            }
                        );

                    if (!updatedAccount) {

                        await TransactionModel.create(
                            [
                                {
                                    type: "debit",
                                    account: account._id,
                                    user: user,
                                    isSuccess: false,
                                    amount: amount_req,
                                    remark:
                                        "Withdrawal failed: Insufficient funds"
                                }
                            ],
                            {
                                session
                            }
                        );

                        throw new ApiError(
                            400,
                            "Insufficient Funds"
                        );
                    }

                    /*
                     * Record successful transaction.
                     */
                    await TransactionModel.create(
                        [
                            {
                                type: "debit",
                                account: account._id,
                                user: user,
                                isSuccess: true,
                                amount: amount_req,
                                remark:
                                    `Withdrawal of ${amount_req} successful`
                            }
                        ],
                        {
                            session
                        }
                    );

                    remainingBalance =
                        updatedAccount.amount;
                }
            );

            return {
                msg: "Amount Withdrawn Successfully",
                remaining_balance:
                    remainingBalance
            };

        } finally {

            await session.endSession();
        }
    };
}

module.exports = ATMCardService;
