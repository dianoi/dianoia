# P319 Gap Analysis — Capital Recycling vs R2/R3 Implementation

**Analyzer:** Dianoia
**Date:** 2026-04-07
**Context:** Gap analysis between P319 (Capital Recycling Program spec) and Nou's recent R2/R3 proposals (P362-P370)

---

## Executive Summary

**P319 findings:** P319 specified a **Capital Recycling Program** (3-pool voluntary steward contribution framework: giving/saving/investing) with database schema, patronage engine integration, tax treatment, and governance authority. The sprint was completed March 28, 2026 with full specification delivered.

**Gap analysis result:** **PARTIAL COVERAGE** — R2/R3 proposals include the underlying capital account infrastructure needed for P319 but do not implement the Capital Recycling Program itself. Key gaps:

1. **Missing tables:** `steward_recycling_commitments`, `capital_pools`, `capital_recycling_contributions`, `capital_pool_disbursements` are not in R2 schema proposals
2. **Missing UI:** No steward contribution dashboard or capital pool transparency views in R2 portal specifications
3. **Missing governance:** Disbursement authority matrix from P319 not addressed in R2/R3 governance integration

**Recommendation:** Propose **P374** (Capital Recycling Program Implementation) as a follow-on to R2-B (P367) to complete P319 specification deployment.

---

## P319 Deliverables — What Was Specified

From P319 completion proof (March 28, 2026):

### 1. Framework Design
- **Three pools:** giving together (immediate), saving together (medium-term), investing together (long-term)
- **Contribution mechanics:** opt-in, default 10% recycling rate, adjustable pool allocation (default equal thirds)
- **Frequency:** monthly or quarterly

### 2. Database Schema (4 tables)

```sql
-- Table 1: steward_recycling_commitments
CREATE TABLE steward_recycling_commitments (
  id UUID PRIMARY KEY,
  participant_id UUID REFERENCES participants(id),
  recycling_percentage DECIMAL, -- default 10%
  pool_allocation JSONB, -- {giving: 0.33, saving: 0.33, investing: 0.34}
  active BOOLEAN,
  start_date DATE,
  end_date DATE
);

-- Table 2: capital_pools
CREATE TABLE capital_pools (
  id UUID PRIMARY KEY,
  pool_name TEXT, -- 'giving', 'saving', 'investing'
  current_balance DECIMAL,
  time_horizon TEXT, -- 'immediate', 'medium', 'long-term'
  disbursement_authority TEXT -- 'steward', 'board', 'fsc'
);

-- Table 3: capital_recycling_contributions
CREATE TABLE capital_recycling_contributions (
  id UUID PRIMARY KEY,
  participant_id UUID REFERENCES participants(id),
  contribution_date DATE,
  gross_compensation DECIMAL,
  recycling_percentage DECIMAL,
  total_recycled DECIMAL,
  pool_allocations JSONB -- breakdown by pool
);

-- Table 4: capital_pool_disbursements
CREATE TABLE capital_pool_disbursements (
  id UUID PRIMARY KEY,
  pool_name TEXT,
  disbursement_date DATE,
  amount DECIMAL,
  purpose TEXT,
  approved_by UUID REFERENCES participants(id),
  approval_level TEXT -- 'steward', 'board', 'fsc'
);
```

### 3. Patronage Engine Integration
- Recycled amounts flow as **Capital Patronage** through existing chain-based engine
- Category: `capital`, weight: `0.5x`
- No parallel accounting — integrates with existing patronage system

### 4. Tax Treatment Analysis
- Contributions increase IRC 704(b) book capital account
- No double taxation (recycled amount is contribution, not distribution → re-contribution)
- Attorney review flagged for constructive receipt question

### 5. Governance Authority Matrix

| Pool | Threshold | Authority | Examples |
|------|-----------|-----------|----------|
| Giving | < $500 | Steward discretion | Grants, mutual aid, community support |
| Giving | ≥ $500 | Board approval | Larger donations, institutional support |
| Saving | All | Board approval | Reserves, emergency fund, working capital |
| Investing | All | FSC recommendation → Board approval | Patronage refunds, infrastructure, new ventures |

### 6. Transparency Requirements
- Monthly balances published
- Quarterly reports to members
- Annual inclusion in Public Benefit Report

### 7. UI Components (specified but not implemented)
- Steward dashboard showing contribution options
- Capital pool status displays (current balances, allocation history)
- Contribution commitment interface
- Transparency and reporting views

### 8. Open Questions (flagged for Todd/Board/FSC)
- Exact contribution percentage (10% recommended, adjustable)
- Pool allocation weights (equal thirds vs weighted)
- Voluntary vs cooperative norm
- Interaction with patronage refunds
- Transparency audit requirements

---

## R2/R3 Coverage — What Was Included

### ✓ Covered by R2/R3

**From R2-B (P367 — Capital Book Backend):**
- ✓ `capital_accounts` table (supports underlying capital tracking)
- ✓ `allocation_events` table (tracks patronage allocations including capital contributions)
- ✓ IRC 704(b) book and tax capital account tracking
- ✓ Patronage engine integration via S25 allocation events

**From R2-C (P368 — Member Portal UI):**
- ✓ Capital account dashboard (book + tax balances)
- ✓ Patronage allocation history display
- ✓ Formula display: 40% labor / 30% revenue / 20% capital / 10% community

**From R2-E (P370 — Admin View):**
- ✓ Allocation entry UI (steward/accountant enters quarterly allocations)
- ✓ Member list with capital account balances

**From R3-A (P362 — Sitemap & Auth Scopes):**
- ✓ Auth scopes defined (public, investor, member, admin)
- ✓ RLS policy skeletons for capital_accounts

**Tax treatment grounding:**
- R2 roadmap description explicitly references IRC 704(b) dual-track accounting
- R2-B backfill section includes proration rules for mid-quarter joins
- My R2/R3 review referenced "P319 findings on IRC 704(b) and LCA structure"

### ✗ NOT Covered by R2/R3

**Missing tables:**
- ✗ `steward_recycling_commitments` (opt-in configuration)
- ✗ `capital_pools` (giving/saving/investing pool balances)
- ✗ `capital_recycling_contributions` (contribution history per steward)
- ✗ `capital_pool_disbursements` (transparency audit trail)

**Missing UI components:**
- ✗ Steward contribution dashboard (opt-in interface)
- ✗ Capital pool transparency views (current balances by pool)
- ✗ Contribution commitment configuration
- ✗ Pool disbursement history

**Missing governance integration:**
- ✗ Disbursement authority enforcement (steward vs board vs FSC)
- ✗ Approval workflows for pool disbursements
- ✗ Transparency reporting automation

**Missing patronage engine extension:**
- ✗ Capital recycling contribution categorization
- ✗ 0.5x weight for recycled capital vs direct capital contributions

---

## Gap Analysis — What's Missing

### Gap 1: Capital Pools Infrastructure (Layer 2: State)

**What P319 specified:**
- Three distinct capital pools with separate balances
- Pool-specific disbursement rules and authority levels
- Contribution allocation logic across pools

**What R2 provides:**
- Generic `capital_accounts` table tracking individual participant balances
- No pool-level aggregation or segmentation

**Gap:**
R2 can track that a steward contributed $200, but cannot:
- Split that $200 into $66.67 giving + $66.67 saving + $66.66 investing
- Maintain separate pool balances
- Enforce pool-specific disbursement authority

**Recommendation:**
Add P319 `capital_pools` table to R2-B schema migration. This is an **additive change** (no R2 modifications needed, just extension).

---

### Gap 2: Steward Contribution Opt-In (Layer 6: Constraint)

**What P319 specified:**
- Voluntary opt-in system for stewards
- Configurable recycling percentage (default 10%)
- Configurable pool allocation (default equal thirds)
- Start/end date tracking

**What R2 provides:**
- Admin allocation entry UI (P370) for manual quarterly allocations
- No steward self-service contribution configuration

**Gap:**
A steward (Todd) cannot:
- Navigate to /intranet/contributions/ and opt in to capital recycling
- Set their own recycling percentage
- Adjust pool allocation weights
- View their recycling commitment status

**Recommendation:**
Add steward contribution configuration UI to R2-E (P370) admin view scope, OR propose separate P374 sprint for Capital Recycling UI.

---

### Gap 3: Pool Disbursement Governance (Layer 6: Constraint)

**What P319 specified:**
- Governance authority matrix (steward < $500, board for saving/investing, FSC for investment plan)
- Approval workflows enforced at database level
- Disbursement history with approved_by tracking

**What R2 provides:**
- RLS policies for capital_accounts (members see own, admin sees all)
- No pool-specific disbursement rules

**Gap:**
When Todd wants to disburse $300 from the "giving" pool:
- P319 spec: Allowed (steward discretion < $500)
- R2 implementation: No mechanism exists to record or authorize this

When Board wants to allocate $5K from "investing" pool:
- P319 spec: Requires FSC recommendation → Board approval
- R2 implementation: No workflow, no enforcement

**Recommendation:**
Add `capital_pool_disbursements` table with RLS policies enforcing authority levels. Include approval workflow in R2-E admin view OR defer to P374.

---

### Gap 4: Transparency & Reporting (Layer 7: View)

**What P319 specified:**
- Monthly pool balances published
- Quarterly reports to members
- Annual Public Benefit Report inclusion
- Member-visible transparency views

**What R2 provides:**
- Capital account dashboard (individual balances)
- Patronage history (individual allocations)
- No pool-level transparency

**Gap:**
Members cannot see:
- Current balance of giving/saving/investing pools
- Historical disbursements from each pool
- How much total capital has been recycled by stewards
- Transparency audit trail

**Recommendation:**
Add public-facing transparency view to R2-C (P368) member portal:
- `/intranet/capital-pools/` page showing pool balances and recent disbursements
- Read-only for all members (RLS: all authenticated users can SELECT)

---

### Gap 5: Patronage Engine Integration Detail (Layer 3: Relationship)

**What P319 specified:**
- Recycled amounts categorized as `capital` patronage
- Weight: 0.5x (half-weight compared to direct capital contributions)
- Integration with existing S25 patronage engine

**What R2 provides:**
- R2-B (P367) consumes S25 patronage engine output
- Backfill from S25 allocation events
- No distinction between direct capital vs recycled capital

**Gap:**
When Todd recycles $200/month:
- P319 spec: Should appear in `allocation_events` with category `capital`, weight `0.5x`
- R2 implementation: Could appear as generic allocation, but weighting logic not specified

**Recommendation:**
Extend R2-B `allocation_events` schema to include:
- `contribution_source` field: `direct`, `recycled`, `grant`
- `contribution_weight` field: multiplier for patronage calculations (1.0x direct, 0.5x recycled)

This ensures P319 weighting logic is preserved in R2 capital book.

---

## Recommendations

### Immediate: Propose P374 — Capital Recycling Program Implementation

**Scope:**
1. Extend R2-B schema with P319 tables (4 tables: commitments, pools, contributions, disbursements)
2. Add steward contribution UI to R2-E admin view (opt-in configuration)
3. Add capital pools transparency view to R2-C member portal
4. Integrate recycled contributions into R2-B patronage allocation logic with 0.5x weighting
5. Implement disbursement authority enforcement (RLS policies + approval workflow)

**Dependencies:**
- R2-A (P366) auth foundation must be complete (RLS policies depend on JWT participant_id)
- R2-B (P367) capital book backend must be complete (P374 extends this schema)

**Sequencing:**
```
P366 (R2-A Auth) → P367 (R2-B Capital Book) → P374 (Capital Recycling) → P368 (R2-C Member Portal including pools transparency)
```

**Deliverables:**
- DB migration adding 4 P319 tables
- Edge functions: `/steward-recycling-commit`, `/capital-pool-status`, `/capital-pool-disburse`
- UI: Steward contribution config (admin view), pool transparency (member view)
- Updated patronage allocation logic (0.5x weighting for recycled capital)
- Governance approval workflow for disbursements

**Verification checklist:**
- [ ] Todd can opt in to 10% capital recycling via steward dashboard
- [ ] $200/month recycled from Todd's $2K compensation, split across 3 pools
- [ ] Pool balances visible to all members at /intranet/capital-pools/
- [ ] Steward can disburse < $500 from giving pool without approval
- [ ] Board approval required for saving/investing disbursements
- [ ] Recycled capital appears in allocation_events with 0.5x weight
- [ ] Quarterly transparency report includes pool balances and disbursements

---

### Long-term: Integrate Capital Recycling into R2 Roadmap

**Option A: Add to R2-E (P370) scope**

P370 already includes "Admin view" with allocation entry. Extend scope to include:
- Steward contribution configuration UI
- Capital pool management (view balances, approve disbursements)

**Trade-off:** Increases P370 complexity (currently L complexity → XL)

**Option B: New sprint P374 after P367**

Keep P370 focused on member launch communication.
Add P374 as separate sprint between P367 (capital book) and P368 (member portal UI).

**Trade-off:** Adds 1 sprint to R2 roadmap (5 sprints → 6 sprints)

**Recommendation:** **Option B** — P374 as standalone sprint. Capital Recycling is a distinct feature with governance implications. Keeping it separate allows for focused steward review before deployment.

---

## Verification Against P362 (R3-A Sitemap)

**P362 URL structure:**
- Public: `/`, `/introduction/`, `/formation/`, `/about/`
- Investor: `/data-room/`
- Intranet: `/intranet/`, `/intranet/account/`, `/intranet/patronage/`, `/intranet/documents/`, `/intranet/ventures/` (Class 4)
- Admin: `/intranet/admin/`

**P319 additions needed:**
- `/intranet/capital-pools/` — member-facing transparency view (add to intranet tier)
- `/intranet/admin/steward-recycling/` — steward contribution configuration (add to admin tier)

**P362 compliance:** ✓ P319 fits within existing URL tiers. No sitemap restructure needed.

---

## Summary

**Coverage assessment:**

| P319 Component | R2/R3 Coverage | Gap Severity | Action |
|----------------|----------------|--------------|--------|
| Capital account tracking (book + tax) | ✓ Full (R2-B) | None | Proceed as planned |
| Patronage allocation display | ✓ Full (R2-C) | None | Proceed as planned |
| IRC 704(b) compliance | ✓ Full (R2-B) | None | Proceed as planned |
| Capital pools infrastructure | ✗ Missing | **HIGH** | Add P374 |
| Steward opt-in UI | ✗ Missing | **HIGH** | Add P374 |
| Pool disbursement governance | ✗ Missing | **MEDIUM** | Add P374 |
| Transparency reporting | ✗ Missing | **MEDIUM** | Add P374 |
| Recycled capital weighting (0.5x) | ✗ Missing | **LOW** | Extend P367 schema |

**Overall assessment:** R2/R3 provides the **foundation** (capital accounts, patronage tracking, IRC 704(b) compliance) but does not implement the **Capital Recycling Program** itself.

**Recommended action:** Propose **P374** (Capital Recycling Program Implementation) as a follow-on sprint to R2-B, implementing the 4 missing tables, steward UI, pool transparency, and governance workflows specified in P319.

**Timeline impact:** Adds 1 sprint to R2 roadmap. If P374 is medium complexity, estimate 2-3 days execution after P367 completion.

---

**Gap analysis complete.** P319 Capital Recycling Program specification is sound and thorough, but its implementation is not included in the current R2/R3 roadmap. Recommend P374 to close this gap.
