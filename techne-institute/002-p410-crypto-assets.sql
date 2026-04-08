-- P410: Crypto Assets Extension Migration
-- Date: 2026-04-08
-- Extends: P409 (Techne Institute Database Schema)
-- Supabase Instance: gxyeobogqfubgzklmxwt.supabase.co

-- ============================================================
-- CRYPTO ASSETS TABLES
-- ============================================================

-- Crypto Assets Registry
-- Tracks tokens across multiple networks
CREATE TABLE IF NOT EXISTS crypto_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL, -- USDC, DAI, ETH, etc.
  name text NOT NULL, -- USD Coin, Dai Stablecoin, Ethereum
  network text NOT NULL, -- mainnet, optimism, arbitrum, polygon, base
  token_address text, -- NULL for native tokens (ETH, MATIC)
  decimals integer NOT NULL DEFAULT 18,
  is_native boolean DEFAULT false, -- true for ETH, MATIC, etc.
  created_at timestamptz DEFAULT now(),
  UNIQUE(symbol, network, token_address)
);

-- Crypto Balances
-- Account × Asset balance tracking
CREATE TABLE IF NOT EXISTS crypto_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES bank_accounts(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES crypto_assets(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  usd_value numeric, -- Optional: calculated from price feeds
  last_updated timestamptz DEFAULT now(),
  UNIQUE(account_id, asset_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crypto_balances_account ON crypto_balances(account_id);
CREATE INDEX IF NOT EXISTS idx_crypto_balances_asset ON crypto_balances(asset_id);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_network ON crypto_assets(network);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_symbol ON crypto_assets(symbol);

-- ============================================================
-- RLS POLICIES (Organizers Only)
-- ============================================================

-- Enable RLS
ALTER TABLE crypto_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_balances ENABLE ROW LEVEL SECURITY;

-- Crypto Assets Policies
CREATE POLICY "organizers_read_crypto_assets"
  ON crypto_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

CREATE POLICY "organizers_write_crypto_assets"
  ON crypto_assets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

-- Crypto Balances Policies
CREATE POLICY "organizers_read_crypto_balances"
  ON crypto_balances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

CREATE POLICY "organizers_write_crypto_balances"
  ON crypto_balances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

-- ============================================================
-- SEED DATA: Common Crypto Assets
-- ============================================================

-- Ethereum Mainnet Assets
INSERT INTO crypto_assets (symbol, name, network, token_address, decimals, is_native)
VALUES
  ('ETH', 'Ethereum', 'mainnet', NULL, 18, true),
  ('USDC', 'USD Coin', 'mainnet', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, false),
  ('DAI', 'Dai Stablecoin', 'mainnet', '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, false)
ON CONFLICT (symbol, network, token_address) DO NOTHING;

-- Optimism Assets
INSERT INTO crypto_assets (symbol, name, network, token_address, decimals, is_native)
VALUES
  ('ETH', 'Ethereum', 'optimism', NULL, 18, true),
  ('USDC', 'USD Coin', 'optimism', '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', 6, false),
  ('DAI', 'Dai Stablecoin', 'optimism', '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', 18, false)
ON CONFLICT (symbol, network, token_address) DO NOTHING;

-- Arbitrum Assets (for future expansion)
INSERT INTO crypto_assets (symbol, name, network, token_address, decimals, is_native)
VALUES
  ('ETH', 'Ethereum', 'arbitrum', NULL, 18, true),
  ('USDC', 'USD Coin', 'arbitrum', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6, false),
  ('DAI', 'Dai Stablecoin', 'arbitrum', '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', 18, false)
ON CONFLICT (symbol, network, token_address) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check crypto tables exist with RLS
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('crypto_assets', 'crypto_balances');

-- Check crypto asset seeds
SELECT symbol, name, network, is_native, token_address
FROM crypto_assets
ORDER BY network, symbol;

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('crypto_assets', 'crypto_balances');

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('crypto_assets', 'crypto_balances')
ORDER BY tablename, policyname;

-- ============================================================
-- NOTES
-- ============================================================

/*
Integration with Safe API:

Mainnet Safe Transaction Service:
  Base URL: https://safe-transaction-mainnet.safe.global
  Endpoint: GET /api/v1/safes/{address}/balances/
  Example: /api/v1/safes/0xA594263e0449A28eAEf5BA6420E81cC1996b7782/balances/

Optimism Safe Transaction Service:
  Base URL: https://safe-transaction-optimism.safe.global
  Endpoint: GET /api/v1/safes/{address}/balances/
  Example: /api/v1/safes/0xA594263e0449A28eAEf5BA6420E81cC1996b7782/balances/

Response format:
[
  {
    "tokenAddress": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "token": {
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "logoUri": "..."
    },
    "balance": "8192312000" // Raw balance (before decimals adjustment)
  },
  ...
]

Sync Process:
1. Query Safe API for each network (mainnet, optimism)
2. Match token_address to crypto_assets table
3. Calculate balance: raw_balance / (10 ^ decimals)
4. Upsert to crypto_balances table
5. Update last_updated timestamp

bank_accounts entries for multi-sig:
- Network: 'mainnet', external_provider: 'safe', external_account_id: '0xA594263e0449A28eAEf5BA6420E81cC1996b7782'
- Network: 'optimism', external_provider: 'safe', external_account_id: '0xA594263e0449A28eAEf5BA6420E81cC1996b7782'

crypto_balances links to bank_accounts via account_id, then to crypto_assets via asset_id.
*/
