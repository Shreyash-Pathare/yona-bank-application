const mongoose = require("mongoose");
const crypto = require("crypto");

const { AccountModel } = require("../models/Account.model");
const { TransactionModel } = require("../models/Transactions.model");
const { UserModel } = require("../models/User.model");

const ApiError = require("../utils/ApiError");
const stripe = require("../utils/Stripe");


class AmountService {

    // =========================================
    // Add Money
    // =========================================

    static async addMoney(body, user) {

        const amount = Number(body.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            throw new ApiError(
                400,
                "Invalid Amount"
            );
        }


        const account = await AccountModel.findById(
            body.account_no
        );


        if (!account) {
            throw new ApiError(
                404,
                "Account Not Found"
            );
        }


        if (
            account.user.toString() !==
            user.toString()
        ) {
            throw new ApiError(
                403,
                "You are not authorized to use this account"
            );
        }


        const transaction =
            await TransactionModel.create({

                account: body.account_no,

                user: user,

                amount: amount,

                type: "credit",

                isSuccess: false,

                remark: "Payment Initiated"

            });


        try {

            const paymentIntent =
                await stripe.paymentIntents.create({

                    amount:
                        Math.round(amount * 100),

                    currency: "inr",

                    metadata: {

                        txn_id:
                            transaction._id.toString(),

                        account_no:
                            body.account_no.toString(),

                        user:
                            user.toString()

                    }

                });


            return {

                client_secret:
                    paymentIntent.client_secret,

                txn_id:
                    transaction._id

            };


        } catch (error) {

            await TransactionModel.findByIdAndUpdate(
                transaction._id,
                {
                    isSuccess: false,
                    remark: "Payment Creation Failed"
                }
            );


            throw new ApiError(
                500,
                "Unable to create payment"
            );
        }
    }



    // =========================================
    // Verify Payment
    // =========================================

    static async verifyPayment(txn_id) {

        const session =
            await mongoose.startSession();


        try {

            let result;


            await session.withTransaction(
                async () => {

                    const transaction =
                        await TransactionModel.findOne({

                            _id: txn_id,

                            isSuccess: {
                                $ne: true
                            }

                        }).session(session);


                    if (!transaction) {

                        const existingTransaction =
                            await TransactionModel
                                .findById(txn_id)
                                .session(session);


                        if (!existingTransaction) {

                            throw new ApiError(
                                404,
                                "Transaction Not Found"
                            );
                        }


                        if (
                            existingTransaction.isSuccess
                        ) {

                            throw new ApiError(
                                400,
                                "Payment Already Verified"
                            );
                        }


                        throw new ApiError(
                            400,
                            "Payment Cannot Be Verified"
                        );
                    }


                    const account =
                        await AccountModel.findById(
                            transaction.account
                        ).session(session);


                    if (!account) {

                        throw new ApiError(
                            404,
                            "Account Not Found"
                        );
                    }


                    transaction.isSuccess = true;

                    transaction.remark =
                        "Payment Credit";


                    await transaction.save({
                        session
                    });


                    await AccountModel.updateOne(

                        {
                            _id: account._id
                        },

                        {
                            $inc: {
                                amount:
                                    transaction.amount
                            }
                        },

                        {
                            session
                        }

                    );


                    result = {
                        msg:
                            "Payment Verified Successfully"
                    };

                }
            );


            return result;


        } finally {

            await session.endSession();

        }
    }



    // =========================================
    // Get All Transactions
    // =========================================

    static async getAllTransactions(user) {

        const all_transaction =
            await TransactionModel
                .find({ user })
                .sort({
                    createdAt: -1
                })
                .select(
                    "type remark createdAt amount isSuccess"
                );


        return all_transaction;
    }



    // =========================================
    // Add New Account
    // =========================================

    static async addNewAccount(user, body) {

        const session =
            await mongoose.startSession();


        try {

            let result;


            await session.withTransaction(
                async () => {

                    const exist_user =
                        await UserModel
                            .findById(user)
                            .session(session);


                    if (!exist_user) {

                        throw new ApiError(
                            401,
                            "User Not Found"
                        );
                    }


                    function generateAccountNumber() {

                        return crypto
                            .randomInt(
                                1000000000,
                                10000000000
                            )
                            .toString();

                    }


                    const accountNumber =
                        generateAccountNumber();


                    const [ac] =
                        await AccountModel.create(

                            [
                                {
                                    user,

                                    accountNumber,

                                    ac_type:
                                        body.ac_type,

                                    amount: 0
                                }
                            ],

                            {
                                session
                            }

                        );


                    await TransactionModel.create(

                        [
                            {
                                account: ac._id,

                                amount: 0,

                                remark:
                                    "New Account Opening",

                                type: "credit",

                                user: user,

                                isSuccess: true
                            }
                        ],

                        {
                            session
                        }

                    );


                    result = {
                        msg:
                            "Account Created :)"
                    };

                }
            );


            return result;


        } finally {

            await session.endSession();

        }
    }



    // =========================================
    // Fund Transfer
    // =========================================

    static async transferMoney(body, user) {

        const {
            from_account,
            to_account
        } = body;


        const amount =
            Number(body.amount);


        // -----------------------------------------
        // Validate amount
        // -----------------------------------------

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            throw new ApiError(
                400,
                "Invalid Amount"
            );
        }


        // -----------------------------------------
        // Validate account numbers
        // -----------------------------------------

        if (
            !from_account ||
            !to_account
        ) {

            throw new ApiError(
                400,
                "Sender and receiver account are required"
            );
        }


        // -----------------------------------------
        // Prevent same-account transfer
        // -----------------------------------------

        if (
            from_account.toString() ===
            to_account.toString()
        ) {

            throw new ApiError(
                400,
                "Cannot transfer to the same account"
            );
        }


        const session =
            await mongoose.startSession();


        try {

            let result;


            await session.withTransaction(
                async () => {

                    // =====================================
                    // Find sender account
                    // =====================================

                    const sender =
                        await AccountModel.findOne({

                            accountNumber:
                                from_account,

                            user: user

                        }).session(session);


                    if (!sender) {

                        throw new ApiError(
                            404,
                            "Sender Account Not Found"
                        );
                    }


                    // =====================================
                    // Find receiver account
                    // =====================================

                    const receiver =
                        await AccountModel.findOne({

                            accountNumber:
                                to_account

                        }).session(session);


                    if (!receiver) {

                        throw new ApiError(
                            404,
                            "Receiver Account Not Found"
                        );
                    }


                    // =====================================
                    // Check balance
                    // =====================================

                    if (
                        sender.amount < amount
                    ) {

                        throw new ApiError(
                            400,
                            "Insufficient Balance"
                        );
                    }


                    // =====================================
                    // Deduct money from sender
                    // =====================================

                    await AccountModel.updateOne(

                        {
                            _id: sender._id,

                            amount: {
                                $gte: amount
                            }
                        },

                        {
                            $inc: {
                                amount: -amount
                            }
                        },

                        {
                            session
                        }

                    );


                    // =====================================
                    // Add money to receiver
                    // =====================================

                    await AccountModel.updateOne(

                        {
                            _id: receiver._id
                        },

                        {
                            $inc: {
                                amount: amount
                            }
                        },

                        {
                            session
                        }

                    );


                    // =====================================
                    // Sender transaction
                    // =====================================

                    await TransactionModel.create(

                        [
                            {

                                account:
                                    sender._id,

                                user:
                                    sender.user,

                                amount:
                                    amount,

                                type:
                                    "debit",

                                isSuccess:
                                    true,

                                remark:
                                    `Fund Transfer to ${receiver.accountNumber}`

                            }
                        ],

                        {
                            session
                        }

                    );


                    // =====================================
                    // Receiver transaction
                    // =====================================

                    await TransactionModel.create(

                        [
                            {

                                account:
                                    receiver._id,

                                user:
                                    receiver.user,

                                amount:
                                    amount,

                                type:
                                    "credit",

                                isSuccess:
                                    true,

                                remark:
                                    `Fund Transfer from ${sender.accountNumber}`

                            }
                        ],

                        {
                            session
                        }

                    );


                    result = {

                        msg:
                            "Fund Transfer Successful",

                        amount:
                            amount,

                        from_account:
                            sender.accountNumber,

                        to_account:
                            receiver.accountNumber

                    };

                }
            );


            return result;


        } finally {

            await session.endSession();

        }
    }

}


module.exports = AmountService;
