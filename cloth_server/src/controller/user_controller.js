
import UserService from "../service/userservice.js";

import {
    successResponse,
    errorResponse
} from "../utilization/response.js";

const userController = {

    register: async (req, res) => {
        try {
            const result = await UserService.registerUser(req.body);

            return successResponse(
                res,
                result,
                "User registered successfully. Please verify your email with OTP.",
                201
            );
        } catch (error) {
            return errorResponse(
                res,
                error.message,
                400
            );
        }
    },

    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return errorResponse(
                    res,
                    "Email and OTP are required",
                    400
                );
            }

            const result = await UserService.verifyOTP(
                email,
                otp
            );

            return successResponse(
                res,
                {
                    user: result.user,
                    verified: true
                },
                "OTP verified successfully"
            );

        } catch (error) {

            if (error.message.includes("locked")) {
                return errorResponse(
                    res,
                    error.message,
                    429
                );
            }

            return errorResponse(
                res,
                error.message,
                400
            );
        }
    },

    resendOTP: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return errorResponse(
                    res,
                    "Email is required",
                    400
                );
            }

            const result = await UserService.resendOTP(email);

            return successResponse(
                res,
                result,
                "New OTP sent successfully to your email"
            );

        } catch (error) {

            if (error.message.includes("locked")) {
                return errorResponse(
                    res,
                    error.message,
                    429
                );
            }

            return errorResponse(
                res,
                error.message,
                400
            );
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return errorResponse(
                    res,
                    "Email and password are required",
                    400
                );
            }

            const result = await UserService.loginUser(
                email,
                password
            );

            return successResponse(
                res,
                result,
                "Login successful"
            );

        } catch (error) {

            if (error.message.includes("locked")) {
                return errorResponse(
                    res,
                    error.message,
                    429
                );
            }

            return errorResponse(
                res,
                error.message,
                401
            );
        }
    },

    updateProfile: async (req, res) => {
        try {

            // User ID JWT token se milegi
            const userId = req.user?.userId;

            if (!userId) {
                return errorResponse(
                    res,
                    "Invalid token",
                    401
                );
            }

            const updateData = {
                ...req.body
            };

            const result = await UserService.updateProfile(
                userId,
                updateData,
                req.files
            );

            return successResponse(
                res,
                result,
                "Profile updated successfully"
            );

        } catch (error) {

            console.error(
                "Update profile error:",
                error.message
            );

            return errorResponse(
                res,
                error.message,
                400
            );
        }
    },

    updateAddress: async (req, res) => {
        try {

            const userId = req.user?.userId;

            if (!userId) {
                return errorResponse(
                    res,
                    "Invalid token",
                    401
                );
            }

            const {
                address_id,
                ...addressData
            } = req.body;

            if (!address_id) {
                return errorResponse(
                    res,
                    "Address ID is required",
                    400
                );
            }

            const result = await UserService.updateAddress(
                userId,
                address_id,
                addressData
            );

            return successResponse(
                res,
                result,
                "Address updated successfully"
            );

        } catch (error) {

            return errorResponse(
                res,
                error.message,
                400
            );
        }
    },

    getProfile: async (req, res) => {
        try {

            const userId = req.user?.userId;

            if (!userId) {
                return errorResponse(
                    res,
                    "Invalid token",
                    401
                );
            }

            const result = await UserService.getProfile(
                userId
            );

            return successResponse(
                res,
                result,
                "Profile fetched successfully"
            );

        } catch (error) {

            return errorResponse(
                res,
                error.message,
                404
            );
        }
    },

    requestPasswordReset: async (req, res) => {
        try {

            const userId = req.user?.userId;

            if (!userId) {
                return errorResponse(
                    res,
                    "Invalid token",
                    401
                );
            }

            const result =
                await UserService.requestPasswordResetByUserId(
                    userId
                );

            return successResponse(
                res,
                result,
                "Password reset OTP sent successfully"
            );

        } catch (error) {

            if (error.message.includes("locked")) {
                return errorResponse(
                    res,
                    error.message,
                    429
                );
            }

            return errorResponse(
                res,
                error.message,
                400
            );
        }
    },

    resetPassword: async (req, res) => {
        try {

            const {
                otp,
                new_password
            } = req.body;

            const userId = req.user?.userId;

            if (!userId) {
                return errorResponse(
                    res,
                    "Invalid token",
                    401
                );
            }

            if (!otp || !new_password) {
                return errorResponse(
                    res,
                    "OTP and new password are required",
                    400
                );
            }

            const result = await UserService.resetPassword(
                userId,
                otp,
                new_password
            );

            return successResponse(
                res,
                result,
                "Password reset successfully"
            );

        } catch (error) {

            if (error.message.includes("locked")) {
                return errorResponse(
                    res,
                    error.message,
                    429
                );
            }

            return errorResponse(
                res,
                error.message,
                400
            );
        }
    }
};

export default userController;

