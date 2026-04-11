import multer from "multer";
import { storage as cloudinaryStorage } from "../config/cloudinary.js";

const upload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/**
 * Middleware: optional single image upload under field name "proofImage".
 * Used by the pickup completion route.
 */
export const uploadProofImage = upload.single("proofImage");

/**
 * Middleware: optional single image upload under field name "image".
 * Used by the pickup creation route and AI assistant.
 */
export const uploadImage = upload.single("image");

/**
 * Error handler for multer-specific errors.
 * Must be registered AFTER uploadProofImage in the route chain.
 */
export const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image too large. Maximum allowed size is 5 MB.",
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err?.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};
