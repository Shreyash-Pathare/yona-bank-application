const { AccountModel } = require("../models/Account.model")
const { ATMmodel } = require("../models/ATMCard.model")
const { UserModel } = require("../models/User.model")
const ApiError = require("../utils/ApiError")
const { default: random } = require("random-int")
const { Account_LIMIT, CARD_TYPE } = require("../utils/constant")
const { TransactionModel } = require("../models/Transactions.model")
const bcrypt = require("bcryptjs")

class ATMCardService {

    static addNewCard = async (user, body) => {

        const exist_atm = await ATMmodel.findOne({
            account: body.account,
            card_type: body.card_type
        })

        if (exist_atm) {
            throw new ApiError(400, "Card Already Exists")
        }

        const generateATMNO = () => {
            return random(1000, 9999) + "" + random(1000, 9999) + "" + random(1000, 9999) + "" + random(1000, 9999)
        }

        const cvv_no = random(100, 999)

        // FIX: Expiry set to 3 YEARS instead of 3 months
        const date = new Date()
        date.setFullYear(date.getFullYear() + 3)
        const expiry = date

        // FIX: Hash the PIN before saving
        const hashedPin = await bcrypt.hash(String(body.pin), 10)

        // FIX: Hash the CVV before saving
        const hashedCvv = await bcrypt.hash(String(cvv_no), 10)

        await ATMmodel.create({
            account: body.account,
            card_no: generateATMNO(),
            card_type: body.card_type,
            cvv: hashedCvv,
            pin: hashedPin,
            expiry: expiry,
            user
        })

        // Return CVV once to the user (only time it should be visible)
        return {
            msg: "Card Generated :)",
            cvv: cvv_no  // shown once, not stored in plain text
        }
    }

    static getATMById = async (user, id) => {

        const atmCard = await ATMmodel.findById(id).select("-pin -cvv -user -account")

        if (!atmCard) {
            throw new ApiError(404, "Card Not Found")
        }

        // FIX: Ownership check - ensure card belongs to requesting user
        const fullCard = await ATMmodel.findById(id)
        if (fullCard.user.toString() !== user.toString()) {
            throw new ApiError(403, "Unauthorized: This card does not belong to you")
        }

        return atmCard
    }

    static withdrawalByATM = async (user, id, body) => {

        const user_exist = await UserModel.findById(user)
        const amount_req = Number(body.amount)

        if (!user_exist) {
            throw new ApiError(401, "Invalid User")
        }

        const atm_details = await ATMmodel.findById(id)
        if (!atm_details) {
            throw new ApiError(400, "Card Details Not Found")
        }

        // FIX: Check if the card belongs to the user
        if (atm_details.user.toString() !== user.toString()) {
            throw new ApiError(403, "Unauthorized: This card does not belong to you")
        }

        // FIX: Check card expiry
        if (new Date() > new Date(atm_details.expiry)) {
            throw new ApiError(400, "Card has expired. Please request a new card.")
        }

        const account = await AccountModel.findById(atm_details.account)
        if (!account) {
            throw new ApiError(400, "Account Not Found")
        }

        // FIX: PIN verification using bcrypt compare
        const isPinValid = await bcrypt.compare(String(body.pin), atm_details.pin)
        if (!isPinValid) {
            await TransactionModel.create({
                type: 'debit',
                account: account._id,
                user: user,
                isSuccess: false,
                amount: amount_req,
                remark: `Withdrawal failed: Invalid PIN entered`
            })
            throw new ApiError(401, "Invalid PIN")
        }

        // Check account limit for current account
        if (account.ac_type === 'current') {
            if (account.amount <= Account_LIMIT.current) {
                await TransactionModel.create({
                    type: 'debit',
                    account: account._id,
                    user: user,
                    isSuccess: false,
                    amount: amount_req,
                    remark: `Withdrawal failed: Insufficient balance (below account limit)`
                })
                throw new ApiError(400, "Insufficient Balance: Account limit reached")
            }
        }

        // FIX: Changed >= to > so user can withdraw exact available balance
        if (amount_req > account.amount) {
            await TransactionModel.create({
                type: 'debit',
                account: account._id,
                user: user,
                isSuccess: false,
                amount: amount_req,
                remark: `Withdrawal failed: Insufficient funds`
            })
            throw new ApiError(400, "Insufficient Funds")
        }

        // FIX: Simplified card type limit check (removed repetitive switch)
        const limits = CARD_TYPE[atm_details.card_type]
        if (!limits) {
            throw new ApiError(400, "Invalid Card Type")
        }
        if (amount_req < limits.min) {
            throw new ApiError(400, `Minimum withdrawal amount is ${limits.min}`)
        }
        if (amount_req > limits.max) {
            throw new ApiError(400, `Maximum withdrawal amount is ${limits.max}`)
        }

        // Deduct amount from account
        await AccountModel.findByIdAndUpdate(account._id, {
            amount: account.amount - amount_req
        })

        // Record successful transaction
        await TransactionModel.create({
            type: 'debit',
            account: account._id,
            user: user,
            isSuccess: true,
            amount: amount_req,
            remark: `Withdrawal of ${amount_req} successful`
        })

        return {
            msg: "Amount Withdrawn Successfully",
            remaining_balance: account.amount - amount_req
        }
    }

}

module.exports = ATMCardService