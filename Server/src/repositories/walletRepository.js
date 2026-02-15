import pool from "../config/postgres.js";

const createWallet = async (walletId, userId) => {
  const query = `
    INSERT INTO wallets (id, user_id)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [walletId, userId]);
  return rows[0];
};

const getWalletByUserId = async (userId) => {
  const query = `SELECT * FROM wallets WHERE user_id = $1;`;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

const updateWalletBalance = async (client, walletId, amount) => {
  const query = `
    UPDATE wallets
    SET balance = balance + $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;
  const { rows } = await client.query(query, [amount, walletId]);
  return rows[0];
};

const insertTransaction = async (
  client,
  txId,
  walletId,
  amount,
  type,
  reason,
  referenceId,
  idempotencyKey
) => {
  const query = `
    INSERT INTO wallet_transactions
    (id, wallet_id, amount, type, reason, reference_id, idempotency_key)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `;
  await client.query(query, [
    txId,
    walletId,
    amount,
    type,
    reason,
    referenceId,
    idempotencyKey,
  ]);
};

export default {
  createWallet,
  getWalletByUserId,
  updateWalletBalance,
  insertTransaction,
};
