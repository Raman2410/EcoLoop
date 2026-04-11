import mongoose from "mongoose";

const SCRAP_TYPES = [
  "PLASTIC",
  "PAPER",
  "CARDBOARD",
  "METAL",
  "ELECTRONICS",
  "GLASS",
];

const pickupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    scrapType: {
      type: String,
      enum: SCRAP_TYPES,
      required: true,
      set: (value) => value.trim().toUpperCase(),
    },

    approxLoad: {
      type: String,
      enum: ["small", "medium", "large", "bulk"],
      required: true,
    },

    actualWeight: {
      type: Number,
      default: 0,
    },

    pricePerKgAtCompletion: {
      type: Number,
    },

    rewardCoins: {
      type: Number,
      default: 0,
    },

    ecoCoins: {
      type: Number,
      default: 0,
    },

    co2Saved: {
      type: Number,
      default: 0,
      comment: "CO₂ saved in kg through recycling this pickup",
    },

    completedAt: {
      type: Date,
    },

    address: {
      type: String,
      required: true,
    },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    /**
     * Service area this pickup belongs to.
     * Used by getPendingPickups to filter by collector's serviceAreas.
     */
    area: {
      type: String,
      default: "",
      trim: true,
    },

    /**
     * Pickup lifecycle status.
     *
     * Flow:
     *   pending → assigned → in_progress → completed
     *                      ↘ cancelled (from pending only)
     *
     * "in_progress" is set when the collector triggers OTP generation,
     * signalling they are physically at the location. Completion is only
     * possible after the user verifies the OTP.
     */
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "recycled",
        "cancelled",
      ],
      default: "pending",
    },

    // Status timestamps for timeline tracking
    statusTimestamps: {
      pending: {
        type: Date,
        default: Date.now,
      },
      assigned: Date,
      in_progress: Date,
      completed: Date,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    // ── OTP-based completion verification ─────────────────────────────────────

    /**
     * One-time password sent to the user's phone when the collector
     * initiates completion. Cleared after successful verification.
     */
    completionOtp: {
      type: String,
      select: false, // Never returned in queries unless explicitly selected
    },

    /**
     * Expiry timestamp for completionOtp.
     * OTP is invalid if Date.now() > completionOtpExpiry.
     */
    completionOtpExpiry: {
      type: Date,
      select: false,
    },

    /**
     * Number of failed OTP attempts for this pickup.
     * Locked out after 5 consecutive failures to prevent brute-force.
     */
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    image: {
      type: String,
      default: null,
      comment: "Photo of scrap uploaded by the user during request creation",
    },

    // ── Optional image proof ───────────────────────────────────────────────────

    /**
     * Path or URL of the proof-of-pickup image uploaded by the collector.
     * Stored as a relative path under /uploads/pickup-proofs/ on disk,
     * or as a full URL if a CDN/Cloudinary is configured later.
     */
    proofImage: {
      type: String,
      default: null,
    },
    archivedByCollector: {
      type: Boolean,
      default: false,
      index: true, // Index for faster queries
    },
    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
pickupSchema.index({ userId: 1, status: 1 });
pickupSchema.index({ collectorId: 1, status: 1 });
pickupSchema.index({ status: 1 });
pickupSchema.index({ scheduledDate: 1 });
pickupSchema.index({ status: 1, area: 1 });

export default mongoose.model("Pickup", pickupSchema);
