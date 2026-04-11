import Review from "../models/Review.model.js";
import Pickup from "../models/Pickup.model.js";
import mongoose from "mongoose";

// ================= VALIDATORS =================

const validateRating = (rating) => {
  const num = Number(rating);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    return {
      isValid: false,
      message: "Rating must be an integer between 1 and 5",
    };
  }
  return { isValid: true, value: num };
};

const validateComment = (comment = "") => {
  const trimmed = String(comment).trim();
  if (trimmed.length > 500) {
    return { isValid: false, message: "Comment cannot exceed 500 characters" };
  }
  return { isValid: true, value: trimmed };
};

// ================= CONTROLLERS =================

/**
 * POST /api/reviews
 * Create a review for a completed pickup
 *
 * Body: { pickupId, rating, comment? }
 */
export const createReview = async (req, res) => {
  try {
    const { pickupId, rating, comment } = req.body;
    const userId = req.user._id;

    // Validate pickupId
    if (!pickupId || !mongoose.Types.ObjectId.isValid(pickupId)) {
      return res.status(400).json({
        success: false,
        message: "Valid pickup ID is required",
      });
    }

    // Validate rating
    const ratingValidation = validateRating(rating);
    if (!ratingValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: ratingValidation.message,
      });
    }

    // Validate comment
    const commentValidation = validateComment(comment);
    if (!commentValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: commentValidation.message,
      });
    }

    // Check if pickup exists and belongs to user
    const pickup = await Pickup.findById(pickupId).select(
      "userId collectorId status"
    );
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: "Pickup not found",
      });
    }

    // Verify user owns this pickup
    if (pickup.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own pickups",
      });
    }

    // Verify pickup is completed
    if (pickup.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "You can only review completed pickups",
      });
    }

    // Verify pickup was assigned to a collector
    if (!pickup.collectorId) {
      return res.status(400).json({
        success: false,
        message: "Cannot review pickup without an assigned collector",
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ pickupId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this pickup",
      });
    }

    // Create review
    const review = await Review.create({
      pickupId,
      userId,
      collectorId: pickup.collectorId,
      rating: ratingValidation.value,
      comment: commentValidation.value,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    console.error("[Review] Create error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review. Please try again.",
    });
  }
};

/**
 * GET /api/reviews/collector/:collectorId
 * Get average rating and review count for a collector
 */
export const getCollectorRating = async (req, res) => {
  try {
    const { collectorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collectorId)) {
      return res.status(400).json({
        success: false,
        message: "Valid collector ID is required",
      });
    }

    // Aggregate reviews for this collector
    const stats = await Review.aggregate([
      { $match: { collectorId: new mongoose.Types.ObjectId(collectorId) } },
      {
        $group: {
          _id: "$collectorId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
        },
      });
    }

    const { averageRating, totalReviews } = stats[0];

    return res.status(200).json({
      success: true,
      data: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
      },
    });
  } catch (error) {
    console.error("[Review] Get rating error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch collector rating",
    });
  }
};

/**
 * GET /api/reviews/pickup/:pickupId
 * Check if a pickup has been reviewed
 */
export const getPickupReview = async (req, res) => {
  try {
    const { pickupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pickupId)) {
      return res.status(400).json({
        success: false,
        message: "Valid pickup ID is required",
      });
    }

    const review = await Review.findOne({ pickupId })
      .select("rating comment createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("[Review] Get pickup review error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch review",
    });
  }
};
