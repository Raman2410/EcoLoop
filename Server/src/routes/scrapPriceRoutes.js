import express from "express";
import { getScrapPricesPublic } from "../controllers/scrapPriceController.js";

const router = express.Router();

router.get("/", getScrapPricesPublic);

export default router;
