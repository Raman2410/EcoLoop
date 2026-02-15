import express from "express";
import {
  upsertScrapPrice,
  getScrapPricesAdmin,
} from "../controllers/scrapPriceController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, upsertScrapPrice);
router.get("/", protect, adminOnly, getScrapPricesAdmin);

export default router;
