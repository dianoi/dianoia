# P410: Crypto Assets Extension — README

**Sprint:** P410
**Extends:** P409 (Techne Institute Database Schema)
**Date:** 2026-04-08
**Supabase Instance:** gxyeobogqfubgzklmxwt.supabase.co

---

## Overview

P410 extends the P409 schema to support multi-network crypto treasury tracking via Safe multi-sig integration.

**RegenHub Multi-sig:** `0xA594263e0449A28eAEf5BA6420E81cC1996b7782`
**Networks:** Ethereum Mainnet, Optimism (extensible to Arbitrum, Polygon, Base)

---

## Schema Additions

### crypto_assets Table

Token registry supporting multiple networks:

```sql
CREATE TABLE crypto_assets (
  id uuid PRIMARY KEY,
  symbol text NOT NULL,          -- USDC, DAI, ETH
  name text NOT NULL,            -- USD Coin, Dai Stablecoin, Ethereum
  network text NOT NULL,         -- mainnet, optimism, arbitrum, polygon, base
  token_address text,            -- NULL for native tokens (ETH)
  decimals integer DEFAULT 18,  -- Token decimals (6 for USDC, 18 for DAI/ETH)
  is_native boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(symbol, network, token_address)
);
```

**Key features:**
- Multi-network support (same token on different networks tracked separately)
- Native token support (ETH, MATIC) with `token_address = NULL`
- Decimals tracked for balance conversion

### crypto_balances Table

Account × Asset balance tracking:

```sql
CREATE TABLE crypto_balances (
  id uuid PRIMARY KEY,
  account_id uuid REFERENCES bank_accounts(id),  -- Links to Safe multi-sig account
  asset_id uuid REFERENCES crypto_assets(id),    -- Links to token
  balance numeric NOT NULL DEFAULT 0,            -- Token balance (human-readable)
  usd_value numeric,                              -- Optional: USD value from price feeds
  last_updated timestamptz DEFAULT now(),
  UNIQUE(account_id, asset_id)
);
```

**Key features:**
- One row per account × asset combination
- Balance stored in human-readable format (already divided by decimals)
- USD value optional (for treasury dashboard display)

---

## Safe API Integration

### Safe Transaction Service Endpoints

**Ethereum Mainnet:**
```
Base URL: https://safe-transaction-mainnet.safe.global
Endpoint: GET /api/v1/safes/{address}/balances/
Example: /api/v1/safes/0xA594263e0449A28eAEf5BA6420E81cC1996b7782/balances/
```

**Optimism:**
```
Base URL: https://safe-transaction-optimism.safe.global
Endpoint: GET /api/v1/safes/{address}/balances/
Example: /api/v1/safes/0xA594263e0449A28eAEf5BA6420E81cC1996b7782/balances/
```

### Response Format

```json
[
  {
    "tokenAddress": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "token": {
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "logoUri": "https://..."
    },
    "balance": "8192312000"
  },
  {
    "tokenAddress": null,
    "token": {
      "name": "Ether",
      "symbol": "ETH",
      "decimals": 18,
      "logoUri": "https://..."
    },
    "balance": "22000000000000000"
  }
]
```

### Sync Process

1. **Query Safe API** for each network (mainnet, optimism)
2. **Match tokens** by `token_address` to `crypto_assets` table
3. **Calculate balance:**
   ```
   human_readable_balance = raw_balance / (10 ^ decimals)
   Example: 8192312000 / (10^6) = 8192.312 USDC
   ```
4. **Upsert** to `crypto_balances` table:
   ```sql
   INSERT INTO crypto_balances (account_id, asset_id, balance, last_updated)
   VALUES ($account_id, $asset_id, $balance, now())
   ON CONFLICT (account_id, asset_id)
   DO UPDATE SET balance = EXCLUDED.balance, last_updated = EXCLUDED.last_updated;
   ```
5. **Update timestamp** for sync tracking

---

## Integration with bank_accounts

Safe multi-sig accounts are stored in `bank_accounts` table:

```sql
-- Ethereum Mainnet Safe
INSERT INTO bank_accounts (
  institution,
  account_name,
  account_type,
  external_provider,
  external_account_id
) VALUES (
  'Safe',
  'RegenHub Multi-sig (Mainnet)',
  'checking',
  'safe',
  '0xA594263e0449A28eAEf5BA6420E81cC1996b7782'
);

-- Optimism Safe
INSERT INTO bank_accounts (
  institution,
  account_name,
  account_type,
  external_provider,
  external_account_id
) VALUES (
  'Safe',
  'RegenHub Multi-sig (Optimism)',
  'checking',
  'safe',
  '0xA594263e0449A28eAEf5BA6420E81cC1996b7782'
);
```

**Relationship:**
```
bank_accounts (Safe multi-sig)
  ↓ account_id
crypto_balances (balance per token)
  ↓ asset_id
crypto_assets (token details)
```

---

## Security (RLS Policies)

**Access control:** Organizers only (same as P409 treasury tables)

```sql
-- crypto_assets: Read/Write by organizers only
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

-- crypto_balances: Read/Write by organizers only
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
```

---

## Seeded Assets

The migration seeds common tokens on Mainnet, Optimism, and Arbitrum:

| Symbol | Name | Mainnet | Optimism | Arbitrum |
|--------|------|---------|----------|----------|
| ETH | Ethereum | ✓ (native) | ✓ (native) | ✓ (native) |
| USDC | USD Coin | ✓ | ✓ | ✓ |
| DAI | Dai Stablecoin | ✓ | ✓ | ✓ |

Additional tokens can be added via SQL INSERT or sync process.

---

## Deployment

### Prerequisites
- P409 schema must be deployed first
- Supabase Dashboard access to gxyeobogqfubgzklmxwt

### Steps

1. **Log in to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/gxyeobogqfubgzklmxwt
   - Navigate to SQL Editor

2. **Execute P410 Migration**
   - Copy contents of `002-p410-crypto-assets.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Deployment**
   Run verification queries at end of migration file:
   ```sql
   -- Check tables exist with RLS
   SELECT tablename,
          CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END
   FROM pg_tables
   WHERE schemaname = 'public'
     AND tablename IN ('crypto_assets', 'crypto_balances');

   -- Check seeded assets
   SELECT symbol, name, network, is_native
   FROM crypto_assets
   ORDER BY network, symbol;
   ```

---

## Current Treasury State

Based on Todd's data:

| Asset | Network | Balance | USD Value |
|-------|---------|---------|-----------|
| USDC | 3 Networks | 8,192.312 | $8,192.07 |
| DAI | Optimism | 1,000 | $999.63 |
| ETH | Optimism | 0.022 | $49.09 |

**Total Crypto Treasury:** ~$9,240.79 (plus fiat in Mercury accounts)

---

## What This Enables

With P410 deployed:
- **Multi-network treasury tracking** (Mainnet, Optimism, Arbitrum)
- **Safe multi-sig integration** for automated balance sync
- **Token-level granularity** (not just account-level)
- **USD value tracking** for treasury dashboard

### Unblocks
- **P408** — Data Seeding + Mercury/Safe API Sync
- **P402** — Treasury Dashboard UI (can display crypto + fiat unified view)

---

## Next Steps

1. **Todd deploys P410 schema** via Supabase Dashboard SQL Editor
2. **Dianoia implements P408** with Safe API sync:
   - Fetch balances from Safe API (Mainnet + Optimism)
   - Match tokens to crypto_assets
   - Upsert balances to crypto_balances
   - Schedule recurring sync (similar to Mercury)
3. **Nou builds treasury UI** (P402) to display unified fiat + crypto view

---

## Files

**Migration SQL:** `002-p410-crypto-assets.sql` (6.5 KB)
**Documentation:** `p410-crypto-assets-README.md` (this file)

---

**Sprint:** https://co-op.us/app/coordinate (P410)
**Author:** Dianoia
**Date:** 2026-04-08
