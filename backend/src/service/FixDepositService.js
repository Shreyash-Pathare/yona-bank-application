const mongoose = require("mongoose");

const { AccountModel } = require("../models/Account.model");
const { FixDepositModel } = require("../models/FixDeposit.model");
const { TransactionModel } = require("../models/Transactions.model");

const { Account_LIMIT } = require("./../utils/constant");
const ApiError = require("../utils/ApiError");

class FixDepositService {

    static async AddNewFD(body, user) {

        const session = await mongoose.startSession();

        try {
            let createdFD;

            await session.withTransaction(async () => {

                const account = await AccountModel.findById(
                    body.account
                ).session(session);

                if (!account) {
                    throw new ApiError(
                        404,
                        "Account Not Found"
                    );
                }

                const fdAmount = Number(body.amount);

                if (!Number.isFinite(fdAmount) || fdAmount <= 0) {
                    throw new ApiError(
                        400,
                        "Invalid FD Amount"
                    );
                }

                const remainingBalance =
                    account.amount - fdAmount;

                if (remainingBalance < 0) {
                    throw new ApiError(
                        400,
                        "Insufficient Balance"
                    );
                }

                if (
                    account.ac_type === "current" &&
                    remainingBalance < Account_LIMIT.current
                ) {
                    throw new ApiError(
                        400,
                        `Account must maintain minimum balance of ₹${Account_LIMIT.current}`
                    );
                }

                const tenureMonths =
                    Number(body.tenure_months);

                if (
                    !Number.isInteger(tenureMonths) ||
                    tenureMonths <= 0
                ) {
                    throw new ApiError(
                        400,
                        "Invalid FD Tenure"
                    );
                }

                // Backend decides the interest rate
                let interestRate;

                if (tenureMonths <= 6) {
                    interestRate = 6;
                } else if (tenureMonths <= 12) {
                    interestRate = 7;
                } else if (tenureMonths <= 24) {
                    interestRate = 7.5;
                } else {
                    interestRate = 8;
                }

                const startDate = new Date();

                const maturityDate = new Date(startDate);

                maturityDate.setMonth(
                    maturityDate.getMonth() + tenureMonths
                );

                const tenureYears =
                    tenureMonths / 12;

                const interestAmount =
                    fdAmount *
                    (interestRate / 100) *
                    tenureYears;

                const maturityAmount =
                    fdAmount + interestAmount;

                const [fd] =
                    await FixDepositModel.create(
                        [
                            {
                                account: body.account,
                                amount: fdAmount,
                                apply_for: body.apply_for,
                                user,

                                date: startDate,
                                maturity_date: maturityDate,

                                tenure_months: tenureMonths,
                                interest_rate: interestRate,

                                interest_amount: Number(
                                    interestAmount.toFixed(2)
                                ),

                                maturity_amount: Number(
                                    maturityAmount.toFixed(2)
                                ),

                                status: "ACTIVE",

                                remark: `Fund Deposit ₹${fdAmount}`
                            }
                        ],
                        { session }
                    );

                await TransactionModel.create(
                    [
                        {
                            account: body.account,
                            amount: fdAmount,
                            isSuccess: true,
                            type: "fix_deposit",
                            user,
                            remark: `Fund Deposit ₹${fdAmount}`
                        }
                    ],
                    { session }
                );

                await AccountModel.updateOne(
                    {
                        _id: account._id
                    },
                    {
                        $set: {
                            amount: remainingBalance
                        }
                    },
                    {
                        session
                    }
                );

                createdFD = fd;
            });

            return {
                msg: "Fixed Deposit Created Successfully",
                fd: createdFD
            };

        } finally {
            await session.endSession();
        }
    }


    static async getAllFD(user) {

        const fixDeposits = await FixDepositModel
            .find({ user })
            .select(
                "_id apply_for amount date maturity_date tenure_months interest_rate interest_amount maturity_amount status claimed_date"
            )
            .sort({ createdAt: -1 });

        const currentDate = new Date();

        for (const fd of fixDeposits) {

            if (
                fd.status === "ACTIVE" &&
                currentDate >= fd.maturity_date
            ) {
                fd.status = "MATURED";
                await fd.save();
            }
        }

        return fixDeposits;
    }


    static async getFDById(user, id) {

        const foundFD = await FixDepositModel.findOne({
            user,
            _id: id
        });

        if (!foundFD) {
            throw new ApiError(
                404,
                "FD Not Found"
            );
        }

        const currentDate = new Date();

        if (
            foundFD.status === "ACTIVE" &&
            currentDate >= foundFD.maturity_date
        ) {
            foundFD.status = "MATURED";
            await foundFD.save();
        }

        const depositDate =
            new Date(foundFD.date);

        const daysPassed = Math.floor(
            (currentDate - depositDate) /
            (1000 * 60 * 60 * 24)
        );

        const currentInterest =
            foundFD.amount *
            (foundFD.interest_rate / 100) *
            (daysPassed / 365);

        const currentValue =
            foundFD.amount + currentInterest;

        return {
            ...foundFD.toObject(),

            days_passed: daysPassed,

            current_interest: Number(
                currentInterest.toFixed(2)
            ),

            current_value: Number(
                currentValue.toFixed(2)
            )
        };
    }


    static async ClaimFDById(user, id) {

        const session = await mongoose.startSession();

        try {
            let totalClaimAmount;

            await session.withTransaction(async () => {

                /*
                 * Find the FD inside the transaction.
                 * The status check is performed again before
                 * changing the account balance.
                 */
                const foundFD =
                    await FixDepositModel.findOne({
                        user,
                        _id: id
                    }).session(session);

                if (!foundFD) {
                    throw new ApiError(
                        404,
                        "FD Not Found"
                    );
                }

                if (foundFD.status === "CLAIMED") {
                    throw new ApiError(
                        400,
                        "FD Already Claimed"
                    );
                }

                if (
                    foundFD.status ===
                    "PREMATURE_CLOSED"
                ) {
                    throw new ApiError(
                        400,
                        "FD Was Already Closed Prematurely"
                    );
                }

                const currentDate = new Date();

                if (
                    currentDate <
                    foundFD.maturity_date
                ) {
                    throw new ApiError(
                        400,
                        "FD Has Not Matured Yet"
                    );
                }

                if (foundFD.status === "ACTIVE") {
                    foundFD.status = "MATURED";

                    await foundFD.save({
                        session
                    });
                }

                totalClaimAmount =
                    Number(
                        foundFD.maturity_amount.toFixed(2)
                    );

                const account =
                    await AccountModel.findById(
                        foundFD.account
                    ).session(session);

                if (!account) {
                    throw new ApiError(
                        404,
                        "Account Not Found"
                    );
                }

                /*
                 * Only credit the account while the FD is
                 * being changed to CLAIMED in the same
                 * database transaction.
                 */
                await AccountModel.updateOne(
                    {
                        _id: account._id
                    },
                    {
                        $inc: {
                            amount: totalClaimAmount
                        }
                    },
                    {
                        session
                    }
                );

                await TransactionModel.create(
                    [
                        {
                            account: foundFD.account,
                            amount: totalClaimAmount,
                            isSuccess: true,
                            type: "fix_deposit",
                            user,
                            remark:
                                `FD Matured and Claimed ₹${totalClaimAmount}`
                        }
                    ],
                    {
                        session
                    }
                );

                foundFD.status = "CLAIMED";
                foundFD.claimed_date = currentDate;

                await foundFD.save({
                    session
                });
            });

            return {
                msg: "FD Claimed Successfully",
                amount: totalClaimAmount
            };

        } finally {
            await session.endSession();
        }
    }
}

module.exports = FixDepositService;
