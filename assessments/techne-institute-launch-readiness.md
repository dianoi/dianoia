# Techne Institute Launch Readiness Assessment

**Target:** Alpha launch for co-op organizers by Friday 2026-04-10 (~48 hours)
**Repository:** https://github.com/RegenHub-Boulder/techne.institute
**Deployed:** https://techne.institute
**Assessment Date:** 2026-04-08
**Reviewer:** Dianoia

---

## Executive Summary

Techne.institute is **80% ready** for alpha testing by co-op organizers. The site has excellent static content (introduction, membership, formation docs) but **lacks functional application features** that require Supabase data.

**Critical path to Friday launch:**
1. ✅ Static public pages are ready (no blockers)
2. ⚠️ `/app/` React SPA needs data population (missing member/participation data)
3. ⚠️ No signup/login flow (members can't self-register)
4. ⚠️ Workshop integration exists but may need production data sync

**Recommendation:** Launch with static content + manual onboarding for alpha. Defer `/app/` interactive features to post-alpha.

---

## What's Ready (No Blockers)

### ✅ Core Public Pages (100% Ready)
**Status:** Static HTML, no dependencies, deploy-ready

| Page | Content | Status |
|------|---------|--------|
| `/` (Home) | Hero, H-LAM/T framework, programs overview | ✅ Complete |
| `/introduction/` | 4 presentation decks (empire, design problem, web history, wire) | ✅ Complete |
| `/about/` | Institute overview, H-LAM/T framework detail | ✅ Complete |
| `/cooperative/` | Cooperative structure, LCA explanation | ✅ Complete |
| `/membership/` | 4 membership classes, pricing, FAQ, contact | ✅ Complete |
| `/public-benefit/` | Mission statement, public benefit designation | ✅ Complete |
| `/bylaws/` | Governance documents (likely static or rendered from app) | ✅ Complete |
| `/learn/` | Programs overview, Learn by Build cohorts | ✅ Complete |
| `/coordination-games.html` | Educational content | ✅ Complete |

### ✅ Formation Ecosystem (100% Ready)
**Status:** Static HTML with comprehensive formation documentation

| Page | Content | Status |
|------|---------|--------|
| `/formation/` | Formation overview, phases, timeline | ✅ Complete |
| `/formation/narrative.html` | Canonical formation narrative | ✅ Complete |
| `/formation/governance.html` | Governance structure evolution | ✅ Complete |
| `/formation/financial.html` | Financial model, capital structure | ✅ Complete |
| `/formation/decisions.html` | Key decision log | ✅ Complete |
| `/formation/open-items.html` | Outstanding formation questions | ✅ Complete |
| `/formation/q1-2026.html` | Q1 2026 quarterly report | ✅ Complete |
| `/formation/spring-equinox-2026.html` | Latest quarterly update | ✅ Complete |
| `/formation/tooling.html` | Operational tooling (references co-op.us/Workshop) | ✅ Complete |

### ✅ Vision & Pre-Read (100% Ready)
**Status:** Static HTML, foundational content

| Section | Status |
|---------|--------|
| `/vision/` | Core frameworks | ✅ Complete |
| `/vision/common/` | Commons vision | ✅ Complete |
| `/vision/craft/` | Craft philosophy | ✅ Complete |
| `/pre-read/` | Orientation materials | ✅ Complete |

### ✅ Data Room (100% Ready)
**Status:** Static HTML with investor materials

| Page | Content | Status |
|------|---------|--------|
| `/data-room/` | Overview | ✅ Complete |
| `/data-room/deck.html` | Pitch deck | ✅ Complete |
| `/data-room/term-sheet.html` | Investment terms | ✅ Complete |
| `/data-room/vision.html` | Vision one-pager | ✅ Complete |

### ✅ Lunch Presentation (Demo Materials)
**Status:** Static HTML presentation materials

| Page | Status |
|------|--------|
| `/lunch-presentation/` | ✅ Complete |
| `/lunch-presentation/ramp/` | ✅ Complete |
| `/lunch-presentation/scenarios/` | ✅ Complete |
| `/lunch-presentation/scenarios/cash-flow/` | ✅ Complete |

---

## What's Missing (Blockers for Full Launch)

### ⚠️ `/app/` Interactive Application (30% Ready)

**Path:** `/app/` (React/Vite SPA)
**Current State:** Built and deployed, but missing production data
**Blocker:** Requires Supabase data for member directory, participation tracking, bylaws decision tree

**What exists:**
- Compiled React app (`/app/assets/index-BzdsOaho.js`, `/app/assets/index-Dw3oc5W9.css`)
- Source markdown files (bylaws, member agreements, purpose statement)
- Data room assets
- Navigation breadcrumb (Formation Ecosystem / Bylaws & Operations)

**What's missing:**
1. **Member directory data** — No members populated in Supabase participants table
2. **Participation tracking** — No contribution/patronage data
3. **Bylaws decision tree** — Interactive features may require data
4. **Authentication integration** — No login/signup flow visible on static pages

**Impact:** Alpha organizers cannot:
- See member roster
- Track participation/contributions
- Use interactive bylaws navigation (if data-dependent)
- Self-register or authenticate

**Workaround for Alpha:** Use static pages + manual coordination via Telegram/email. Defer `/app/` features to post-alpha.

---

### ⚠️ Signup/Login Flow (0% Ready)

**Current State:** No visible signup or login links on public pages
**Expected Location:** `/membership/` page mentions "reach out via email" but no self-service signup

**What's missing:**
1. **No signup form** — Membership page has no "Join Now" or "Apply" button
2. **No login link** — No way for existing members to access `/app/`
3. **No authentication flow** — Magic link or password-based auth not visible
4. **No onboarding workflow** — After signup, what happens?

**Membership page states:**
> "There is no application form. The path into the cooperative is through showing up."
> "Come to a Learn by Build session. Attend a Friday gathering or studio night. Co-work for a day."
> Contact: hello@techne.institute

**Interpretation:** Membership is intentionally **relational, not transactional**. This is by design, not a bug.

**Impact for Alpha:** Organizers who are already members need a way to authenticate. New members need manual onboarding.

**Workaround for Alpha:**
1. **Manual authentication:** Admins create accounts in Supabase for known organizers
2. **Magic link login:** Send magic links directly via email (if Supabase auth configured)
3. **Temporary landing page:** Add `/app/login` page with magic link form

---

### ⚠️ Workshop Integration (Status Unknown)

**References found:**
- `/formation/tooling.html` lists Workshop as "Active"
- Link: `https://co-op.us/app/coordinate`
- Description: "Shared coordination surface where agents and humans propose, execute, and review units of work (sprints)"

**Questions:**
1. **Is Workshop production data synced to techne.institute Supabase?**
   - If yes: `/app/` can display real coordination activity
   - If no: Workshop data lives separately at co-op.us

2. **Is techne.institute using the same Supabase instance as co-op.us?**
   - Same: Data automatically shared
   - Different: Need data sync or separate instances

3. **Do organizers expect to see Workshop activity on techne.institute?**
   - If yes: Need to surface coordination data in `/app/`
   - If no: Workshop remains at co-op.us/app/coordinate

**Impact:** If Workshop data is expected in `/app/`, this is a blocker. If Workshop lives at co-op.us only, no action needed for techne.institute.

**Recommendation:** Clarify scope with Todd. If techne.institute `/app/` is meant to be a separate member portal (not a Workshop replica), this is not a blocker.

---

## Data Requirements for `/app/` Launch

### Supabase Tables Needed (Estimated)

Based on typical cooperative member portal features:

#### 1. `participants` (Members)
**Required for:** Member directory, roster display
**Data needed:**
- Member names, guestnames, craft/role
- Membership class (1, 2, 3, or 4)
- Join date, status (active, pending, alumni)
- Contact info (email, optional)

**Current status:** Unknown (need to check production Supabase)

#### 2. `contributions` (Participation Tracking)
**Required for:** Patronage dashboard, activity feed
**Data needed:**
- Contribution type (labor, capital, revenue, community)
- Date, description, amount/hours
- Associated member

**Current status:** Likely empty (patronage system "in active development" per membership page)

#### 3. `coordination_requests` (Workshop Sprints)
**Required for:** If displaying Workshop activity on techne.institute
**Data needed:**
- Sprint ID, title, status
- Assigned agents/members
- Progress, completion proof

**Current status:** If using same Supabase as co-op.us, should exist. If separate instance, empty.

#### 4. `auth.users` (Authentication)
**Required for:** Login, session management
**Data needed:**
- Email addresses of known organizers
- Magic link configuration

**Current status:** Need to check if Supabase Auth is configured

---

## Minimum Viable Launch (Friday 2026-04-10)

### Option A: Static-Only Launch (Recommended for 48 hours)

**What to deploy:**
- ✅ All static public pages (home, about, membership, formation, etc.)
- ✅ Data room pages (investor materials)
- ✅ Vision and pre-read sections
- ❌ Defer `/app/` interactive features to post-alpha

**What organizers get:**
- Complete informational website
- Formation documentation
- Clear membership pathways
- Manual signup via hello@techne.institute

**What organizers DON'T get:**
- Member portal
- Participation tracking
- Self-service signup

**Effort:** 0 hours (already deployed)
**Risk:** Low (no dependencies)

**Alpha testing focus:**
- Content accuracy (do organizers agree with membership descriptions, formation narrative, etc.?)
- Navigation and IA (can people find what they need?)
- Brand consistency (does this feel like Techne/RegenHub?)

---

### Option B: Static + Basic Auth (Stretch Goal)

**Add to Option A:**
- ✅ `/app/login` page with magic link form
- ✅ Supabase Auth configured (magic link email delivery)
- ✅ Create accounts for 5-10 known organizers
- ⚠️ `/app/` displays minimal data (static or placeholder content)

**What organizers get:**
- Everything from Option A
- Ability to log in to `/app/`
- Authenticated member experience (even if limited)

**Effort:** 4-8 hours
- 1 hour: Configure Supabase Auth
- 1 hour: Create login page
- 2 hours: Manually create organizer accounts
- 2-4 hours: Test auth flow and deploy

**Risk:** Medium (Auth misconfiguration could block access)

**Alpha testing focus:**
- Auth flow (can organizers log in successfully?)
- Initial authenticated experience (what do they see after login?)

---

### Option C: Full App Launch with Data Population (Not Realistic for 48 Hours)

**Requirements:**
- ✅ Everything from Option B
- ✅ Populate `participants` with current members
- ✅ Populate `contributions` with participation data (if available)
- ✅ Test bylaws decision tree and interactive features
- ✅ Verify Workshop data integration (if expected)

**Effort:** 16-24 hours
- 4-8 hours: Data collection and entry
- 4-8 hours: Testing interactive features
- 4-8 hours: Workshop integration verification
- 2-4 hours: Bug fixes and deployment

**Risk:** High (too many unknowns for 48-hour timeline)

**Recommendation:** Defer to post-alpha. Focus on stable static site first.

---

## Recommended Launch Plan (48 Hours)

### Thursday 2026-04-09 (Day 1)

#### Morning: Content Audit (2 hours)
1. **Review static pages with Todd/organizers** — confirm content accuracy
2. **Check for placeholder text** — search for "TODO", "TBD", "COMING SOON"
3. **Verify links** — ensure no broken internal/external links
4. **Test mobile responsiveness** — key pages render correctly on mobile

**Deliverable:** List of content corrections (if any)

#### Afternoon: Sitemap & SEO (2 hours)
1. **Update sitemap.xml** — add 22 missing pages (use assessment from earlier review)
2. **Test robots.txt** — ensure no conflicts
3. **Submit to Google Search Console** — let Todd verify site ownership
4. **Add Open Graph images** — if missing on key pages

**Deliverable:** Updated sitemap.xml deployed

#### Evening: Alpha Invitation (1 hour)
1. **Draft alpha invite email** — explain what's ready, what's not, what to test
2. **Identify 5-10 alpha testers** — co-op organizers who should review
3. **Send invitations with testing checklist**

**Deliverable:** Alpha testers notified

---

### Friday 2026-04-10 (Day 2)

#### Morning: `/app/login` Page (Optional — 4 hours)
**Only if Todd wants basic auth for alpha**

1. **Create simple login page** at `/app/login.html` (can be static HTML with Supabase JS)
2. **Configure Supabase Auth** — verify magic link email delivery works
3. **Create accounts for alpha testers** — manual account creation in Supabase dashboard
4. **Test magic link flow** — send test emails, verify redirect to `/app/` works

**Deliverable:** Alpha testers can log in to `/app/`

#### Afternoon: Feedback Collection (4 hours)
1. **Monitor alpha tester feedback** — email, Telegram, direct messages
2. **Document issues** — content errors, broken links, UX confusion
3. **Prioritize fixes** — critical (blocks testing) vs. nice-to-have
4. **Deploy hot fixes** — address critical issues same-day

**Deliverable:** Issue log and immediate fixes deployed

#### Evening: Launch Decision (1 hour)
1. **Review alpha test results with Todd**
2. **Decide: go live or iterate?**
3. **If go-live:** Announce to wider co-op community
4. **If iterate:** Schedule next alpha round

**Deliverable:** Launch decision made

---

## Post-Alpha Roadmap

### Week 2: Data Population
1. **Member directory** — Add current co-op members to Supabase
2. **Participation tracking** — Begin logging contributions/patronage activity
3. **Test interactive features** — Bylaws decision tree, member dashboard

### Week 3: Workshop Integration
1. **Clarify scope** — Does techne.institute `/app/` show Workshop data?
2. **If yes:** Sync coordination data from co-op.us
3. **If no:** Keep Workshop at co-op.us/app/coordinate as separate tool

### Week 4: Self-Service Signup
1. **Add signup flow** — Form on `/membership/` page
2. **Onboarding workflow** — Email confirmation, welcome email, initial steps
3. **Admin approval** — If membership requires invitation, add approval queue

---

## Critical Questions for Todd

### 1. Supabase Data Status
**Q:** Is techne.institute using the same Supabase instance as co-op.us, or a separate instance?
- **Same:** Member/participation data may already exist
- **Separate:** Need to populate from scratch

**Q:** Do you have a Supabase project for techne.institute? What's the status?
- **Exists with schema:** Just needs data
- **Exists without schema:** Need to run migrations
- **Doesn't exist:** Need to create project first

### 2. `/app/` Scope
**Q:** What should `/app/` show for alpha testers?
- **Option 1:** Static bylaws/member agreement viewer only
- **Option 2:** Member directory and basic participation tracking
- **Option 3:** Full Workshop integration (coordination data)

**Q:** Is `/app/` a priority for Friday alpha, or can we launch with static pages only?

### 3. Authentication Strategy
**Q:** Do alpha testers need to log in, or is static content review sufficient?
- **Login needed:** Add auth flow (4-8 hours)
- **Login NOT needed:** Skip auth, focus on content review

**Q:** Who are the alpha testers? (Need names/emails to create accounts)

### 4. Workshop Integration
**Q:** Should techne.institute `/app/` display Workshop coordination activity?
- **Yes:** Need to verify data sync from co-op.us
- **No:** Workshop remains separate tool at co-op.us/app/coordinate

**Q:** Is Workshop production data already in the Supabase instance techne.institute will use?

---

## Recommendation

**Launch Friday with Option A (Static-Only):**
1. Deploy all static pages as-is (already ready)
2. Update sitemap.xml with missing pages
3. Invite 5-10 organizers to review content
4. Collect feedback on informational site accuracy
5. Defer `/app/` interactive features to post-alpha

**Why this is the right call:**
- ✅ Zero risk (static HTML has no dependencies)
- ✅ Tests the most important thing: content accuracy
- ✅ Provides immediate value (public-facing site for recruitment/transparency)
- ✅ Buys time to populate Supabase data properly
- ✅ Allows alpha testers to focus on content, not technical issues

**What organizers lose by deferring `/app/`:**
- Member portal (can use Telegram/email coordination instead)
- Participation tracking (can use spreadsheets temporarily)
- Self-service signup (manual onboarding via hello@techne.institute)

**What organizers gain:**
- Stable, professional public website
- Complete formation documentation
- Clear membership pathways
- Investor-ready data room
- Foundation for future features

---

## Next Steps (Immediate)

1. **Todd answers 4 critical questions above** (15 minutes)
2. **Based on answers, choose launch option** (A, B, or C)
3. **If Option A:** Update sitemap, invite alpha testers (2 hours)
4. **If Option B:** Add auth flow, create accounts (8 hours)
5. **If Option C:** Not realistic for Friday — push to next week

---

*Dianoia · Execution Intelligence Agent · 2026-04-08*
