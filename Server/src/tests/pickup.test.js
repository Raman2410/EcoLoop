// Server/src/tests/pickup.test.js
import { describe, it, expect } from "@jest/globals";

// ── Pure logic copied from controller (no DB required) ────────────────────

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
  if (!normalizedScrapType) return { isValid: false, message: "Invalid scrap type" };
  if (!VALID_LOADS.includes(approxLoad)) return { isValid: false, message: "Invalid approxLoad value" };
  const parsedDate = new Date(scheduledDate);
  if (Number.isNaN(parsedDate.getTime())) return { isValid: false, message: "Invalid scheduledDate" };
  return { isValid: true, normalizedScrapType, parsedDate };
};

const getWeightFromLoad = (load) => LOAD_TO_WEIGHT[load] || null;
const calculateRewardCoins = (weight, pricePerKg) => weight * pricePerKg;
const normalizeArea = (value = "") => String(value).trim();

// ── Service-area filtering (mirrors getPendingPickups DB filter) ───────────
const filterPickupsByServiceArea = (allPickups, collectorAreas) =>
  allPickups.filter(
    (p) => p.status === "pending" && collectorAreas.includes(p.area)
  );

// ── OTP business rules (mirrors generateCompletionOtp / verifyOtpAndComplete)

const MAX_OTP_ATTEMPTS = 5;
const OTP_VALIDITY_MS  = 10 * 60 * 1000; // 10 minutes

/**
 * Pure OTP generation — mirrors the controller's logic without I/O.
 */
const generatePickupOtp = () => {
  // 6-digit string, zero-padded (mirrors otpService.generateOTP)
  return String(Math.floor(100000 + Math.random() * 900000));
};

/**
 * Pure OTP verification — mirrors the guard logic in verifyOtpAndComplete.
 * Returns { valid: boolean, reason?: string }
 */
const verifyPickupOtp = ({ submittedOtp, storedOtp, expiry, attempts }) => {
  if (attempts >= MAX_OTP_ATTEMPTS) {
    return { valid: false, reason: "locked" };
  }
  if (!expiry || Date.now() > new Date(expiry).getTime()) {
    return { valid: false, reason: "expired" };
  }
  if (String(submittedOtp).trim() !== String(storedOtp).trim()) {
    return { valid: false, reason: "mismatch" };
  }
  return { valid: true };
};

/**
 * Valid status transitions for the OTP completion flow.
 */
const VALID_TRANSITIONS = {
  pending:     ["assigned"],
  assigned:    ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed:   [],
  cancelled:   [],
};

const canTransition = (currentStatus, nextStatus) =>
  (VALID_TRANSITIONS[currentStatus] ?? []).includes(nextStatus);

// ═════════════════════════════════════════════════════════════════════════════
// TESTS — Section 1: Pickup creation (existing, unchanged)
// ═════════════════════════════════════════════════════════════════════════════

describe("validatePickupCreation", () => {

  describe("missing fields", () => {
    it("fails when all fields are missing", () => {
      expect(validatePickupCreation({}).isValid).toBe(false);
    });
    it("fails when scrapType is missing", () => {
      const r = validatePickupCreation({ approxLoad: "small", address: "A", scheduledDate: "2026-12-01" });
      expect(r.isValid).toBe(false);
      expect(r.message).toBe("All fields are required");
    });
    it("fails when address is missing", () => {
      const r = validatePickupCreation({ scrapType: "PLASTIC", approxLoad: "small", scheduledDate: "2026-12-01" });
      expect(r.isValid).toBe(false);
    });
    it("fails when scheduledDate is missing", () => {
      const r = validatePickupCreation({ scrapType: "PLASTIC", approxLoad: "small", address: "A" });
      expect(r.isValid).toBe(false);
    });
  });

  describe("scrap type validation", () => {
    it("fails with invalid scrap type", () => {
      const r = validatePickupCreation({ scrapType: "UNICORN", approxLoad: "small", address: "A", scheduledDate: "2026-12-01" });
      expect(r.isValid).toBe(false);
      expect(r.message).toBe("Invalid scrap type");
    });
    it("accepts PLASTIC (uppercase)", () => {
      const r = validatePickupCreation({ scrapType: "PLASTIC", approxLoad: "small", address: "A", scheduledDate: "2026-12-01" });
      expect(r.isValid).toBe(true);
      expect(r.normalizedScrapType).toBe("PLASTIC");
    });
    it("accepts plastic (lowercase) and normalizes", () => {
      const r = validatePickupCreation({ scrapType: "plastic", approxLoad: "small", address: "A", scheduledDate: "2026-12-01" });
      expect(r.isValid).toBe(true);
      expect(r.normalizedScrapType).toBe("PLASTIC");
    });
    it("accepts all valid scrap types", () => {
      for (const type of SCRAP_TYPES) {
        expect(validatePickupCreation({ scrapType: type, approxLoad: "small", address: "A", scheduledDate: "2026-12-01" }).isValid).toBe(true);
      }
    });
  });

  describe("approxLoad validation", () => {
    it("fails with invalid load", () => {
      const r = validatePickupCreation({ scrapType: "PLASTIC", approxLoad: "enormous", address: "A", scheduledDate: "2026-12-01" });
      expect(r.isValid).toBe(false);
      expect(r.message).toBe("Invalid approxLoad value");
    });
    it("accepts all valid load sizes", () => {
      for (const load of VALID_LOADS) {
        expect(validatePickupCreation({ scrapType: "PLASTIC", approxLoad: load, address: "A", scheduledDate: "2026-12-01" }).isValid).toBe(true);
      }
    });
  });

  describe("date validation", () => {
    it("fails with an invalid date string", () => {
      const r = validatePickupCreation({ scrapType: "PLASTIC", approxLoad: "small", address: "A", scheduledDate: "not-a-date" });
      expect(r.isValid).toBe(false);
      expect(r.message).toBe("Invalid scheduledDate");
    });
    it("accepts a valid date", () => {
      const r = validatePickupCreation({ scrapType: "PLASTIC", approxLoad: "small", address: "A", scheduledDate: "2026-12-01" });
      expect(r.isValid).toBe(true);
      expect(r.parsedDate).toBeInstanceOf(Date);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TESTS — Section 2: Weight & reward calculations (existing, unchanged)
// ═════════════════════════════════════════════════════════════════════════════

describe("getWeightFromLoad", () => {
  it("returns 2 for small",   () => expect(getWeightFromLoad("small")).toBe(2));
  it("returns 5 for medium",  () => expect(getWeightFromLoad("medium")).toBe(5));
  it("returns 10 for large",  () => expect(getWeightFromLoad("large")).toBe(10));
  it("returns 20 for bulk",   () => expect(getWeightFromLoad("bulk")).toBe(20));
  it("returns null for unknown", () => expect(getWeightFromLoad("unknown")).toBeNull());
});

describe("calculateRewardCoins", () => {
  it("2kg × 15 = 30",  () => expect(calculateRewardCoins(2, 15)).toBe(30));
  it("10kg × 8 = 80",  () => expect(calculateRewardCoins(10, 8)).toBe(80));
  it("0kg → 0",         () => expect(calculateRewardCoins(0, 15)).toBe(0));
  it("price 0 → 0",     () => expect(calculateRewardCoins(5, 0)).toBe(0));
});

// ═════════════════════════════════════════════════════════════════════════════
// TESTS — Section 3: Service-area filtering (from previous feature)
// ═════════════════════════════════════════════════════════════════════════════

describe("filterPickupsByServiceArea", () => {
  const allPickups = [
    { _id: "p1", area: "Koramangala", status: "pending" },
    { _id: "p2", area: "Indiranagar",  status: "pending" },
    { _id: "p3", area: "Koramangala", status: "assigned" },
    { _id: "p4", area: "Whitefield",   status: "pending" },
    { _id: "p5", area: "Indiranagar",  status: "pending" },
    { _id: "p6", area: "",             status: "pending" },
    { _id: "p7", area: "Koramangala", status: "pending" },
  ];

  it("returns only pending pickups in matching area", () => {
    const r = filterPickupsByServiceArea(allPickups, ["Koramangala"]);
    expect(r).toHaveLength(2);
    expect(r.map((p) => p._id)).toEqual(["p1", "p7"]);
  });
  it("returns pickups from multiple areas", () => {
    const r = filterPickupsByServiceArea(allPickups, ["Koramangala", "Indiranagar"]);
    expect(r).toHaveLength(4);
  });
  it("excludes assigned/completed pickups", () => {
    const r = filterPickupsByServiceArea(allPickups, ["Koramangala"]);
    expect(r.every((p) => p.status === "pending")).toBe(true);
  });
  it("returns empty when no area matches", () => {
    expect(filterPickupsByServiceArea(allPickups, ["MG Road"])).toHaveLength(0);
  });
  it("returns empty when areas array is empty", () => {
    expect(filterPickupsByServiceArea(allPickups, [])).toHaveLength(0);
  });
  it("is case-sensitive", () => {
    expect(filterPickupsByServiceArea(allPickups, ["koramangala"])).toHaveLength(0);
  });
});

describe("normalizeArea", () => {
  it("trims whitespace",       () => expect(normalizeArea("  Koramangala  ")).toBe("Koramangala"));
  it("returns '' for empty",   () => expect(normalizeArea("")).toBe(""));
  it("returns '' for undefined", () => expect(normalizeArea(undefined)).toBe(""));
  it("preserves casing",       () => expect(normalizeArea("INDIRANAGAR")).toBe("INDIRANAGAR"));
});

// ═════════════════════════════════════════════════════════════════════════════
// TESTS — Section 4: OTP generation (NEW)
// ═════════════════════════════════════════════════════════════════════════════

describe("generatePickupOtp", () => {
  it("returns a 6-character string", () => {
    const otp = generatePickupOtp();
    expect(typeof otp).toBe("string");
    expect(otp).toHaveLength(6);
  });

  it("is numeric (all digits)", () => {
    const otp = generatePickupOtp();
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it("generates different values across calls (probabilistic)", () => {
    const otps = new Set(Array.from({ length: 50 }, generatePickupOtp));
    // With 900000 possible values, 50 calls producing ≥2 unique values is certain
    expect(otps.size).toBeGreaterThan(1);
  });

  it("is always >= 100000", () => {
    for (let i = 0; i < 20; i++) {
      expect(parseInt(generatePickupOtp(), 10)).toBeGreaterThanOrEqual(100000);
    }
  });

  it("is always <= 999999", () => {
    for (let i = 0; i < 20; i++) {
      expect(parseInt(generatePickupOtp(), 10)).toBeLessThanOrEqual(999999);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TESTS — Section 5: OTP verification logic (NEW)
// ═════════════════════════════════════════════════════════════════════════════

describe("verifyPickupOtp", () => {
  const futureExpiry = new Date(Date.now() + OTP_VALIDITY_MS);
  const pastExpiry   = new Date(Date.now() - 1000);

  describe("valid OTP", () => {
    it("returns valid=true when OTP matches and not expired", () => {
      const r = verifyPickupOtp({
        submittedOtp: "123456",
        storedOtp: "123456",
        expiry: futureExpiry,
        attempts: 0,
      });
      expect(r.valid).toBe(true);
    });

    it("trims whitespace from submitted OTP before matching", () => {
      const r = verifyPickupOtp({
        submittedOtp: "  654321  ",
        storedOtp: "654321",
        expiry: futureExpiry,
        attempts: 0,
      });
      expect(r.valid).toBe(true);
    });

    it("allows attempts up to MAX_OTP_ATTEMPTS - 1", () => {
      const r = verifyPickupOtp({
        submittedOtp: "111111",
        storedOtp: "111111",
        expiry: futureExpiry,
        attempts: MAX_OTP_ATTEMPTS - 1,
      });
      expect(r.valid).toBe(true);
    });
  });

  describe("invalid OTP — mismatch", () => {
    it("returns valid=false with reason 'mismatch' for wrong OTP", () => {
      const r = verifyPickupOtp({
        submittedOtp: "000000",
        storedOtp: "123456",
        expiry: futureExpiry,
        attempts: 0,
      });
      expect(r.valid).toBe(false);
      expect(r.reason).toBe("mismatch");
    });

    it("is case/whitespace sensitive after trim", () => {
      const r = verifyPickupOtp({
        submittedOtp: "12345",    // 5 digits vs 6
        storedOtp: "123456",
        expiry: futureExpiry,
        attempts: 0,
      });
      expect(r.valid).toBe(false);
      expect(r.reason).toBe("mismatch");
    });
  });

  describe("invalid OTP — expiry", () => {
    it("returns valid=false with reason 'expired' when OTP is past expiry", () => {
      const r = verifyPickupOtp({
        submittedOtp: "123456",
        storedOtp: "123456",
        expiry: pastExpiry,
        attempts: 0,
      });
      expect(r.valid).toBe(false);
      expect(r.reason).toBe("expired");
    });

    it("returns 'expired' when expiry is null/undefined", () => {
      const r = verifyPickupOtp({
        submittedOtp: "123456",
        storedOtp: "123456",
        expiry: null,
        attempts: 0,
      });
      expect(r.valid).toBe(false);
      expect(r.reason).toBe("expired");
    });
  });

  describe("brute-force lockout", () => {
    it("locks when attempts equals MAX_OTP_ATTEMPTS", () => {
      const r = verifyPickupOtp({
        submittedOtp: "123456",
        storedOtp: "123456",
        expiry: futureExpiry,
        attempts: MAX_OTP_ATTEMPTS,
      });
      expect(r.valid).toBe(false);
      expect(r.reason).toBe("locked");
    });

    it("locks even with correct OTP when attempts > MAX", () => {
      const r = verifyPickupOtp({
        submittedOtp: "999999",
        storedOtp: "999999",
        expiry: futureExpiry,
        attempts: MAX_OTP_ATTEMPTS + 3,
      });
      expect(r.valid).toBe(false);
      expect(r.reason).toBe("locked");
    });

    it("lockout check runs before expiry check (lockout has priority)", () => {
      // Even if OTP would be expired, locked reason takes precedence
      const r = verifyPickupOtp({
        submittedOtp: "123456",
        storedOtp: "123456",
        expiry: pastExpiry,
        attempts: MAX_OTP_ATTEMPTS,
      });
      expect(r.valid).toBe(false);
      expect(r.reason).toBe("locked");
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TESTS — Section 6: Status transition rules (NEW)
// ═════════════════════════════════════════════════════════════════════════════

describe("canTransition (pickup status machine)", () => {

  describe("valid transitions", () => {
    it("pending → assigned",       () => expect(canTransition("pending",     "assigned")).toBe(true));
    it("assigned → in_progress",   () => expect(canTransition("assigned",    "in_progress")).toBe(true));
    it("assigned → cancelled",     () => expect(canTransition("assigned",    "cancelled")).toBe(true));
    it("in_progress → completed",  () => expect(canTransition("in_progress", "completed")).toBe(true));
  });

  describe("invalid transitions", () => {
    it("pending cannot go directly to completed",   () => expect(canTransition("pending",     "completed")).toBe(false));
    it("pending cannot go to in_progress",          () => expect(canTransition("pending",     "in_progress")).toBe(false));
    it("assigned cannot go directly to completed",  () => expect(canTransition("assigned",    "completed")).toBe(false));
    it("in_progress cannot go to cancelled",        () => expect(canTransition("in_progress", "cancelled")).toBe(false));
    it("in_progress cannot go back to assigned",    () => expect(canTransition("in_progress", "assigned")).toBe(false));
    it("completed is a terminal state",             () => expect(canTransition("completed",   "assigned")).toBe(false));
    it("cancelled is a terminal state",             () => expect(canTransition("cancelled",   "pending")).toBe(false));
  });

  describe("unknown statuses", () => {
    it("unknown current status returns false", () => {
      expect(canTransition("ghost_status", "assigned")).toBe(false);
    });
    it("unknown next status returns false", () => {
      expect(canTransition("pending", "ghost_status")).toBe(false);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TESTS — Section 7: OTP expiry window (NEW)
// ═════════════════════════════════════════════════════════════════════════════

describe("OTP expiry window", () => {
  it("OTP is valid immediately after generation", () => {
    const expiry = new Date(Date.now() + OTP_VALIDITY_MS);
    const r = verifyPickupOtp({ submittedOtp: "111111", storedOtp: "111111", expiry, attempts: 0 });
    expect(r.valid).toBe(true);
  });

  it("OTP is invalid 1ms after expiry", () => {
    const expiry = new Date(Date.now() - 1);
    const r = verifyPickupOtp({ submittedOtp: "111111", storedOtp: "111111", expiry, attempts: 0 });
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("expired");
  });

  it("OTP validity window is 10 minutes", () => {
    expect(OTP_VALIDITY_MS).toBe(10 * 60 * 1000);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TESTS — Section 8: Reward calculation with realistic scrap weights (NEW)
// ═════════════════════════════════════════════════════════════════════════════

describe("calculateRewardCoins — realistic scenarios", () => {
  const PLASTIC_PRICE_PER_KG = 8;
  const PAPER_PRICE_PER_KG   = 5;
  const METAL_PRICE_PER_KG   = 25;

  it("small plastic bag (2kg × ₹8 = 16 coins)", () => {
    expect(calculateRewardCoins(getWeightFromLoad("small"), PLASTIC_PRICE_PER_KG)).toBe(16);
  });
  it("medium paper stack (5kg × ₹5 = 25 coins)", () => {
    expect(calculateRewardCoins(getWeightFromLoad("medium"), PAPER_PRICE_PER_KG)).toBe(25);
  });
  it("large metal scrap (10kg × ₹25 = 250 coins)", () => {
    expect(calculateRewardCoins(getWeightFromLoad("large"), METAL_PRICE_PER_KG)).toBe(250);
  });
  it("bulk plastic (20kg × ₹8 = 160 coins)", () => {
    expect(calculateRewardCoins(getWeightFromLoad("bulk"), PLASTIC_PRICE_PER_KG)).toBe(160);
  });
  it("returns 0 for zero price (unconfigured scrap type)", () => {
    expect(calculateRewardCoins(getWeightFromLoad("large"), 0)).toBe(0);
  });
});
