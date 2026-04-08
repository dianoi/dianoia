# Techne Institute Database

**Supabase Instance:** gxyeobogqfubgzklmxwt.supabase.co
**Schema Version:** P409 (2026-04-08)

## Schema Overview

### Treasury (with API Integration)
- `bank_accounts` — Co-op bank accounts with Mercury/Stripe API support
- `transactions` — Financial transactions with deduplication for API imports

### Projects & Ventures
- `projects` — Co-op initiatives (type: project for 1-2 people, venture for 3+)
- `project_participants` — Many-to-many relationship (projects ↔ members)
- `project_milestones` — Deliverables and milestones per project

### Capital Accounts
- `capital_accounts` — Member equity tracking (K-1 partnership accounting)
- `capital_transactions` — Audit trail for capital movements

### Labor Tracking
- `labor_contributions` — Member labor with FMV calculation

### Members
- `profiles` (enhanced) — Member directory with email, membership_class, craft

## Deploying Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Log in to https://supabase.com/dashboard/project/gxyeobogqfubgzklmxwt
2. Navigate to SQL Editor
3. Copy contents of `migrations/001-p409-schema.sql`
4. Paste and execute
5. Verify with verification queries at end of migration file

### Option 2: psql (if available)
```bash
PGPASSWORD="<service_role_key>" psql \\
  -h db.gxyeobogqfubgzklmxwt.supabase.co \\
  -p 5432 \\
  -U postgres \\
  -d postgres \\
  -f migrations/001-p409-schema.sql
```

### Option 3: Supabase CLI (if installed)
```bash
supabase db push
```

## Security (RLS Policies)

### Treasury
- **Read/Write:** Organizers only
- Prevents non-organizer access to financial data

### Projects
- **Read:** All authenticated members
- **Write:** Organizers only

### Capital Accounts
- **Read own:** Members see their own capital account
- **Read all:** Organizers see all capital accounts
- **Write:** Organizers only

### Labor Contributions
- **Read/Write own:** Members manage their own labor entries
- **Read all:** Organizers see all labor contributions

## API Integration

### Mercury (Implemented in P408)
- `external_provider = 'mercury'` identifies Mercury-synced accounts
- `external_id` prevents duplicate transaction imports
- `external_account_id` maps to Mercury account ID

### Future: Stripe Treasury
- Same pattern as Mercury
- Switch `external_provider` to `'stripe'`
- Update API endpoint in sync function

## Verification

After deployment, run these queries to verify:

```sql
-- Check all tables exist with RLS
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'bank_accounts', 'transactions', 'projects', 'capital_accounts', 'labor_contributions'
  );

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Notes

- Generated columns (`current_balance`, `fmv_total`) auto-calculate based on formulas
- Timestamps auto-update via triggers
- Foreign keys use CASCADE for automatic cleanup
- Indexes optimize common query patterns (date DESC, member lookups)

---

**Deployed:** Pending (waiting for Supabase Dashboard access)
**Sprint:** P409
**Author:** Dianoia
