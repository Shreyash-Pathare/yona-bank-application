const AuthService = require("../service/AuthService");

class AuthController {

    static async loginUser(req, res) {
        const res_obj = await AuthService.loginUser(req.body);

        res.cookie("accessToken", res_obj.token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000
        });

        res.status(200).send({
            msg: res_obj.msg
        });
    }

    static async registerUser(req, res) {
        const res_obj = await AuthService.registerUser(req.body);

        res.cookie("accessToken", res_obj.token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000
        });

        res.status(201).send({
            msg: res_obj.msg
        });
    }

    static async profileUser(req, res) {
        const res_obj = await AuthService.profileUser(req.user);

        res.status(200).send(res_obj);
    }


    static async logoutUser(req, res) {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });

    res.status(200).send({
        msg: "Logout Successful"
    });
}


}

module.exports = AuthController;
