import express from 'express';
import userController from '../controller/user_controller.js';
import {
    validateUserRegistration,
    validateUserLogin,
    validateOTP,
    validateEmail,
    validatePasswordReset,
    validateProfileUpdate
} from '../middleware/validation.js';

const router = express.Router();

// Public Routes - NO JWT REQUIRED
router.post('/register', validateUserRegistration, userController.register);
router.post('/verify-otp', validateOTP, userController.verifyOTP);
router.post('/resend-otp', validateEmail, userController.resendOTP);
router.post('/login', validateUserLogin, userController.login);
router.post('/request-password-reset', validateEmail, userController.requestPasswordReset);
router.post('/reset-password', validatePasswordReset, userController.resetPassword);

// Protected Routes (Use userId in body or header)
router.get('/profile', userController.getProfile);
router.put('/update-profile', validateProfileUpdate, userController.updateProfile);
router.put('/update-address', userController.updateAddress);

export default router;