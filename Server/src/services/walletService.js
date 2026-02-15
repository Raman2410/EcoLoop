import { v4 as uuidv4 } from "uuid";
import pool from "../config/postgres.js";
import walletRepo from "../repositories/walletRepository.js";

const createWalletIfNotExists = async (userId) => {
  let wallet = await walletRepo.getWalletByUserId(userId);
  if (!wallet) {
    wallet = await walletRepo.createWallet(uuidv4(), userId);
    console.log(`✅ Wallet created for user ${userId}`);
  }
  return wallet;
};

const creditEcoCoins = async ({ userId, amount, pickupId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const wallet = await walletRepo.getWalletByUserId(userId);
    if (!wallet) {
      throw new Error("Wallet not found for user: " + userId);
    }

    await walletRepo.updateWalletBalance(client, wallet.id, amount);

    // ✅ Better duplicate handling
    try {
      await walletRepo.insertTransaction(
        client,
        uuidv4(),
        wallet.id,
        amount,
        "CREDIT",
        "Pickup completed",
        pickupId,
        `pickup-${pickupId}` // idempotency key
      );
    } catch (txError) {
      // Check if it's a duplicate transaction
      if (txError.code === '23505') { // PostgreSQL unique violation
        console.log(`⚠️ Transaction already processed for pickup ${pickupId}`);
        await client.query("ROLLBACK");
        return { success: true, alreadyProcessed: true };
      }
      throw txError;
    }

    await client.query("COMMIT");
    console.log(`✅ Credited ${amount} ecoCoins to user ${userId}`);
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Credit ecoCoins failed:", error.message);
    throw error;
  } finally {
    client.release();
  }
};

const getWallet = async (userId) => {
  return walletRepo.getWalletByUserId(userId);
};

export default {
  createWalletIfNotExists,
  creditEcoCoins,
  getWallet,
};