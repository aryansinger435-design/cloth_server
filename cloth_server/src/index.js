import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "../src/routes/routes.js";

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// JSON body parser
app.use(express.json({ limit: "10kb" }));

// CORS
app.use(cors());

// Rate limiter
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

// MongoDB connection
mongoose
    .connect(process.env.dburl)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.log("❌ MongoDB connection error:", err));

// Routes
app.use("/api", router);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// Server
app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});