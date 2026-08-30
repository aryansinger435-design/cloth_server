import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    first_name: {
        type: String,
        required: true,
        trim: true
    },

    last_name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: "other"
    },

    pincode: {
        type: String,
        trim: true
    },

    phone: {
        type: String,
        trim: true
    },

    bio: {
        type: String,
        maxlength: 500,
        trim: true
    },

    website: {
        type: String,
        trim: true
    },

    profile_img: {
        type: String,
        default: null
    },

    profile_img_public_id: {
        type: String,
        default: null
    },

    profile_img_details: {
        width: Number,
        height: Number,
        format: String,
        bytes: Number
    },

    social_links: {
        facebook: {
            type: String,
            trim: true
        },

        twitter: {
            type: String,
            trim: true
        },

        instagram: {
            type: String,
            trim: true
        },

        linkedin: {
            type: String,
            trim: true
        },

        youtube: {
            type: String,
            trim: true
        }
    },

    address_list: [{
        street: {
            type: String,
            trim: true
        },

        city: {
            type: String,
            trim: true
        },

        state: {
            type: String,
            trim: true
        },

        country: {
            type: String,
            trim: true
        },

        pincode: {
            type: String,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        address_type: {
            type: String,
            enum: ["home", "work", "other"],
            default: "home"
        },

        is_default: {
            type: Boolean,
            default: false
        },

        created_at: {
            type: Date,
            default: Date.now
        },

        updated_at: {
            type: Date,
            default: Date.now
        }
    }],

    is_address_list: {
        type: Boolean,
        default: false
    },

    role: {
        type: String,
        enum: ["user", "admin", "vendor"],
        default: "user"
    },

    is_active: {
        type: Boolean,
        default: false
    },

    is_deleted: {
        type: Boolean,
        default: false
    },

    deleted_at: {
        type: Date,
        default: null
    },

    verification: {
        user: {
            otp: {
                type: String
            },

            is_verified: {
                type: Boolean,
                default: false
            },

            otp_expiry: {
                type: Date
            },

            otp_attempts: {
                type: Number,
                default: 0
            },

            max_otp_attempts: {
                type: Number,
                default: 3
            },

            is_locked: {
                type: Boolean,
                default: false
            },

            lock_until: {
                type: Date
            },

            lock_count: {
                type: Number,
                default: 0
            },

            lock_durations: {
                type: [Number],
                default: [1, 5, 10, 30, 60]
            },

            current_lock_index: {
                type: Number,
                default: 0
            }
        }
    },

    order_list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }],

    cart_list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart"
    }],

    created_at: {
        type: Date,
        default: Date.now
    },

    updated_at: {
        type: Date,
        default: Date.now
    }

});


// ================= METHODS =================

userSchema.methods.isLocked = function () {

    if (!this.verification?.user?.is_locked) {
        return false;
    }

    if (!this.verification?.user?.lock_until) {
        return false;
    }

    return new Date() < this.verification.user.lock_until;
};


userSchema.methods.getRemainingLockTime = function () {

    if (!this.isLocked()) {
        return 0;
    }

    const remaining =
        this.verification.user.lock_until - new Date();

    return Math.max(
        0,
        Math.floor(remaining / 1000)
    );
};


const User = mongoose.model("User", userSchema);

export default User;