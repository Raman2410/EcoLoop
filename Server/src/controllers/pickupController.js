import mongoose from "mongoose";
import Pickup from "../models/Pickup.model.js";
import ScrapPrice from "../models/ScrapPrice.model.js";
import walletService from "../services/walletService.js";
import User from "../models/User.model.js";
import Review from "../models/Review.model.js";
import { generateOTP, getOtpExpiry } from "../services/otpService.js";
import { sendOTP } from "../services/smsServices.js";
import {
  SCRAP_TYPES,
  normalizeScrapType,
  calculateCO2Savings,
} from "../constants/scrapConstants.js";
import { io } from "../server.js";
import { checkAndAssignBadges } from "../services/badge/badgeService.js";

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
  IN_PROGRESS: "in_progress", // OTP generated, awaiting user verification
  COMPLETED: "completed",
};

const COLLECTOR_REWARD_POINTS = 10;
const PENDING_PAGE_LIMIT = 10;

// Max failed OTP attempts before lock-out
const MAX_OTP_ATTEMPTS = 5;

// ================= UTILITIES =================

const resolveScrapType = (value) => {
  const normalized = normalizeScrapType(value);
  return SCRAP_TYPES.includes(normalized) ? normalized : null;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getWeightFromLoad = (load) => LOAD_TO_WEIGHT[load] || null;

const calculateRewardCoins = (weight, pricePerKg) => weight * pricePerKg;

const normalizeArea = (value = "") => String(value).trim().toLowerCase();

// ================= VALIDATORS =================

const validatePickupCreation = ({
  scrapType,
  approxLoad,
  address,
  scheduledDate,
}) => {
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
  return { isValid: true, normalizedScrapType, parsedDate };
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

const createPickupRecord = async (
  userId,
  scrapType,
  approxLoad,
  address,
  scheduledDate,
  area,
  lat,
  lng,
  image
) => {
  return Pickup.create({
    userId,
    scrapType,
    approxLoad,
    address,
    scheduledDate,
    area,
    lat,
    lng,
    image,
  });
};

const assignPickupToCollector = async (pickup, collectorId) => {
  pickup.collectorId = collectorId;
  pickup.status = PICKUP_STATUS.ASSIGNED;
  pickup.statusTimestamps = pickup.statusTimestamps || {};
  pickup.statusTimestamps.assigned = new Date();
  return pickup.save();
};

const fetchScrapPrice = async (scrapType) => {
  const normalizedScrapType = resolveScrapType(scrapType);
  if (!normalizedScrapType) return null;
  return ScrapPrice.findOne({ scrapType: normalizedScrapType });
};

const updatePickupCompletion = async (
  pickup,
  weight,
  pricePerKg,
  rewardCoins,
  normalizedScrapType,
  proofImagePath
) => {
  pickup.status = PICKUP_STATUS.COMPLETED;
  pickup.actualWeight = weight;
  pickup.pricePerKgAtCompletion = pricePerKg;
  pickup.rewardCoins = rewardCoins;
  pickup.ecoCoins = rewardCoins;
  pickup.completedAt = new Date();
  pickup.scrapType = normalizedScrapType;

  // Calculate and store CO₂ savings
  pickup.co2Saved = calculateCO2Savings(normalizedScrapType, weight);

  // Set completed timestamp
  pickup.statusTimestamps = pickup.statusTimestamps || {};
  pickup.statusTimestamps.completed = new Date();

  // Clear OTP fields — they must not persist after completion
  pickup.completionOtp = undefined;
  pickup.completionOtpExpiry = undefined;
  pickup.otpAttempts = 0;

  // Store proof image path if provided
  if (proofImagePath) {
    pickup.proofImage = proofImagePath;
  }

  return pickup.save();
};

const rewardCollector = async (collectorId) => {
  try {
    const collector = await User.findById(collectorId);
    if (collector && collector.role === "collector") {
      // 1. Existing logic: Reward ecoPoints
      collector.ecoPoints =
        (collector.ecoPoints || 0) + COLLECTOR_REWARD_POINTS;

      // 2. New Gamification stats
      const now = new Date();
      collector.totalPickups = (collector.totalPickups || 0) + 1;
      collector.todayPickups = (collector.todayPickups || 0) + 1;
      collector.lastActive = now;

      // 3. Badge check & assignment (Done while todayPickups > old bestDayRecord)
      checkAndAssignBadges(collector);

      // Update bestDayRecord if today's count exceeds it
      if (collector.todayPickups > (collector.bestDayRecord || 0)) {
        collector.bestDayRecord = collector.todayPickups;
      }

      await collector.save();
      console.log(`[Gamification] Collector ${collector.name} stats updated.`);
    }
  } catch (error) {
    console.error("Collector reward & badges error:", error);
    // Non-critical: don't throw
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

// ================= SHARED CONTROLLERS =================

export const getPickupById = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate("userId", "name phone email")
      .populate("collectorId", "name phone");

    if (!pickup)
      return res
        .status(404)
        .json({ success: false, message: "Pickup not found" });

    // Check if it has been reviewed
    const review = await Review.findOne({ pickupId: pickup._id });

    res.status(200).json({ data: { pickup, isReviewed: !!review, review } });
  } catch (error) {
    console.error("Error fetching pickup details:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ================= COLLECTOR GET CONTROLLERS =================

export const getAssignedPickups = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Return both "assigned" and "in_progress" pickups so the collector
    // can still see a pickup they've started completing via OTP.
    const filter = {
      collectorId: req.user._id,
      status: { $in: [PICKUP_STATUS.ASSIGNED, PICKUP_STATUS.IN_PROGRESS] },
    };

    const [total, pickups] = await Promise.all([
      Pickup.countDocuments(filter),
      Pickup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name phone address"),
    ]);

    return res.json({
      success: true,
      count: pickups.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pickups,
    });
  } catch (error) {
    console.error("Get assigned pickups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCompletedPickups = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      collectorId: req.user._id,
      status: PICKUP_STATUS.COMPLETED,
      archivedByCollector: { $ne: true }, // Exclude archived pickups
    };

    const [total, pickups] = await Promise.all([
      Pickup.countDocuments(filter),
      Pickup.find(filter)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name phone address"),
    ]);

    return res.json({
      success: true,
      count: pickups.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pickups,
    });
  } catch (error) {
    console.error("Get completed pickups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
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
    const rawArea = req.body.area || address || "";
    const normalizedArea = normalizeArea(rawArea);

    const image = req.file ? req.file.path : null;

    const pickup = await createPickupRecord(
      req.user._id,
      normalizedScrapType,
      approxLoad,
      address,
      parsedDate,
      normalizedArea,
      req.body.lat,
      req.body.lng,
      image
    );

    const payload = {
      pickupId: pickup._id,
      _id: pickup._id, // Add as _id to match model
      scrapType: normalizedScrapType,
      approxLoad,
      address,
      area: normalizedArea,
      scheduledDate: parsedDate,
      image: pickup.image,
      userId: {
        _id: req.user._id,
        name: req.user.name,
        phone: req.user.phone,
      },
    };

    // ── Smart socket broadcast ────────────────────────────────────────────────
    // The pickup area is a free-text string typed by the user (e.g. "kosli bus stand").
    // Collectors join rooms named after their serviceArea keyword (e.g. "area:kosli").
    // We need to find ALL area rooms whose keyword appears inside the pickup's area
    // string, and emit to each one — so "kosli" collector gets "kosli bus stand" pickup.
    //
    // We do this by querying all unique serviceAreas across active collectors and
    // checking which ones are substrings of normalizedArea.
    try {
      const collectors = await User.find(
        { role: "collector", isActive: true },
        { serviceAreas: 1, serviceArea: 1 }
      ).lean();

      const emittedRooms = new Set();

      // Always emit to the exact room first
      const exactRoom = `area:${normalizedArea}`;
      io.to(exactRoom).emit("new-pickup", payload);
      emittedRooms.add(exactRoom);
      console.log(`[Socket] Emitted new-pickup to area room: ${exactRoom}`);

      // Also emit to user's private room so they get a notification they created it (optional but good for consistency)
      const userRoom = `user:${pickup.userId.toString()}`;
      io.to(userRoom).emit("pickup-created", payload);
      console.log(`[Socket] Emitted pickup-created to private room: ${userRoom}`);

      // Also emit to any collector area room whose keyword appears in the pickup area
      for (const collector of collectors) {
        const collectorAreas = collector.serviceAreas?.length
          ? collector.serviceAreas
          : collector.serviceArea
            ? [collector.serviceArea]
            : [];

        for (const area of collectorAreas) {
          const keyword = normalizeArea(area);
          if (!keyword) continue;
          const room = `area:${keyword}`;
          if (!emittedRooms.has(room) && normalizedArea.includes(keyword)) {
            io.to(room).emit("new-pickup", payload);
            emittedRooms.add(room);
            console.log(
              `[Socket] Emitted new-pickup to ${room} (keyword match)`
            );
          }
        }
      }
    } catch (socketErr) {
      // Non-critical — don't fail the pickup creation
      console.error("[Socket] Broadcast error:", socketErr.message);
    }

    return res.status(201).json(pickup);
  } catch (error) {
    console.error("Create pickup FULL error:", error);
    return res
      .status(400)
      .json({ message: error.message, errors: error.errors });
  }
};

/**
 * USER: Get My Pickups (with pagination)
 */
export const getMyPickups = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    
    // Allow frontend to request specific statuses (active vs history) to keep pages full
    if (req.query.status === 'active') {
      filter.status = { $nin: ['completed', 'cancelled'] };
    } else if (req.query.status === 'history') {
      filter.status = { $in: ['completed', 'cancelled'] };
    }

    const [total, pickups] = await Promise.all([
      Pickup.countDocuments(filter),
      Pickup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("collectorId", "name phone"),
    ]);

    return res.json({
      success: true,
      count: pickups.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pickups,
    });
  } catch (error) {
    console.error("Get my pickups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ================= COLLECTOR CONTROLLERS =================

/**
 * COLLECTOR: View Pending Pickups — filtered by service areas + paginated
 */
export const getPendingPickups = async (req, res) => {
  try {
    const collector = await User.findById(req.user._id).select(
      "role serviceArea serviceAreas"
    );

    if (!collector || collector.role !== "collector") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only collectors can view these requests.",
      });
    }

    let areas = collector.serviceAreas ?? [];
    areas = areas.map((a) => normalizeArea(a));
    if (areas.length === 0 && collector.serviceArea) {
      areas = [normalizeArea(collector.serviceArea)];
    }
    if (areas.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: 1,
        totalPages: 0,
        pickups: [],
        message:
          "No service areas assigned. Contact an admin to update your profile.",
      });
    }

    console.log(`[getPendingPickups] collector=${req.user._id} areas=`, areas);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = PENDING_PAGE_LIMIT;
    const skip = (page - 1) * limit;

    // Build a flexible area filter:
    // 1. Exact match (area stored identically to serviceArea)
    // 2. Partial/keyword match — pickup area CONTAINS the collector's area keyword
    //    e.g. collector "kosli" matches pickup "kosli bus stand"
    // 3. Legacy: pickups with no area set (created before area field existed)
    const areaRegexConditions = areas.map((a) => ({
      area: { $regex: a, $options: "i" },
    }));

    const filter = {
      status: PICKUP_STATUS.PENDING,
      $or: [
        ...areaRegexConditions, // partial keyword match (covers exact too)
        { area: { $in: ["", null] } }, // legacy: no area stored
        { area: { $exists: false } }, // legacy: field missing entirely
      ],
    };

    const [total, pickups] = await Promise.all([
      Pickup.countDocuments(filter),
      Pickup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name phone address"),
    ]);

    return res.status(200).json({
      success: true,
      count: pickups.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pickups,
    });
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
      return res
        .status(409)
        .json({ message: "Pickup already assigned or completed" });
    }
    await assignPickupToCollector(pickup, req.user._id);

    // Notify the user who owns this pickup
    const userRoom = `user:${pickup.userId.toString()}`;
    io.to(userRoom).emit("pickup-accepted", {
      pickupId: pickup._id,
      collectorName: req.user.name,
      collectorPhone: req.user.phone || null,
      timestamp: pickup.statusTimestamps.assigned || new Date(),
    });
    console.log(`[Socket] Emitted pickup-accepted to private room: ${userRoom}`);

    return res
      .status(200)
      .json({ message: "Pickup assigned successfully", pickup });
  } catch (error) {
    console.error("Accept pickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OTP-VERIFIED COMPLETION FLOW
// ═══════════════════════════════════════════════════════════════════════════

/**
 * COLLECTOR: Generate Completion OTP
 *
 * POST /api/pickups/generate-otp/:id
 *
 * Called when the collector arrives at the user's address and is ready
 * to collect. This:
 *   1. Verifies the collector is assigned to this pickup
 *   2. Generates a 6-digit OTP and stores it (hashed) on the pickup doc
 *   3. Sends the OTP to the user's registered phone
 *   4. Transitions status: assigned → in_progress
 *
 * The user reads the OTP to the collector who enters it in the app.
 *
 * Security:
 *   - Only the assigned collector can call this endpoint
 *   - Status must be "assigned" (can re-generate if still in_progress)
 *   - OTP expires in 10 minutes
 */
export const generateCompletionOtp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid pickup id" });
    }

    // ── 1. Fetch pickup with OTP fields explicitly selected ─────────────────
    const pickup = await Pickup.findById(id).select(
      "+completionOtp +completionOtpExpiry +otpAttempts"
    );
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    // ── 2. Ownership check ──────────────────────────────────────────────────
    const ownershipValidation = validatePickupOwnership(pickup, req.user._id);
    if (!ownershipValidation.isValid) {
      return res.status(403).json({ message: ownershipValidation.message });
    }

    // ── 3. Status guard: must be assigned or in_progress ────────────────────
    // Allow re-generation if in_progress (user didn't receive OTP, etc.)
    if (
      pickup.status !== PICKUP_STATUS.ASSIGNED &&
      pickup.status !== PICKUP_STATUS.IN_PROGRESS
    ) {
      return res.status(400).json({
        message: `Cannot generate OTP for a pickup with status "${pickup.status}".`,
      });
    }

    // ── 4. Fetch user's phone to send OTP to ────────────────────────────────
    const user = await User.findById(pickup.userId).select("name phone");
    if (!user) {
      return res.status(404).json({ message: "Pickup owner not found" });
    }

    // ── 5. Generate OTP + set expiry ────────────────────────────────────────
    const otp = generateOTP(); // 6-digit string from otpService
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    pickup.completionOtp = otp;
    pickup.completionOtpExpiry = expiry;
    pickup.otpAttempts = 0; // reset attempt counter
    pickup.status = PICKUP_STATUS.IN_PROGRESS;
    pickup.statusTimestamps = pickup.statusTimestamps || {};
    pickup.statusTimestamps.in_progress = new Date();

    await pickup.save();

    // ── 6. Emit OTP to user via socket (includes OTP for in-app display) ────
    // The OTP is shown directly in the user's pickup detail page so they can
    // read it out to the collector even if SMS hasn't arrived yet.
    const userRoom = `user:${pickup.userId.toString()}`;
    io.to(userRoom).emit("otp-generated", {
      pickupId: pickup._id,
      otp, // shown in the user's app
      otpExpiresAt: expiry,
      timestamp: pickup.statusTimestamps.in_progress,
    });
    console.log(`[Socket] Emitted otp-generated to private room: ${userRoom}`);

    // ── 7. Also send OTP via SMS (non-blocking — app fallback above is primary) ─
    if (user.phone) {
      sendOTP(user.phone, otp).catch((err) => {
        console.warn("[OTP] SMS failed (user sees OTP in app):", err.message);
      });
    } else {
      console.warn(
        `[OTP] User ${pickup.userId} has no phone — OTP shown in app only`
      );
    }

    return res.status(200).json({
      success: true,
      message: user.phone
        ? "OTP sent to user via SMS and displayed in their app."
        : "OTP generated and displayed in user's app (no phone on file).",
      otpExpiresAt: expiry,
    });
  } catch (error) {
    console.error("Generate completion OTP error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * COLLECTOR: Verify OTP and Complete Pickup
 *
 * POST /api/pickups/verify-otp/:id
 * Content-Type: multipart/form-data
 *
 * Body fields:
 *   otp         {string} 6-digit OTP provided by the user   [required]
 *   proofImage  {file}   Photo of collected scrap            [optional]
 *
 * On success:
 *   - Status transitions: in_progress → completed
 *   - OTP fields cleared from document
 *   - Wallet credits issued to user
 *   - ecoPoints added to collector
 *   - Proof image path stored if provided
 *
 * Security:
 *   - Only the assigned collector can call this
 *   - Pickup must be in_progress (OTP must have been generated)
 *   - OTP must match and not be expired
 *   - Locked after MAX_OTP_ATTEMPTS consecutive failures
 */
export const verifyOtpAndComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    // ── 1. Basic input validation ────────────────────────────────────────────
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid pickup id" });
    }
    if (!otp || String(otp).trim().length === 0) {
      return res.status(400).json({ message: "OTP is required" });
    }

    // ── 2. Fetch pickup with hidden OTP fields ───────────────────────────────
    const pickup = await Pickup.findById(id).select(
      "+completionOtp +completionOtpExpiry +otpAttempts"
    );
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    // ── 3. Ownership check ──────────────────────────────────────────────────
    const ownershipValidation = validatePickupOwnership(pickup, req.user._id);
    if (!ownershipValidation.isValid) {
      return res.status(403).json({ message: ownershipValidation.message });
    }

    // ── 4. Status guard: must be in_progress ────────────────────────────────
    if (pickup.status !== PICKUP_STATUS.IN_PROGRESS) {
      const hint =
        pickup.status === PICKUP_STATUS.ASSIGNED
          ? " Please generate an OTP first."
          : "";
      return res.status(400).json({
        message: `Pickup is not awaiting OTP verification (status: "${pickup.status}").${hint}`,
      });
    }

    // ── 5. Brute-force guard ─────────────────────────────────────────────────
    if (pickup.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        message: `Too many failed OTP attempts. Please generate a new OTP.`,
      });
    }

    // ── 6. OTP expiry check ──────────────────────────────────────────────────
    if (
      !pickup.completionOtpExpiry ||
      new Date() > pickup.completionOtpExpiry
    ) {
      return res.status(400).json({
        message: "OTP has expired. Please generate a new one.",
      });
    }

    // ── 7. OTP match ─────────────────────────────────────────────────────────
    if (String(otp).trim() !== pickup.completionOtp) {
      // Increment attempt counter and save — don't block on this
      pickup.otpAttempts = (pickup.otpAttempts || 0) + 1;
      await pickup.save();

      const remaining = MAX_OTP_ATTEMPTS - pickup.otpAttempts;
      return res.status(400).json({
        message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    // ── 8. OTP valid — proceed with completion logic ─────────────────────────

    // Calculate weight
    const weight = getWeightFromLoad(pickup.approxLoad);
    if (!weight) {
      return res
        .status(400)
        .json({ message: "Invalid approxLoad value on this pickup" });
    }

    // Validate scrap type
    const normalizedScrapType = resolveScrapType(pickup.scrapType);
    if (!normalizedScrapType) {
      return res
        .status(400)
        .json({ message: "Invalid scrap type on this pickup" });
    }

    // Fetch scrap price
    const scrapPrice = await fetchScrapPrice(pickup.scrapType);
    if (!scrapPrice) {
      return res.status(409).json({
        message: "Scrap price not configured for this type. Contact an admin.",
      });
    }

    const pricePerKg = scrapPrice.pricePerKg;
    const rewardCoins = calculateRewardCoins(weight, pricePerKg);

    // Proof image path (set by multer disk storage, undefined if not uploaded)
    const proofImagePath = req.file ? req.file.path : null;

    // Process wallet rewards for the user
    await processPickupRewards(pickup.userId, pickup._id, rewardCoins);

    // Mark pickup as completed, clear OTP fields, store proof
    await updatePickupCompletion(
      pickup,
      weight,
      pricePerKg,
      rewardCoins,
      normalizedScrapType,
      proofImagePath
    );

    // Award ecoPoints to the collector (non-blocking)
    await rewardCollector(pickup.collectorId);

    // Notify the user their pickup is complete and EcoCoins are credited
    const userRoom = `user:${pickup.userId.toString()}`;
    io.to(userRoom).emit("pickup-completed", {
      pickupId: pickup._id,
      ecoCoinsEarned: rewardCoins,
      weightKg: weight,
    });
    console.log(
      `[Socket] Emitted pickup-completed to private room: ${userRoom} — ${rewardCoins} coins`
    );

    console.log(
      `[verifyOtpAndComplete] pickup=${id} completed — ` +
        `coins=${rewardCoins} proof=${proofImagePath || "none"}`
    );

    return res.status(200).json({
      success: true,
      message: "Pickup completed successfully with OTP verification.",
      ecoCoinsEarned: rewardCoins,
      pricePerKg,
      proofImage: proofImagePath || null,
    });
  } catch (error) {
    console.error("Verify OTP and complete error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * COLLECTOR: Complete Pickup (LEGACY — now blocked)
 *
 * PATCH /api/pickups/complete/:id
 *
 * This endpoint previously allowed direct completion without OTP.
 * It is now locked to prevent bypassing the verification flow.
 * Kept in the router to avoid 404s on existing clients — returns
 * a clear instruction to use the new OTP flow instead.
 */
export const completePickup = async (_req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "This endpoint is deprecated. Use POST /api/pickups/generate-otp/:id to generate a completion OTP, then POST /api/pickups/verify-otp/:id to verify it and complete the pickup.",
  });
};

/**

/**
 * COLLECTOR: Archive a completed pickup from their active view.
 * The pickup remains in the database but is marked as archived.
 * Only the assigned collector can archive their own completed pickups.
 *
 * DELETE /api/pickups/completed/:id
 */
export const deleteCompletedPickup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid pickup id" });
    }

    const pickup = await Pickup.findById(id);
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }
    if (pickup.collectorId?.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to archive this pickup" });
    }
    if (pickup.status !== PICKUP_STATUS.COMPLETED) {
      return res
        .status(400)
        .json({ message: "Only completed pickups can be archived" });
    }

    // Soft delete: mark as archived instead of deleting
    pickup.archivedByCollector = true;
    pickup.archivedAt = new Date();
    await pickup.save();

    return res
      .status(200)
      .json({ success: true, message: "Pickup moved to history" });
  } catch (error) {
    console.error("Archive completed pickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const cancelPickup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid pickup id" });
    }
    const pickup = await Pickup.findById(id);
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }
    if (pickup.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this pickup" });
    }
    if (pickup.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending pickups can be cancelled" });
    }
    pickup.status = "cancelled";
    await pickup.save();
    return res
      .status(200)
      .json({ success: true, message: "Pickup cancelled successfully" });
  } catch (error) {
    console.error("Cancel pickup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * COLLECTOR: Get archived (history) pickups (with pagination)
 * GET /api/pickups/archived
 */
export const getArchivedPickups = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      collectorId: req.user._id,
      status: PICKUP_STATUS.COMPLETED,
      archivedByCollector: true,
    };

    const [total, pickups] = await Promise.all([
      Pickup.countDocuments(filter),
      Pickup.find(filter)
        .sort({ archivedAt: -1 }) // Most recently archived first
        .skip(skip)
        .limit(limit)
        .populate("userId", "name phone address"),
    ]);

    return res.json({
      success: true,
      count: pickups.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pickups,
    });
  } catch (error) {
    console.error("Get archived pickups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
