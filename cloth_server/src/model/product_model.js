import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount_price: {
        type: Number,
        default: 0,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        default: 10,
        min: 0
    },
    images: [
        {
            url: { type: String, required: true },
            public_id: { type: String, default: null }
        }
    ],
    sizes: {
        type: [String],
        default: ["S", "M", "L", "XL"]
    },
    colors: {
        type: [String],
        default: ["Black", "White", "Blue"]
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    ratings: {
        average: {
            type: Number,
            default: 4.5,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 12
        }
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

productSchema.pre("save", function (next) {
    this.updated_at = Date.now();
    next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
