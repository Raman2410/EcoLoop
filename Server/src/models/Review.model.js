import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    pickupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pickup",
      required: true,
      unique: true, // One review per pickup
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer between 1 and 5",
      },
    },

    comment: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient collector rating queries
reviewSchema.index({ collectorId: 1, rating: 1 });

export default mongoose.model("Review", reviewSchema);
