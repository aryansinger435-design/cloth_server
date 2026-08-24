import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { router } from "./routes/routes.js";

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
  windowMs:  60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
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
  .connect(process.env.mongodburl)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.use("/", router);

// Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});