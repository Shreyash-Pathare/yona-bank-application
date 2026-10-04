const mongoose = require("mongoose");

const { AccountModel } = require("../models/Account.model");
const { TransactionModel } = require("../models/Transactions.model");
const { UserModel } = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const stripe = require("../utils/Stripe");

class AmountService {

    static async addMoney(body, user) {

        const amount = Number(body.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            throw new ApiError(400, "Invalid Amount");
        }

        const account = await AccountModel.findById(
            body.account_no
        );

        if (!account) {
            throw new ApiError(404, "Account Not Found");
        }

        if (account.user.toString() !== user.toString()) {
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

            // Create Stripe Payment Intent
            const paymentIntent =
                await stripe.paymentIntents.create({
                    amount: Math.round(amount * 100),
                    currency: "inr",

                    metadata: {
                        txn_id: transaction._id.toString(),
                        account_no: body.account_no.toString(),
                        user: user.toString()
                    }
                });

            return {
                client_secret:
                    paymentIntent.client_secret,

                txn_id: transaction._id
            };

        } catch (error) {

            // Mark transaction as failed
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


    static async verifyPayment(txn_id) {

        const session = await mongoose.startSession();

        try {

            let result;

            await session.withTransaction(async () => {

                /*
                 * Find the transaction only if it has not
                 * already been successfully processed.
                 *
                 * This prevents the same payment from
                 * crediting the account twice.
                 */
                const transaction =
                    await TransactionModel.findOne({
                        _id: txn_id,
                        isSuccess: {
                            $ne: true
                        }
                    }).session(session);

                if (!transaction) {

                    const existingTransaction =
                        await TransactionModel.findById(
                            txn_id
                        ).session(session);

                    if (!existingTransaction) {
                        throw new ApiError(
                            404,
                            "Transaction Not Found"
                        );
                    }

                    if (existingTransaction.isSuccess) {
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

                /*
                 * Mark transaction successful.
                 */
                transaction.isSuccess = true;
                transaction.remark = "Payment Credit";

                await transaction.save({
                    session
                });

                /*
                 * Credit the account inside the same
                 * MongoDB transaction.
                 */
                await AccountModel.updateOne(
                    {
                        _id: account._id
                    },
                    {
                        $inc: {
                            amount: transaction.amount
                        }
                    },
                    {
                        session
                    }
                );

                result = {
                    msg: "Payment Verified Successfully"
                };
            });

            return result;

        } finally {

            await session.endSession();
        }
    }


    static async getAllTransactions(user) {

        const all_transaction =
            await TransactionModel
                .find({ user })
                .sort({ createdAt: -1 })
                .select(
                    "type remark createdAt amount isSuccess"
                );

        return all_transaction;
    }


    static async addNewAccount(user, body) {

        const session = await mongoose.startSession();

        try {

            let result;

            await session.withTransaction(async () => {

                const exist_user =
                    await UserModel.findById(user)
                        .session(session);

                if (!exist_user) {
                    throw new ApiError(
                        401,
                        "User Not Found"
                    );
                }

                const [ac] =
                    await AccountModel.create(
                        [
                            {
                                user,
                                ac_type: body.ac_type,
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
                            remark: "New Account Opening",
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
                    msg: "Account Created :)"
                };
            });

            return result;

        } finally {

            await session.endSession();
        }
    }
}

module.exports = AmountService;
