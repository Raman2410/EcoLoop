import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: function () {
      return this.role === "collector";
    },
    unique: true,
    sparse: true,
  },

  address: {
    type: String,
  },

  ecoCoins: {
    type: Number,
    default: 0,
  },

  role: {
    type: String,
    enum: ["user", "collector", "admin"],
    default: "user",
  },

  // ── Collector-specific fields (only used when role === "collector") ────────

  businessName: {
    type: String,
    required: function () {
      return this.role === "collector";
    },
  },

  /**
   * Legacy single-string field kept for backward compatibility.
   * New code should read serviceAreas (array) instead.
   * On save, the pre-save hook below keeps both fields in sync.
   */
  serviceArea: {
    type: String,
    required: function () {
      return this.role === "collector";
    },
  },

  /**
   * Array of service areas for a collector.
   * Used by getPendingPickups to filter pickups to only those
   * whose `area` matches one of these entries.
   *
   * Populated automatically from serviceArea on save (see pre-save hook).
   * Can also be set directly for collectors who cover multiple areas.
   *
   * Example: ["Koramangala", "Indiranagar"]
   */
  serviceAreas: {
    type: [String],
    default: [],
  },

  vehicleType: {
    type: String,
    enum: ["cycle", "bike", "auto", "truck"],
    required: function () {
      return this.role === "collector";
    },
  },

  vehicleNumber: {
    type: String,
    required: function () {
      return this.role === "collector";
    },
  },

  isAvailable: {
    type: Boolean,
    default: function () {
      return this.role === "collector" ? true : undefined;
    },
  },

  ecoPoints: {
    type: Number,
    default: 0,
  },

  // ── Collector gamification & stats ──────────────────────────────────────────

  totalPickups: {
    type: Number,
    default: 0,
  },
  
  todayPickups: {
    type: Number,
    default: 0,
  },
  
  bestDayRecord: {
    type: Number,
    default: 0,
  },
  
  badges: {
    type: [String],
    default: [],
  },
  
  lastActive: {
    type: Date,
  },

  otp: {
    type: String,
  },

  otpExpiry: {
    type: Date,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  tokenVersion: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// ── Pre-save hook: keep serviceAreas in sync with serviceArea ──────────────
//
// When a collector registers or updates their serviceArea string, we
// automatically populate serviceAreas so filtering logic always has an array
// to work with, regardless of whether the collector used the old or new field.
//
// This runs on every save, so existing collectors get their serviceAreas
// backfilled the next time their document is touched.
UserSchema.pre("save", function () {
  if (this.role === "collector" && this.serviceArea) {
    // Normalize to lowercase so it matches the area stored on Pickup documents
    const normalized = this.serviceArea.trim().toLowerCase();
    this.serviceArea = normalized;

    // Rebuild serviceAreas as a deduplicated, lowercased array
    const normalizedAreas = (this.serviceAreas || [])
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);
    if (normalized && !normalizedAreas.includes(normalized)) {
      normalizedAreas.unshift(normalized);
    }
    this.serviceAreas = normalizedAreas;
  }
});

// ── Indexes ────────────────────────────────────────────────────────────────
UserSchema.index({ role: 1 });
UserSchema.index({ isVerified: 1 });
// Supports efficient $in queries in getPendingPickups
UserSchema.index({ serviceAreas: 1 });

export default mongoose.model("User", UserSchema);
