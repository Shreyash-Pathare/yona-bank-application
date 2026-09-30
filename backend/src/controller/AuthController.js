const AuthService = require("../service/AuthService");

class AuthController {

    static async loginUser(req, res) {
        const res_obj = await AuthService.loginUser(req.body);

        res.cookie("accessToken", res_obj.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
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
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
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


    const LogoutHandler = async () => {
    try {
        await axiosClient.post("/auth/logout");

        setUser(null);
        setAtm(null);

        toast.success("Logout Successful");

        router.push("/login");
    } catch (error) {
        toast.error(
            error.response?.data?.msg || "Logout failed"
        );
    }
};

}

module.exports = AuthController;
