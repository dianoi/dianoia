# Techne Institute Alpha Launch — Dependency Tree

**Target:** Friday 2026-04-10 EOD
**Repository:** https://github.com/RegenHub-Boulder/techne.institute
**Supabase:** gxyeobogqfubgzklmxwt.supabase.co

---

## Deliverable: Functional Alpha for 11 Organizers

### What "functional" means:
- Organizers log in via magic link
- View member directory (who else is an organizer)
- View treasury balances and transactions
- View/add/manage projects and ventures
- View personal capital account
- Log labor contributions with FMV tracking
- Read bylaws, member agreement, purpose statement
- Static public site works (already deployed)

---

## Dependency Graph

```
ROOT
├─ [A] Auth Infrastructure ⚡ BLOCKING
│   ├─ Configure Supabase Auth (magic link)
│   ├─ Build login page
│   ├─ Auth state management in React
│   └─ Protected route wrapper
│
├─ [B] Database Schema ⚡ BLOCKING
│   ├─ Treasury schema (bank_accounts, transactions)
│   ├─ Projects schema (projects, project_participants, milestones)
│   ├─ Capital accounts schema (capital_accounts, capital_transactions)
│   ├─ Labor schema (labor_contributions)
│   ├─ Enhanced profiles schema (add email, membership_class, craft)
│   └─ RLS policies for all tables
│
├─ [C] Data Seeding ⚡ DEPENDENCY: B + Todd's data
│   ├─ Seed treasury data (balances, transactions)
│   ├─ Seed projects data (active projects, participants)
│   ├─ Seed capital accounts (initial contributions)
│   └─ Enhance profiles (add emails, membership info)
│
├─ [D] Member Directory UI → DEPENDENCY: A, B
│   ├─ Fetch profiles from Supabase
│   ├─ Display roster with search/filter
│   └─ Auth-gated access
│
├─ [E] Treasury UI → DEPENDENCY: A, B, C
│   ├─ Bank accounts list with balances
│   ├─ Transaction history table
│   └─ Total assets summary
│
├─ [F] Projects UI → DEPENDENCY: A, B, C
│   ├─ Project list (filter by status)
│   ├─ Project detail page
│   ├─ Add project form
│   └─ Assign participants to projects
│
├─ [G] Capital Accounts UI → DEPENDENCY: A, B, C
│   ├─ Display member's capital balance
│   ├─ Transaction history by type
│   └─ Breakdown visualization
│
├─ [H] Labor Tracking UI → DEPENDENCY: A, B
│   ├─ Labor entry form
│   ├─ Labor history table
│   └─ FMV summary per member
│
├─ [I] Digital Member Guide UI → DEPENDENCY: A
│   ├─ Render markdown docs (already exist in repo)
│   ├─ Navigation between docs
│   └─ Auth-gated access
│
└─ [J] Integration Testing → DEPENDENCY: A, B, C, D, E, F, G, H, I
    ├─ End-to-end auth flow
    ├─ Data display verification
    ├─ Form submission testing
    ├─ RLS policy verification
    └─ Cross-browser testing
```

---

## Execution Order (By Dependency Layer)

### Layer 0: Blocking Infrastructure (Parallel)
**No dependencies — start immediately**

**[A] Auth Infrastructure** (Nou)
- Configure Supabase Auth
- Build login page
- Auth state management
- Protected route wrapper

**[B] Database Schema** (Dianoia)
- Design all schemas
- Write migration SQL
- Deploy to Supabase
- Create RLS policies

**Parallelism:** A and B have zero dependencies on each other. Execute simultaneously.

---

### Layer 1: Data Population
**Dependencies:** B (schema exists) + Todd's data

**[C] Data Seeding** (Dianoia)
- Seed treasury: requires Todd's bank balances/transactions
- Seed projects: requires Todd's project list/participants
- Seed capital accounts: requires Todd's initial contribution amounts
- Enhance profiles: requires Todd's email/membership info

**Blocker:** Cannot proceed until Todd provides:
1. Current bank account balances + recent transactions
2. Active projects/ventures + contributors + status
3. Initial capital contributions per organizer
4. Email addresses + membership class per profile

---

### Layer 2: UI Components (Parallel)
**Dependencies:** A (auth works) + B (schemas exist)

**[D] Member Directory UI** (Nou)
- Dependency: A, B
- No dependency on C (can use existing 4 profiles)

**[E] Treasury UI** (Nou)
- Dependency: A, B, C
- Must wait for seeded treasury data

**[F] Projects UI** (Nou)
- Dependency: A, B, C
- Must wait for seeded project data

**[G] Capital Accounts UI** (Nou)
- Dependency: A, B, C
- Must wait for seeded capital data

**[H] Labor Tracking UI** (Nou)
- Dependency: A, B
- No dependency on C (empty table is fine, organizers can add entries)

**[I] Digital Member Guide UI** (Nou)
- Dependency: A only
- Docs already exist as markdown files in repo

**Parallelism:** D, H, I can start as soon as A and B are done. E, F, G must wait for C.

---

### Layer 3: Integration & Deployment
**Dependencies:** All previous layers

**[J] Integration Testing** (Both)
- Test complete user flows
- Verify RLS policies
- Fix bugs
- Deploy to production

---

## Critical Path Analysis

### Longest Dependency Chain (Critical Path):
```
B (Schema) → C (Data Seeding) → E/F/G (Treasury/Projects/Capital UIs) → J (Testing)
```

**This chain blocks the most features.** Shortening it is highest priority.

### Shortening Strategy:
1. **B (Schema):** Dianoia starts immediately, no blockers
2. **C (Data Seeding):** Todd provides data ASAP (this is the external blocker)
3. **E/F/G (UIs):** Nou builds immediately after C completes
4. **J (Testing):** Starts as soon as last UI is functional

### Parallel Work (Non-Critical):
```
A (Auth) → D/H/I (Member Directory/Labor/Guide UIs) → J (Testing)
```

These features can complete in parallel with the critical path.

---

## Deliverable Checklist

### ✅ Infrastructure
- [ ] Supabase Auth configured (magic link)
- [ ] Login page functional
- [ ] Auth state managed in React
- [ ] Protected routes enforced

### ✅ Database
- [ ] Treasury schema deployed
- [ ] Projects schema deployed
- [ ] Capital accounts schema deployed
- [ ] Labor schema deployed
- [ ] Enhanced profiles schema deployed
- [ ] RLS policies active and tested

### ✅ Data
- [ ] Treasury data seeded (balances, transactions)
- [ ] Projects data seeded (projects, participants, milestones)
- [ ] Capital accounts seeded (initial contributions)
- [ ] Profiles enhanced (emails, membership class)

### ✅ User Interface
- [ ] Member directory page (list, search, filter)
- [ ] Treasury dashboard (balances, transactions, totals)
- [ ] Projects list page (active/paused/completed)
- [ ] Project detail page (info, participants, milestones)
- [ ] Add project form
- [ ] Capital account page (balance, transaction history)
- [ ] Labor entry form (date, hours, rate, description)
- [ ] Labor history page (table, FMV summary)
- [ ] Digital member guide (bylaws, member agreement, purpose)

### ✅ Quality
- [ ] End-to-end auth flow tested
- [ ] All pages load with correct data
- [ ] Forms submit successfully
- [ ] RLS policies prevent unauthorized access
- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile-responsive (basic)

---

## External Dependencies (Todd's Input Required)

### Data for Seeding (Layer 1 Blocker)

**Treasury Data:**
```
Bank Account: [name]
Institution: [bank name]
Type: [checking/savings]
Balance: $[amount]
Last Updated: [date]

Recent Transactions:
- [date], [description], $[amount], [category: income/expense]
- [date], [description], $[amount], [category: income/expense]
- ...
```

**Projects Data:**
```
Project: [name]
Type: [project (1-2 people) or venture (3+ people)]
Status: [active/paused/completed]
Description: [brief description]
Contributors: [names from profiles: Todd, Jon Bo, Aaron, Savannah]
Milestones: [optional list of deliverables/tasks]
```

**Capital Accounts Data:**
```
Todd Youngblood: Initial contribution $[amount]
Jon Bo: Initial contribution $[amount]
Aaron G Neyer: Initial contribution $[amount]
Savannah Kruger: Initial contribution $[amount]
```

**Profiles Enhancement:**
```
Todd Youngblood:
  Email: [email]
  Membership Class: [1/2/3/4]
  Craft: [e.g., "governance, finance"]

Jon Bo:
  Email: [email]
  Membership Class: [1/2/3/4]
  Craft: [e.g., "design, coordination"]

Aaron G Neyer:
  Email: [email]
  Membership Class: [1/2/3/4]
  Craft: [e.g., "code, infrastructure"]

Savannah Kruger:
  Email: [email]
  Membership Class: [1/2/3/4]
  Craft: [e.g., "community, education"]
```

---

## Execution Strategy

### Dianoia (Backend)
**Start immediately:** Layer 0 [B] (Schema)
**Wait for Todd's data:** Layer 1 [C] (Seeding)
**Finish:** Layer 3 [J] (Testing with Nou)

### Nou (Frontend)
**Start immediately:** Layer 0 [A] (Auth)
**Start after Layer 0:** Layer 2 [D, H, I] (UIs with no data dependency)
**Wait for Layer 1:** Layer 2 [E, F, G] (UIs with data dependency)
**Finish:** Layer 3 [J] (Testing with Dianoia)

### Coordination Points
1. **After Layer 0 completes:** Nou can start most UI work
2. **After Layer 1 completes:** Nou can finish remaining UIs (E, F, G)
3. **After Layer 2 completes:** Both move to integration testing

---

## Success Criteria

**Alpha is successful if:**
1. All 11 allowed organizers can log in
2. All 9 major features work (directory, treasury, projects, capital, labor, guide)
3. Data displays correctly and is current
4. No critical bugs block usage
5. Organizers can perform key actions (add project, log labor, view balances)

**Alpha is NOT dependent on:**
- Perfect UX polish
- Mobile optimization (just needs to be usable)
- Advanced features (voting, proposals, notifications)
- Workshop evolution (deferred to post-alpha)

---

## What Can Be Parallelized

### Immediate (No Dependencies)
- Auth setup (Nou)
- Schema design (Dianoia)

### After Schema Deployed
- Member directory UI (Nou) — uses existing profiles
- Labor tracking UI (Nou) — empty table is fine
- Digital guide UI (Nou) — markdown files already exist
- Data seeding (Dianoia) — **blocked by Todd's data**

### After Data Seeded
- Treasury UI (Nou)
- Projects UI (Nou)
- Capital accounts UI (Nou)

### After All UIs Built
- Integration testing (both)
- Bug fixes (both)
- Production deployment (both)

---

## Anti-Pattern: Time-Based Planning

**Don't think:** "Schema takes 6 hours, so start at 18:00 and finish at 00:00"

**Do think:** "Schema has no dependencies, start now. When complete, data seeding unblocks. When data seeding completes, treasury/projects/capital UIs unblock."

**Planning unit:** Dependency chain, not clock time

**Completion signal:** Deliverable is functional, not hours elapsed

---

*Dianoia · Execution Intelligence Agent · Dependency-Driven Execution · 2026-04-08*
