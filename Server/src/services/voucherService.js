import { v4 as uuidv4 } from "uuid";
import pool from "../config/postgres.js";
import walletRepo from "../repositories/walletRepository.js";
import Voucher from "../models/Voucher.model.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const COINS_PER_RUPEE = 10;
const VOUCHER_EXPIRY_DAYS = 7;

const ALLOWED_AMOUNTS = new Set([20, 50, 100]);

const VOUCHER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generates a unique voucher code like ECO-A1B2C3D4
 */
const generateVoucherCode = () => {
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += VOUCHER_CHARS[Math.floor(Math.random() * VOUCHER_CHARS.length)];
  }
  return `ECO${suffix}`;
};

/**
 * Ensures the generated code doesn't collide with an existing one.
 * Retries up to 5 times (collision probability is astronomically low).
 */
const generateUniqueCode = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateVoucherCode();
    const existing = await Voucher.findOne({ code }).lean();
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique voucher code. Please retry.");
};

const getExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + VOUCHER_EXPIRY_DAYS);
  return date;
};

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * Redeems EcoCoins for a cash voucher.
 *
 * Flow:
 *  1. Validate requested amount
 *  2. Fetch PostgreSQL wallet → check balance
 *  3. Open PG transaction → debit wallet + insert DEBIT transaction
 *  4. On PG commit → create Voucher document in MongoDB
 *
 * @param {string} userId  - MongoDB User _id (string)
 * @param {number} amount  - Voucher value in ₹ (20 | 50 | 100)
 * @returns {Promise<Voucher>}
 */
const redeemVoucher = async (userId, amount) => {
  // ── 1. Validate amount ──────────────────────────────────────────────────────
  if (!ALLOWED_AMOUNTS.has(amount)) {
    const err = new Error("Invalid voucher amount. Choose ₹20, ₹50, or ₹100.");
    err.status = 400;
    throw err;
  }

  const requiredCoins = amount * COINS_PER_RUPEE;

  // ── 2. Check wallet balance (PostgreSQL) ────────────────────────────────────
  const wallet = await walletRepo.getWalletByUserId(userId);
  if (!wallet) {
    const err = new Error("Wallet not found. Please contact support.");
    err.status = 404;
    throw err;
  }

  if (Number(wallet.balance) < requiredCoins) {
    const err = new Error(
      `Insufficient EcoCoins. You need ${requiredCoins} coins but have ${wallet.balance}.`
    );
    err.status = 400;
    err.code = "INSUFFICIENT_COINS";
    err.required = requiredCoins;
    err.available = Number(wallet.balance);
    throw err;
  }

  // ── 3. Debit wallet in a PG transaction ─────────────────────────────────────
  const client = await pool.connect();
  let voucher;

  try {
    await client.query("BEGIN");

    // Debit (negative amount)
    await walletRepo.updateWalletBalance(client, wallet.id, -requiredCoins);

    // Record transaction
    const idempotencyKey = `voucher-${userId}-${Date.now()}`;
    await walletRepo.insertTransaction(
      client,
      uuidv4(),
      wallet.id,
      requiredCoins,
      "DEBIT",
      `Voucher redemption: ₹${amount} voucher`,
      null,
      idempotencyKey
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Voucher debit failed:", err.message);
    throw err;
  } finally {
    client.release();
  }

  // ── 4. Create Voucher document in MongoDB ────────────────────────────────────
  // (After PG commit succeeds — if Mongo fails here, the coins are already
  //  deducted; a retry / support flow would be needed in production.)
  try {
    const code = await generateUniqueCode();

    voucher = await Voucher.create({
      userId,
      code,
      value: amount,
      ecoCoinsUsed: requiredCoins,
      expiresAt: getExpiryDate(),
    });
  } catch (mongoErr) {
    console.error(
      "❌ Mongo voucher creation failed after PG commit:",
      mongoErr.message
    );
    // Re-throw so the controller can return 500 — coins were debited
    throw new Error(
      "Voucher record could not be saved. Please contact support with your transaction reference."
    );
  }

  return voucher;
};

/**
 * Returns all vouchers for a user, newest first.
 *
 * @param {string} userId
 * @returns {Promise<Voucher[]>}
 */
const getUserVouchers = async (userId) => {
  return Voucher.find({ userId }).sort({ createdAt: -1 }).lean();
};

export default {
  redeemVoucher,
  getUserVouchers,
};
