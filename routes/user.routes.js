import { Router } from "express";
import {
  loginUser,
  registerUser,
  logout,
  verfiyOTP,
  reqResetPassword,
  updatePassword,
  checkIsExistingUser,
  autoLogin,
  uploadAvatar,
  deleteAvatar,
  updateUserName,
  deleteAccount,
  resentOTP,
  refreshAccessToken
} from "../controller/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../services/upload.service.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/isExistingUser").post(checkIsExistingUser);
router.route("/login").post(loginUser);
router.route("/verifyOTP").post(verfiyOTP);
router.route("/resendOTP").post(resentOTP);
router.route("/reset-password").post(reqResetPassword);
router.route("/update-password").post(updatePassword);
router.route("/refresh-token").post(refreshAccessToken);


// secuar routes
router.route("/auto-login").get(verifyJWT, autoLogin);
router.route("/logout").get(verifyJWT, logout);
router.route("/upload-avatar").post(upload.single("avatar"), verifyJWT, uploadAvatar);
router.route("/delete-avatar").delete(verifyJWT, deleteAvatar);
router.route("/update-name").put(verifyJWT, updateUserName);
router.route("/delete-account").delete(verifyJWT, deleteAccount);

export default router;
