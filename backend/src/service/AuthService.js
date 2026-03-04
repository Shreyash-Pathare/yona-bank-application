const { UserModel } = require("../models/User.model")
const ApiError = require("../utils/ApiError")
const bcryptjs = require("bcryptjs")
const JWTService = require("../utils/JwtService")
const { AccountModel } = require("../models/Account.model")
const { TransactionModel } = require("../models/Transactions.model")
const { FixDepositModel } = require("../models/FixDeposit.model")
const { ATMmodel } = require("../models/ATMCard.model")


class AuthService {

    static async loginUser(body) {

        const { email, password } = body

        // CHANGE 1: normalize email to lowercase before lookup
        const check_exist = await UserModel.findOne({ email: email.toLowerCase() })
        if (!check_exist) {
            throw new ApiError(400, "No Account Found")
        }

        const isMatch = await bcryptjs.compare(password, check_exist.password)
        if (!isMatch) {
            throw new ApiError(400, "Invalid Credentials")
        }

        const token = JWTService.generateToken(check_exist._id)

        return {
            msg: "Login Success",
            token: token
        }
    }


    static async registerUser(body) {

        const { name, email, password, ac_type } = body

        // CHANGE 2: normalize email to lowercase before saving
        const normalizedEmail = email.toLowerCase()

        const check_exist = await UserModel.findOne({ email: normalizedEmail })
        if (check_exist) {
            throw new ApiError(400, "Email Already Exist")
        }

        // CHANGE 3: hash password before saving (was plaintext before)
        const hashedPassword = await bcryptjs.hash(password, 10)

        const user = await UserModel.create({
            name,
            email: normalizedEmail,   // was: email (not normalized)
            password: hashedPassword, // was: password (plaintext)
            ac_type
        })

        const ac = await AccountModel.create({
            user: user._id,
            amount: 0,
            ac_type: ac_type
        })

        await TransactionModel.create({
            user: user._id,
            account: ac._id,
            amount: 0,
            type: 'credit',
            isSuccess: true,
            remark: 'Account Opening !'
        })

        const token = JWTService.generateToken(user._id)

        return {
            msg: "Register Success",
            token: token
        }
    }


    static async profileUser(user) {

        // CHANGE 4: moved user check to TOP — was at bottom, would crash before reaching it
        const userd = await UserModel.findById(user)
            .select("name email ac_type createdAt -_id")
        if (!userd) {
            throw new ApiError(401, "Profile Not Found")
        }

        const profile_obj = {}

        // CHANGE 5: run all DB calls in parallel with Promise.all (faster)
        const [account, fixDeposits, atms] = await Promise.all([
            AccountModel.find({ user }).select("_id amount"),
            FixDepositModel.find({ user, isClaimed: false }),
            ATMmodel.find({ user }).select("_id card_type")
        ])

        // CHANGE 6: was !account which is always false since .find() returns [] not null
        if (account.length === 0) {
            const ac = await AccountModel.create({
                user,
                amount: 0
            })

            await TransactionModel.create({
                account: ac._id,
                amount: 0,
                type: 'credit',
                isSuccess: true,
                remark: 'Account Opening !',
                user: user,
            })

            profile_obj['account_no'] = [{
                _id: ac._id,
                amount: ac.amount
            }]
        } else {
            profile_obj['account_no'] = account
        }

        // CHANGE 7: removed unnecessary Promise.resolve() — reduce is synchronous
        profile_obj['fd_amount'] = fixDeposits.length > 0
            ? fixDeposits.reduce((pre, cur) => pre + cur.amount, 0)
            : 0

        return { ...userd.toObject(), ...profile_obj, atms }
    }
}

module.exports = AuthService