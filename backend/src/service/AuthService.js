
const { UserModel } = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const bcryptjs = require("bcryptjs");
const JWTService = require("../utils/JwtService");
const crypto = require("crypto");
const { AccountModel } = require("../models/Account.model");
const { TransactionModel } = require("../models/Transactions.model");
const { FixDepositModel } = require("../models/FixDeposit.model");
const { ATMmodel } = require("../models/ATMCard.model");


class AuthService {

    static async loginUser(body) {

        const { email, password } = body;

        const check_exist = await UserModel.findOne({
            email: email.toLowerCase()
        });

        if (!check_exist) {
            throw new ApiError(
                400,
                "No Account Found"
            );
        }

        const isMatch = await bcryptjs.compare(
            password,
            check_exist.password
        );

        if (!isMatch) {
            throw new ApiError(
                400,
                "Invalid Credentials"
            );
        }

        const token = JWTService.generateToken(
            check_exist._id
        );

        return {
            msg: "Login Success",
            token
        };
    }


    static async registerUser(body) {

        const {
            name,
            email,
            password,
            ac_type
        } = body;

        const normalizedEmail =
            email.toLowerCase();

        const check_exist = await UserModel.findOne({
            email: normalizedEmail
        });

        if (check_exist) {
            throw new ApiError(
                400,
                "Email Already Exist"
            );
        }

        const user = await UserModel.create({
            name,
            email: normalizedEmail,
            password,
            ac_type
        });


        function generateAccountNumber() {
     
            return crypto.randomInt(1000000000, 10000000000).toString();
        } 
        const accountNumber = generateAccountNumber();
        
        const ac = await AccountModel.create({
            user: user._id,
            accountNumber,
            amount: 0,
            ac_type
        });

        await TransactionModel.create({
            user: user._id,
            account: ac._id,
            amount: 0,
            type: "credit",
            isSuccess: true,
            remark: "Account Opening !"
        });

        const token =
            JWTService.generateToken(user._id);

        return {
            msg: "Register Success",
            token
        };
    }


    static async profileUser(user) {

        const userd = await UserModel
            .findById(user)
            .select(
                "name email ac_type createdAt -_id"
            );

        if (!userd) {
            throw new ApiError(
                401,
                "Profile Not Found"
            );
        }

        const [
            accounts,
            fixDeposits,
            atms
        ] = await Promise.all([

            AccountModel
                .find({ user })
                .select("_id amount ac_type"),

            FixDepositModel
                .find({
                    user,
                    status: {
                        $nin: [
                            "CLAIMED",
                            "PREMATURE_CLOSED"
                        ]
                    }
                })
                .select(
                    "_id account apply_for amount date maturity_date tenure_months interest_rate interest_amount maturity_amount status"
                )
                .sort({
                    createdAt: -1
                }),

            ATMmodel
                .find({ user })
                .select("_id card_type")
        ]);


        let account_no = accounts;


        if (accounts.length === 0) {

            const ac = await AccountModel.create({
                user,
                amount: 0
            });

            await TransactionModel.create({
                account: ac._id,
                amount: 0,
                type: "credit",
                isSuccess: true,
                remark: "Account Opening !",
                user
            });

            account_no = [{
                _id: ac._id,
                amount: ac.amount,
                ac_type: ac.ac_type
            }];
        }


        const fd_amount = fixDeposits.length > 0
            ? fixDeposits.reduce(
                (total, fd) => total + fd.amount,
                0
            )
            : 0;


        return {
            ...userd.toObject(),

            account_no,

            fd_amount,

            fds: fixDeposits,

            atms
        };
    }
}


module.exports = AuthService;
