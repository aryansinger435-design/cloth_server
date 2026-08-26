import mongoose from "mongoose";
import {
    namevalidation,
    emailvalidation,
    passwordvalidation,
    pincodevalidation
} from '../valid/allvalidation.js';

const userSchema = new mongoose.Schema({
    profile_img: { type: Object, default: null },

    first_name: {
        type: String,
        required: true,
        validate: [namevalidation, "invalid name"]
    },

    last_name: {
        type: String,
        required: true
    },

    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },

    role: {
        type: String,
        enum: ['admin', 'user'],
        required: true,
        default: 'user'
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: [emailvalidation, "invalid email"]
    },

    password: {
        type: String,
        required: true,
       
    },

    pincode: {
        type: String,
        required: true,
        validate: [pincodevalidation, "invalid pincode"]
    },

    is_active: {
        type: Boolean,
        default: false
    },

    is_deleted: {
        type: Boolean,
        default: false
    },

    address_list: {
        type: Array,
        default: []
    },

    is_address_list: {
        type: Boolean,
        default: false
    },

    verification: {
        user: {
            otp: { type: String, default: null },
            is_verified: { type: Boolean, default: false },
            otp_expiry: { type: Date, default: null },
            otp_attempts: { type: Number, default: 0 },
            max_otp_attempts: { type: Number, default: 3 },
            is_locked: { type: Boolean, default: false },
            lock_until: { type: Date, default: null },
            lock_count: { type: Number, default: 0 },
            lock_durations: {
                type: [Number],
                default: [1, 5, 10, 30, 60]
            },
            current_lock_index: { type: Number, default: 0 }
        },
        admin: {}
    },

    order_list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],

    cart_list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    }],

}, {
    timestamps: true
});

// Method to check if user is locked
userSchema.methods.isLocked = function() {
    if (!this.verification.user.is_locked) return false;

    if (
        this.verification.user.lock_until &&
        new Date() > this.verification.user.lock_until
    ) {
        this.verification.user.is_locked = false;
        this.verification.user.lock_until = null;
        return false;
    }

    return true;
};

// Method to get remaining lock time in seconds
userSchema.methods.getRemainingLockTime = function() {
    if (
        !this.verification.user.is_locked ||
        !this.verification.user.lock_until
    ) return 0;

    const remaining =
        (this.verification.user.lock_until - new Date()) / 1000;

    return Math.max(0, Math.ceil(remaining));
};

export default mongoose.model('User', userSchema);
