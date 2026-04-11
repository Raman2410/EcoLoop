import express from "express";
import rateLimit from "express-rate-limit";
import {
  createPickup,
  getMyPickups,
  getPendingPickups,
  getAssignedPickups,
  getCompletedPickups,
  acceptPickup,
  completePickup,
  cancelPickup,
  generateCompletionOtp,
  verifyOtpAndComplete,
  deleteCompletedPickup,
  getArchivedPickups,
  getPickupById,
} from "../controllers/pickupController.js";

import {
  protect,
  collectorOnly,
  userOnly,
} from "../middlewares/authMiddleware.js";

import {
  uploadProofImage,
  uploadImage,
  handleUploadError,
} from "../middlewares/upload.middleware.js";

const router = express.Router();

const createPickupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req, res) => {
    // Limit by user ID instead of IP so multiple users on the same network aren't blocked
    return req.user ? req.user._id.toString() : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many pickup requests, please try again later",
  },
});

// ── User routes ────────────────────────────────────────────────────────────
router.post(
  "/",
  createPickupLimiter,
  protect,
  userOnly,
  uploadImage,
  handleUploadError,
  createPickup
);
router.get("/my", protect, userOnly, getMyPickups);
router.patch("/cancel/:id", protect, userOnly, cancelPickup);

// ── Collector read routes ──────────────────────────────────────────────────
router.get("/pending", protect, collectorOnly, getPendingPickups);
router.get("/assigned", protect, collectorOnly, getAssignedPickups);
router.get("/completed", protect, collectorOnly, getCompletedPickups);
router.delete("/completed/:id", protect, collectorOnly, deleteCompletedPickup);
router.get("/archived", protect, getArchivedPickups);

// ── Collector action routes ────────────────────────────────────────────────
router.put("/accept/:id", protect, collectorOnly, acceptPickup);

// Legacy complete route — returns 400 with instructions to use OTP flow
router.patch("/complete/:id", protect, collectorOnly, completePickup);

// ── OTP-verified completion routes ────────────────────────────────────────

/**
 * Step 1: Collector arrives → generate OTP → send to user's phone
 * POST /api/pickups/generate-otp/:id
 */
router.post("/generate-otp/:id", protect, collectorOnly, generateCompletionOtp);

/**
 * Step 2: Collector enters user's OTP → optionally uploads proof image → complete
 * POST /api/pickups/verify-otp/:id
 * Content-Type: multipart/form-data
 * Fields: otp (string), proofImage (file, optional)
 */
router.post(
  "/verify-otp/:id",
  protect,
  collectorOnly,
  uploadProofImage, // multer parses multipart body, attaches req.file
  handleUploadError, // converts multer errors to clean JSON responses
  verifyOtpAndComplete
);

// ── Shared GET route for Details ───────────────────────────────────────────
// Must be at the bottom to avoid overriding explicit paths like /pending
router.get("/:id", protect, getPickupById);

export default router;
