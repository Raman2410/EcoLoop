import express from "express";

// Unified Smart Waste Classifier — GPT-4o vision (text + image)
import { getAssistantDecision } from "../controllers/aiAssistant.controller.js";

// Multer middleware for optional image upload
import {
  uploadImage,
  handleUploadError,
} from "../middlewares/upload.middleware.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/ai/assistant
 *
 * Unified Smart Waste Classifier (GPT-4o vision).
 * Accepts multipart/form-data with:
 *   - text fields: title, description, category, condition (all optional)
 *   - file field:  image (optional, max 5 MB)
 *
 * At least one of text fields OR image must be provided.
 */
router.post(
  "/assistant",
  protect,
  uploadImage,
  handleUploadError,
  getAssistantDecision
);

export default router;
