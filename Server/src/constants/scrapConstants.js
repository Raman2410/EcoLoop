export const SCRAP_TYPES = [
  "PLASTIC",
  "PAPER",
  "CARDBOARD",
  "METAL",
  "ELECTRONICS",
  "GLASS",
];

/**
 * CO₂ savings per kg of recycled material (in kg CO₂)
 * Source: WRAP.org Recycling CO₂ data
 * These factors represent the avoided emissions when recycling vs. landfill/incineration
 */
export const CO2_SAVINGS_PER_KG = {
  PLASTIC: 2.0, // 2.0 kg CO₂ saved per kg plastic recycled
  PAPER: 0.9, // 0.9 kg CO₂ saved per kg paper recycled
  CARDBOARD: 0.7, // 0.7 kg CO₂ saved per kg cardboard recycled
  METAL: 9, // 9 kg CO₂ saved per kg metal recycled
  ELECTRONICS: 4.5, // 4.5 kg CO₂ saved per kg electronics recycled
  GLASS: 3, // 3 kg CO₂ saved per kg glass recycled
};

/**
 * Calculate CO₂ savings for a given scrap type and weight
 * @param {string} scrapType - One of SCRAP_TYPES
 * @param {number} weight - Weight in kg
 * @returns {number} CO₂ saved in kg (rounded to 2 decimals)
 */
export const calculateCO2Savings = (scrapType, weight) => {
  const normalized = normalizeScrapType(scrapType);
  const factor = CO2_SAVINGS_PER_KG[normalized] || 0;
  return Math.round(weight * factor * 100) / 100;
};

export const normalizeScrapType = (value = "") => {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
};
