export const SCRAP_TYPES = [
  "PLASTIC",
  "PAPER",
  "CARDBOARD",
  "METAL",
  "ELECTRONICS",
  "GLASS",
];

export const normalizeScrapType = (value = "") => {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
};