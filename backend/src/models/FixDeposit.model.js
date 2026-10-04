const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "account",
            required: true
        },

        apply_for: {
            type: String,
            required: true,
            trim: true
        },

        amount: {
            type: Number,
            required: true,
            min: 1
        },

        date: {
            type: Date,
            default: Date.now
        },

        maturity_date: {
            type: Date,
            required: true
        },

        tenure_months: {
            type: Number,
            required: true,
            min: 1
        },

        interest_rate: {
            type: Number,
            required: true,
            min: 0
        },

        interest_amount: {
            type: Number,
            default: 0
        },

        maturity_amount: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: [
                "ACTIVE",
                "MATURED",
                "CLAIMED"
            ],
            default: "ACTIVE"
        },

        claimed_date: {
            type: Date
        },

        remark: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const model = mongoose.model("fix-deposit", Schema);

exports.FixDepositModel = model;
