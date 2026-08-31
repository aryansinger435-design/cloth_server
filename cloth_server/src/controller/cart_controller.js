import Cart from "../model/cart_model.js";
import Product from "../model/product_model.js";
import { successResponse, errorResponse } from "../utilization/response.js";

const cartController = {
    // GET /api/cart
    getCart: async (req, res) => {
        try {
            const userId = req.user.userId;
            let cart = await Cart.findOne({ user: userId }).populate("items.product");

            if (!cart) {
                cart = new Cart({ user: userId, items: [] });
                await cart.save();
            }

            // Filter out items whose product might have been deleted
            const validItems = cart.items.filter((item) => item.product !== null);
            if (validItems.length !== cart.items.length) {
                cart.items = validItems;
                await cart.save();
            }

            let subtotal = 0;
            let totalItems = 0;

            cart.items.forEach((item) => {
                const price = item.product.discount_price > 0 ? item.product.discount_price : item.product.price;
                subtotal += price * item.quantity;
                totalItems += item.quantity;
            });

            return successResponse(
                res,
                {
                    cart,
                    subtotal,
                    totalItems
                },
                "Cart fetched successfully"
            );
        } catch (error) {
            console.error("Get cart error:", error);
            return errorResponse(res, error.message, 500);
        }
    },

    // POST /api/cart/add
    addToCart: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { productId, quantity = 1, size = "M", color = "Standard" } = req.body;

            if (!productId) {
                return errorResponse(res, "Product ID is required", 400);
            }

            const product = await Product.findById(productId);
            if (!product) {
                return errorResponse(res, "Product not found", 404);
            }

            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                cart = new Cart({ user: userId, items: [] });
            }

            // Check if item already exists in cart with same size and color
            const existingIndex = cart.items.findIndex(
                (item) => item.product.toString() === productId && item.size === size && item.color === color
            );

            const qtyToAdd = Math.max(1, parseInt(quantity, 10));

            if (existingIndex > -1) {
                cart.items[existingIndex].quantity += qtyToAdd;
            } else {
                cart.items.push({
                    product: productId,
                    quantity: qtyToAdd,
                    size,
                    color
                });
            }

            await cart.save();
            const populatedCart = await Cart.findById(cart._id).populate("items.product");

            let subtotal = 0;
            let totalItems = 0;
            populatedCart.items.forEach((item) => {
                if (item.product) {
                    const price = item.product.discount_price > 0 ? item.product.discount_price : item.product.price;
                    subtotal += price * item.quantity;
                    totalItems += item.quantity;
                }
            });

            return successResponse(
                res,
                {
                    cart: populatedCart,
                    subtotal,
                    totalItems
                },
                "Item added to cart"
            );
        } catch (error) {
            console.error("Add to cart error:", error);
            return errorResponse(res, error.message, 500);
        }
    },

    // PUT /api/cart/update
    updateCartItem: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { itemId, quantity } = req.body;

            if (!itemId) {
                return errorResponse(res, "Item ID is required", 400);
            }

            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                return errorResponse(res, "Cart not found", 404);
            }

            const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return errorResponse(res, "Item not found in cart", 404);
            }

            const newQty = parseInt(quantity, 10);
            if (newQty <= 0) {
                // Remove item if quantity becomes 0 or less
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = newQty;
            }

            await cart.save();
            const populatedCart = await Cart.findById(cart._id).populate("items.product");

            let subtotal = 0;
            let totalItems = 0;
            populatedCart.items.forEach((item) => {
                if (item.product) {
                    const price = item.product.discount_price > 0 ? item.product.discount_price : item.product.price;
                    subtotal += price * item.quantity;
                    totalItems += item.quantity;
                }
            });

            return successResponse(
                res,
                {
                    cart: populatedCart,
                    subtotal,
                    totalItems
                },
                "Cart updated"
            );
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // DELETE /api/cart/remove/:itemId
    removeFromCart: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { itemId } = req.params;

            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                return errorResponse(res, "Cart not found", 404);
            }

            cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
            await cart.save();

            const populatedCart = await Cart.findById(cart._id).populate("items.product");

            let subtotal = 0;
            let totalItems = 0;
            populatedCart.items.forEach((item) => {
                if (item.product) {
                    const price = item.product.discount_price > 0 ? item.product.discount_price : item.product.price;
                    subtotal += price * item.quantity;
                    totalItems += item.quantity;
                }
            });

            return successResponse(
                res,
                {
                    cart: populatedCart,
                    subtotal,
                    totalItems
                },
                "Item removed from cart"
            );
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // DELETE /api/cart/clear
    clearCart: async (req, res) => {
        try {
            const userId = req.user.userId;
            let cart = await Cart.findOne({ user: userId });
            if (cart) {
                cart.items = [];
                await cart.save();
            }
            return successResponse(res, { cart, subtotal: 0, totalItems: 0 }, "Cart cleared");
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }
};

export default cartController;
