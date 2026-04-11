/**
 * Seed all scrap prices into MongoDB.
 *
 * Usage:
 *   node src/scripts/seedScrapPrices.js
 *
 * Safe to re-run — uses upsert so existing prices are updated, not duplicated.
 * Requires at least one user in the DB (used as `updatedBy`).
 */

import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.model.js";
import ScrapPrice from "../models/ScrapPrice.model.js";

const SCRAP_PRICES = [
  { scrapType: "PLASTIC", pricePerKg: 8 },
  { scrapType: "PAPER", pricePerKg: 5 },
  { scrapType: "CARDBOARD", pricePerKg: 4 },
  { scrapType: "METAL", pricePerKg: 30 },
  { scrapType: "ELECTRONICS", pricePerKg: 50 },
  { scrapType: "GLASS", pricePerKg: 3 },
];

const seed = async () => {
  await connectDB();
  console.log("\n[seedScrapPrices] Connected to MongoDB.\n");

  // Any user works as `updatedBy` — prefer admin, fall back to first user
  const adminUser =
    (await User.findOne({ role: "admin" })) ?? (await User.findOne({}));
  if (!adminUser) {
    console.error(
      "❌  No users found. Register at least one user first, then re-run."
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`  Using "${adminUser.email}" as updatedBy.\n`);

  for (const price of SCRAP_PRICES) {
    await ScrapPrice.findOneAndUpdate(
      { scrapType: price.scrapType },
      { ...price, updatedBy: adminUser._id },
      { upsert: true, new: true }
    );
    console.log(`  ✓  ${price.scrapType.padEnd(12)} ₹${price.pricePerKg}/kg`);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  All ${SCRAP_PRICES.length} scrap prices seeded successfully!
  Collectors can now complete pickups
  for all scrap types without errors.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("[seedScrapPrices] Fatal error:", err);
  process.exit(1);
});
