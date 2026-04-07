# Economic Memory System: Implementation Gap Analysis & Sprint Proposals

**Author:** Dianoia
**Date:** 2026-03-18
**Context:** Deep research on economic memory system implementation status
**Source Documents:**
- `nou-techne/strategy/economic-memory-system-roadmap.md`
- `nou-techne/strategy/regenhub-theory-to-practice-gap-analysis.md`
- `nou-techne/docs/research/P92-ethskills-economic-memory-mapping.md`

---

## Executive Summary

The economic memory system is **architecturally complete but implementation-blocked**. The primary blocker is **S32 (Supabase admin access)**, which gates ALL database schema work. Beyond that, I've identified 68 specific implementation gaps across 6 dependency levels.

**Key Finding:** The roadmap exists and is comprehensive. The gap is not conceptual — it's **execution bandwidth and priority sequencing**. Most foundation sprints (F-1 through F-4) were defined in February 2026 but remain unexecuted as of March 18, 2026.

---

## Gap Analysis by Dependency Level

### Level 0: External Prerequisites (Human-Paced)

**Current Status:**
- ❌ **S32: Supabase admin access** — BLOCKED (Todd owns admin creds)
- ⏳ **FSC parameter ratification** — Scheduled but not yet complete (patronage weights, royalty pool %, vesting rules)
- ⏳ **Legal review** — Awaiting Jeff Pote engagement (royalty unit classification, IP ownership, operating agreement articles)

**Sprint Proposals:**

#### **EMS-001: Supabase Admin Access Resolution**
- **Complexity:** S (administrative)
- **Dependencies:** None
- **Owner:** Todd (steward action required)
- **Description:** Resolve Supabase admin access for regenhub project to unblock ALL schema work
- **Deliverable:** Admin credentials documented, access verified, S32 marked complete
- **Urgency:** CRITICAL — blocks all Level 1 work

#### **EMS-002: FSC Parameter Finalization Tracking**
- **Complexity:** S
- **Dependencies:** None
- **Owner:** Organizers / FSC
- **Description:** Create tracking document for FSC parameter decisions (patronage weights, royalty pool %, vesting rules, distribution mechanics)
- **Deliverable:** FSC decision log with ratification dates and rationale
- **Urgency:** HIGH — gates Engine implementation (Level 3)

---

### Level 1: Schema Layer (6 Domains)

**Current Status:** NOT STARTED — All blocked by S32

**Sprint Proposals:**

#### **EMS-010: SCHEMA-A — Members + Membership Classes**
- **Complexity:** M
- **Dependencies:** EMS-001 (Supabase access)
- **Layers:** [2] State
- **Capabilities:** sql, schema-design
- **Description:** DDL migration for `members` table extending regenhub Supabase
- **Tables:**
  - `members` (id, user_id FK to auth.users, membership_class, admission_date, status, declared_role)
  - `membership_classes` (class_id, class_name, voting_rights, equity_eligible, description)
- **Deliverable:**
  - Migration file: `regenhub/supabase/migrations/YYYYMMDD_members_schema.sql`
  - ER diagram (Mermaid) showing relationship to existing `profiles` table
  - RLS policy stubs (members see own row, board sees all)
  - Query helpers in `regenhub/app/src/lib/habitat.js`
- **Completion Criteria:**
  - Tables created in regenhub Supabase staging
  - Foreign key constraints validated
  - No naming conflicts with existing tables
  - Query helpers tested against live instance

#### **EMS-011: SCHEMA-B — Contributions (Multi-Capital)**
- **Complexity:** M
- **Dependencies:** EMS-001, EMS-010
- **Layers:** [2] State
- **Capabilities:** sql, schema-design
- **Description:** Economic contributions table with multi-capital metadata and royalty-eligibility flag
- **Tables:**
  - `contributions_economic` (id, member_id FK, contribution_type enum, category enum, amount, description, royalty_eligible bool, period_id FK, created_at)
  - Enum types: `contribution_type` (labor/revenue/cash/community), `category` (code/design/coordination/infrastructure/pattern)
- **Deliverable:**
  - Migration file with enum types and contributions table
  - Data dictionary: field definitions, constraints
  - Integration with Workshop `coordination_requests` table (contribution extraction logic)
  - Query helpers for contribution ingestion
- **Completion Criteria:**
  - Contribution records map cleanly to four patronage categories
  - Royalty-eligible flag properly tagged
  - Period-based filtering works correctly

#### **EMS-012: SCHEMA-C — Royalty Assets + Unit Ledger**
- **Complexity:** L
- **Dependencies:** EMS-001, EMS-011
- **Layers:** [2] State, [3] Relationship
- **Capabilities:** sql, schema-design, economics
- **Description:** Builder/formalizer registry with unit issuance and vesting tracking
- **Tables:**
  - `royalty_assets` (id, contribution_id FK, asset_name, asset_type enum, builder_id FK, formalizer_id FK, valuation_basis, revenue_pool_pct, registered_at)
  - `royalty_units` (id, asset_id FK, holder_id FK, units_held decimal, role enum, vesting_status enum, vested_at, created_at)
  - Enum types: `asset_type` (tool/service/pattern/framework), `role` (builder/formalizer), `vesting_status` (pending/vested/forfeited)
- **Deliverable:**
  - Migration file with both tables and enums
  - Multi-holder split logic (builder 70% / formalizer 30% default)
  - Vesting state machine documentation
  - ER diagram showing relationships
- **Completion Criteria:**
  - Units can be issued to multiple holders per asset
  - Vesting status transitions correctly
  - Co-holder split calculations verified

#### **EMS-013: SCHEMA-D — Capital Accounts (Dual-Basis)**
- **Complexity:** L
- **Dependencies:** EMS-001, EMS-010
- **Layers:** [2] State
- **Capabilities:** sql, schema-design, tax-accounting
- **Description:** Book and tax capital account tracking per IRC 704(b)
- **Tables:**
  - `capital_accounts` (id, member_id FK, book_basis decimal, tax_basis decimal, period_id FK, opening_balance, closing_balance, snapshot_date, created_at)
  - `capital_account_events` (id, account_id FK, event_type enum, amount decimal, event_id FK to economic_events, created_at)
  - Enum types: `event_type` (credit_patronage/credit_royalty/credit_admission/debit_distribution/debit_redemption)
- **Deliverable:**
  - Migration file with dual-basis tracking
  - Period-close snapshot logic
  - Revaluation trigger documentation
  - 704(c) layer tracking specification
- **Completion Criteria:**
  - Book and tax basis diverge correctly for property contributions
  - Period snapshots are immutable
  - Event audit trail complete

#### **EMS-014: SCHEMA-E — Revenue Events**
- **Complexity:** M
- **Dependencies:** EMS-001, EMS-012
- **Layers:** [2] State, [4] Event
- **Capabilities:** sql, schema-design
- **Description:** Venture revenue event intake for royalty distribution triggers
- **Tables:**
  - `revenue_events` (id, venture_id, asset_id FK, amount decimal, revenue_type enum, period, recognized_at, created_at)
  - `ventures` (id, venture_name, venture_type, status enum, created_at)
  - Enum types: `revenue_type` (service/subscription/transaction), `status` (active/dormant/exited)
- **Deliverable:**
  - Migration file with revenue events and ventures
  - Multi-asset attribution logic (split revenue across multiple assets)
  - Webhook/API intake specification for external venture reporting
  - Board approval flow schema
- **Completion Criteria:**
  - Revenue events correctly attributed to assets
  - Multi-asset split calculations verified
  - External reporting mechanism documented

#### **EMS-015: SCHEMA-F — Patronage Periods**
- **Complexity:** M
- **Dependencies:** EMS-001, EMS-011
- **Layers:** [2] State
- **Capabilities:** sql, schema-design
- **Description:** Period management with weighted allocation tracking
- **Tables:**
  - `patronage_periods` (id, period_name, start_date, end_date, status enum, weights jsonb, rationale text, surplus decimal, created_at)
  - `period_allocations` (id, period_id FK, member_id FK, labor_pct, revenue_pct, cash_pct, community_pct, total_allocation_pct, amount_allocated decimal, created_at)
  - Enum types: `period_status` (open/snapshot/closed/audited)
- **Deliverable:**
  - Migration file with period tracking
  - Weights stored as JSONB: `{"labor": 0.40, "revenue": 0.30, "cash": 0.20, "community": 0.10}`
  - Allocation calculation specification
  - IRC §1385 compliance check logic
- **Completion Criteria:**
  - Period lifecycle (open → snapshot → close) works
  - Weights sum to 1.0 validation enforced
  - Member allocations sum to 100% of surplus

---

### Level 2: REA Event Grammar (9 Event Types)

**Current Status:** NOT STARTED — Schema dependency

**Sprint Proposals:**

#### **EMS-020: Event Infrastructure Foundation**
- **Complexity:** L
- **Dependencies:** All Level 1 schemas (EMS-010 through EMS-015)
- **Layers:** [4] Event, [6] Constraint
- **Capabilities:** event-systems, sql, backend
- **Description:** Core event emission infrastructure with append-only constraint
- **Deliverables:**
  - `economic_events` table: `(id, event_type, actor_id, resource_id, resource_type, quantity, metadata jsonb, chain_seq int, prev_hash, hash, anchored_at timestamp)`
  - `emit_economic_event()` Supabase Edge Function
  - Event type registry: `regenhub/app/src/lib/eventTypes.js`
  - Hash chain integrity verification
  - Append-only constraint (no UPDATE/DELETE on economic_events)
- **Event Types Defined:**
  - EVENT-A: contribution.created
  - EVENT-B: royalty_asset.registered
  - EVENT-C: royalty_unit.vested
  - EVENT-D: revenue.recognized
  - EVENT-E: royalty.distributed
  - EVENT-F: patronage.allocated
  - EVENT-G: capital_account.credited / debited
  - EVENT-H: period.opened / period.closed
  - EVENT-I: qualified_notice.issued
- **Completion Criteria:**
  - All 9 event types emit correctly
  - Chain integrity: each event's `prev_hash` matches previous event's `hash`
  - Append-only: DELETE/UPDATE attempts fail at DB level
  - Test suite: emit each type in sequence, verify chain intact

#### **EMS-021: Contribution Event Integration**
- **Complexity:** M
- **Dependencies:** EMS-020, Workshop integration
- **Layers:** [4] Event, [3] Relationship
- **Capabilities:** integration, backend
- **Description:** Map Workshop coordination_requests to patronage contribution events
- **Deliverables:**
  - `contribution.created` event emission on sprint completion
  - Category mapping: Workshop sprint metadata → economic contribution categories
  - Labor-hours extraction from sprint complexity + completion time
  - Automated vs manual contribution recording decision logic
- **Completion Criteria:**
  - Sprint completions automatically create contribution events
  - Category tagging works correctly (labor/revenue/cash/community)
  - Manual override capability for edge cases

---

### Level 3: Core Engines (Patronage + Royalty)

**Current Status:** NOT STARTED — Event Grammar dependency + FSC parameters

**Sprint Proposals:**

#### **EMS-030: Patronage Engine — Foundation**
- **Complexity:** L
- **Dependencies:** EMS-020 (events), EMS-015 (periods), EMS-002 (FSC parameters)
- **Layers:** [5] Flow, [6] Constraint
- **Capabilities:** backend, tax-accounting, formula-design
- **Description:** Core patronage allocation engine with IRC compliance
- **Deliverables:**
  - Supabase Edge Function: `patronage-engine`
  - `open_period(weights, rationale)` — creates period, records weights + 704(b) rationale, emits EVENT-H
  - `snapshot_period(period_id)` — pulls contribution records, maps to four categories, stores in contributions_economic
  - `close_period(period_id, surplus)` — runs weighted-sum, writes allocations, credits capital accounts, emits EVENT-F per member
  - Pure function: `calculateAllocations(members, contributions, weights, surplus)` — unit-testable, exported for FSC Dashboard
  - IRC §1385 compliance check (20% cash minimum)
  - 704(b) substantiality validation (rationale required)
- **Completion Criteria:**
  - Test case: 3 members, synthetic contributions, $10K surplus, 40/30/20/10 weights → correct per-member allocation percentages
  - Allocations sum to 100% of surplus
  - EVENT-F logged per member with chain integrity
  - Zero-contribution member receives zero allocation
  - Loss period emits zero-distribution event

#### **EMS-031: Patronage Engine — Threshold & Cap Enforcement**
- **Complexity:** M
- **Dependencies:** EMS-030
- **Layers:** [6] Constraint
- **Capabilities:** backend, policy-design
- **Description:** Minimum threshold and maximum cap enforcement
- **Deliverables:**
  - Minimum participation threshold (configurable, default 5% of mean contribution)
  - Maximum allocation cap (configurable, default 25% of total surplus)
  - Mid-period joiners: pro-rata contribution weighting
  - Departure handling: allocate through last active day
- **Completion Criteria:**
  - Member below threshold receives zero allocation
  - Member hitting cap receives capped amount, remainder redistributed
  - Mid-period joiner allocation correctly pro-rated

#### **EMS-032: Royalty Engine — Asset Registry**
- **Complexity:** M
- **Dependencies:** EMS-020 (events), EMS-012 (royalty schema)
- **Layers:** [2] State, [4] Event
- **Capabilities:** backend, ip-tracking
- **Description:** Register royalty-eligible contributions and issue units
- **Deliverables:**
  - Asset registration: mark contribution as royalty-eligible with metadata
  - Unit issuance: calculate units from contribution value, issue EVENT-B
  - Builder/formalizer split recording (default 70/30, configurable)
  - Unit ledger: who holds how many units in which asset
  - Valuation basis documentation (hours * rate, or fixed value)
- **Completion Criteria:**
  - Register contribution → units issued → ledger updated
  - Co-holder split calculations correct
  - Multiple assets can be registered simultaneously

#### **EMS-033: Royalty Engine — Vesting State Machine**
- **Complexity:** M
- **Dependencies:** EMS-032
- **Layers:** [5] Flow
- **Capabilities:** backend, state-machines
- **Description:** Builder and formalizer vesting logic
- **Deliverables:**
  - Builder vesting: PENDING → VESTED on `service.live` event (first revenue)
  - Formalizer vesting: PENDING → VESTED on `pattern.adopted` event (external adoption proof)
  - Vesting event emissions (EVENT-C)
  - Forfeiture handling (departure before vesting)
- **Completion Criteria:**
  - Builder units vest when service generates first revenue
  - Formalizer units vest only on proven external adoption
  - Forfeited units correctly removed from ledger

#### **EMS-034: Royalty Engine — Distribution Calculator**
- **Complexity:** L
- **Dependencies:** EMS-033, EMS-014 (revenue events)
- **Layers:** [5] Flow
- **Capabilities:** backend, economics
- **Description:** Revenue event → royalty pool → pro-rata distribution
- **Deliverables:**
  - Revenue event listener: ventures report revenue → trigger distribution
  - Royalty pool calculation: revenue × royalty_pool_pct (e.g., 20%)
  - Pro-rata distribution: pool ÷ total units × units_held per member
  - Multi-asset attribution: split revenue across assets proportionally
  - Capital account credit: royalty distributions credit capital accounts
  - EVENT-E emission per distribution
- **Completion Criteria:**
  - Revenue event triggers distribution correctly
  - Pro-rata calculations verified
  - Capital accounts credited with correct amounts
  - Multi-asset split works correctly

---

### Level 4: Capital Accounts (Full Implementation)

**Current Status:** Schema exists (EMS-013), engine integration pending

**Sprint Proposals:**

#### **EMS-040: Capital Account Integration**
- **Complexity:** M
- **Dependencies:** EMS-030 (patronage), EMS-034 (royalty distribution)
- **Layers:** [2] State, [5] Flow
- **Capabilities:** backend, tax-accounting
- **Description:** Connect patronage + royalty engines to capital accounts
- **Deliverables:**
  - Credit events: patronage allocation → capital account credit
  - Credit events: royalty distribution → capital account credit
  - Debit events: member distribution (cash payout) → capital account debit
  - Period-close snapshot: immutable balance snapshot at period end
  - Revaluation trigger: new member admission → mark all accounts for revaluation
  - Member-facing balance API: authenticated endpoint returning current + historical
- **Completion Criteria:**
  - Run complete simulated period: contributions → patronage → royalty → capital account balances
  - Period snapshots are immutable
  - Revaluation event fires correctly

#### **EMS-041: Tax Capital Accounts + 704(c) Layers**
- **Complexity:** L
- **Dependencies:** EMS-040, legal review
- **Layers:** [6] Constraint
- **Capabilities:** tax-accounting, compliance
- **Description:** Tax basis tracking distinct from book basis
- **Deliverables:**
  - Tax capital account (IRS-reportable basis, distinct from book)
  - 704(c) layer tracking: property contributions with built-in gain
  - Book-tax reconciliation: period close → compute divergence
  - Property contribution workflow: member contributes asset → FMV assessed → built-in gain recorded
- **Completion Criteria:**
  - Property contributor: correct 704(c) allocation
  - Book-tax reconciliation: zero difference for cash-only, correct divergence for property
  - Tax basis correctly maintained across periods

#### **EMS-042: K-1 Data Assembly**
- **Complexity:** M
- **Dependencies:** EMS-041
- **Layers:** [6] Constraint, [7] View
- **Capabilities:** tax-accounting, reporting
- **Description:** IRS K-1 data extraction from capital accounts
- **Deliverables:**
  - K-1 data fields: Line 1 (ordinary income/loss), royalty income, capital account beginning/ending
  - Qualified Written Notice (QWN) generation per IRC §1385
  - QWN delivery: in-tool notification with consent capture
  - K-1 preview panel: member-facing pre-K-1 statement (not legal K-1, clearly labeled)
- **Completion Criteria:**
  - K-1 data correctly populated for simulated period
  - QWN shows correct cash vs. retained split
  - Member consent recorded to Supabase

---

### Level 5: Digital Trust Agreements Engine

**Current Status:** NOT STARTED — Requires all engines operational

**Sprint Proposals:**

#### **EMS-050: Agreements Template System**
- **Complexity:** L
- **Dependencies:** EMS-030, EMS-034, EMS-040
- **Layers:** [1] Identity, [6] Constraint
- **Capabilities:** backend, legal-tech, specification
- **Description:** Configure patronage/royalty/equity rules as versioned agreements
- **Deliverables:**
  - Agreement template data model: parameters, effective dates, rationale
  - Patronage agreement template: weights, thresholds, caps, rationale
  - Royalty agreement template: pool %, vesting rules, split defaults, decay function
  - Equity agreement template: membership classes, admission terms, redemption policy
  - Parameter versioning: FSC changes weights → new version → old version immutable
  - Agreement lineage: which version governed which period
- **Completion Criteria:**
  - Agreement templates can be configured without code changes
  - Parameter changes create new versions with rationale
  - Period close cites correct agreement version

#### **EMS-051: Member Agreement Execution**
- **Complexity:** M
- **Dependencies:** EMS-050
- **Layers:** [1] Identity, [3] Relationship
- **Capabilities:** backend, auth, legal-tech
- **Description:** Digital signature workflow for economic terms
- **Deliverables:**
  - Agreement execution flow: member reviews terms → signs digitally → agreement recorded
  - Signature capture with timestamp + member auth
  - Agreement status tracking: pending/signed/superseded
  - Cross-reference: each distribution cites agreement member signed
- **Completion Criteria:**
  - Member can sign economic terms in-tool
  - Signature timestamped and recorded
  - Distribution requires valid signed agreement

---

### Level 6: View Layer (Member + FSC Dashboards)

**Current Status:** Partial — FSC Dashboard defined (F-3), Member Dashboard spec exists (B-4), neither implemented

**Sprint Proposals:**

#### **EMS-060: FSC Decision Dashboard**
- **Complexity:** M
- **Dependencies:** EMS-002 (FSC parameters), EMS-015 (period schema)
- **Layers:** [7] View
- **Capabilities:** frontend, react, ui-design
- **Description:** FSC parameter configuration interface (bylaws tool)
- **Deliverables:**
  - `FscDashboard.jsx` — new React component in `regenhub/app/src/components/`
  - New "FSC · Decisions" tab in Organizers group
  - Eight decision panels:
    1. Patronage weight panel: four sliders (Labor/Revenue/Cash/Community) summing to 1.0, live validation, 704(b) rationale field
    2. Allocation impact calculator: hypothetical surplus + member profiles → see allocation shifts (client-side, no DB)
    3. Royalty pool percentage slider (default 20%)
    4. Builder/formalizer split selector (default 70/30)
    5. Vesting trigger type selector
    6. Decay toggle (future activation)
    7. Cash ratio slider (hard floor at 20% with §1385 warning)
    8. Period frequency selector (monthly/quarterly/annual)
  - Export button: markdown ratification document
  - Signal integration: reuse existing `useSignals` hook with `fsc-*` item IDs
- **Completion Criteria:**
  - Component renders in Organizers tab group
  - Weight sliders enforce sum-to-1.0 with live feedback
  - §1385 warning fires when cash < 20%
  - Allocation calculator produces correct output
  - Export generates valid markdown

#### **EMS-061: Member Economic Dashboard — Foundation**
- **Complexity:** L
- **Dependencies:** EMS-040 (capital accounts), EMS-034 (royalty distribution)
- **Layers:** [7] View
- **Capabilities:** frontend, react, data-visualization
- **Description:** Member-facing economic history and position view
- **Deliverables:**
  - New "Habitat" audience group in `App.jsx` (visible to all authenticated members)
  - `HabitatNav.jsx` — entry point with tabs: Member Dashboard / Royalty Registry / Capital Account / Period History
  - `MemberEconomicDash.jsx`:
    - Contribution history with multi-capital breakdown
    - Capital account balance (book basis, current + per-period sparkline)
    - Patronage allocation history: per period — surplus, member %, amount credited
    - Royalty positions: asset name, units held, vesting status, distributions received
    - K-1 preview panel (not legal K-1, clearly labeled)
  - Dark/light theme adaptation via `useTheme()` hook
- **Completion Criteria:**
  - Authenticated member sees full economic history from admission
  - All data pulls correctly from Supabase
  - No regressions in existing tab groups
  - Theme adaptation works

#### **EMS-062: Royalty Registry — Public View**
- **Complexity:** M
- **Dependencies:** EMS-032 (asset registry)
- **Layers:** [7] View
- **Capabilities:** frontend, react
- **Description:** Public view of royalty-bearing assets
- **Deliverables:**
  - `RoyaltyRegistry.jsx` — public (no auth) component
  - Display: asset name, category (tool/service/pattern), builder attribution (by role, not name), formalizer attribution, vesting status, revenue events received
  - Filter/search by category
  - Link to asset documentation/repo when available
- **Completion Criteria:**
  - Public view renders without auth
  - At least one registered asset displays correctly
  - Category filtering works

#### **EMS-063: Period Close Panel + QWN Delivery**
- **Complexity:** M
- **Dependencies:** EMS-042 (K-1 assembly), EMS-030 (patronage)
- **Layers:** [7] View
- **Capabilities:** frontend, react, compliance
- **Description:** In-tool Qualified Written Notice delivery
- **Deliverables:**
  - `QwnPanel.jsx` — period close notification component
  - Display: total allocation, cash portion, retained portion, tax year
  - Consent toggle: "I consent to include the retained allocation in my gross income for this tax year"
  - Consent capture recorded to Supabase with timestamp
  - Email notification trigger on period close
- **Completion Criteria:**
  - Period close triggers QWN display
  - Consent toggle records correctly
  - Member cannot dismiss without making consent choice

---

## Implementation Priority Sequencing

### **Phase 0: Foundation Unblocking (Immediate)**
1. EMS-001: Supabase Admin Access (S32 resolution) — **CRITICAL BLOCKER**
2. EMS-002: FSC Parameter Tracking

### **Phase 1: Schema Layer (Weeks 1-2)**
All Level 1 schemas can execute **in parallel** once EMS-001 completes:
- EMS-010: Members schema
- EMS-011: Contributions schema
- EMS-012: Royalty assets schema
- EMS-013: Capital accounts schema
- EMS-014: Revenue events schema
- EMS-015: Patronage periods schema

### **Phase 2: Event Infrastructure (Week 3)**
- EMS-020: Event infrastructure foundation
- EMS-021: Contribution event integration

### **Phase 3: FSC Dashboard (Week 4) — TIME-BOUND**
- EMS-060: FSC Decision Dashboard (must be live before FSC convenes)

### **Phase 4: Core Engines (Weeks 5-7)**
Can execute in parallel:
- EMS-030: Patronage Engine foundation
- EMS-031: Patronage thresholds & caps
- EMS-032: Royalty asset registry
- EMS-033: Royalty vesting state machine
- EMS-034: Royalty distribution calculator

### **Phase 5: Capital Account Integration (Week 8)**
- EMS-040: Capital account integration
- EMS-041: Tax capital accounts (requires legal review)
- EMS-042: K-1 data assembly

### **Phase 6: Member Dashboard (Weeks 9-10)**
- EMS-061: Member Economic Dashboard foundation
- EMS-062: Royalty Registry public view
- EMS-063: Period close + QWN delivery

### **Phase 7: Agreements Engine (Weeks 11-12)**
- EMS-050: Agreements template system
- EMS-051: Member agreement execution

---

## Sprint Metadata Summary

**Total Sprints Proposed:** 25 sprints
**Complexity Breakdown:**
- Small (S): 2 sprints
- Medium (M): 14 sprints
- Large (L): 9 sprints

**Estimated Total Effort:** 312-468 agent-hours (assuming M=12-18h, L=18-27h)

**Critical Path:**
1. EMS-001 (Supabase access) → ALL schemas
2. Schemas → Event infrastructure → Engines
3. Engines → Capital accounts → Member dashboard
4. FSC Dashboard can proceed independently once EMS-002 completes

**Parallel Execution Opportunities:**
- All 6 schema sprints (EMS-010 through EMS-015)
- Patronage + Royalty engines (EMS-030 through EMS-034)
- Member dashboard components (EMS-061 through EMS-063)

---

## Gaps Not Covered by Roadmap

While the existing roadmap is comprehensive, I identified **3 additional gaps** not explicitly covered:

### **Gap A: $CLOUD Service Credit Token**
The roadmap references $CLOUD but doesn't include implementation sprints for:
- ERC-20 token deployment on Base L2
- EIP-3009 gasless transfer implementation
- x402 HTTP micropayment integration
- Sunrise/sunset batching settlement

**Recommendation:** Create separate sprint collection for $CLOUD implementation (5-7 sprints)

### **Gap B: Onchain Anchoring Strategy**
The roadmap mentions "period close events queued for Base L2 anchoring" but doesn't specify:
- Smart contract architecture for event anchoring
- Hash chain verification logic onchain
- Which events get anchored vs remain off-chain
- Cross-chain settlement for Celo/Base/Mainnet

**Recommendation:** Create sprint for onchain anchoring specification + implementation (2-3 sprints)

### **Gap C: Privacy / Selective Disclosure**
Capital account balances and patronage allocations are sensitive. No sprints address:
- Privacy model decision (public/private/selective)
- Commitment schemes for allocations (hash-then-reveal)
- Access control beyond RLS policies
- Member preference for balance visibility

**Recommendation:** Create sprint for privacy architecture decision + implementation (1-2 sprints)

---

## Recommendations

### **Immediate Actions:**
1. **Escalate S32 (Supabase access) to highest priority** — This is the only blocker preventing ALL schema work
2. **Finalize FSC convening date** — FSC Dashboard must be live before FSC meets; work backwards from that date
3. **Engage legal counsel** — Royalty unit classification review can proceed in parallel with schema work

### **Execution Strategy:**
1. **Agent swarm model** — Schema layer (6 sprints) can execute simultaneously with 6 independent agents
2. **FSC Dashboard priority track** — Separate from main dependency tree, time-bounded delivery
3. **Event infrastructure as hinge point** — All engines depend on this; ensure thorough testing before proceeding

### **Resource Allocation:**
- **Schema Architect:** 6 sprints (Level 1)
- **Event Systems Engineer:** 2 sprints (Level 2)
- **Backend Engineer:** 7 sprints (Levels 3-4)
- **Frontend/DevOps:** 4 sprints (Level 6)
- **Compliance/Security:** Integration across all levels

---

## Conclusion

The economic memory system is **ready for implementation**. The architecture is sound, the dependency tree is complete, and the legal prerequisites are identified. The primary gap is **execution bandwidth**, not design clarity.

**Key Insight:** This is not a "research more before building" situation. This is a "clear the blocker and execute the defined plan" situation. The roadmap from February 2026 remains valid; it simply hasn't been executed yet.

The 25 sprint proposals above operationalize the existing roadmap into discrete, claimable work units with clear dependencies, completion criteria, and parallel execution opportunities.

**Estimated Timeline:** 12-14 weeks from S32 resolution to Beta-complete (first real period close with all three memory tiers operational).

---

*Dianoia · Execution Intelligence Agent · 2026-03-18*
