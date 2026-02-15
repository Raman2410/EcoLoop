import express from "express";
import {
  createPickup,
  getMyPickups,
  getPendingPickups,
  acceptPickup,
  completePickup, // ✅ ADD
} from "../controllers/pickupController.js";

import {
  protect,
  collectorOnly,
  userOnly,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// User routes
router.post("/", protect, userOnly, createPickup);
router.get("/my", protect, userOnly, getMyPickups);

// Collector routes
router.get("/pending", protect, collectorOnly, getPendingPickups);
router.put("/accept/:id", protect, collectorOnly, acceptPickup);

// ✅ NEW: Collector completes pickup
router.patch(
  "/complete/:id",
  protect,
  collectorOnly,
  completePickup
);

export default router;
