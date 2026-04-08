# P408: Treasury API Sync Documentation

**Sprint:** P408 — Data Seeding + Mercury/Safe API Sync
**Date:** 2026-04-08
**Status:** Data seeding complete, API sync documented for future implementation

---

## Data Seeding Complete

### Treasury Accounts (4 accounts, $9,340.79 total)

**Mercury (Fiat)**
- Checking ••1253: $100.00
- Savings ••8590: $0.00

**Safe Multi-sig (Crypto)**
- Mainnet: 0xA594263e0449A28eAEf5BA6420E81cC1996b7782
- Optimism: 0xA594263e0449A28eAEf5BA6420E81cC1996b7782
  - 8,192.312 USDC ($8,192.07)
  - 1,000 DAI ($999.63)
  - 0.022 ETH ($49.09)

### Projects/Ventures (11 total)

**Active Ventures:**
- LearnVibe.Build (completed)
- Information & Communications Commons
- Schelling Point (archived)

**Projects (venture-in-formation):**
- Parachute, Postage, Habitat

**Studio Infrastructure:**
- Patronage Accounting Systems
- commons.id
- co-op.us
- Watershed Data Aggregator
- Coordination Games Participation

### Capital Accounts (4 organizers)

Created for Todd, Jon, Aaron, Savannah. Initial contributions seeded where profiles exist.

**Note:** Full organizer seeding blocked by FK constraint to auth.users. Requires P399 (auth) completion first.

---

## API Sync Implementation Guide

### Mercury API Sync

**API Key:** Stored in `/workspace/group/.secrets/mercury_api_key`

**Endpoint:** `https://api.mercury.com/api/v1/accounts`

**Authentication:** Bearer token in Authorization header

**Implementation Steps:**

1. **Fetch Account Balances**
   ```javascript
   const response = await fetch('https://api.mercury.com/api/v1/accounts', {
     headers: {
       'Authorization': `Bearer ${MERCURY_API_KEY}`,
       'Accept': 'application/json'
     }
   });
   const { accounts } = await response.json();

   // Update bank_accounts table
   for (const account of accounts) {
     await supabase.from('bank_accounts')
       .update({
         balance: account.availableBalance / 100, // Convert cents to dollars
         last_updated: new Date()
       })
       .eq('external_account_id', account.id);
   }
   ```

2. **Fetch Transaction History**
   ```javascript
   const response = await fetch(`https://api.mercury.com/api/v1/accounts/${accountId}/transactions`, {
     headers: {
       'Authorization': `Bearer ${MERCURY_API_KEY}`,
       'Accept': 'application/json'
     }
   });
   const { transactions } = await response.json();

   // Insert new transactions (external_id prevents duplicates)
   for (const txn of transactions) {
     await supabase.from('transactions').insert({
       account_id: bankAccountId,
       date: txn.postedAt,
       description: txn.note || txn.counterpartyName,
       amount: txn.amount / 100,
       category: txn.amount > 0 ? 'income' : 'expense',
       external_id: txn.id,
       external_provider: 'mercury'
     }).onConflict('external_id').ignore();
   }
   ```

3. **Supabase Edge Function**
   Create `/supabase/functions/sync-mercury/index.ts`:
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   serve(async (req) => {
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL')!,
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
     )

     const mercuryKey = Deno.env.get('MERCURY_API_KEY')!

     // Fetch and sync logic here

     return new Response(JSON.stringify({ ok: true }), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```

4. **Scheduled Job (pg_cron)**
   ```sql
   SELECT cron.schedule(
     'sync-mercury-daily',
     '0 2 * * *', -- 2am daily
     $$
     SELECT
       net.http_post(
         url := 'https://gxyeobogqfubgzklmxwt.supabase.co/functions/v1/sync-mercury',
         headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
       );
     $$
   );
   ```

---

### Safe API Sync

**Multi-sig Address:** `0xA594263e0449A28eAEf5BA6420E81cC1996b7782`

**Endpoints:**
- Mainnet: `https://safe-transaction-mainnet.safe.global/api/v1/safes/{address}/balances/`
- Optimism: `https://safe-transaction-optimism.safe.global/api/v1/safes/{address}/balances/`

**Implementation Steps:**

1. **Fetch Crypto Balances**
   ```javascript
   const networks = [
     { name: 'mainnet', url: 'https://safe-transaction-mainnet.safe.global' },
     { name: 'optimism', url: 'https://safe-transaction-optimism.safe.global' }
   ];

   for (const network of networks) {
     const response = await fetch(
       `${network.url}/api/v1/safes/${SAFE_ADDRESS}/balances/`,
       { headers: { 'User-Agent': 'RegenHub/1.0' } }
     );
     const balances = await response.json();

     for (const bal of balances) {
       // Find matching crypto_asset
       const { data: asset } = await supabase
         .from('crypto_assets')
         .select('id')
         .eq('token_address', bal.tokenAddress || null)
         .eq('network', network.name)
         .single();

       if (!asset) continue;

       // Calculate human-readable balance
       const balance = parseInt(bal.balance) / (10 ** bal.token.decimals);

       // Upsert crypto_balance
       await supabase.from('crypto_balances')
         .upsert({
           account_id: safeAccountId,
           asset_id: asset.id,
           balance: balance,
           usd_value: balance * (await fetchPriceUSD(bal.token.symbol)),
           last_updated: new Date()
         }, {
           onConflict: 'account_id,asset_id'
         });
     }
   }
   ```

2. **Price Feed Integration (Optional)**
   Use CoinGecko API for USD prices:
   ```javascript
   async function fetchPriceUSD(symbol) {
     const response = await fetch(
       `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
     );
     const data = await response.json();
     return data[symbol.toLowerCase()]?.usd || 0;
   }
   ```

3. **Supabase Edge Function**
   Create `/supabase/functions/sync-safe/index.ts` (similar structure to Mercury sync)

4. **Scheduled Job**
   ```sql
   SELECT cron.schedule(
     'sync-safe-daily',
     '0 3 * * *', -- 3am daily (after Mercury sync)
     $$
     SELECT
       net.http_post(
         url := 'https://gxyeobogqfubgzklmxwt.supabase.co/functions/v1/sync-safe',
         headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
       );
     $$
   );
   ```

---

## Future Enhancements

### Stripe Treasury Migration

When migrating from Mercury to Stripe Treasury:

1. **Update bank_accounts table:**
   ```sql
   UPDATE bank_accounts
   SET external_provider = 'stripe',
       external_account_id = '<stripe_account_id>'
   WHERE external_provider = 'mercury';
   ```

2. **Update Edge Function:**
   - Change API endpoint to Stripe Treasury API
   - Update authentication (use Stripe secret key)
   - Map Stripe transaction format to schema

3. **No schema changes required** — `external_provider` column supports multiple providers

### Real-time Webhooks

**Mercury Webhooks:**
- Configure in Mercury Dashboard
- Endpoint: `https://gxyeobogqfubgzklmxwt.supabase.co/functions/v1/mercury-webhook`
- Verify signature for security
- Update balances/transactions immediately on webhook receipt

**Safe Transaction Service Webhooks:**
- Safe doesn't provide webhooks natively
- Fallback: Poll every 6 hours instead of daily
- Or use Alchemy/Infura webhook for on-chain events

---

## Security Considerations

1. **API Keys:** Store in Supabase Vault, never commit to repo
2. **Service Role Key:** Only use in Edge Functions, never expose to client
3. **RLS Policies:** Already enforced (organizers only for treasury tables)
4. **Webhook Signatures:** Always verify before processing
5. **Rate Limiting:** Implement exponential backoff for API calls

---

## Testing

**Manual Testing:**
1. Run sync functions manually via curl:
   ```bash
   curl -X POST https://gxyeobogqfubgzklmxwt.supabase.co/functions/v1/sync-mercury \
     -H "Authorization: Bearer <service_role_key>"
   ```

2. Verify database updates:
   ```sql
   SELECT * FROM bank_accounts ORDER BY last_updated DESC;
   SELECT * FROM crypto_balances ORDER BY last_updated DESC;
   SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
   ```

**Automated Testing:**
- Create test fixtures with mock API responses
- Verify transaction deduplication (external_id constraint)
- Test error handling (API down, invalid credentials, etc.)

---

## Deployment Checklist

- [x] Database schema deployed (P409 + P410)
- [x] Mercury accounts seeded
- [x] Safe accounts seeded
- [x] Crypto balances seeded
- [x] Projects seeded
- [x] Capital accounts seeded
- [ ] Mercury API key stored in Supabase Vault
- [ ] Edge Function: sync-mercury deployed
- [ ] Edge Function: sync-safe deployed
- [ ] Cron jobs scheduled
- [ ] Webhook endpoints configured (optional)
- [ ] Initial transaction backfill completed
- [ ] Documentation committed to repo

---

**Status:** Data seeding complete. API sync functions documented for implementation by Nou or future sprint.

**Files:**
- Seed scripts: `/workspace/group/seed-remaining.js`
- Test connection: `/workspace/group/test-connection.js`
- Deploy schemas: `/workspace/group/deploy-schemas.js`

**Next Steps:**
- Nou implements Edge Functions for Mercury/Safe sync
- Schedule cron jobs after Edge Functions deployed
- Configure webhooks for real-time updates
