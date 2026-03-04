const { ATMmodel } = require("../models/ATMCard.model")
const ApiError = require("../utils/ApiError")

// In-memory store for PIN attempts (use Redis in production)
const pinAttempts = {}

const MAX_ATTEMPTS = 3
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Middleware to block requests if a card is blocked
 * or if too many wrong PIN attempts have been made
 */
const checkCardBlocked = async (req, res, next) => {
    try {
        const cardId = req.params.id

        // Check DB block flag
        const card = await ATMmodel.findById(cardId)
        if (!card) return next(new ApiError(404, "Card Not Found"))

        if (card.is_blocked) {
            return next(new ApiError(403, "This card has been permanently blocked. Please contact support."))
        }

        // Check in-memory attempt lockout
        const attemptData = pinAttempts[cardId]
        if (attemptData) {
            const timeSinceLock = Date.now() - attemptData.lockedAt
            if (attemptData.locked && timeSinceLock < LOCK_DURATION_MS) {
                const remaining = Math.ceil((LOCK_DURATION_MS - timeSinceLock) / 60000)
                return next(new ApiError(429, `Card temporarily locked. Try again in ${remaining} minutes.`))
            } else if (attemptData.locked) {
                // Lock expired, reset
                pinAttempts[cardId] = { count: 0, locked: false }
            }
        }

        next()
    } catch (err) {
        next(err)
    }
}

/**
 * Call this after a failed PIN attempt
 */
const recordFailedPinAttempt = async (cardId) => {
    if (!pinAttempts[cardId]) {
        pinAttempts[cardId] = { count: 0, locked: false }
    }

    pinAttempts[cardId].count += 1

    if (pinAttempts[cardId].count >= MAX_ATTEMPTS) {
        pinAttempts[cardId].locked = true
        pinAttempts[cardId].lockedAt = Date.now()

        // FIX: After 3 failed attempts, permanently block card in DB
        await ATMmodel.findByIdAndUpdate(cardId, { is_blocked: true })
    }
}

/**
 * Call this after a successful PIN
 */
const resetPinAttempts = (cardId) => {
    delete pinAttempts[cardId]
}

module.exports = { checkCardBlocked, recordFailedPinAttempt, resetPinAttempts }