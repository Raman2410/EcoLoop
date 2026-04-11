// Weight mapping — must stay in sync with LOAD_TO_WEIGHT in pickupController.js
const LOAD_TO_KG = {
  small: 2,
  medium: 5,
  large: 10,
  bulk: 20,
};

/**
 * Returns accurate pickup weight in KG.
 * Priority:
 * 1. actualWeight  — set by backend on OTP-verified completion
 * 2. approxLoad    — estimated fallback for pending/assigned pickups
 *
 * NOTE: approxLoad is normalised to lowercase before lookup so values like
 * "Small" or "MEDIUM" (which can arrive from older records) still resolve.
 */
export const getPickupWeightKg = (pickup) => {
  if (!pickup) return 0;

  // Backend sets `actualWeight` (not `actualWeightKg`) on completion
  if (typeof pickup.actualWeight === "number" && pickup.actualWeight > 0) {
    return pickup.actualWeight;
  }

  // Normalise to lowercase — the DB stores "small"/"medium"/etc. already,
  // but guard against any case inconsistency from older records.
  const load = (pickup.approxLoad || "").toLowerCase();
  return LOAD_TO_KG[load] || 0;
};
