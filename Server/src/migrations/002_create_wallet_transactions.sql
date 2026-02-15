CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY,
    wallet_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    type VARCHAR(10) CHECK (type IN ('CREDIT', 'DEBIT')),
    reason TEXT NOT NULL,
    reference_id UUID,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
);
