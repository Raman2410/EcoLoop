/**
 * Migration: backfill serviceAreas for existing collector documents
 *
 * Run once after deploying the User model update:
 *   node src/scripts/migrateServiceAreas.js
 *
 * Safe to run multiple times — uses $addToSet to avoid duplicates.
 *
 * What it does:
 *   For every collector whose serviceAreas array is empty (or missing)
 *   but who has a legacy serviceArea string, copies that string into
 *   the serviceAreas array so the new filtering logic works immediately.
 */

import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.model.js";

const migrate = async () => {
  await connectDB();
  console.log("[Migration] Connected to MongoDB.");

  // Find all collectors with an empty serviceAreas but a non-empty serviceArea
  const staleCollectors = await User.find({
    role: "collector",
    serviceArea: { $exists: true, $ne: "" },
    $or: [
      { serviceAreas: { $exists: false } },
      { serviceAreas: { $size: 0 } },
    ],
  }).select("_id name serviceArea serviceAreas");

  console.log(`[Migration] Found ${staleCollectors.length} collector(s) to migrate.`);

  if (staleCollectors.length === 0) {
    console.log("[Migration] Nothing to do. Exiting.");
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const collector of staleCollectors) {
    try {
      const area = collector.serviceArea.trim();

      await User.updateOne(
        { _id: collector._id },
        { $addToSet: { serviceAreas: area } }  // $addToSet avoids duplicates
      );

      console.log(`  ✓ ${collector.name} (${collector._id}) → serviceAreas: ["${area}"]`);
      updated++;
    } catch (err) {
      console.error(`  ✗ Failed for ${collector._id}:`, err.message);
      failed++;
    }
  }

  console.log(`\n[Migration] Done. Updated: ${updated}, Failed: ${failed}`);
  await mongoose.disconnect();
};

migrate().catch((err) => {
  console.error("[Migration] Fatal error:", err);
  process.exit(1);
});
