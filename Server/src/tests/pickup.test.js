// Server/src/tests/pickup.test.js
import { describe, it, expect } from "@jest/globals";

// ── Copy the logic we're testing (no DB needed) ───────────────────────────
const SCRAP_TYPES = ["PLASTIC", "PAPER", "CARDBOARD"];
const VALID_LOADS = ["small", "medium", "large", "bulk"];
const LOAD_TO_WEIGHT = { small: 2, medium: 5, large: 10, bulk: 20 };

const normalizeScrapType = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const resolveScrapType = (value) => {
  const normalized = normalizeScrapType(value);
  return SCRAP_TYPES.includes(normalized) ? normalized : null;
};

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
  return { isValid: true, normalizedScrapType, parsedDate };
};

const getWeightFromLoad = (load) => LOAD_TO_WEIGHT[load] || null;
const calculateRewardCoins = (weight, pricePerKg) => weight * pricePerKg;

// ── Tests ──────────────────────────────────────────────────────────────────

describe("validatePickupCreation", () => {

  describe("missing fields", () => {
    it("should fail when all fields are missing", () => {
      const result = validatePickupCreation({});
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("All fields are required");
    });

    it("should fail when scrapType is missing", () => {
      const result = validatePickupCreation({
        approxLoad: "small",
        address: "123 Main St",
        scheduledDate: "2026-12-01",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("All fields are required");
    });

    it("should fail when address is missing", () => {
      const result = validatePickupCreation({
        scrapType: "PLASTIC",
        approxLoad: "small",
        scheduledDate: "2026-12-01",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("All fields are required");
    });

    it("should fail when scheduledDate is missing", () => {
      const result = validatePickupCreation({
        scrapType: "PLASTIC",
        approxLoad: "small",
        address: "123 Main St",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("All fields are required");
    });
  });

  describe("scrap type validation", () => {
    it("should fail with an invalid scrap type", () => {
      const result = validatePickupCreation({
        scrapType: "UNICORN",
        approxLoad: "small",
        address: "123 Main St",
        scheduledDate: "2026-12-01",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Invalid scrap type");
    });

    it("should accept PLASTIC (uppercase)", () => {
      const result = validatePickupCreation({
        scrapType: "PLASTIC",
        approxLoad: "small",
        address: "123 Main St",
        scheduledDate: "2026-12-01",
      });
      expect(result.isValid).toBe(true);
      expect(result.normalizedScrapType).toBe("PLASTIC");
    });

    it("should accept plastic (lowercase) and normalize it", () => {
      const result = validatePickupCreation({
        scrapType: "plastic",
        approxLoad: "small",
        address: "123 Main St",
        scheduledDate: "2026-12-01",
      });
      expect(result.isValid).toBe(true);
      expect(result.normalizedScrapType).toBe("PLASTIC");
    });

    it("should accept all valid scrap types", () => {
      for (const type of SCRAP_TYPES) {
        const result = validatePickupCreation({
          scrapType: type,
          approxLoad: "small",
          address: "123 Main St",
          scheduledDate: "2026-12-01",
        });
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe("approxLoad validation", () => {
    it("should fail with an invalid load value", () => {
      const result = validatePickupCreation({
        scrapType: "PLASTIC",
        approxLoad: "enormous",
        address: "123 Main St",
        scheduledDate: "2026-12-01",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Invalid approxLoad value");
    });

    it("should accept all valid load sizes", () => {
      for (const load of VALID_LOADS) {
        const result = validatePickupCreation({
          scrapType: "PLASTIC",
          approxLoad: load,
          address: "123 Main St",
          scheduledDate: "2026-12-01",
        });
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe("date validation", () => {
    it("should fail with an invalid date string", () => {
      const result = validatePickupCreation({
        scrapType: "PLASTIC",
        approxLoad: "small",
        address: "123 Main St",
        scheduledDate: "not-a-date",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Invalid scheduledDate");
    });

    it("should accept a valid future date", () => {
      const result = validatePickupCreation({
        scrapType: "PLASTIC",
        approxLoad: "small",
        address: "123 Main St",
        scheduledDate: "2026-12-01",
      });
      expect(result.isValid).toBe(true);
      expect(result.parsedDate).toBeInstanceOf(Date);
    });
  });

  describe("valid input", () => {
    it("should pass with all valid fields", () => {
      const result = validatePickupCreation({
        scrapType: "CARDBOARD",
        approxLoad: "bulk",
        address: "456 Green Ave",
        scheduledDate: "2026-06-15",
      });
      expect(result.isValid).toBe(true);
      expect(result.normalizedScrapType).toBe("CARDBOARD");
      expect(result.parsedDate).toBeInstanceOf(Date);
    });
  });
});

describe("getWeightFromLoad", () => {
  it("should return 2 for small", () => expect(getWeightFromLoad("small")).toBe(2));
  it("should return 5 for medium", () => expect(getWeightFromLoad("medium")).toBe(5));
  it("should return 10 for large", () => expect(getWeightFromLoad("large")).toBe(10));
  it("should return 20 for bulk", () => expect(getWeightFromLoad("bulk")).toBe(20));
  it("should return null for unknown load", () => expect(getWeightFromLoad("unknown")).toBeNull());
});

describe("calculateRewardCoins", () => {
  it("should calculate correctly (2kg × 15 = 30)", () => {
    expect(calculateRewardCoins(2, 15)).toBe(30);
  });
  it("should calculate correctly (10kg × 8 = 80)", () => {
    expect(calculateRewardCoins(10, 8)).toBe(80);
  });
  it("should return 0 when weight is 0", () => {
    expect(calculateRewardCoins(0, 15)).toBe(0);
  });
  it("should return 0 when price is 0", () => {
    expect(calculateRewardCoins(5, 0)).toBe(0);
  });
});