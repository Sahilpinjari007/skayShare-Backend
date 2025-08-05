import { Router } from "express";
import {
  loginUser,
  registerUser,
  logout,
  verfiyOTP,
  reqResetPassword,
  updatePassword,
  checkIsExistingUser,
  resenOTP,
  autoLogin,
} from "../controller/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/isExistingUser").post(checkIsExistingUser);
router.route("/login").post(loginUser);
router.route("/verifyOTP").post(verfiyOTP);
router.route("/resendOTP").post(resenOTP);
router.route("/reset-password").post(reqResetPassword);
router.route("/update-password").post(updatePassword);


// secuar routes
router.route("/auto-login").get(verifyJWT, autoLogin);
router.route("/logout").post(verifyJWT, logout);

export default router;
