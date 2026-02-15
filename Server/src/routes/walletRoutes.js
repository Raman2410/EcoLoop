import express from "express";
import walletController from "../controllers/walletController.js";
import { protect, userOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, userOnly, walletController.getWallet);

export default router;
