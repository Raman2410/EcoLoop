// Run this once to seed scrap prices into MongoDB
// Usage: node src/scripts/seedScrapPrices.js

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const SCRAP_PRICES = [
  { scrapType: "PLASTIC",     pricePerKg: 8  },
  { scrapType: "PAPER",       pricePerKg: 5  },
  { scrapType: "CARDBOARD",   pricePerKg: 4  },
  { scrapType: "METAL",       pricePerKg: 30 },
  { scrapType: "ELECTRONICS", pricePerKg: 50 },
  { scrapType: "GLASS",       pricePerKg: 3  },
];

const SCRAP_TYPES = ["PLASTIC", "PAPER", "CARDBOARD", "METAL", "ELECTRONICS", "GLASS"];

const scrapPriceSchema = new mongoose.Schema({
  scrapType: { type: String, enum: SCRAP_TYPES, required: true, unique: true },
  pricePerKg: { type: Number, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const ScrapPrice = mongoose.model("ScrapPrice", scrapPriceSchema);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Get any existing user to use as updatedBy (required field)
    const db = mongoose.connection.db;
    const user = await db.collection("users").findOne({});
    if (!user) {
      console.error("❌ No users found. Register at least one user first.");
      process.exit(1);
    }

    const updatedBy = user._id;
    console.log(`Using user: ${user.email} as updatedBy`);

    for (const price of SCRAP_PRICES) {
      await ScrapPrice.findOneAndUpdate(
        { scrapType: price.scrapType },
        { ...price, updatedBy },
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded: ${price.scrapType} = ₹${price.pricePerKg}/kg`);
    }

    console.log("\n🎉 All scrap prices seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();