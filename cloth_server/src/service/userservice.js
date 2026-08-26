import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../model/user_model.js';

import { generateOTP, resendOTP, sendOTP, verifyOTP } from '../email/emailservice.js'

class UserService {
    /**
     * Register a new user
     */
    static async registerUser(userData) {
        const { email, password, first_name, last_name, gender, pincode } = userData;

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        // Create user
        const user = new User({
            first_name,
            last_name,
            gender,
            pincode,
            email: email.toLowerCase(),
            password: hashedPassword,
            is_active: false,
            verification: {
                user: {
                    otp,
                    is_verified: false,
                    otp_expiry: otpExpiry,
                    otp_attempts: 0,
                    max_otp_attempts: 3,
                    is_locked: false,
                    lock_until: null,
                    lock_count: 0,
                    lock_durations: [1, 5, 10, 30, 60],
                    current_lock_index: 0
                }
            }
        });

        await user.save();

        // Send OTP email
        try {
            await sendOTP(email, otp, 'Account Verification', 'verification');
            console.log('✅ OTP email sent to:', email);
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError.message);
        }

        return {
            userId: user._id,
            email: user.email,
            first_name: user.first_name,
            is_verified: false
        };
    }

    /**
     * Handle OTP lock
     */
    static async handleOTPLock(user) {
        const lockDurations = user.verification.user.lock_durations;
        const currentIndex = user.verification.user.current_lock_index || 0;

        let lockMinutes = lockDurations[currentIndex] || lockDurations[lockDurations.length - 1];
        let nextIndex = Math.min(currentIndex + 1, lockDurations.length - 1);

        if (currentIndex >= lockDurations.length - 1) {
            nextIndex = 0;
        }

        const lockDurationMs = lockMinutes * 60 * 1000;
        const lockUntil = new Date(Date.now() + lockDurationMs);

        user.verification.user.is_locked = true;
        user.verification.user.lock_until = lockUntil;
        user.verification.user.current_lock_index = nextIndex;
        user.verification.user.lock_count = (user.verification.user.lock_count || 0) + 1;
        user.verification.user.otp_attempts = 0;
        user.verification.user.otp = null;

        await user.save();

        return {
            isLocked: true,
            lockMinutes,
            lockUntil,
            remainingSeconds: lockMinutes * 60
        };
    }

    /**
     * Verify OTP - NO JWT TOKEN
     */
    static async verifyOTP(email, otp) {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if locked
        if (user.isLocked()) {
            const remainingTime = user.getRemainingLockTime();
            throw new Error(
                `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
            );
        }

        if (user.verification.user.is_verified) {
            throw new Error('User is already verified');
        }

        if (new Date() > user.verification.user.otp_expiry) {
            throw new Error('OTP has expired. Please request a new one');
        }

        if (user.verification.user.otp !== otp) {
            user.verification.user.otp_attempts += 1;

            const maxAttempts = user.verification.user.max_otp_attempts;
            const remainingAttempts = maxAttempts - user.verification.user.otp_attempts;

            if (user.verification.user.otp_attempts >= maxAttempts) {
                await this.handleOTPLock(user);
                throw new Error(`Too many failed attempts. Account locked`);
            }

            await user.save();
            throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining`);
        }

        // OTP is correct - Verify user
        user.verification.user.is_verified = true;
        user.verification.user.otp = null;
        user.verification.user.otp_attempts = 0;
        user.verification.user.is_locked = false;
        user.verification.user.lock_until = null;
        user.verification.user.current_lock_index = 0;
        user.is_active = true;

        await user.save();

        // Return ONLY user data - NO TOKEN
        return {
            user: {
                id: user._id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                gender: user.gender,
                role: user.role,
                is_verified: true,
                is_active: user.is_active,
                profile_img: user.profile_img,
                address_list: user.address_list
            }
        };
    }

    /**
     * Resend OTP
     */
    static async resendOTP(email) {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isLocked()) {
            const remainingTime = user.getRemainingLockTime();
            throw new Error(
                `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
            );
        }

        if (user.verification.user.is_verified) {
            throw new Error('User is already verified');
        }

        const newOTP = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        user.verification.user.otp = newOTP;
        user.verification.user.otp_expiry = otpExpiry;
        user.verification.user.otp_attempts = 0;

        await user.save();

        try {
            await sendOTP(
                email,
                newOTP,
                'Resend OTP - Account Verification',
                'verification'
            );
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
        }

        return {
            email: user.email,
            expiresIn: '5 minutes'
        };
    }

    /**
     * Login user
     */
    static async loginUser(email, password) {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (user.is_deleted) {
            throw new Error('Account has been deleted');
        }

        if (!user.is_active) {
            throw new Error('Account is not active. Please verify your email.');
        }

        if (user.isLocked()) {
            const remainingTime = user.getRemainingLockTime();
            throw new Error(
                `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '7d'
            }
        );

        // Return user data + token
        return {
            token,
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                gender: user.gender,
                role: user.role,
                profile_img: user.profile_img,
                is_active: user.is_active,
                is_verified: user.verification.user.is_verified,
                address_list: user.address_list
            }
        };
    }

    /**
     * Update profile
     */
    static async updateProfile(userId, updateData) {
        const allowedUpdates = [
            'first_name',
            'last_name',
            'gender',
            'profile_img'
        ];

        const filteredData = {};

        Object.keys(updateData).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredData[key] = updateData[key];
            }
        });

        // Handle address update
        if (updateData.address) {
            const user = await User.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            user.address_list.push(updateData.address);
            user.is_address_list = true;

            await user.save();
        }

        const user = await User.findByIdAndUpdate(
            userId,
            filteredData,
            {
                new: true,
                runValidators: true
            }
        ).select('-password -verification');

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Update address
     */
    static async updateAddress(userId, addressId, addressData) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        const addressIndex = user.address_list.findIndex(
            addr => addr._id && addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            throw new Error('Address not found');
        }

        user.address_list[addressIndex] = {
            ...user.address_list[addressIndex].toObject(),
            ...addressData
        };

        await user.save();

        return user.address_list;
    }

    /**
     * Get user profile
     */
    static async getProfile(userId) {
        const user = await User.findById(userId)
            .select('-password -verification.otp -verification.user.otp')
            .populate('order_list')
            .populate('cart_list');

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }




    /**
 * Request password reset using logged-in user's JWT
 */
static async requestPasswordResetByUserId(userId) {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.isLocked()) {
        const remainingTime = user.getRemainingLockTime();

        throw new Error(
            `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
        );
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.verification.user.otp = otp;
    user.verification.user.otp_expiry = otpExpiry;
    user.verification.user.otp_attempts = 0;

    await user.save();

    try {
        await sendOTP(
            user.email,
            otp,
            'Password Reset OTP',
            'password_reset'
        );
    } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
    }

    return {
        email: user.email,
        expiresIn: '5 minutes'
    };
}

    /**
     * Request password reset
     */
    static async requestPasswordReset(email) {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isLocked()) {
            const remainingTime = user.getRemainingLockTime();
            throw new Error(
                `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
            );
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        user.verification.user.otp = otp;
        user.verification.user.otp_expiry = otpExpiry;
        user.verification.user.otp_attempts = 0;

        await user.save();

        try {
            await sendOTP(
                email,
                otp,
                'Password Reset OTP',
                'password_reset'
            );
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
        }

        return {
            email: user.email,
            expiresIn: '5 minutes'
        };
    }

    /**
     * Reset password - NO JWT TOKEN
     */
   /**
 * Reset password using logged-in user's JWT
 */
static async resetPassword(userId, otp, newPassword) {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.isLocked()) {
        const remainingTime = user.getRemainingLockTime();

        throw new Error(
            `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
        );
    }

    if (!user.verification.user.otp_expiry) {
        throw new Error('Please request a password reset OTP first');
    }

    if (new Date() > user.verification.user.otp_expiry) {
        throw new Error('OTP has expired. Please request a new one');
    }

    if (user.verification.user.otp !== otp) {
        user.verification.user.otp_attempts += 1;

        const maxAttempts = user.verification.user.max_otp_attempts;
        const remainingAttempts =
            maxAttempts - user.verification.user.otp_attempts;

        if (user.verification.user.otp_attempts >= maxAttempts) {
            await this.handleOTPLock(user);
            throw new Error('Too many failed attempts. Account locked');
        }

        await user.save();

        throw new Error(
            `Invalid OTP. ${remainingAttempts} attempts remaining`
        );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;

    user.verification.user.otp = null;
    user.verification.user.otp_expiry = null;
    user.verification.user.otp_attempts = 0;
    user.verification.user.is_locked = false;
    user.verification.user.lock_until = null;

    await user.save();

    return {
        success: true,
        message: 'Password reset successfully'
    };
}
}
export default UserService;
