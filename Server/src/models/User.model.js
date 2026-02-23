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

    // Collector-specific fields (only used when role === "collector")
    businessName: {
      type: String,
      required: function() {
        return this.role === "collector";
      },
    },

    serviceArea: {
      type: String,
      required: function() {
        return this.role === "collector";
      },
    },

    vehicleType: {
      type: String,
      enum: ["cycle", "bike", "auto", "truck"],
      required: function() {
        return this.role === "collector";
      },
    },

    vehicleNumber: {
      type: String,
      required: function() {
        return this.role === "collector";
      },
    },

    isAvailable: {
      type: Boolean,
      default: function() {
        return this.role === "collector" ? true : undefined;
      },
    },

    ecoPoints: {
      type: Number,
      default: 0,
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
  },
  { timestamps: true }
);

// Indexes for common query patterns
UserSchema.index({ role: 1 });
UserSchema.index({ isVerified: 1 });

export default mongoose.model("User", UserSchema);