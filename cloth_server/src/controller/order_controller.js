import Order from "../model/order_model.js";
import Cart from "../model/cart_model.js";
import { successResponse, errorResponse } from "../utilization/response.js";

const orderController = {
    // POST /api/orders
    createOrder: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { items, shipping_address, payment_method = "COD", total_amount } = req.body;

            if (!items || !items.length || !total_amount) {
                return errorResponse(res, "Order items and total amount are required", 400);
            }

            const order = new Order({
                user: userId,
                items,
                shipping_address: shipping_address || {},
                total_amount,
                payment_method,
                payment_status: payment_method === "COD" ? "Pending" : "Paid",
                order_status: "Pending"
            });

            await order.save();

            // Clear user's cart after successful order creation
            await Cart.findOneAndUpdate({ user: userId }, { items: [] });

            return successResponse(res, order, "Order placed successfully", 201);
        } catch (error) {
            console.error("Create order error:", error);
            return errorResponse(res, error.message, 500);
        }
    },

    // GET /api/orders/my-orders
    getMyOrders: async (req, res) => {
        try {
            const userId = req.user.userId;
            const orders = await Order.find({ user: userId }).sort({ created_at: -1 });
            return successResponse(res, orders, "Orders fetched successfully");
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // GET /api/admin/orders (Admin only)
    getAllOrdersAdmin: async (req, res) => {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const filter = {};
            if (status && status !== "All") {
                filter.order_status = status;
            }

            const pageNum = Math.max(1, parseInt(page, 10));
            const limitNum = Math.max(1, parseInt(limit, 10));
            const skip = (pageNum - 1) * limitNum;

            const total = await Order.countDocuments(filter);
            const orders = await Order.find(filter)
                .populate("user", "first_name last_name email phone")
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitNum);

            return successResponse(
                res,
                {
                    orders,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    currentPage: pageNum
                },
                "Admin orders fetched successfully"
            );
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // PUT /api/admin/orders/:id/status (Admin only)
    updateOrderStatusAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { order_status, payment_status } = req.body;

            const updateData = {};
            if (order_status) updateData.order_status = order_status;
            if (payment_status) updateData.payment_status = payment_status;

            const order = await Order.findByIdAndUpdate(id, updateData, { new: true });
            if (!order) {
                return errorResponse(res, "Order not found", 404);
            }

            return successResponse(res, order, "Order status updated successfully");
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }
};

export default orderController;
