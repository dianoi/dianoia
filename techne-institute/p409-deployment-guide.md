# P409 Deployment Guide — Techne Institute Database Schema

**Sprint:** P409
**Status:** Complete — Ready for Deployment
**Date:** 2026-04-08
**Supabase Instance:** gxyeobogqfubgzklmxwt.supabase.co

## Quick Start

### Deployment via Supabase Dashboard (Recommended)

1. **Log in to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/gxyeobogqfubgzklmxwt
   - Navigate to: SQL Editor

2. **Execute Migration**
   - Copy full SQL from: `/tmp/techne-institute/database/migrations/001-p409-schema.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Deployment**
   Run these queries at end of migration file:
   ```sql
   -- Check all tables exist with RLS
   SELECT tablename,
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

## Schema Overview

### Treasury (with Mercury API Support)
- **bank_accounts** — Co-op bank accounts
  - Columns: institution, account_name, account_type, balance, currency
  - API fields: external_provider, external_account_id

- **transactions** — Financial transactions
  - Columns: account_id, date, description, amount, category, project_id
  - API fields: external_id (unique), external_provider
  - Deduplication: external_id prevents duplicate imports

### Projects & Ventures
- **projects** — Co-op initiatives
  - Type: 'project' (1-2 people) or 'venture' (3+ people)
  - Status: active, paused, completed, archived

- **project_participants** — Many-to-many (projects ↔ members)
  - Role: lead, contributor, advisor

- **project_milestones** — Deliverables per project
  - Status: pending, in_progress, completed

### Capital Accounts
- **capital_accounts** — Member equity tracking (K-1)
  - Columns: initial_contribution, labor_contributions, capital_contributions, patronage_allocated, draws_taken
  - Generated: current_balance (auto-calculated)

- **capital_transactions** — Audit trail
  - Type: initial, labor, capital, patronage, draw

### Labor Tracking
- **labor_contributions** — Member labor with FMV
  - Columns: member_id, date, hours, hourly_rate, description, project_id, category
  - Generated: fmv_total (hours * hourly_rate)

### Members
- **profiles** (enhanced) — Member directory
  - New columns: email (unique), membership_class, craft

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

## Files

### Migration SQL
**Path:** `/tmp/techne-institute/database/migrations/001-p409-schema.sql`
**Size:** 12.8 KB
**Commit:** eb1d13f (local)

Contains:
- All table definitions (8 tables)
- Enhanced profiles (3 new columns)
- RLS policies (11 policies)
- Indexes (8 indexes for performance)
- Triggers (auto-update timestamps)
- Foreign keys with CASCADE
- Generated columns (current_balance, fmv_total)
- Verification queries

### Documentation
**Path:** `/tmp/techne-institute/database/README.md`
**Commit:** eb1d13f (local)

Contains:
- Schema overview
- Deployment options (Dashboard, psql, CLI)
- Security summary (RLS policies)
- API integration guide
- Verification queries

## What This Enables

With P409 deployed, these sprints can proceed:

- **P408** — Data Seeding + Mercury API Sync (requires Todd's data)
- **P399** — Auth + Magic Link Login (Nou)
- **P401** — Member Directory UI (Nou)
- **P402** — Treasury Dashboard UI (Nou, requires P408)
- **P403** — Projects UI (Nou, requires P408)
- **P404** — Capital Accounts UI (Nou, requires P408)
- **P405** — Labor Tracking UI (Nou)
- **P406** — Digital Member Guide UI (Nou)
- **P407** — Integration Testing (Both, requires all UI)

## Technical Notes

- **Generated columns** auto-calculate based on formulas (current_balance, fmv_total)
- **Timestamps** auto-update via triggers
- **Foreign keys** use CASCADE for automatic cleanup
- **Indexes** optimize common query patterns (date DESC, member lookups)
- **RLS** enforces security at database layer (no UI bypass possible)

## Deployment Status

- ✅ Migration SQL created (12.8 KB)
- ✅ Documentation written
- ✅ Committed locally (eb1d13f)
- ⚠️ Cannot push to RegenHub-Boulder/techne.institute (GitHub permission)
- ⏳ Awaiting manual deployment by Todd via Supabase Dashboard

## Next Steps

1. Todd deploys P409 schema via Supabase Dashboard SQL Editor
2. Todd provides data for P408:
   - Mercury API key (or connection info)
   - Current bank account balances
   - Active projects/ventures list with contributors
   - Initial capital contributions per organizer
   - Profile emails and membership classes
3. Dianoia claims and executes P408 (data seeding + Mercury sync)
4. Nou begins UI sprints (P399, P401-P407)

---

**Questions or issues?** Dianoia is available in Workshop Activity for clarifications.

**Workshop Sprint:** https://co-op.us/app/coordinate (sprint P409)
**Completion proof:** Migration SQL at `/tmp/techne-institute/database/migrations/001-p409-schema.sql`
