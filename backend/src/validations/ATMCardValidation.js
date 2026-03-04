const { body, param } = require("express-validator")
const { CARD_TYPE } = require("../utils/constant")

class ATMCardValidation {
    static atmId = [
        // NO CHANGE
        param('id').notEmpty().withMessage("ID is Required").isMongoId().withMessage("ATM ID should be a valid mongodb id")
    ]

    static withdrawalByATM = [
        // CHANGE 1: was isLength({max:4,min:4}) — added isNumeric() to ensure PIN is digits only, not letters like "abcd"
        body('pin')
            .notEmpty().withMessage("PIN is Required")
            .isNumeric().withMessage("PIN must be digits only")   // ADDED
            .isLength({ max: 4, min: 4 }).withMessage("PIN Length Should be equal to 4"),

        // NO CHANGE
        body('amount').isNumeric().notEmpty().withMessage("Amount is Required"),
    ]

    static addNewATM = [
        // NO CHANGE
        body('account').notEmpty().withMessage("Account is Required").isMongoId().withMessage("Account should be a valid mongodb id"),

        // CHANGE 2: same as above — added isNumeric() so PIN like "ab12" is rejected at validation level itself
        body('pin')
            .notEmpty().withMessage("PIN is Required")
            .isNumeric().withMessage("PIN must be digits only")   // ADDED
            .isLength({ max: 4, min: 4 }).withMessage("PIN Length Should be equal to 4"),

        // NO CHANGE
        body('card_type').notEmpty().withMessage("Card Type is Required").isIn(Object.keys(CARD_TYPE)).withMessage("Select Valid Card Type")
    ]
}

module.exports = ATMCardValidation