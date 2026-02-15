ALTER TABLE wallets
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE wallet_transactions
  ALTER COLUMN reference_id TYPE TEXT USING reference_id::text;
