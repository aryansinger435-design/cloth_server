import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    updateProfileimg,
    deleteProfileimg,
    compressProfileImage
} from "../upload/upload.js";
import fs from "fs"
import User from "../model/user_model.js";

import {
    generateOTP,
    sendOTP
} from "../email/emailservice.js";



class UserService {

    // =====================================================
    // REGISTER
    // =====================================================

    static async registerUser(userData) {

        const {
            email,
            password,
            first_name,
            last_name,
            gender,
            pincode
        } = userData;


        if (
            !email ||
            !password ||
            !first_name ||
            !last_name
        ) {
            throw new Error(
                "Required fields are missing"
            );
        }


        const existingUser =
            await User.findOne({
                email: email.toLowerCase()
            });


        if (existingUser) {
            throw new Error(
                "User already exists with this email"
            );
        }


        const salt =
            await bcrypt.genSalt(10);

        const hashedPassword =
            await bcrypt.hash(
                password,
                salt
            );


        const otp = generateOTP();

        const otpExpiry =
            new Date(
                Date.now() +
                5 * 60 * 1000
            );


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

                    lock_durations: [
                        1,
                        5,
                        10,
                        30,
                        60
                    ],

                    current_lock_index: 0
                }
            }
        });


        await user.save();


        try {

            await sendOTP(
                email,
                otp,
                "Account Verification",
                "verification"
            );

        } catch (error) {

            console.error(
                "Email error:",
                error.message
            );
        }


        return {

            userId: user._id,

            email: user.email,

            first_name: user.first_name,

            is_verified: false
        };
    }


    // =====================================================
    // OTP LOCK
    // =====================================================

    static async handleOTPLock(user) {

        const lockDurations =
            user.verification.user.lock_durations;

        const currentIndex =
            user.verification.user.current_lock_index || 0;


        const lockMinutes =
            lockDurations[currentIndex] ||
            lockDurations[
                lockDurations.length - 1
            ];


        const nextIndex =
            Math.min(
                currentIndex + 1,
                lockDurations.length - 1
            );


        const lockDurationMs =
            lockMinutes * 60 * 1000;


        const lockUntil =
            new Date(
                Date.now() +
                lockDurationMs
            );


        user.verification.user.is_locked =
            true;

        user.verification.user.lock_until =
            lockUntil;

        user.verification.user.current_lock_index =
            nextIndex;

        user.verification.user.lock_count =
            (user.verification.user.lock_count || 0) + 1;

        user.verification.user.otp_attempts =
            0;

        user.verification.user.otp =
            null;


        await user.save();


        return {

            isLocked: true,

            lockMinutes,

            lockUntil,

            remainingSeconds:
                lockMinutes * 60
        };
    }


    // =====================================================
    // VERIFY OTP
    // =====================================================

    static async verifyOTP(email, otp) {

        const user =
            await User.findOne({
                email: email.toLowerCase()
            });


        if (!user) {
            throw new Error(
                "User not found"
            );
        }


        if (user.isLocked()) {

            const remainingTime =
                user.getRemainingLockTime();

            throw new Error(
                `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
            );
        }


        if (
            user.verification.user.is_verified
        ) {
            throw new Error(
                "User is already verified"
            );
        }


        if (
            new Date() >
            user.verification.user.otp_expiry
        ) {
            throw new Error(
                "OTP has expired. Please request a new one"
            );
        }


        if (
            user.verification.user.otp !== otp
        ) {

            user.verification.user.otp_attempts += 1;


            const maxAttempts =
                user.verification.user.max_otp_attempts;


            const remainingAttempts =
                maxAttempts -
                user.verification.user.otp_attempts;


            if (
                user.verification.user.otp_attempts >=
                maxAttempts
            ) {

                await this.handleOTPLock(user);

                throw new Error(
                    "Too many failed attempts. Account locked"
                );
            }


            await user.save();


            throw new Error(
                `Invalid OTP. ${remainingAttempts} attempts remaining`
            );
        }


        user.verification.user.is_verified =
            true;

        user.verification.user.otp =
            null;

        user.verification.user.otp_attempts =
            0;

        user.verification.user.is_locked =
            false;

        user.verification.user.lock_until =
            null;

        user.verification.user.current_lock_index =
            0;

        user.is_active = true;


        await user.save();


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


    // =====================================================
    // RESEND OTP
    // =====================================================

    static async resendOTP(email) {

        const user =
            await User.findOne({
                email: email.toLowerCase()
            });


        if (!user) {
            throw new Error(
                "User not found"
            );
        }


        if (user.isLocked()) {

            const remainingTime =
                user.getRemainingLockTime();

            throw new Error(
                `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
            );
        }


        if (
            user.verification.user.is_verified
        ) {
            throw new Error(
                "User is already verified"
            );
        }


        const newOTP =
            generateOTP();


        const otpExpiry =
            new Date(
                Date.now() +
                5 * 60 * 1000
            );


        user.verification.user.otp =
            newOTP;

        user.verification.user.otp_expiry =
            otpExpiry;

        user.verification.user.otp_attempts =
            0;


        await user.save();


        await sendOTP(
            email,
            newOTP,
            "Resend OTP - Account Verification",
            "verification"
        );


        return {

            email: user.email,

            expiresIn: "5 minutes"
        };
    }


    // =====================================================
    // LOGIN
    // =====================================================

    static async loginUser(
        email,
        password
    ) {

        const user =
            await User.findOne({
                email: email.toLowerCase()
            });


        if (!user) {
            throw new Error(
                "Invalid credentials"
            );
        }


        if (user.is_deleted) {
            throw new Error(
                "Account has been deleted"
            );
        }


        if (!user.is_active) {
            throw new Error(
                "Account is not active. Please verify your email."
            );
        }


        if (user.isLocked()) {

            const remainingTime =
                user.getRemainingLockTime();

            throw new Error(
                `Account is locked. Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`
            );
        }


        const isPasswordValid =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isPasswordValid) {
            throw new Error(
                "Invalid credentials"
            );
        }


        // ================= JWT =================

        const token =
            jwt.sign(

                {
                    userId: user._id.toString(),

                    email: user.email,

                    role: user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN ||
                        "7d"
                }
            );


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

                is_verified:
                    user.verification.user.is_verified,

                address_list:
                    user.address_list
            }
        };
    }


    // =====================================================
    // UPDATE PROFILE
    // =====================================================

    static async updateProfile(
        userId,
        updateData,
        files = null
    ) {

        const user =
            await User.findById(userId);


        if (!user) {
            throw new Error(
                "User not found"
            );
        }


        if (user.is_deleted) {
            throw new Error(
                "Account has been deleted"
            );
        }


        const allowedUpdates = [

            "first_name",

            "last_name",

            "gender",

            "pincode",

            "phone",

            "bio",

            "website"
        ];


        const updatedFields = [];


        // ================= TEXT FIELDS =================

        Object.keys(updateData).forEach(
            (key) => {

                if (
                    allowedUpdates.includes(key) &&
                    updateData[key] !== undefined &&
                    updateData[key] !== null
                ) {

                    if (
                        typeof updateData[key] ===
                        "string"
                    ) {

                        user[key] =
                            updateData[key].trim();

                    } else {

                        user[key] =
                            updateData[key];
                    }


                    updatedFields.push(key);
                }
            }
        );


        // ================= SOCIAL LINKS =================

        if (updateData.social_links) {

            let socialLinks =
                updateData.social_links;


            if (
                typeof socialLinks ===
                "string"
            ) {

                try {

                    socialLinks =
                        JSON.parse(
                            socialLinks
                        );

                } catch (error) {

                    throw new Error(
                        "Invalid social_links JSON"
                    );
                }
            }


            const allowedSocial = [

                "facebook",

                "twitter",

                "instagram",

                "linkedin",

                "youtube"
            ];


            if (!user.social_links) {
                user.social_links = {};
            }


            Object.keys(socialLinks).forEach(
                (key) => {

                    if (
                        allowedSocial.includes(key) &&
                        socialLinks[key] !== undefined
                    ) {

                        user.social_links[key] =
                            socialLinks[key]?.trim() || "";

                        updatedFields.push(
                            `social_links.${key}`
                        );
                    }
                }
            );
        }


        // ================= PROFILE IMAGE =================

        if (
            files &&
            files.profile_img &&
            files.profile_img.length > 0
        ) {

            const file =
                files.profile_img[0];

            const filePath =
                file.path;


            try {

                const uploadResult =
                    await updateProfileimg(
                        filePath
                    );


                if (uploadResult) {

                    const oldPublicId =
                        user.profile_img_public_id;


                    user.profile_img =
                        uploadResult.secure_url;


                    user.profile_img_public_id =
                        uploadResult.public_id;


                    user.profile_img_details = {

                        width:
                            uploadResult.width,

                        height:
                            uploadResult.height,

                        format:
                            uploadResult.format,

                        bytes:
                            uploadResult.bytes
                    };


                    updatedFields.push(
                        "profile_img"
                    );


                    // Delete old Cloudinary image

                    if (oldPublicId) {

                        await deleteProfileimg(
                            oldPublicId
                        );
                    }
                }


                // Delete temporary local file

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

            } catch (error) {

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                throw new Error(
                    "Failed to upload profile image: " +
                    error.message
                );
            }
        }


        // ================= CHECK UPDATE =================

        if (updatedFields.length === 0) {

            throw new Error(
                "No valid fields provided to update"
            );
        }


        user.updated_at =
            new Date();


        await user.save();


        // IMPORTANT:
        // No Order/Cart populate here

        const updatedUser =
            await User.findById(userId)
                .select(
                    "-password -verification.user.otp"
                );


        return {

            user: updatedUser,

            updatedFields,

            message:
                `Successfully updated: ${updatedFields.join(", ")}`
        };
    }


    // =====================================================
    // GET PROFILE
    // =====================================================

    static async getProfile(userId) {

        const user =
            await User.findById(userId)
                .select(
                    "-password -verification.user.otp"
                );


        if (!user) {
            throw new Error(
                "User not found"
            );
        }


        return user;
    }


    // =====================================================
    // UPDATE ADDRESS
    // =====================================================

    static async updateAddress(
        userId,
        addressId,
        addressData
    ) {

        const user =
            await User.findById(userId);


        if (!user) {
            throw new Error(
                "User not found"
            );
        }


        const addressIndex =
            user.address_list.findIndex(
                (address) =>
                    address._id.toString() ===
                    addressId
            );


        if (addressIndex === -1) {

            throw new Error(
                "Address not found"
            );
        }


        user.address_list[addressIndex] = {

            ...user.address_list[
                addressIndex
            ].toObject(),

            ...addressData,

            updated_at: new Date()
        };


        if (addressData.is_default) {

            user.address_list.forEach(
                (address, index) => {

                    if (
                        index !== addressIndex
                    ) {

                        address.is_default =
                            false;
                    }
                }
            );
        }


        user.updated_at =
            new Date();


        await user.save();


        return user;
    }
}


export default UserService;