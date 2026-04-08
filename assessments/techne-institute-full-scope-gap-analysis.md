# Techne Institute — Full Scope Gap Analysis

**Date:** 2026-04-08
**Target:** Friday 2026-04-10 alpha launch (48 hours)
**Current Supabase:** gxyeobogqfubgzklmxwt.supabase.co

---

## Todd's Full Feature Requirements

### Priority Features for Alpha
1. **Common Treasury** — Co-op bank balances
2. **Projects (1-2 contributors)** — Small team coordination
3. **Ventures (3+ contributors)** — Multi-person coordination
4. **Member Capital Accounts** — Individual equity tracking
5. **Member Directory** — Roster with roles
6. **Labor Contribution Books** — FMV of labor value contributed
7. **Digital Member Guide** — Purpose Statement, Bylaws, Member Agreement
8. **Auth** — Magic link login
9. **Workshop Evolution** — techne.institute/workshop exists, needs evolution

---

## Current State vs. Required State

### What EXISTS in Supabase (gxyeobogqfubgzklmxwt)

#### ✅ Profiles Table
```sql
profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  declared_role text NOT NULL,
  created_at timestamptz DEFAULT now()
)
```
**Current data:** 4 profiles (Todd, Jon Bo, Aaron, Savannah)
**Status:** ✅ Usable for member directory
**Missing:** Email, craft, membership_class, capital_account balance

#### ✅ Allowed Organizers Table
```sql
allowed_organizers (
  email text PRIMARY KEY
)
```
**Current data:** 11 emails
**Status:** ✅ Ready for auth gating
**Use case:** Magic link allowlist

#### ✅ Signals Table
```sql
signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  signal_type text NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```
**Current data:** Unknown (didn't check count)
**Status:** ✅ Schema exists, purpose unclear
**Potential use:** Voting/feedback on proposals

---

### What's MISSING (Must Build for Alpha)

#### ❌ Treasury/Finances
**Required tables:**
```sql
-- Bank accounts and balances
bank_accounts (
  id uuid PRIMARY KEY,
  institution text,
  account_name text,
  account_type text, -- checking, savings, investment
  balance numeric,
  currency text DEFAULT 'USD',
  last_updated timestamptz
)

-- Transaction history
transactions (
  id uuid PRIMARY KEY,
  account_id uuid REFERENCES bank_accounts,
  date date,
  description text,
  amount numeric,
  category text, -- income, expense, capital_call, distribution
  project_id uuid, -- optional link to project/venture
  created_at timestamptz
)
```

**What this enables:** Common treasury dashboard showing total co-op funds

**Effort to build:** 8-12 hours
- Schema design and migration: 2 hours
- Data entry (current balances): 1 hour
- UI components: 4-6 hours
- Testing: 2-3 hours

---

#### ❌ Projects & Ventures
**Required tables:**
```sql
-- Projects (1-2 contributors) and Ventures (3+ contributors)
projects (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text CHECK (type IN ('project', 'venture')),
  status text CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_by uuid REFERENCES profiles,
  created_at timestamptz DEFAULT now()
)

-- Project/venture participants
project_participants (
  project_id uuid REFERENCES projects,
  participant_id uuid REFERENCES profiles,
  role text, -- lead, contributor, advisor
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, participant_id)
)

-- Project milestones/deliverables
project_milestones (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects,
  title text NOT NULL,
  description text,
  due_date date,
  status text CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz
)
```

**What this enables:**
- List of active projects/ventures
- Who's working on what
- Milestone tracking

**Effort to build:** 12-16 hours
- Schema design: 2 hours
- UI for project list/detail pages: 6-8 hours
- UI for adding projects/participants: 4-6 hours
- Testing: 2-4 hours

---

#### ❌ Capital Accounts
**Required tables:**
```sql
-- Member capital accounts (partnership equity tracking)
capital_accounts (
  id uuid PRIMARY KEY,
  member_id uuid REFERENCES profiles,
  initial_contribution numeric DEFAULT 0,
  labor_contributions numeric DEFAULT 0, -- Cumulative labor FMV
  capital_contributions numeric DEFAULT 0,
  patronage_allocated numeric DEFAULT 0, -- Surplus distributions
  draws_taken numeric DEFAULT 0, -- Member draws/distributions
  current_balance numeric GENERATED ALWAYS AS (
    initial_contribution + labor_contributions + capital_contributions
    + patronage_allocated - draws_taken
  ) STORED,
  updated_at timestamptz DEFAULT now()
)

-- Capital account transactions (audit trail)
capital_transactions (
  id uuid PRIMARY KEY,
  account_id uuid REFERENCES capital_accounts,
  date date,
  type text CHECK (type IN ('initial', 'labor', 'capital', 'patronage', 'draw')),
  amount numeric,
  description text,
  created_at timestamptz
)
```

**What this enables:** Each member sees their equity balance (K-1 tax basis)

**Effort to build:** 10-14 hours
- Schema design: 2 hours
- Data entry (initial contributions): 2 hours
- UI for capital account dashboard: 4-6 hours
- UI for transaction history: 2-4 hours
- Testing: 2-4 hours

---

#### ❌ Labor Contribution Books
**Required tables:**
```sql
-- Labor contributions (time + FMV tracking)
labor_contributions (
  id uuid PRIMARY KEY,
  member_id uuid REFERENCES profiles,
  date date,
  hours numeric,
  hourly_rate numeric, -- FMV rate for this type of work
  fmv_total numeric GENERATED ALWAYS AS (hours * hourly_rate) STORED,
  description text,
  project_id uuid REFERENCES projects, -- optional
  category text, -- governance, operations, project_work, community
  created_at timestamptz DEFAULT now()
)
```

**What this enables:**
- Track labor hours per member
- Calculate FMV of labor contributions
- Feed into capital accounts (labor_contributions column)

**Effort to build:** 8-12 hours
- Schema design: 1 hour
- UI for labor entry form: 4-6 hours
- UI for labor history/reports: 3-5 hours
- Testing: 2-3 hours

---

#### ❌ Digital Member Guide (Bylaws/Docs)
**Current state:**
- `/app/` React SPA exists
- Source markdown files in `/app/` directory:
  - `regenhub-proposed.md` (99KB — proposed bylaws)
  - `ma-regenhub-proposed.md` (25KB — proposed member agreement)
  - `purpose-statement.md` (10KB)
  - `articles-of-organization.md` (4KB)

**What's needed:**
- ✅ Content exists as markdown
- ⚠️ React app may already render these (need to check)
- ❌ Auth gating (ensure only logged-in members can access)

**Effort to build:** 2-4 hours
- Verify existing React app renders docs: 1 hour
- Add auth gating if missing: 1-2 hours
- Test navigation and doc display: 1-2 hours

---

#### ❌ Auth (Magic Link)
**Status:** Supabase Auth service exists, needs configuration

**What's needed:**
1. Enable Supabase Auth email provider
2. Configure magic link template
3. Add login page at `/app/login`
4. Implement auth flow in React app
5. Gate `/app/*` routes behind auth
6. Use `allowed_organizers` table to restrict signup

**Effort to build:** 6-8 hours
- Supabase Auth setup: 1 hour
- Login page UI: 2-3 hours
- Auth state management in React: 2-3 hours
- RLS policies (ensure only allowed emails can auth): 1-2 hours
- Testing: 2-3 hours

---

#### ❌ Workshop Evolution
**Current state:** `/workshop/` directory exists (static HTML)
**What Todd wants:** Evolution (unclear what this means)

**Possible interpretations:**
1. **Integrate Workshop data from co-op.us** — Show coordination activity on techne.institute
2. **Rebuild Workshop for techne.institute context** — Projects/ventures replace sprints
3. **Hybrid:** Use co-op.us Workshop for agent coordination, techne.institute for member coordination

**Clarification needed:** What does "evolution" mean?

---

## Total Effort Estimate (Full Scope)

| Feature | Status | Effort (hours) |
|---------|--------|----------------|
| Treasury | ❌ Missing schema + UI | 8-12 |
| Projects & Ventures | ❌ Missing schema + UI | 12-16 |
| Capital Accounts | ❌ Missing schema + UI | 10-14 |
| Labor Contribution Books | ❌ Missing schema + UI | 8-12 |
| Digital Member Guide | ⚠️ Content exists, needs auth | 2-4 |
| Auth (Magic Link) | ❌ Needs setup | 6-8 |
| Member Directory | ✅ Profiles exist, needs UI | 2-4 |
| Workshop Evolution | ❓ Unclear scope | TBD |

**Total: 48-70 hours** (minimum)

**Available time: ~48 hours** (until Friday EOD)

---

## Reality Check: This Cannot Be Built in 48 Hours

Todd's full feature list requires:
- 6 new database schemas (treasury, projects, capital accounts, labor, transactions, milestones)
- Data entry for current state (bank balances, capital contributions, existing projects)
- 7 major UI sections (treasury dashboard, project list/detail, capital accounts, labor entry, member directory, auth, member guide)
- Auth setup and testing
- Integration testing across all features

**This is 1-2 weeks of focused development work**, not 48 hours.

---

## Recommended Approach: Phased Alpha Launch

### Phase 1: Friday Alpha (48 Hours) — "Information + Identity"

**Goal:** Get organizers authenticated and viewing foundational content

**Deliverables:**
1. ✅ **Static public pages** (already done)
2. ✅ **Magic link auth** (6-8 hours)
3. ✅ **Member directory** (2-4 hours — display existing profiles)
4. ✅ **Digital member guide** (2-4 hours — render markdown docs with auth)
5. ✅ **Updated sitemap** (1 hour)

**Total effort: 11-17 hours** (achievable in 48 hours with focused work)

**What organizers can do:**
- Log in with magic link
- See who else is an organizer (member directory)
- Read bylaws, member agreement, purpose statement
- Provide feedback on static content

**What they CAN'T do yet:**
- View treasury balances
- Track projects/ventures
- See capital accounts
- Log labor contributions

---

### Phase 2: Week 2 (April 11-18) — "Treasury + Projects"

**Deliverables:**
1. ❌ Treasury schema + UI (8-12 hours)
2. ❌ Projects & ventures schema + UI (12-16 hours)
3. ❌ Data entry for current balances and active projects (4-6 hours)

**Total effort: 24-34 hours**

**What organizers can do:**
- View common treasury balances
- See list of active projects/ventures
- Add new projects and assign participants

---

### Phase 3: Week 3 (April 19-25) — "Capital Accounts + Labor Tracking"

**Deliverables:**
1. ❌ Capital accounts schema + UI (10-14 hours)
2. ❌ Labor contribution schema + UI (8-12 hours)
3. ❌ Data entry for initial contributions and historical labor (6-8 hours)

**Total effort: 24-34 hours**

**What organizers can do:**
- View personal capital account balance
- Log labor contributions with FMV
- See equity build-up over time

---

### Phase 4: Week 4+ — "Workshop Evolution + Polish"

**Deliverables:**
1. ❓ Workshop evolution (depends on clarified scope)
2. ❌ Financial reports (patronage allocation preview)
3. ❌ Advanced features (voting, proposals, etc.)

---

## Critical Decision Point

**Todd must choose ONE of these paths:**

### Option A: Launch Friday with Phase 1 Only (Recommended)
- **Realistic:** 11-17 hours of work
- **Deliverable:** Auth + member directory + digital guide + static content
- **Trade-off:** No treasury, projects, or capital accounts yet
- **Benefit:** Stable foundation for future features

### Option B: Delay Launch to April 18 (Phase 1 + 2)
- **Realistic:** 35-51 hours of work over 10 days
- **Deliverable:** Everything from Phase 1 + treasury + projects
- **Trade-off:** No alpha feedback this week
- **Benefit:** More complete system for first impressions

### Option C: Attempt Full Build in 48 Hours (Not Recommended)
- **Unrealistic:** 48-70 hours of work in 48 calendar hours
- **Risk:** Nothing works well, rushed code, bugs
- **Outcome:** Likely to miss Friday deadline anyway

---

## My Recommendation

**Launch Friday with Phase 1** (Information + Identity):
1. Enable magic link auth today (Wednesday evening)
2. Build member directory tomorrow (Thursday morning)
3. Ensure digital member guide renders (Thursday afternoon)
4. Test with 2-3 organizers Thursday evening
5. Launch Friday morning

**Then immediately start Phase 2** (Treasury + Projects) for Week 2.

This gives organizers something real to test on Friday while preserving quality and not creating technical debt from rushing.

---

## Questions for Todd (Immediate Answers Needed)

### 1. Launch Timeline
**Q:** Are you willing to launch Friday with Phase 1 only (auth + directory + docs), or do you want to delay launch until treasury/projects are ready?

**If Friday:** I can deliver Phase 1 by EOD Friday.
**If delay:** I need at least 7-10 days for Phase 1 + 2.

### 2. Treasury Data
**Q:** Do you have current bank account balances and transaction history ready to import?
- **If yes:** Where is it? (spreadsheet, accounting software, etc.)
- **If no:** Can treasury be a Phase 2 feature?

### 3. Projects/Ventures Data
**Q:** What projects/ventures currently exist? Who's working on them?
- Need: Project names, descriptions, contributors, status
- Format: Can be provided as spreadsheet/doc to import

### 4. Capital Accounts Data
**Q:** What are the initial capital contributions for each of the 4 organizers?
- Todd: $X
- Jon Bo: $X
- Aaron: $X
- Savannah: $X

### 5. Workshop Evolution Scope
**Q:** What does "workshop evolution" mean specifically?
- Option A: Import coordination data from co-op.us Workshop
- Option B: Build project-based coordination (replace sprints with project tasks)
- Option C: Keep co-op.us Workshop separate, techne.institute focuses on member operations

---

## Next Steps (If Phase 1 Approved)

### Wednesday Evening (Tonight) — 4 hours
1. ✅ Configure Supabase Auth for magic links
2. ✅ Create login page at `/app/login`
3. ✅ Test magic link email delivery

### Thursday Morning — 4 hours
4. ✅ Build member directory UI (display profiles table)
5. ✅ Add auth gating to `/app/*` routes

### Thursday Afternoon — 4 hours
6. ✅ Verify digital member guide renders markdown docs
7. ✅ Update sitemap.xml with all pages
8. ✅ Deploy to production

### Thursday Evening — 2 hours
9. ✅ Test with 2-3 organizers (magic link flow, directory, docs)
10. ✅ Fix critical bugs if found

### Friday Morning — 1 hour
11. ✅ Final smoke test
12. ✅ Announce alpha launch to full organizer list

**Total: 15 hours across 48 hours** (achievable)

---

*Dianoia · Execution Intelligence Agent · 2026-04-08*
