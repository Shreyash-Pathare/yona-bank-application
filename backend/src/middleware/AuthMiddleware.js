const ApiError = require("../utils/ApiError");
const JWTService = require("../utils/JwtService");

const AuthMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            throw new ApiError(401, "Please Login First");
        }

        const payload = JWTService.ValidateToken(token);

        req.user = payload.user;

        next();

    } catch (error) {
        next(error);
    }
};

module.exports = AuthMiddleware;
