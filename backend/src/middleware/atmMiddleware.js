const { ATMmodel } = require("../models/ATMCard.model")
const ApiError = require("../utils/ApiError")

const MAX_ATTEMPTS = 3
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// Temporary storage for failed PIN attempts
// In production, use Redis for multiple server instances.
const pinAttempts = {}


/**
 * Check whether the card is allowed to attempt a PIN.
 */
const checkCardBlocked = async (req, res, next) => {
    try {
        const cardId = req.params.id

        // Check if card exists
        const card = await ATMmodel.findById(cardId)

        if (!card) {
            return next(new ApiError(404, "Card Not Found"))
        }

        // Check permanent block
        if (card.is_blocked) {
            return next(
                new ApiError(
                    403,
                    "Card is permanently blocked. Please contact support."
                )
            )
        }

        // Check temporary PIN lock
        const attemptData = pinAttempts[cardId]

        if (attemptData?.locked) {

            const elapsedTime = Date.now() - attemptData.lockedAt

            // Still locked
            if (elapsedTime < LOCK_DURATION_MS) {

                const remainingMinutes = Math.ceil(
                    (LOCK_DURATION_MS - elapsedTime) / 60000
                )

                return next(
                    new ApiError(
                        429,
                        `Too many incorrect PIN attempts. Try again in ${remainingMinutes} minutes.`
                    )
                )
            }

            // Lock expired
            delete pinAttempts[cardId]
        }

        next()

    } catch (error) {
        next(error)
    }
}



const recordFailedPinAttempt = (cardId) => {

   
    if (!pinAttempts[cardId]) {
        pinAttempts[cardId] = {
            count: 0,
            locked: false,
            lockedAt: null
        }
    }

    const attemptData = pinAttempts[cardId]

    attemptData.count += 1

  
    if (attemptData.count >= MAX_ATTEMPTS) {

        attemptData.locked = true
        attemptData.lockedAt = Date.now()

        console.log(
            `Card ${cardId} locked for 15 minutes`
        )
    }
}



const resetPinAttempts = (cardId) => {
    delete pinAttempts[cardId]
}


module.exports = {
    checkCardBlocked,
    recordFailedPinAttempt,
    resetPinAttempts
}
