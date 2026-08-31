import express from "express";
import userController from "../controller/user_controller.js";
import productController from "../controller/product_controller.js";
import cartController from "../controller/cart_controller.js";
import orderController from "../controller/order_controller.js";
import adminController from "../controller/admin_controller.js";
import upload from "../upload/upload.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ================= AUTH ROUTES =================
router.post("/register", userController.register);
router.post("/verify-otp", userController.verifyOTP);
router.post("/resend-otp", userController.resendOTP);
router.post("/login", userController.login);

// ================= PROFILE & ADDRESS ROUTES =================
router.get("/profile", authMiddleware, userController.getProfile);
router.put(
    "/update-profile",
    authMiddleware,
    upload.fields([{ name: "profile_img", maxCount: 1 }]),
    userController.updateProfile
);
router.put("/update-address", authMiddleware, userController.updateAddress);
router.post("/request-password-reset", authMiddleware, userController.requestPasswordReset);
router.post("/reset-password", authMiddleware, userController.resetPassword);

// ================= PRODUCT PUBLIC ROUTES =================
router.get("/products/categories", productController.getCategories);
router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);

// ================= PRODUCT ADMIN ROUTES =================
router.post(
    "/products",
    authMiddleware,
    adminMiddleware,
    upload.fields([{ name: "product_img", maxCount: 1 }]),
    productController.createProduct
);
router.put(
    "/products/:id",
    authMiddleware,
    adminMiddleware,
    upload.fields([{ name: "product_img", maxCount: 1 }]),
    productController.updateProduct
);
router.delete("/products/:id", authMiddleware, adminMiddleware, productController.deleteProduct);

// ================= CART ROUTES =================
router.get("/cart", authMiddleware, cartController.getCart);
router.post("/cart/add", authMiddleware, cartController.addToCart);
router.put("/cart/update", authMiddleware, cartController.updateCartItem);
router.delete("/cart/remove/:itemId", authMiddleware, cartController.removeFromCart);
router.delete("/cart/clear", authMiddleware, cartController.clearCart);

// ================= ORDER ROUTES =================
router.post("/orders", authMiddleware, orderController.createOrder);
router.get("/orders/my-orders", authMiddleware, orderController.getMyOrders);

// ================= ADMIN DASHBOARD ROUTES =================
router.get("/admin/stats", authMiddleware, adminMiddleware, adminController.getStats);
router.get("/admin/products", authMiddleware, adminMiddleware, productController.getAllProductsAdmin);
router.get("/admin/users", authMiddleware, adminMiddleware, adminController.getAllUsers);
router.delete("/admin/users/:id", authMiddleware, adminMiddleware, adminController.deleteUser);
router.put("/admin/users/:id/role", authMiddleware, adminMiddleware, adminController.updateUserRole);
router.put("/admin/users/:id/status", authMiddleware, adminMiddleware, adminController.toggleUserStatus);
router.get("/admin/orders", authMiddleware, adminMiddleware, orderController.getAllOrdersAdmin);
router.put("/admin/orders/:id/status", authMiddleware, adminMiddleware, orderController.updateOrderStatusAdmin);

export { router };
export default router;