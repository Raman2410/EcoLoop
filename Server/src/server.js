import "./config/env.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import pool from "./config/postgres.js";
import pickupRoutes from "./routes/pickupRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminScrapPriceRoutes from "./routes/adminScrapPriceRoutes.js";
import scrapPriceRoutes from "./routes/scrapPriceRoutes.js";

// Validate required env variables on startup
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "PORT"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[Startup] Missing required env variable: ${key}`);
    process.exit(1);
  }
});

const app = express();
const port = process.env.PORT || 8000;

connectDB();

// Middleware
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// NoSQL injection protection (Express 5 compatible)
app.use((req, _res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      for (const key of Object.keys(obj)) {
        if (key.startsWith("$")) {
          delete obj[key];
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/", (_req, res) => {
  res.json({ success: true, message: "EcoLoop API is running" });
});

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

// Routes
app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/admin/scrap-prices", adminScrapPriceRoutes);
app.use("/api/scrap-prices", scrapPriceRoutes);
app.use("/api/wallet", walletRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(port, () => {
  console.log(`[Server] Running on port ${port} (${process.env.NODE_ENV || "development"})`);
});