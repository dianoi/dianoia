# Techne Institute Alpha Launch — Agent Execution Plan

**Target:** Friday 2026-04-10 EOD
**Available:** 48 hours
**Execution Model:** Parallel agent work (Dianoia + Nou)
**Repository:** https://github.com/RegenHub-Boulder/techne.institute
**Supabase:** gxyeobogqfubgzklmxwt.supabase.co

---

## Reconceptualization: Agent-Native Execution

**Human development model:** Sequential work, 8-hour days, context switching overhead
**Agent execution model:** Parallel streams, 24/7 availability, no context switching cost

**Key differences:**
1. **Parallelization:** Dianoia and Nou work simultaneously on independent components
2. **No sleep requirement:** Continuous execution across 48 hours
3. **Instant context:** Full codebase understanding without ramp-up
4. **No fatigue:** Quality doesn't degrade over time

**Revised estimate:** 48-70 sequential hours → **24-36 parallel hours** (fits in 48-hour window)

---

## Work Breakdown: Parallel Execution Streams

### Stream 1: Backend/Data (Dianoia) — 16-20 hours
**Scope:** Database schema, migrations, RLS policies, data seeding

1. **Treasury schema + data** (4-5 hours)
   - Design bank_accounts, transactions tables
   - Write migration SQL
   - Seed with current balance data (Todd provides)
   - RLS policies

2. **Projects/ventures schema + data** (5-6 hours)
   - Design projects, project_participants, project_milestones tables
   - Write migration SQL
   - Seed with current projects (Todd provides)
   - RLS policies

3. **Capital accounts schema + data** (4-5 hours)
   - Design capital_accounts, capital_transactions tables
   - Write migration SQL
   - Seed with initial contributions (Todd provides)
   - RLS policies

4. **Labor contributions schema** (3-4 hours)
   - Design labor_contributions table
   - Write migration SQL
   - RLS policies
   - (Data entry can happen post-launch)

**Dependencies:** Todd provides current state data (balances, projects, capital contributions)

---

### Stream 2: Frontend/UI (Nou) — 18-24 hours
**Scope:** React components, pages, auth integration, routing

1. **Auth setup + login flow** (4-6 hours)
   - Configure Supabase Auth (magic link)
   - Build /app/login page
   - Auth state management in React
   - Protected route wrapper
   - Test email delivery

2. **Member directory** (2-3 hours)
   - Fetch profiles from Supabase
   - Display roster with roles
   - Basic search/filter

3. **Digital member guide** (2-3 hours)
   - Render markdown docs (bylaws, member agreement, purpose)
   - Navigation between docs
   - Auth-gated access

4. **Treasury dashboard** (3-4 hours)
   - Display bank account balances
   - Transaction history table
   - Total assets summary

5. **Projects/ventures UI** (4-6 hours)
   - Project list page (active/paused/completed)
   - Project detail page (participants, milestones)
   - Add project form
   - Add participant to project

6. **Capital accounts UI** (3-4 hours)
   - Display member's capital account balance
   - Transaction history
   - Breakdown by type (initial, labor, patronage, draws)

7. **Labor contribution UI** (2-3 hours)
   - Labor entry form (date, hours, rate, description)
   - Labor history table
   - Total FMV summary

**Dependencies:** Stream 1 schemas deployed to Supabase

---

### Stream 3: Integration/Testing (Both) — 6-8 hours
**Scope:** End-to-end testing, bug fixes, deployment

1. **Integration testing** (3-4 hours)
   - Auth flow (magic link → dashboard)
   - Data display across all pages
   - Form submissions work correctly
   - RLS policies enforce access control

2. **Bug fixes** (2-3 hours)
   - Address issues found in testing
   - Edge case handling
   - Error messages

3. **Deployment** (1 hour)
   - Deploy frontend to GitHub Pages
   - Verify production Supabase connection
   - Smoke test in production

---

## Execution Timeline (Parallel)

### Wednesday Evening (2026-04-08, 18:00-24:00) — 6 hours

**Dianoia:**
- Design treasury schema
- Design projects/ventures schema
- Write migration SQL for both
- Begin capital accounts schema

**Nou:**
- Set up Supabase Auth (magic link)
- Build login page UI
- Implement auth state management
- Test magic link email delivery

**Handoff:** None needed (independent work)

---

### Thursday Morning (2026-04-09, 00:00-12:00) — 12 hours

**Dianoia:**
- Complete capital accounts schema
- Design labor contributions schema
- Write all migration SQL
- Deploy schemas to Supabase
- Write RLS policies
- **Request data from Todd:** Current balances, projects, capital contributions

**Nou:**
- Build member directory UI
- Build digital member guide UI
- Start treasury dashboard UI
- Start projects list UI

**Handoff:** Dianoia deploys schemas → Nou can query real tables

---

### Thursday Afternoon (2026-04-09, 12:00-18:00) — 6 hours

**Dianoia:**
- Seed treasury data (once Todd provides)
- Seed projects data (once Todd provides)
- Seed capital accounts data (once Todd provides)
- Verify RLS policies work correctly

**Nou:**
- Complete treasury dashboard UI
- Complete projects list + detail UI
- Build capital accounts UI
- Build labor contribution UI

**Handoff:** Dianoia seeds data → Nou tests with real data

---

### Thursday Evening (2026-04-09, 18:00-24:00) — 6 hours

**Both (Integration):**
- End-to-end testing of full flow
- Fix bugs discovered in testing
- Verify all features work with auth
- Test on multiple browsers/devices

---

### Friday Morning (2026-04-10, 00:00-12:00) — 12 hours

**Both (Polish + Buffer):**
- Address any remaining issues
- Performance optimization if needed
- Final smoke test in production
- Documentation for organizers (how to use each feature)

**Deploy:** Production deployment by 12:00

---

### Friday Afternoon (2026-04-10, 12:00-18:00) — 6 hours

**Alpha Testing:**
- Invite 11 allowed organizers to test
- Monitor for issues
- Hot-fix critical bugs if needed
- Collect feedback

---

## Total Parallel Execution Time

| Phase | Dianoia | Nou | Elapsed |
|-------|---------|-----|---------|
| Wed Evening | 6h | 6h | 6h |
| Thu Morning | 12h | 12h | 12h |
| Thu Afternoon | 6h | 6h | 6h |
| Thu Evening | 6h (integration) | 6h (integration) | 6h |
| Fri Morning | 12h (polish/buffer) | 12h (polish/buffer) | 12h |

**Total agent hours:** 42h (Dianoia) + 42h (Nou) = 84 agent-hours
**Total elapsed time:** 42 hours (within 48-hour window)
**Buffer:** 6 hours for unexpected issues

---

## Critical Dependencies (Todd's Input Required)

### Data Needed by Thursday 12:00 for Seeding

#### 1. Treasury Data
**Format:** Spreadsheet or structured text
```
Bank Account Name: [e.g., "Wells Fargo Business Checking"]
Balance: $X,XXX
Last Updated: YYYY-MM-DD

Recent transactions:
- Date: YYYY-MM-DD, Description: "...", Amount: $X,XXX, Category: income/expense
- Date: YYYY-MM-DD, Description: "...", Amount: $X,XXX, Category: income/expense
```

#### 2. Projects/Ventures Data
**Format:** List with details
```
Project 1:
- Name: "..."
- Description: "..."
- Type: project (1-2 people) or venture (3+ people)
- Status: active/paused/completed
- Contributors: [Names from profiles table]
- Milestones (optional): ["...", "...", "..."]

Project 2:
...
```

#### 3. Capital Accounts Data
**Format:** Initial contributions per member
```
Todd Youngblood: $X,XXX (initial share buy-in)
Jon Bo: $X,XXX
Aaron G Neyer: $X,XXX
Savannah Kruger: $X,XXX
```

**Optional:** Historical labor contributions (can be entered post-launch)

---

## Features Delivered by Friday EOD

### ✅ Authentication
- Magic link login at /app/login
- Email restricted to allowed_organizers table
- Session management
- Protected routes

### ✅ Member Directory
- List of all organizer profiles
- Name, role, join date
- Search/filter capability

### ✅ Digital Member Guide
- Bylaws (interactive navigation)
- Member Agreement
- Purpose Statement
- Articles of Organization

### ✅ Treasury Dashboard
- Current bank account balances
- Recent transactions
- Total co-op assets

### ✅ Projects & Ventures
- List of active projects/ventures
- Project detail pages (description, participants, milestones)
- Ability to add new projects
- Assign participants to projects

### ✅ Capital Accounts
- Each member's capital account balance
- Transaction history (initial contribution, labor, patronage, draws)
- Breakdown by contribution type

### ✅ Labor Contribution Tracking
- Form to log labor contributions (date, hours, rate, description)
- Labor history table
- Total FMV contributed per member
- Link labor to projects (optional)

### ✅ Static Public Pages
- Home, about, membership, formation, vision, data-room, etc.
- All existing content (already deployed)

---

## Post-Launch Iteration (Week 2+)

### Workshop Evolution
**Needs clarification from Todd:**
- What does "evolution" mean?
- Import co-op.us coordination data?
- Build project-based coordination (tasks, assignments, completions)?
- Keep co-op.us Workshop separate?

**Recommendation:** Address in Week 2 after alpha feedback

### Additional Features (Week 2-4)
- Financial reports (patronage allocation preview)
- Voting/proposals system (if needed)
- File uploads (documents, images)
- Notifications (email/in-app)
- Mobile responsiveness polish

---

## Success Criteria for Friday Alpha

### Functional
- ✅ 11 allowed organizers can log in via magic link
- ✅ All 7 major features work (directory, guide, treasury, projects, capital, labor)
- ✅ Data displays correctly for all organizers
- ✅ No critical bugs blocking usage

### Experience
- ✅ Organizers understand what they're looking at
- ✅ Forms are intuitive and functional
- ✅ Navigation is clear
- ✅ Mobile-friendly (at least usable)

### Foundation
- ✅ Database schema is solid (won't need major refactoring)
- ✅ RLS policies secure member data
- ✅ Code is maintainable for future features
- ✅ Production deployment is stable

---

## Execution Strategy

### Dianoia (Backend/Data Specialist)
**Focus:** Schema design, data integrity, security
**Strengths:** SQL, migrations, RLS policies, data modeling
**Deliverable:** Fully functional Supabase backend with seeded data

### Nou (Frontend/UX Specialist)
**Focus:** React components, user experience, visual design
**Strengths:** TypeScript, React, UI/UX, responsive design
**Deliverable:** Complete authenticated web application

### Coordination
- **No blocking dependencies** — work streams are parallel
- **Async handoffs** — Dianoia deploys schemas, Nou queries them
- **Shared repo** — Both commit to github.com/RegenHub-Boulder/techne.institute
- **Real-time sync** — Check each other's work every 6 hours

---

## Risk Mitigation

### Risk 1: Todd's data not provided by Thursday 12:00
**Mitigation:** Use placeholder data, replace with real data Friday morning
**Impact:** Minor — still functional for testing

### Risk 2: Supabase API rate limits
**Mitigation:** Implement client-side caching, batch requests
**Impact:** Low — usage will be light (11 users)

### Risk 3: Magic link email delivery issues
**Mitigation:** Test with multiple email providers (Gmail, custom domains)
**Impact:** Medium — could block login (test early)

### Risk 4: React app build complexity
**Mitigation:** Nou has full context on existing app structure
**Impact:** Low — existing app is Vite/React (standard stack)

### Risk 5: RLS policy bugs
**Mitigation:** Thorough testing of access control (organizers can only see allowed data)
**Impact:** High — security risk (prioritize testing)

---

## Commitment

**Dianoia:** I commit to delivering the full backend (schemas, migrations, RLS, seeded data) by Thursday EOD.

**Nou:** [Will be asked to commit to frontend delivery]

**Both:** We commit to integrated, tested, production-ready alpha by Friday 18:00.

---

## Next Steps (Immediate)

1. **Todd approves this plan** (10 minutes)
2. **Todd provides data requirements** (1-2 hours to compile)
3. **Dianoia starts backend work** (Wednesday evening, now)
4. **Nou starts frontend work** (Wednesday evening, coordinated start)
5. **Handoff Thursday 12:00** (Dianoia deploys schemas, Nou integrates)
6. **Integration Thursday 18:00** (Both test together)
7. **Deploy Friday 12:00** (Production launch)
8. **Alpha testing Friday afternoon** (Organizers invited)

---

*Dianoia · Execution Intelligence Agent · Agent-Native Execution Model · 2026-04-08*
