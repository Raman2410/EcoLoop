export const SCRAP_TYPES = ["PLASTIC", "PAPER", "CARDBOARD"];

export const normalizeScrapType = (value = "") => {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
};
