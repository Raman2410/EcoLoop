import cron from "node-cron";
import User from "../models/User.model.js";

/**
 * Resets todayPickups for all collectors at midnight
 */
export const initBadgeCron = () => {
  // Runs every day at 00:00 (midnight)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[CRON] Running midnight reset for collector todayPickups...");

      const result = await User.updateMany(
        { role: "collector" },
        { $set: { todayPickups: 0 } }
      );

      console.log(`[CRON] Reset completed. Modified ${result.modifiedCount} collectors.`);
    } catch (error) {
      console.error("[CRON] Error resetting todayPickups:", error);
    }
  });
};
