import mongoose from "mongoose";
import Pickup from "../models/Pickup.model.js";
import ScrapPrice from "../models/ScrapPrice.model.js";
import walletService from "../services/walletService.js";
import User from "../models/User.model.js";
import {
  SCRAP_TYPES,
  normalizeScrapType,
} from "../constants/scrapConstants.js";

// ================= CONSTANTS =================
const VALID_LOADS = ["small", "medium", "large", "bulk"];
const LOAD_TO_WEIGHT = {
  small: 2,
  medium: 5,
  large: 10,
  bulk: 20,
};

const PICKUP_STATUS = {
  PENDING: "pending",
  ASSIGNED: "assigned",
  COMPLETED: "completed",
};

const COLLECTOR_REWARD_POINTS = 10;

// ================= UTILITIES =================
const resolveScrapType = (value) => {
  const normalized = normalizeScrapType(value);
  return SCRAP_TYPES.includes(normalized) ? normalized : null;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getWeightFromLoad = (load) => LOAD_TO_WEIGHT[load] || null;

const calculateRewardCoins = (weight, pricePerKg) => weight * pricePerKg;

// ================= VALIDATORS =================
const validatePickupCreation = ({ scrapType, approxLoad, address, scheduledDate }) => {
  if (!scrapType || !approxLoad || !address || !scheduledDate) {
    return { isValid: false, message: "All fields are required" };
  }

  const normalizedScrapType = resolveScrapType(scrapType);
  if (!normalizedScrapType) {
    return { isValid: false, message: "Invalid scrap type" };
  }

  if (!VALID_LOADS.includes(approxLoad)) {
    return { isValid: false, message: "Invalid approxLoad value" };
  }

  const parsedDate = new Date(scheduledDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return { isValid: false, message: "Invalid scheduledDate" };
  }

  return { 
    isValid: true, 
    normalizedScrapType, 
    parsedDate 
  };
};

const validatePickupOwnership = (pickup, collectorId) => {
  if (!pickup.collectorId) {
    return { isValid: false, message: "Pickup not assigned to any collector" };
  }

  if (pickup.collectorId.toString() !== collectorId.toString()) {
    return { isValid: false, message: "Not assigned to this pickup" };
  }

  return { isValid: true };
};

// ================= PICKUP OPERATIONS =================
const createPickupRecord = async (userId, scrapType, approxLoad, address, scheduledDate) => {
  return Pickup.create({
    userId,
    scrapType,
    approxLoad,
    address,
    scheduledDate,
  });
};

const assignPickupToCollector = async (pickup, collectorId) => {
  pickup.collectorId = collectorId;
  pickup.status = PICKUP_STATUS.ASSIGNED;
  return pickup.save();
};

const fetchScrapPrice = async (scrapType) => {
  const normalizedScrapType = resolveScrapType(scrapType);
  if (!normalizedScrapType) {
    return null;
  }

  return ScrapPrice.findOne({ scrapType: normalizedScrapType });
};

const updatePickupCompletion = async (pickup, weight, pricePerKg, rewardCoins, normalizedScrapType) => {
  pickup.status = PICKUP_STATUS.COMPLETED;
  pickup.actualWeight = weight;
  pickup.pricePerKgAtCompletion = pricePerKg;
  pickup.rewardCoins = rewardCoins;
  pickup.ecoCoins = rewardCoins;
  pickup.completedAt = new Date();
  pickup.scrapType = normalizedScrapType;

  return pickup.save();
};

const rewardCollector = async (collectorId) => {
  try {
    const collector = await User.findById(collectorId);
    if (collector && collector.role === "collector") {
      collector.ecoPoints = (collector.ecoPoints || 0) + COLLECTOR_REWARD_POINTS;
      await collector.save();
    }
  } catch (error) {
    console.error("Collector reward error:", error);
    // Don't throw - this is a non-critical operation
  }
};

const processPickupRewards = async (userId, pickupId, rewardCoins) => {
  await walletService.createWalletIfNotExists(userId.toString());
  await walletService.creditEcoCoins({
    userId: userId.toString(),
    amount: rewardCoins,
    pickupId: pickupId.toString(),
  });
};

// ================= USER CONTROLLERS =================

/**
 * USER: Create Pickup Request
 */
export const createPickup = async (req, res) => {
  try {
    const validation = validatePickupCreation(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const { approxLoad, address } = req.body;
    const { normalizedScrapType, parsedDate } = validation;

    const pickup = await createPickupRecord(
      req.user._id,
      normalizedScrapType,
      approxLoad,
      address,
      parsedDate
    );

    return res.status(201).json(pickup);

  } catch (error) {
    console.error("Create pickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * USER: Get My Pickups
 */
export const getMyPickups = async (req, res) => {
  try {
    const pickups = await Pickup.find({ userId: req.user._id });
    return res.json(pickups);

  } catch (error) {
    console.error("Get my pickups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ================= COLLECTOR CONTROLLERS =================

/**
 * COLLECTOR: View Pending Pickups
 */
export const getPendingPickups = async (_req, res) => {
  try {
    const pickups = await Pickup.find({ status: PICKUP_STATUS.PENDING })
      .populate("userId", "name phone address");
    
    return res.json(pickups);

  } catch (error) {
    console.error("Get pending pickups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * COLLECTOR: Accept Pickup
 */
export const acceptPickup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid pickup id" });
    }

    const pickup = await Pickup.findById(id);
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    if (pickup.status !== PICKUP_STATUS.PENDING) {
      return res.status(409).json({ 
        message: "Pickup already assigned or completed" 
      });
    }

    await assignPickupToCollector(pickup, req.user._id);

    return res.status(200).json({
      message: "Pickup assigned successfully",
      pickup,
    });

  } catch (error) {
    console.error("Accept pickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * COLLECTOR: Complete Pickup
 */
export const completePickup = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate pickup ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid pickup id" });
    }

    // Fetch pickup
    const pickup = await Pickup.findById(id);
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    // Verify ownership
    const ownershipValidation = validatePickupOwnership(pickup, req.user._id);
    if (!ownershipValidation.isValid) {
      return res.status(403).json({ message: ownershipValidation.message });
    }

    // Verify status
    if (pickup.status !== PICKUP_STATUS.ASSIGNED) {
      return res.status(400).json({
        message: "Pickup must be assigned before completion",
      });
    }

    // Calculate weight
    const weight = getWeightFromLoad(pickup.approxLoad);
    if (!weight) {
      return res.status(400).json({ message: "Invalid approxLoad value" });
    }

    // Validate and fetch scrap price
    const normalizedScrapType = resolveScrapType(pickup.scrapType);
    if (!normalizedScrapType) {
      return res.status(400).json({ message: "Invalid scrap type" });
    }

    const scrapPrice = await fetchScrapPrice(pickup.scrapType);
    if (!scrapPrice) {
      return res.status(409).json({
        message: "Scrap price not configured for this type",
      });
    }

    // Calculate rewards
    const pricePerKg = scrapPrice.pricePerKg;
    const rewardCoins = calculateRewardCoins(weight, pricePerKg);

    // Process wallet rewards
    await processPickupRewards(pickup.userId, pickup._id, rewardCoins);

    // Update pickup status
    await updatePickupCompletion(
      pickup,
      weight,
      pricePerKg,
      rewardCoins,
      normalizedScrapType
    );

    // Reward collector (non-blocking)
    await rewardCollector(pickup.collectorId);

    return res.status(200).json({
      message: "Pickup completed successfully",
      ecoCoinsEarned: rewardCoins,
      pricePerKg,
    });

  } catch (error) {
    console.error("Complete pickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};