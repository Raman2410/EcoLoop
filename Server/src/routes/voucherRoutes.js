import express from "express";
import voucherController from "../controllers/voucherController.js";
import { protect, userOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All voucher routes require a logged-in user
router.use(protect, userOnly);

// POST /api/vouchers/redeem  — create a new voucher by spending EcoCoins
router.post("/redeem", voucherController.redeemVoucher);

// GET  /api/vouchers/my      — list all vouchers for the logged-in user
router.get("/my", voucherController.getMyVouchers);

export default router;
