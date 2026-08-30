import express from "express";
import userController from "../controller/user_controller.js";
import upload from "../upload/upload.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();


// ================= REGISTER =================

router.post(
    "/register",
    userController.register
);


// ================= VERIFY OTP =================

router.post(
    "/verify-otp",
    userController.verifyOTP
);


// ================= RESEND OTP =================

router.post(
    "/resend-otp",
    userController.resendOTP
);


// ================= LOGIN =================

router.post(
    "/login",
    userController.login
);


// ================= UPDATE PROFILE =================

router.put(
    "/update-profile",

    // Login required
    authMiddleware,

    // Profile image
    upload.fields([
        {
            name: "profile_img",
            maxCount: 1
        }
    ]),

    userController.updateProfile
);


// ================= GET PROFILE =================

router.get(
    "/profile",
    authMiddleware,
    userController.getProfile
);


// ================= UPDATE ADDRESS =================

router.put(
    "/update-address",
    authMiddleware,
    userController.updateAddress
);


// ================= REQUEST PASSWORD RESET =================

router.post(
    "/request-password-reset",
    authMiddleware,
    userController.requestPasswordReset
);


// ================= RESET PASSWORD =================

router.post(
    "/reset-password",
    authMiddleware,
    userController.resetPassword
);


export { router };
export default router;