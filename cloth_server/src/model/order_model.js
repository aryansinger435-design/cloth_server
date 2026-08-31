import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    size: {
        type: String,
        default: "M"
    },
    color: {
        type: String,
        default: "Standard"
    },
    image: {
        type: String,
        default: ""
    }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [orderItemSchema],
    shipping_address: {
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        country: { type: String, default: "" },
        pincode: { type: String, default: "" },
        phone: { type: String, default: "" }
    },
    total_amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ["COD", "Card", "UPI", "NetBanking"],
        default: "COD"
    },
    payment_status: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    },
    order_status: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Pending"
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

orderSchema.pre("save", function (next) {
    this.updated_at = Date.now();
    next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
