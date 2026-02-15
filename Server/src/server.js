
import "./config/env.js";
import express from "express";

import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

console.log("ENV CHECK:", typeof process.env.MONGO_URI);

import connectDB from "./config/db.js";
import pool from "./config/postgres.js"; // ← Add this line
import pickupRoutes from "./routes/pickupRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
// import User from "./models/User.js";
// import Collector from "./models/Collector.js";
import authRoutes from "./routes/authRoutes.js";
import adminScrapPriceRoutes from "./routes/adminScrapPriceRoutes.js";
import scrapPriceRoutes from "./routes/scrapPriceRoutes.js";


const app = express();
const port = process.env.PORT || 8000;

// Connect MongoDB
connectDB();

// Middleware
app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json());
console.log("User & Collector models loaded");

// Test Route
app.get("/", (req, res) => {
  res.send("EcoLoop Backend is running...");
});

// api routers
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/admin/scrap-prices", adminScrapPriceRoutes);
app.use("/api/scrap-prices", scrapPriceRoutes);
app.use("/api/wallet", walletRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

});
