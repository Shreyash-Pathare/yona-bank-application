const ATMCardService = require("../service/ATMCardService")
const { recordFailedPinAttempt, resetPinAttempts } = require("../middleware/atmMiddleware") // CHANGE 1: new import

class ATMCardController{
    static addNewCard = async (req,res)=>{
        // NO CHANGE
        const res_obj = await ATMCardService.addNewCard(req.user,req.body)
        res.status(201).send(res_obj)
    }

    static getATMById = async (req,res)=>{
        // NO CHANGE
        const res_obj = await ATMCardService.getATMById(req.user,req.params.id)
        res.status(200).send(res_obj)
    }

    static withdrawalByATM = async(req,res)=>{
        // CHANGE 2: added try/catch to handle PIN failures and trigger attempt tracking
        try {
            const res_obj = await ATMCardService.withdrawalByATM(req.user,req.params.id,req.body)
            resetPinAttempts(req.params.id)   // CHANGE 3: reset attempts on successful withdrawal
            res.status(200).send(res_obj)
        } catch(err) {
            if(err.statusCode === 401){        // CHANGE 4: 401 means wrong PIN in our service
                await recordFailedPinAttempt(req.params.id)  // track the failed attempt
            }
            res.status(err.statusCode || 500).send({ msg: err.message })
        }
    }
}

module.exports = ATMCardController