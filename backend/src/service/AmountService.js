const { AccountModel } = require("../models/Account.model");
const { TransactionModel } = require("../models/Transactions.model");
const { UserModel } = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const stripe = require("../utils/Stripe");

class AmountService {

    static async addMoney(body, user) {

        const transaction = await TransactionModel.create({
            account: body.account_no,
            user: user,
            amount: parseInt(body.amount),
            type: 'credit'
        });

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(body.amount) * 100, // in paise/cents
            currency: 'inr',
            metadata: {
                txn_id: transaction._id.toString(),
                account_no: body.account_no,
                user: user.toString()
            }
        });

        return {
            client_secret: paymentIntent.client_secret,
            txn_id: transaction._id
        };
    }

    static async verifyPayment(txn_id) {

        // update transaction and add amount into account
        const transaction = await TransactionModel.findByIdAndUpdate(txn_id, {
            isSuccess: true,
            remark: 'Payment Credit'
        }, { new: true });

        if (!transaction) {
            throw new ApiError(404, "Transaction Not Found");
        }

        const account = await AccountModel.findById(transaction.account);

        await AccountModel.findByIdAndUpdate(account._id, {
            amount: account.amount + transaction.amount
        });

        return {
            msg: "Payment Verified Successfully"
        };
    }

    static async getAllTransactions(user) {
        const all_transaction = await TransactionModel.find({ user })
            .sort({ createdAt: -1 })
            .select("type remark createdAt amount isSuccess");

        return all_transaction;
    }

    static async addNewAccount(user, body) {

        const exist_user = await UserModel.findById(user);
        if (!exist_user) {
            throw new ApiError(401, "User Not Found");
        }

        const ac = await AccountModel.create({
            user,
            ac_type: body.ac_type,
            amount: 0
        });

        await TransactionModel.create({
            account: ac._id,
            amount: 0,
            remark: 'New Account Opening',
            type: 'credit',
            user: user,
            isSuccess: true
        });

        return {
            msg: "Account Created :)"
        };
    }
}

module.exports = AmountService;
