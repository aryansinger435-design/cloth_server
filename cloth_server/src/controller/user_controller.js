import UserService from '../service/userservice.js';
import { successResponse, errorResponse } from '../utilization/response.js';
import {allError} from '../middleware/errorhandling.js'
export const userController = {
    /**
     * Register a new user
     * POST /api/register
     */
    register: async (req, res) => {
        try {
            const result = await UserService.registerUser(req.body);
            return successResponse(res, result, 'User registered successfully. Please verify your email with OTP.', 201);
        } catch (error) {
           allError(error, res)
        }
    },

    /**
     * Verify OTP - NO JWT TOKEN
     * POST /api/verify-otp
     */
    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;
            
            // Validate input
            if (!email || !otp) {
                return errorResponse(res, 'Email and OTP are required', 400);
            }

            const result = await  UserService.verifyOTP(email, otp);
            
            // Return only user data - NO TOKEN
            return successResponse(res, {
                user: result.user,
                verified: true
            }, 'OTP verified successfully');
            
        } catch (error) {
            if (error.message.includes('locked')) {
                return errorResponse(res, error.message, 429);
            }
            return errorResponse(res, error.message, 400);
        }
    },

    /**
     * Resend OTP
     * POST /api/resend-otp
     */
    resendOTP: async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                return errorResponse(res, 'Email is required', 400);
            }

            const result = await UserService.resendOTP(email);
            return successResponse(res, result, 'New OTP sent successfully to your email');
        } catch (error) {
            if (error.message.includes('locked')) {
                return errorResponse(res, error.message, 429);
            }
            return errorResponse(res, error.message, 400);
        }
    },

    /**
     * Login user - NO JWT TOKEN
     * POST /api/login
     */
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return errorResponse(res, 'Email and password are required', 400);
            }

            const result = await UserService.loginUser(email, password);
            return successResponse(res, result, 'Login successful');
        } catch (error) {
            if (error.message.includes('locked')) {
                return errorResponse(res, error.message, 429);
            }
            return errorResponse(res, error.message, 401);
        }
    },

    /**
     * Update profile
     * PUT /api/update-profile
     */
    updateProfile: async (req, res) => {
    try {
        const userId = req.body.userId || req.headers['user-id'];

        if (!userId) {
            return errorResponse(res, 'User ID is required', 400);
        }

        const updateData = {
            ...req.body
        };

        if (req.file) {
            updateData.profile_img = {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype
            };
        }

        const result = await UserService.updateProfile(userId, updateData);

        return successResponse(
            res,
            result,
            'Profile updated successfully'
        );

    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
},

    /**
     * Update address
     * PUT /api/update-address
     */
    updateAddress: async (req, res) => {
        try {
            const userId = req.body.userId || req.headers['user-id'];
            
            if (!userId) {
                return errorResponse(res, 'User ID is required', 400);
            }

            const { address_id, ...addressData } = req.body;
            
            if (!address_id) {
                return errorResponse(res, 'Address ID is required', 400);
            }
            
            const result = await UserService.updateAddress(userId, address_id, addressData);
            return successResponse(res, result, 'Address updated successfully');
        } catch (error) {
            return errorResponse(res, error.message, 400);
        }
    },

    /**
     * Get user profile
     * GET /api/profile
     */
    getProfile: async (req, res) => {
        try {
            const userId = req.query.userId || req.headers['user-id'];
            
            if (!userId) {
                return errorResponse(res, 'User ID is required', 400);
            }

            const result = await UserService.getProfile(userId);
            return successResponse(res, result, 'Profile fetched successfully');
        } catch (error) {
            return errorResponse(res, error.message, 404);
        }
    },

    /**
     * Request password reset
     * POST /api/request-password-reset
     */
    requestPasswordReset: async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return errorResponse(res, 'Invalid token', 401);
        }

        const result = await UserService.requestPasswordResetByUserId(userId);

        return successResponse(
            res,
            result,
            'Password reset OTP sent successfully'
        );

    } catch (error) {
        if (error.message.includes('locked')) {
            return errorResponse(res, error.message, 429);
        }

        return errorResponse(res, error.message, 400);
    }
},


    /**
     * Reset password - NO JWT TOKEN
     * POST /api/reset-password
     */
      /**
     * Reset password
     * POST /api/reset-password
     */
    resetPassword: async (req, res) => {
        try {
            const { otp, new_password } = req.body;
            const userId = req.user.userId;

            if (!userId) {
                return errorResponse(res, 'Invalid token', 401);
            }

            if (!otp || !new_password) {
                return errorResponse(
                    res,
                    'OTP and new password are required',
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
                'Password reset successfully'
            );

        } catch (error) {
            if (error.message.includes('locked')) {
                return errorResponse(res, error.message, 429);
            }

            return errorResponse(res, error.message, 400);
        }
    }
};

export default userController;
