import mongoose from "mongoose";

const VoucherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    value: {
      type: Number,
      required: true,
      enum: [20, 50, 100],
    },

    ecoCoinsUsed: {
      type: Number,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index — MongoDB auto-removes expired docs
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    redeemedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

VoucherSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Voucher", VoucherSchema);
