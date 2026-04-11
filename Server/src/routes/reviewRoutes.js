import express from "express";
import {
  createReview,
  getCollectorRating,
  getPickupReview,
} from "../controllers/reviewController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All review routes require authentication
router.use(protect);

// Create a review
router.post("/", createReview);

// Get collector's average rating and review count
router.get("/collector/:collectorId", getCollectorRating);

// Get review for a specific pickup
router.get("/pickup/:pickupId", getPickupReview);

export default router;
