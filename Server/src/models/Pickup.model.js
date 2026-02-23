import mongoose from "mongoose";
const SCRAP_TYPES = ["PLASTIC", "PAPER", "CARDBOARD"];

const pickupSchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collector",
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

    completedAt: {
      type: Date,
    },

    address: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "completed", "recycled", "cancelled"],
      default: "pending",
    },

    scheduledDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true
});

// Indexes for common query patterns
pickupSchema.index({ userId: 1, status: 1 });
pickupSchema.index({ collectorId: 1, status: 1 });
pickupSchema.index({ status: 1 });
pickupSchema.index({ scheduledDate: 1 });

export default mongoose.model("Pickup", pickupSchema);