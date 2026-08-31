import User from "../model/user_model.js";
import Product from "../model/product_model.js";
import Order from "../model/order_model.js";
import { successResponse, errorResponse } from "../utilization/response.js";

const adminController = {
    // GET /api/admin/stats
    getStats: async (req, res) => {
        try {
            const [totalUsers, totalProducts, totalOrders, orders] = await Promise.all([
                User.countDocuments({ is_deleted: { $ne: true } }),
                Product.countDocuments(),
                Order.countDocuments(),
                Order.find({ order_status: { $ne: "Cancelled" } })
            ]);

            const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

            const recentOrders = await Order.find()
                .populate("user", "first_name last_name email")
                .sort({ created_at: -1 })
                .limit(5);

            const recentUsers = await User.find({ is_deleted: { $ne: true } })
                .select("-password -verification.user.otp")
                .sort({ created_at: -1 })
                .limit(5);

            return successResponse(
                res,
                {
                    totalUsers,
                    totalProducts,
                    totalOrders,
                    totalRevenue,
                    recentOrders,
                    recentUsers
                },
                "Dashboard stats fetched successfully"
            );
        } catch (error) {
            console.error("Admin stats error:", error);
            return errorResponse(res, error.message, 500);
        }
    },

    // GET /api/admin/users
    getAllUsers: async (req, res) => {
        try {
            const { search, role, page = 1, limit = 20 } = req.query;
            const filter = { is_deleted: { $ne: true } };

            if (role && role !== "All") {
                filter.role = role;
            }

            if (search) {
                filter.$or = [
                    { first_name: { $regex: search, $options: "i" } },
                    { last_name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } }
                ];
            }

            const pageNum = Math.max(1, parseInt(page, 10));
            const limitNum = Math.max(1, parseInt(limit, 10));
            const skip = (pageNum - 1) * limitNum;

            const total = await User.countDocuments(filter);
            const users = await User.find(filter)
                .select("-password -verification.user.otp")
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitNum);

            return successResponse(
                res,
                {
                    users,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    currentPage: pageNum
                },
                "Users fetched successfully"
            );
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // DELETE /api/admin/users/:id
    deleteUser: async (req, res) => {
        try {
            const targetId = req.params.id;
            const adminId = req.user.userId;

            if (targetId === adminId) {
                return errorResponse(res, "You cannot delete your own admin account", 400);
            }

            const user = await User.findById(targetId);
            if (!user) {
                return errorResponse(res, "User not found", 404);
            }

            // Permanently remove user and user's cart
            await User.findByIdAndDelete(targetId);

            return successResponse(res, null, "User removed successfully");
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // PUT /api/admin/users/:id/role
    updateUserRole: async (req, res) => {
        try {
            const { role } = req.body;
            const targetId = req.params.id;

            if (!["user", "admin", "vendor"].includes(role)) {
                return errorResponse(res, "Invalid role specified", 400);
            }

            const user = await User.findByIdAndUpdate(
                targetId,
                { role },
                { new: true }
            ).select("-password -verification.user.otp");

            if (!user) {
                return errorResponse(res, "User not found", 404);
            }

            return successResponse(res, user, `User role updated to ${role}`);
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // PUT /api/admin/users/:id/status
    toggleUserStatus: async (req, res) => {
        try {
            const targetId = req.params.id;
            const user = await User.findById(targetId);
            if (!user) {
                return errorResponse(res, "User not found", 404);
            }

            user.is_active = !user.is_active;
            await user.save();

            return successResponse(
                res,
                { id: user._id, is_active: user.is_active },
                `User status changed to ${user.is_active ? "Active" : "Inactive"}`
            );
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }
};

export default adminController;
