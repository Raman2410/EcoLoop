import mongoose from "mongoose";

const SCRAP_TYPES = [
  "PLASTIC",
  "PAPER",
  "CARDBOARD",
  "METAL",
  "ELECTRONICS",
  "GLASS",
];

const scrapPriceSchema = new mongoose.Schema(
  {
    scrapType: {
      type: String,
      enum: SCRAP_TYPES,
      required: true,
      unique: true,
      set: (value) => value.trim().toUpperCase(),
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ScrapPrice", scrapPriceSchema);