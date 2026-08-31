import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Product from "./model/product_model.js";
import User from "./model/user_model.js";

dotenv.config();

const sampleProducts = [
    {
        name: "Classic Denim Jacket",
        description: "Timeless vintage wash denim jacket made from 100% premium breathable cotton. Features antique brass buttons and roomy chest pockets.",
        price: 2499,
        discount_price: 1899,
        category: "Jackets",
        stock: 25,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Light Blue", "Dark Indigo", "Washed Black"],
        is_featured: true,
        images: [
            {
                url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
                public_id: null
            }
        ],
        ratings: { average: 4.8, count: 42 }
    },
    {
        name: "Urban Oversized Cotton Tee",
        description: "Heavyweight 240 GSM combed cotton oversized streetwear t-shirt with dropped shoulders and a modern boxy silhouette.",
        price: 999,
        discount_price: 699,
        category: "T-Shirts",
        stock: 50,
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Off-White", "Charcoal", "Sage Green", "Black"],
        is_featured: true,
        images: [
            {
                url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
                public_id: null
            }
        ],
        ratings: { average: 4.7, count: 68 }
    },
    {
        name: "Slim Fit Chino Trousers",
        description: "Stretch-cotton twill chinos tailored for everyday style and maximum flexibility. Wrinkle-resistant finish with deep slant pockets.",
        price: 1799,
        discount_price: 1399,
        category: "Pants",
        stock: 30,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Khaki", "Navy Blue", "Olive", "Beige"],
        is_featured: true,
        images: [
            {
                url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
                public_id: null
            }
        ],
        ratings: { average: 4.6, count: 35 }
    },
    {
        name: "Cozy Fleece Pullover Hoodie",
        description: "Ultra-plush brushed fleece hoodie with double-layer drawstring hood and ribbed cuffs. Designed for chilly evenings and everyday lounging.",
        price: 2199,
        discount_price: 1599,
        category: "Hoodies",
        stock: 20,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Heather Grey", "Midnight Black", "Burgundy"],
        is_featured: true,
        images: [
            {
                url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
                public_id: null
            }
        ],
        ratings: { average: 4.9, count: 89 }
    },
    {
        name: "Floral Boho Summer Dress",
        description: "Flowy, lightweight chiffon floral midi dress with delicate flutter sleeves, a cinched waist, and a tiered ruffled skirt.",
        price: 2699,
        discount_price: 1999,
        category: "Dresses",
        stock: 18,
        sizes: ["XS", "S", "M", "L"],
        colors: ["Blush Pink", "Sky Blue", "Daisy Yellow"],
        is_featured: true,
        images: [
            {
                url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
                public_id: null
            }
        ],
        ratings: { average: 4.8, count: 54 }
    },
    {
        name: "Relaxed Fit Cargo Joggers",
        description: "Streetwear utility cargo pants with elasticated waistband, adjustable toggle cuffs, and multiple functional snap-flap cargo pockets.",
        price: 1899,
        discount_price: 1499,
        category: "Pants",
        stock: 35,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Army Green", "Stealth Black", "Camo"],
        is_featured: false,
        images: [
            {
                url: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80",
                public_id: null
            }
        ],
        ratings: { average: 4.5, count: 28 }
    },
    {
        name: "Casual Linen Button-Down Shirt",
        description: "Crisp and airy 100% natural European linen long sleeve shirt. Perfect for beach vacations, summer weddings, and relaxed office wear.",
        price: 1999,
        discount_price: 1499,
        category: "Shirts",
        stock: 22,
        sizes: ["S", "M", "L", "XL"],
        colors: ["White", "Sky Blue", "Pastel Pink"],
        is_featured: false,
        images: [
            {
                url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
                public_id: null
            }
        ],
        ratings: { average: 4.6, count: 31 }
    },
    {
        name: "Waterproof Puffer Winter Parka",
        description: "Windproof and thermal insulated winter parka with detachable faux-fur hood trim and deep microfleece-lined hand-warmer pockets.",
        price: 4999,
        discount_price: 3799,
        category: "Jackets",
        stock: 12,
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Matte Black", "Deep Navy", "Olive Drab"],
        is_featured: true,
        images: [
            {
                url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop&q=80",
                public_id: null
            }
        ],
        ratings: { average: 4.9, count: 73 }
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.dburl);
        console.log("✅ Connected to MongoDB for seeding...");

        // 1. Seed Products if empty or on demand
        const existingProductsCount = await Product.countDocuments();
        if (existingProductsCount === 0) {
            console.log("🌱 Inserting sample products...");
            await Product.insertMany(sampleProducts);
            console.log(`✅ ${sampleProducts.length} sample products inserted!`);
        } else {
            console.log(`ℹ️ Products already exist (${existingProductsCount} products). Skipping product seed.`);
        }

        // 2. Ensure Admin User Exists for testing
        const adminEmail = "admin@clothstore.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            console.log("👤 Creating default admin user (admin@clothstore.com / Admin@123)...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("Admin@123", salt);

            const adminUser = new User({
                first_name: "Store",
                last_name: "Admin",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
                is_active: true,
                verification: {
                    user: {
                        is_verified: true
                    }
                }
            });

            await adminUser.save();
            console.log("✅ Admin user created: admin@clothstore.com / Admin@123 (role: admin)");
        } else {
            // Ensure role is admin
            if (existingAdmin.role !== "admin") {
                existingAdmin.role = "admin";
                existingAdmin.is_active = true;
                await existingAdmin.save();
                console.log("✅ Existing user updated to admin role!");
            } else {
                console.log("ℹ️ Admin user already exists with role: admin");
            }
        }

        console.log("🎉 Seed finished successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed error:", err);
        process.exit(1);
    }
};

seedDB();
