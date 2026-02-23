// Fallback mapping (used ONLY if backend weight not available)
const LOAD_TO_KG = {
  small: 5,
  medium: 10,
  large: 20,
  bulk: 40,
};

/**
 * Returns accurate pickup weight in KG
 * Priority:
 * 1️⃣ actualWeightKg (from backend, future-ready)
 * 2️⃣ derived from approxLoad (current)
 */
export const getPickupWeightKg = (pickup) => {
  if (!pickup) return 0;

  // 🔹 Future backend value
  if (typeof pickup.actualWeightKg === "number") {
    return pickup.actualWeightKg;
  }

  // 🔹 Current derived fallback
  return LOAD_TO_KG[pickup.approxLoad] || 0;
};
