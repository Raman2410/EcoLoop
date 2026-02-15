import express from "express";
import {
  register,
  login,
  logout,
  // Legacy endpoints for backward compatibility
  registerUser,
  registerCollector,
  loginUser,
  loginCollector,
  logoutUser,
  logoutCollector,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { verifyOtp } from "../controllers/authController.js";

const router = express.Router();

// New unified endpoints
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);

// otp-verify
router.post("/verify-otp", verifyOtp);

// Legacy endpoints (optional - remove if not needed)
router.post("/register/user", registerUser);
router.post("/register/collector", registerCollector);
router.post("/login/user", loginUser);
router.post("/login/collector", loginCollector);
router.post("/logout/user", protect, logoutUser);
router.post("/logout/collector", protect, logoutCollector);

export default router;