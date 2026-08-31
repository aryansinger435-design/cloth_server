import Product from "../model/product_model.js";
import { successResponse, errorResponse } from "../utilization/response.js";
import { updateProfileimg, deleteProfileimg } from "../upload/upload.js";
import fs from "fs";

const productController = {
    // GET /api/products
    getAllProducts: async (req, res) => {
        try {
            const {
                search,
                category,
                minPrice,
                maxPrice,
                sort,
                featured,
                page = 1,
                limit = 12
            } = req.query;

            const filter = { is_active: true };

            if (category && category !== "All") {
                filter.category = { $regex: new RegExp(`^${category}$`, "i") };
            }

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                    { category: { $regex: search, $options: "i" } }
                ];
            }

            if (minPrice !== undefined || maxPrice !== undefined) {
                filter.price = {};
                if (minPrice) filter.price.$gte = Number(minPrice);
                if (maxPrice) filter.price.$lte = Number(maxPrice);
            }

            if (featured === "true") {
                filter.is_featured = true;
            }

            let sortOption = { created_at: -1 };
            if (sort === "price_asc") sortOption = { price: 1 };
            else if (sort === "price_desc") sortOption = { price: -1 };
            else if (sort === "rating") sortOption = { "ratings.average": -1 };
            else if (sort === "newest") sortOption = { created_at: -1 };

            const pageNum = Math.max(1, parseInt(page, 10));
            const limitNum = Math.max(1, parseInt(limit, 10));
            const skip = (pageNum - 1) * limitNum;

            const total = await Product.countDocuments(filter);
            const products = await Product.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum);

            return successResponse(
                res,
                {
                    products,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    currentPage: pageNum,
                    limit: limitNum
                },
                "Products fetched successfully"
            );
        } catch (error) {
            console.error("Get products error:", error);
            return errorResponse(res, error.message, 500);
        }
    },

    // GET /api/products/all-admin (Admin view including inactive products)
    getAllProductsAdmin: async (req, res) => {
        try {
            const { search, category, page = 1, limit = 50 } = req.query;
            const filter = {};

            if (category && category !== "All") {
                filter.category = { $regex: new RegExp(`^${category}$`, "i") };
            }

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
                ];
            }

            const pageNum = Math.max(1, parseInt(page, 10));
            const limitNum = Math.max(1, parseInt(limit, 10));
            const skip = (pageNum - 1) * limitNum;

            const total = await Product.countDocuments(filter);
            const products = await Product.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitNum);

            return successResponse(
                res,
                {
                    products,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    currentPage: pageNum
                },
                "Admin products fetched successfully"
            );
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // GET /api/products/categories
    getCategories: async (req, res) => {
        try {
            const categories = await Product.distinct("category");
            return successResponse(res, categories, "Categories fetched successfully");
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // GET /api/products/:id
    getProductById: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return errorResponse(res, "Product not found", 404);
            }
            return successResponse(res, product, "Product fetched successfully");
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    },

    // POST /api/products (Admin only)
    createProduct: async (req, res) => {
        try {
            const {
                name,
                description,
                price,
                discount_price,
                category,
                stock,
                sizes,
                colors,
                is_featured,
                image_url
            } = req.body;

            if (!name || !price || !category) {
                return errorResponse(res, "Name, price, and category are required", 400);
            }

            let images = [];

            // If file was uploaded via multer
            if (req.files && req.files.product_img && req.files.product_img.length > 0) {
                const file = req.files.product_img[0];
                try {
                    const uploadResult = await updateProfileimg(file.path);
                    if (uploadResult) {
                        images.push({
                            url: uploadResult.secure_url,
                            public_id: uploadResult.public_id
                        });
                    }
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                } catch (uploadErr) {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    console.error("Image upload failed:", uploadErr.message);
                }
            }

            // If image URL was provided directly
            if (images.length === 0 && image_url) {
                images.push({ url: image_url.trim(), public_id: null });
            }

            // Fallback placeholder image if none provided
            if (images.length === 0) {
                images.push({
                    url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80",
                    public_id: null
                });
            }

            // Parse sizes and colors if sent as JSON string or comma-separated
            let parsedSizes = sizes;
            if (typeof sizes === "string") {
                try {
                    parsedSizes = JSON.parse(sizes);
                } catch {
                    parsedSizes = sizes.split(",").map((s) => s.trim()).filter(Boolean);
                }
            }

            let parsedColors = colors;
            if (typeof colors === "string") {
                try {
                    parsedColors = JSON.parse(colors);
                } catch {
                    parsedColors = colors.split(",").map((c) => c.trim()).filter(Boolean);
                }
            }

            const product = new Product({
                name: name.trim(),
                description: (description || "").trim(),
                price: Number(price),
                discount_price: discount_price ? Number(discount_price) : 0,
                category: category.trim(),
                stock: stock !== undefined ? Number(stock) : 10,
                images,
                sizes: Array.isArray(parsedSizes) && parsedSizes.length > 0 ? parsedSizes : ["S", "M", "L", "XL"],
                colors: Array.isArray(parsedColors) && parsedColors.length > 0 ? parsedColors : ["Black", "White"],
                is_featured: is_featured === true || is_featured === "true"
            });

            await product.save();

            return successResponse(res, product, "Product created successfully", 201);
        } catch (error) {
            console.error("Create product error:", error);
            return errorResponse(res, error.message, 400);
        }
    },

    // PUT /api/products/:id (Admin only)
    updateProduct: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return errorResponse(res, "Product not found", 404);
            }

            const {
                name,
                description,
                price,
                discount_price,
                category,
                stock,
                sizes,
                colors,
                is_featured,
                is_active,
                image_url
            } = req.body;

            if (name !== undefined) product.name = name.trim();
            if (description !== undefined) product.description = description.trim();
            if (price !== undefined) product.price = Number(price);
            if (discount_price !== undefined) product.discount_price = Number(discount_price);
            if (category !== undefined) product.category = category.trim();
            if (stock !== undefined) product.stock = Number(stock);
            if (is_featured !== undefined) product.is_featured = is_featured === true || is_featured === "true";
            if (is_active !== undefined) product.is_active = is_active === true || is_active === "true";

            if (sizes !== undefined) {
                let parsedSizes = sizes;
                if (typeof sizes === "string") {
                    try {
                        parsedSizes = JSON.parse(sizes);
                    } catch {
                        parsedSizes = sizes.split(",").map((s) => s.trim()).filter(Boolean);
                    }
                }
                if (Array.isArray(parsedSizes)) product.sizes = parsedSizes;
            }

            if (colors !== undefined) {
                let parsedColors = colors;
                if (typeof colors === "string") {
                    try {
                        parsedColors = JSON.parse(colors);
                    } catch {
                        parsedColors = colors.split(",").map((c) => c.trim()).filter(Boolean);
                    }
                }
                if (Array.isArray(parsedColors)) product.colors = parsedColors;
            }

            // Image update from uploaded file
            if (req.files && req.files.product_img && req.files.product_img.length > 0) {
                const file = req.files.product_img[0];
                try {
                    const uploadResult = await updateProfileimg(file.path);
                    if (uploadResult) {
                        // Delete previous cloudinary image if it existed
                        if (product.images?.[0]?.public_id) {
                            await deleteProfileimg(product.images[0].public_id);
                        }
                        product.images = [
                            {
                                url: uploadResult.secure_url,
                                public_id: uploadResult.public_id
                            }
                        ];
                    }
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                } catch (uploadErr) {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    console.error("Image upload failed:", uploadErr.message);
                }
            } else if (image_url) {
                product.images = [{ url: image_url.trim(), public_id: null }];
            }

            await product.save();

            return successResponse(res, product, "Product updated successfully");
        } catch (error) {
            console.error("Update product error:", error);
            return errorResponse(res, error.message, 400);
        }
    },

    // DELETE /api/products/:id (Admin only)
    deleteProduct: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return errorResponse(res, "Product not found", 404);
            }

            // Clean up Cloudinary images
            if (product.images && product.images.length > 0) {
                for (const img of product.images) {
                    if (img.public_id) {
                        await deleteProfileimg(img.public_id);
                    }
                }
            }

            await Product.findByIdAndDelete(req.params.id);

            return successResponse(res, null, "Product deleted successfully");
        } catch (error) {
            return errorResponse(res, error.message, 500);
        }
    }
};

export default productController;
