# R2 & R3 Roadmap Review — Enhancement Suggestions

**Reviewer:** Dianoia  
**Date:** April 6, 2026  
**Context:** Post-P315 audit, grounded in TIO layer architecture and Workshop coordination patterns

---

## Executive Summary

Both R2 and R3 are well-scoped strategic initiatives with clear business value. The specifications are thorough and show strong understanding of the technical and organizational context. My suggestions focus on:

1. **R2:** Clarifying auth flows, defining data migration paths, and surfacing edge cases from P319 findings
2. **R3:** Strengthening the navigation strategy with progressive disclosure patterns and establishing design system governance
3. **Cross-cutting:** Ensuring R2/R3 coordination dependencies are explicit and sequenced correctly

---

## R2 — Member & Investor Portal

### Strengths

✓ **Grounded in research:** P319 findings on IRC 704(b) and LCA structure are correctly applied  
✓ **Scoped by user class:** Four membership classes with distinct needs (good separation of concerns)  
✓ **Integration awareness:** Dependencies on patronage engine (S25) and auth tiers are identified  
✓ **Open decisions surfaced:** K-1 generation, valuation method, RLS policy — all flagged correctly

### Enhancement Suggestions

#### 1. Auth Flow Specification (Layer 6: Constraint)

**Gap:** "Supabase auth: magic link or OAuth" is underspecified. Which OAuth providers? What happens when a member has multiple email addresses or changes email?

**Recommendation:**
Add an auth flow specification covering:
- **Primary path:** Magic link to email on file (from `participants` table)
- **Recovery path:** Email change request flow (member submits, steward approves, updates `participants.contact_email`)
- **OAuth option:** Google OAuth as secondary (maps to same `participant_id` via email claim)
- **Session duration:** 7-day token with refresh, or explicit logout
- **RLS enforcement:** `participant_id` from JWT claims must match row owner for capital accounts

**Why:** Auth failures are the #1 support burden in member portals. Explicit flows prevent "I can't log in" tickets.

#### 2. Data Migration & Backfill Strategy (Layer 2: State)

**Gap:** The spec assumes capital account data exists. How do we initialize accounts for existing members who joined before the portal?

**Recommendation:**
Add a data migration section:
- **One-time backfill:** Script to populate `capital_accounts` table from patronage engine historical allocations (Q1 2026 exists, earlier quarters may need manual entry)
- **Validation:** Cross-check totals against accountant-approved books
- **Member notification:** Email when account becomes visible ("Your capital account is now accessible at...")

**Why:** Launching with incomplete data creates trust issues. Members will compare portal balances to their records and question discrepancies.

#### 3. Venture Basket Composition Detail (Layer 7: View)

**Current spec:** "Venture basket composition: ventures in basket, % equity held, status"

**Enhancement:**
Specify what "status" means for each venture:
- **Active:** Company operating, no liquidation event
- **Exited:** Acquisition/IPO, distribution pending or completed
- **Dissolved:** Company closed, equity worthless (write-off)
- **Transferred:** Equity transferred out of basket per investor request

Also specify how % equity is displayed:
- **Absolute:** "1.5% of Company X"
- **Relative to basket:** "15% of your venture basket is Company X"
- **Both?**

**Why:** Ambiguity in equity display leads to investor confusion. Specify now, implement once.

#### 4. Quarterly Allocation Event Schema (Layer 4: Event)

**Gap:** "Consume allocation events" from patronage engine — what does this event look like?

**Recommendation:**
Define the allocation event schema:
```json
{
  "event_type": "patronage_allocation",
  "quarter": "2026-Q2",
  "participant_id": "uuid",
  "components": {
    "labor": 1234.56,
    "revenue": 567.89,
    "capital": 890.12,
    "community": 345.67
  },
  "total_allocation": 3038.24,
  "book_capital_balance": 12345.67,
  "tax_capital_balance": 11234.56,
  "qualified_vs_nonqualified": "qualified",
  "timestamp": "2026-07-15T00:00:00Z"
}
```

**Why:** Clear event schema prevents integration bugs between patronage engine and capital book backend.

#### 5. K-1 Generation Decision — Recommendation

**Open decision:** "K-1 generation: manual upload vs automated pipeline"

**Recommendation:** **Start with manual upload, plan for automation.**

**Phase 1 (manual):**
- Accountant generates K-1 PDFs per member
- Steward uploads to `documents` table with `participant_id` + `tax_year` + `document_type: 'K1'`
- Member downloads from vault

**Phase 2 (automated):**
- When tax automation is mature (2027+), generate K-1 programmatically from `capital_accounts` and `allocation_events`
- Use same document schema, switch upload source

**Why:** K-1 generation has serious tax implications. Manual first = accountant review. Automate only after pattern is proven.

#### 6. Edge Case: Mid-Year Member Additions

**Gap:** What happens when a new member joins mid-quarter?

**Recommendation:**
Specify proration rules:
- **Labor patronage:** Prorated by days active in quarter
- **Revenue patronage:** Full allocation if any revenue contribution (no proration)
- **Capital patronage:** Prorated by days capital was deployed
- **Community patronage:** Full allocation (community contribution is not time-based)

Document this in the Member Portal FAQ and capital book backend logic.

**Why:** P319 findings surfaced this as a common LCA question. Answer it proactively.

---

## R3 — techne.institute Intranet Architecture

### Strengths

✓ **Clear tier model:** Public / Investor-accessible / Intranet — good separation  
✓ **URL structure is logical:** `/intranet/` prefix makes access tier obvious  
✓ **Design system awareness:** Shared tokens.css without flattening section aesthetics  
✓ **Migration planning:** /app/data-room/ → /data-room/ transition considered

### Enhancement Suggestions

#### 1. Progressive Disclosure in Navigation (Layer 7: View)

**Current spec:** "Global navigation shell — two modes (public / intranet)"

**Enhancement:**
Add a **third mode: transitional nav** for the investor-accessible tier.

**Three navigation modes:**
1. **Public nav:** Home · Introduction · Formation · About (unauthenticated)
2. **Investor nav:** Public links + Data Room (token-gated, shows "Intranet" link grayed/locked)
3. **Intranet nav:** Full member navigation (authenticated, all sections visible)

**Why:** Progressive disclosure shows investors what's available once they become members. "Intranet" link in investor nav with a lock icon is a nudge toward membership.

#### 2. Design System Governance (Layer 6: Constraint)

**Current spec:** "Shared tokens.css (parchment/ember/charcoal palette), without flattening section aesthetics"

**Enhancement:**
Define **what tokens are shared** vs **what remains section-specific:**

**Shared tokens (tokens.css):**
- Color palette: `--parchment`, `--ember`, `--charcoal`, `--copper-accent`
- Typography scale: `--text-xs` through `--text-3xl`
- Spacing scale: `--space-1` through `--space-12`
- Breakpoints: `--mobile`, `--tablet`, `--desktop`

**Section-specific (section CSS files):**
- Font stacks (Cormorant on landing, EB Garamond on formation, Inter on intranet)
- Layout grids (vary by section needs)
- Component patterns (buttons, cards, modals)

**Governance:** New sections must use shared tokens for color/spacing/type scale, but can define custom font stacks and layouts.

**Why:** Tokens create visual coherence without forcing homogeneity. Governance prevents token drift over time.

#### 3. Sitemap.xml and Robots.txt Strategy (Layer 6: Constraint)

**Current spec:** "sitemap.xml and robots.txt excluding /intranet/ and /admin/"

**Enhancement:**
Be explicit about **what gets indexed:**

**sitemap.xml includes:**
- `/` (landing)
- `/introduction/` (all four essays)
- `/formation/` (index + narrative, governance, financial — but NOT documents page)
- `/about/` (if created)

**sitemap.xml excludes:**
- `/intranet/*` (authenticated content)
- `/admin/*` (steward-only)
- `/data-room/*` (investor-gated)
- `/app/*` (authentication-required React app)

**robots.txt:**
```
User-agent: *
Disallow: /intranet/
Disallow: /admin/
Disallow: /data-room/
Disallow: /app/
Allow: /
```

**Why:** Clear indexing boundaries protect member privacy and prevent gated content from appearing in search results.

#### 4. URL Migration Plan Detail (Layer 3: Relationship)

**Current spec:** "migration plan for /app/data-room/ → /data-room/"

**Enhancement:**
Specify redirect rules and backward compatibility:

**Phase 1: Parallel paths (1 month)**
- Both `/app/data-room/` and `/data-room/` serve the same content
- No redirects yet (allows testing of new path)

**Phase 2: Soft redirect (2 months)**
- `/app/data-room/` returns 302 (temporary redirect) to `/data-room/`
- User sees notice: "This URL is moving. Update your bookmarks."

**Phase 3: Hard redirect (permanent)**
- `/app/data-room/` returns 301 (permanent redirect) to `/data-room/`
- Search engines update index

**Why:** Hard redirects on day 1 break bookmarks. Phased migration gives users time to adapt.

#### 5. Navigation Web Component Specification (Layer 7: View)

**Current spec:** "nav.js web component"

**Enhancement:**
Define component API and behavior:

**Component API:**
```html
<techne-nav mode="public|investor|intranet" active-section="introduction"></techne-nav>
```

**Props:**
- `mode`: Determines which links are visible
- `active-section`: Highlights current section
- `user-name`: (intranet mode only) Display name in nav

**Behavior:**
- Works in static HTML pages (loads as standalone script)
- Works in React app (mounts as custom element)
- Responsive: hamburger menu on mobile, horizontal on desktop
- Accessible: keyboard navigation, ARIA labels

**Why:** Explicit API prevents implementation drift between static and React contexts.

#### 6. Access Tier Enforcement (Layer 6: Constraint)

**Gap:** "Supabase auth scopes" mentioned but not defined.

**Recommendation:**
Define three auth scopes mapped to membership tiers:

**Scopes:**
1. `public` — No auth required
2. `investor` — Token-gated OR Class 4 member authenticated
3. `member` — Class 1/2/3/4 authenticated via Supabase

**Enforcement:**
- Public pages: No middleware
- Investor pages: Check for `data_room_token` cookie OR `auth.user()` with `membership_class` claim
- Intranet pages: Require `auth.user()` with valid `participant_id` and `membership_class`

**RLS policies:**
```sql
-- Example: capital_accounts table
CREATE POLICY "Members see own accounts"
ON capital_accounts
FOR SELECT
USING (auth.uid() = participant_id);

-- Example: venture_basket (Class 4 only)
CREATE POLICY "Class 4 sees venture basket"
ON venture_basket
FOR SELECT
USING (
  auth.uid() IN (
    SELECT participant_id FROM participants WHERE membership_class = 4
  )
);
```

**Why:** Scope definitions now inform R2 implementation later. Prevents rework.

---

## Cross-Cutting Concerns

### 1. Sequencing R2 and R3

**Current dependency note:** "R2 depends on R3 (intranet URL structure and auth tier definitions should be settled first)"

**Enhancement:**
Make sequencing explicit:

**Phase 1: R3 — Sitemap & Auth Tiers (sprint P360?)**
- Deliver: sitemap.md, auth scope definitions, tokens.css, nav.js web component
- Review: Steward approval on URL structure and access tiers
- Outcome: R2 can reference canonical intranet URLs

**Phase 2: R2 — Member Portal Implementation (sprint P361?)**
- Depends on: R3 Phase 1 complete
- Builds on: `/intranet/*` URL structure, auth scopes, nav component
- Delivers: Capital account dashboard, K-1 vault, investor portal

**Why:** R3 defines the structure, R2 builds within it. Serial dependency, not parallel.

### 2. Design System vs Section Aesthetics Tension

**Both roadmap items mention preserving section aesthetics while introducing shared tokens.**

**Recommendation:**
Establish a **design system tier model:**

**Tier 1: Tokens (enforced globally)**
- Colors, spacing, type scale
- Defined in `tokens.css`
- Used by all sections

**Tier 2: Components (shared library, optional usage)**
- Buttons, cards, modals, form fields
- Defined in `components.css`
- Sections can use or override

**Tier 3: Section Aesthetics (section-specific)**
- Font stacks, layout grids, unique patterns
- Defined in section CSS files
- Full creative control

**Why:** Three-tier model prevents "design system sprawl" where every section wants custom tokens, while still allowing aesthetic diversity.

### 3. Member Communication Strategy

**Gap:** Both roadmap items introduce significant changes (new portal, new URLs) but don't address member communication.

**Recommendation:**
Add a communication plan to each roadmap item:

**R2 launch:**
- Email all members: "Your capital account is now online"
- Include: Portal URL, login instructions, FAQ link
- Timing: After data backfill and validation complete

**R3 launch:**
- Email with new sitemap: "techne.institute has been reorganized"
- Include: Key URL changes, bookmark update instructions
- Timing: After URL migration Phase 1 (parallel paths)

**Why:** Silent launches create confusion. Proactive communication builds trust.

---

## Summary of Enhancements

### R2 — Member & Investor Portal
1. **Auth flow specification** — magic link + OAuth paths, recovery flows
2. **Data migration strategy** — backfill script, validation, member notification
3. **Venture basket detail** — status definitions, % equity display format
4. **Allocation event schema** — JSON structure for patronage engine integration
5. **K-1 generation recommendation** — manual first, automate later
6. **Mid-year member proration** — rules for partial-quarter allocations

### R3 — techne.institute Intranet
1. **Progressive disclosure nav** — three modes (public/investor/intranet)
2. **Design system governance** — three-tier token model (tokens/components/sections)
3. **Sitemap & robots.txt** — explicit inclusion/exclusion rules
4. **URL migration phases** — parallel → soft redirect → hard redirect
5. **Nav web component API** — props, behavior, accessibility
6. **Auth scope definitions** — public/investor/member with RLS policy examples

### Cross-Cutting
1. **Sequencing clarity** — R3 Phase 1 → R2 (serial dependency)
2. **Design system tiers** — enforced tokens, optional components, section freedom
3. **Member communication** — email plans for both launches

---

## Verification Checklist

Before declaring either roadmap item complete, verify:

### R2 Verification
- [ ] Auth flow tested with all four membership classes
- [ ] Capital account balances match accountant-approved books
- [ ] K-1 documents display correctly for all tax years on file
- [ ] Venture basket composition visible to Class 4, hidden from Class 1/2/3
- [ ] Mobile layout works on 375px width
- [ ] RLS policies prevent cross-member data access
- [ ] Member communication sent and FAQ published

### R3 Verification
- [ ] Navigation component works in both static HTML and React contexts
- [ ] URL redirects preserve query parameters and fragments
- [ ] sitemap.xml excludes /intranet/ and /admin/
- [ ] robots.txt verified via Google Search Console
- [ ] Design tokens used consistently across all sections
- [ ] Accessibility: keyboard nav works, ARIA labels present
- [ ] Member communication sent with sitemap changes

---

**Questions? Follow-ups?**

These suggestions are grounded in:
- P315 audit findings (52 defects across 7 layers)
- P319 LCA/IRC 704(b) research
- TIO layer architecture (Identity → State → Relationship → Event → Flow → Constraint → View)
- Workshop coordination patterns observed over 6 weeks

Ready to discuss any of these enhancements or provide more detail on implementation.

Dianoia  
April 6, 2026
