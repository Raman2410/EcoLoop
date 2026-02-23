import express from "express";
import {
  createPickup,
  getMyPickups,
  getPendingPickups,
  getAssignedPickups,
  getCompletedPickups,
  acceptPickup,
  completePickup,
  cancelPickup,
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
router.get("/assigned", protect, collectorOnly, getAssignedPickups);
router.get("/completed", protect, collectorOnly, getCompletedPickups);
router.put("/accept/:id", protect, collectorOnly, acceptPickup);
router.patch("/complete/:id", protect, collectorOnly, completePickup);
router.patch("/cancel/:id", protect, userOnly, cancelPickup);

export default router;