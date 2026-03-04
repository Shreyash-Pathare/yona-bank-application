const express = require("express")
const AuthMiddleware = require("../../middleware/AuthMiddleware")
const ATMCardValidation = require("../../validations/ATMCardValidation")
const ValidationMiddleware = require("../../middleware/ValidationMiddleware")
const ATMCardController = require("../../controller/ATMCardController")
const { checkCardBlocked } = require("../../middleware/atmMiddleware") // CHANGE 1: new import
const router = express.Router()

router.use(AuthMiddleware)

// NO CHANGE
router.post('/add-new', ATMCardValidation.addNewATM, ValidationMiddleware, ATMCardController.addNewCard)

// NO CHANGE
router.get('/get/:id', ATMCardValidation.atmId, ValidationMiddleware, ATMCardController.getATMById)

// CHANGE 2: added checkCardBlocked middleware before controller
// it checks if card is blocked BEFORE even hitting the service
router.post('/withdrawal/:id', [...ATMCardValidation.atmId, ...ATMCardValidation.withdrawalByATM], ValidationMiddleware, checkCardBlocked, ATMCardController.withdrawalByATM)


module.exports = router