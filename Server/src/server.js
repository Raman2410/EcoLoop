import "./config/env.js";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import connectDB from "./config/db.js";
import pool from "./config/postgres.js";
import pickupRoutes from "./routes/pickupRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminScrapPriceRoutes from "./routes/adminScrapPriceRoutes.js";
import scrapPriceRoutes from "./routes/scrapPriceRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import aiRoutes from "./routes/ai.routes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { initBadgeCron } from "./cron/badgeCron.js";

// Validate required env variables on startup
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "PORT"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[Startup] Missing required env variable: ${key}`);
    process.exit(1);
  }
});

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 8000;

// ── Socket.io ──────────────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  path: "/api/socket.io", // Ensure this matches frontend and proxy rules
  cors: {
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Room strategy:
//   user:<userId>   — private room for a single user (pickup accepted, OTP, complete)
//   area:<areaName> — broadcast room for all collectors in that service area
io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Client sends their userId after auth so we can route events to them
  socket.on("register-user", (userId) => {
    if (userId) {
      const room = `user:${userId.toString()}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined private room: ${room}`);
    } else {
      console.warn(`[Socket] register-user called without userId by ${socket.id}`);
    }
  });

  // Collector joins their service area room(s) to receive new-pickup events
  socket.on("register-collector", (areas) => {
    const list = Array.isArray(areas) ? areas : [areas];
    const normalizedAreas = list
      .filter(Boolean)
      .map((a) => a.trim().toLowerCase());

    normalizedAreas.forEach((area) => {
      const room = `area:${area}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined area room: ${room}`);
    });
  });

  // Collector broadcasts their GPS position while on an active pickup.
  // Server relays it to the user who owns that pickup.
  socket.on("collector-location", async ({ pickupId, lat, lng }) => {
    if (!pickupId || lat == null || lng == null) return;
    try {
      // Import lazily to avoid circular dependency at module load time
      const { default: Pickup } = await import("./models/Pickup.model.js");
      const pickup = await Pickup.findById(pickupId).select("userId").lean();
      if (pickup?.userId) {
        const room = `user:${pickup.userId.toString()}`;
        io.to(room).emit("collector-location", {
          lat,
          lng,
          pickupId,
        });
      }
    } catch (err) {
      console.error("[Socket] collector-location relay error:", err.message);
    }
  });

  socket.on("join-areas", (areas) => {
    if (!Array.isArray(areas)) return;

    areas.forEach((area) => {
      const room = `area:${area.trim().toLowerCase()}`;
      socket.join(room);
      console.log(`[Socket] Manually joined room: ${room}`);
    });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

connectDB();

// Initialize gamification cron
initBadgeCron();

// Middleware
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true,
  })
);
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
app.get("/api/health", async (_req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? "ok" : "error";

    // Check PostgreSQL connection
    await pool.query("SELECT 1");
    const postgresStatus = "ok";

    res.json({
      success: true,
      message: "Healthy",
      services: {
        mongodb: mongoStatus,
        postgres: postgresStatus,
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: "Unhealthy",
      error: err.message,
    });
  }
});

// app.get('/test', (req, res) => {
//   res.json({ success: true, message: "Test route working" });
// });

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

// Routes
app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/admin/scrap-prices", adminScrapPriceRoutes);
app.use("/api/scrap-prices", scrapPriceRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reviews", reviewRoutes);

// Serve uploaded proof images as static files.
// __dirname = Server/src  →  one level up = Server/uploads
// Access pattern: GET /uploads/pickup-proofs/<filename>
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

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

httpServer.listen(port,'0.0.0.0', () => {
  console.log(
    `[Server] Running on port ${port} (${process.env.NODE_ENV || "development"})`
  );
});
