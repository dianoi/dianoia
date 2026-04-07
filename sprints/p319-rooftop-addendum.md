# P319 Gap Analysis — Rooftop Conversation Addendum

**Date:** 2026-04-07  
**Author:** Dianoia  
**Source:** RegenHub Rooftop conversation (Todd + Cameron, April 6, 2026)  
**Context:** Extending P319 gap analysis with layered economic memory insights

---

## Executive Summary

The rooftop conversation reveals that P319 (Capital Recycling Program) is **one layer** of a **four-layer economic memory architecture**. The current gap analysis correctly identified that R2/R3 provides foundation but not P319-specific implementation. This addendum extends that finding:

**P319 is Layer 1 (Patronage)** in a broader system that includes:
- **Layer 0:** Labor (FMV tracking, contribution accounting)
- **Layer 1:** Patronage (P319 three-pool model)
- **Layer 2:** Equity (venture positions, vesting)
- **Layer 3:** Royalties (IP licensing, term-based)

The rooftop conversation positioned the **three-pool model** ("giving together, saving together, investing together") as **core LCA identity** — not just a treasury feature, but **three ways of relating** as members.

---

## Key Rooftop Insights Mapped to P319

### 1. Three Pools = "Three Ways of Relating"

**Rooftop insight:**
> "The three pools aren't just treasury buckets — they're three ways of relating as members. Giving together (mutual aid, immediate), saving together (rainy day, medium-term), investing together (ventures, long-term)."

**P319 gap implication:**
- Current P319 spec treats pools as **financial constructs only**
- Missing: **member-facing narrative** about what each pool *means* relationally
- Missing: UI/UX that frames pool participation as **identity expression**, not just allocation decisions

**Design recommendation:**
- Pool allocation UI should ask: "How do you want to relate?" not "How do you want to allocate?"
- Each pool needs **ritual** and **story** (e.g., giving pool = "soup kitchen pattern," saving pool = "rainy day fund tradition")

---

### 2. Layered Economic Memory (Four Layers)

**Rooftop insight:**
> "There's labor (Layer 0 — what you did, FMV vs actual pay), patronage (Layer 1 — three pools), equity (Layer 2 — venture positions), and royalties (Layer 3 — IP you created). Each has a different time horizon."

**P319 gap implication:**
- P319 only addresses **Layer 1 (Patronage)**
- Layers 0, 2, 3 are **not in scope** for P319 but **must integrate** with patronage layer
- Missing: **Inter-layer coordination schema** (how does labor contribution delta affect patronage pool eligibility? How do venture equity positions interact with patronage allocations?)

**Schema extension needed:**

```sql
-- Layer 0: Labor FMV tracking
CREATE TABLE labor_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) NOT NULL,
  role TEXT NOT NULL,
  hours DECIMAL NOT NULL,
  fair_market_value DECIMAL NOT NULL,  -- BLS-anchored external rate
  actual_compensation DECIMAL NOT NULL,
  contribution_delta DECIMAL GENERATED ALWAYS AS (fair_market_value - actual_compensation) STORED,
  contribution_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Layer 2: Venture equity
CREATE TABLE venture_equity_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) NOT NULL,
  venture_id UUID NOT NULL,  -- Reference to ventures table (not in P319)
  equity_percentage DECIMAL NOT NULL,
  vesting_schedule JSONB NOT NULL,  -- {cliff_months, total_months, accrual_basis}
  granted_at TIMESTAMPTZ NOT NULL,
  accrual_to_date DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Layer 3: Royalties
CREATE TABLE royalty_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) NOT NULL,
  work_id UUID NOT NULL,  -- Reference to intellectual property registry
  royalty_percentage DECIMAL NOT NULL,
  term_years INTEGER NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ GENERATED ALWAYS AS (granted_at + (term_years || ' years')::INTERVAL) STORED,
  accrual_to_date DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inter-layer coordination
CREATE TABLE economic_memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) NOT NULL,
  layer INTEGER NOT NULL CHECK (layer IN (0, 1, 2, 3)),  -- 0=Labor, 1=Patronage, 2=Equity, 3=Royalty
  event_type TEXT NOT NULL,  -- 'contribution', 'allocation', 'vesting', 'accrual'
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,  -- 'USD', 'equity_units', 'royalty_points'
  recorded_at TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 3. Multi-Book Accounting (Regulatory vs Design)

**Rooftop insight:**
> "We need multi-book accounting. IRC 704(b) requires one book (tax capital accounts). But members need to see their labor FMV ledger, their patronage allocations, their dividend book, their contribution book. These are separate views of the same economic relationship."

**P319 gap implication:**
- P319 assumes **single ledger** for capital accounts
- Missing: **Book enumeration** (which books exist? what does each track?)
- Missing: **Book reconciliation logic** (how do books relate? when do they converge/diverge?)

**Design pattern:**

```sql
-- Book registry
CREATE TABLE accounting_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_name TEXT UNIQUE NOT NULL,  -- 'tax_capital', 'labor_fmv', 'patronage_allocation', 'dividend', 'contribution'
  book_type TEXT NOT NULL,  -- 'regulatory', 'member_facing', 'internal'
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Entries are posted to specific books
CREATE TABLE capital_account_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) NOT NULL,
  book_id UUID REFERENCES accounting_books(id) NOT NULL,
  entry_type TEXT NOT NULL,  -- 'contribution', 'allocation', 'distribution', 'adjustment'
  amount DECIMAL NOT NULL,
  balance_after DECIMAL NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL,
  description TEXT,
  source_event_id UUID,  -- References economic_memory_events
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Book reconciliation rules
CREATE TABLE book_reconciliation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_book_id UUID REFERENCES accounting_books(id) NOT NULL,
  target_book_id UUID REFERENCES accounting_books(id) NOT NULL,
  reconciliation_frequency TEXT NOT NULL,  -- 'realtime', 'monthly', 'annual'
  reconciliation_formula TEXT NOT NULL,  -- How source maps to target
  last_reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 4. Three-Pool Treasury Architecture (Temporal Framing)

**Rooftop insight:**
> "Each pool has a time horizon. Giving = immediate (this month's mutual aid). Saving = medium-term (6-18 months rainy day). Investing = long-term (3-7 year venture bets)."

**P319 gap implication:**
- P319 spec defines pools but **not time horizons**
- Missing: **Disbursement velocity constraints** (giving pool should disburse fast, investing pool slow)
- Missing: **Pool health metrics** tied to time horizon (e.g., "saving pool should cover 12 months runway")

**Schema extension:**

```sql
-- Extend capital_pools with temporal metadata
ALTER TABLE capital_pools ADD COLUMN time_horizon_months INTEGER NOT NULL;
ALTER TABLE capital_pools ADD COLUMN target_coverage_months INTEGER;  -- For saving pool
ALTER TABLE capital_pools ADD COLUMN max_disbursement_per_period DECIMAL;  -- Velocity limit
ALTER TABLE capital_pools ADD COLUMN disbursement_period_days INTEGER DEFAULT 30;

-- Pool health tracking
CREATE TABLE pool_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES capital_pools(id) NOT NULL,
  metric_date DATE NOT NULL,
  current_balance DECIMAL NOT NULL,
  target_balance DECIMAL,  -- Based on time horizon and runway needs
  health_score DECIMAL CHECK (health_score BETWEEN 0 AND 100),
  months_runway DECIMAL,  -- For saving pool
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pool_id, metric_date)
);
```

---

### 5. BLS-Anchored Labor FMV (External Anchor)

**Rooftop insight:**
> "Labor FMV comes from Bureau of Labor Statistics. We're not making up rates — we're using external anchors. That's what makes the contribution delta meaningful."

**P319 gap implication:**
- Labor layer (Layer 0) is **prerequisite** for patronage layer (Layer 1)
- P319 assumes patronage allocations but doesn't specify **where contributions come from**
- Missing: **BLS rate lookup table** and **role-to-BLS-code mapping**

**Schema extension:**

```sql
-- BLS rate registry
CREATE TABLE bls_occupation_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_code TEXT UNIQUE NOT NULL,  -- Standard Occupational Classification code
  occupation_title TEXT NOT NULL,
  hourly_rate_median DECIMAL NOT NULL,
  hourly_rate_mean DECIMAL NOT NULL,
  annual_wage_median DECIMAL NOT NULL,
  annual_wage_mean DECIMAL NOT NULL,
  data_year INTEGER NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(soc_code, data_year)
);

-- Role to BLS mapping
CREATE TABLE role_bls_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT UNIQUE NOT NULL,
  soc_code TEXT REFERENCES bls_occupation_rates(soc_code) NOT NULL,
  adjustment_factor DECIMAL DEFAULT 1.0,  -- For regional/experience adjustments
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 6. Transferability Per Economic Unit Type

**Rooftop insight:**
> "Different economic units have different transferability. Labor contributions aren't transferable. Patronage allocations might vest before transfer. Equity has transfer restrictions. Royalties might be freely assignable."

**P319 gap implication:**
- P319 doesn't address **transfer rules** for patronage allocations
- Missing: **Vesting schedules** (do patronage allocations vest? over what period?)
- Missing: **Transfer restrictions** (can you transfer unvested allocations? to whom?)

**Schema extension:**

```sql
-- Economic unit transferability rules
CREATE TABLE economic_unit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_type TEXT UNIQUE NOT NULL,  -- 'labor_contribution', 'patronage_allocation', 'equity', 'royalty'
  layer INTEGER NOT NULL CHECK (layer IN (0, 1, 2, 3)),
  is_transferable BOOLEAN NOT NULL DEFAULT false,
  requires_vesting BOOLEAN NOT NULL DEFAULT false,
  default_vesting_months INTEGER,
  transfer_restrictions TEXT,  -- 'none', 'members_only', 'board_approval_required'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vesting schedules
CREATE TABLE vesting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) NOT NULL,
  economic_unit_type TEXT REFERENCES economic_unit_types(unit_type) NOT NULL,
  total_amount DECIMAL NOT NULL,
  vested_amount DECIMAL DEFAULT 0,
  vesting_start_date DATE NOT NULL,
  vesting_cliff_months INTEGER DEFAULT 0,
  vesting_total_months INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 7. Rings/Flow Funding = Mutual Aid Layer

**Rooftop insight:**
> "The 'rings' pattern (flow funding, mutual aid) is orthogonal to the capital stack. It's a different game — gift economy, needs-based, monthly cycle. It sits alongside patronage, not inside it."

**P319 gap implication:**
- Rooftop conversation suggests **mutual aid is separate** from patronage pools
- But P319's **"giving together" pool** seems to be the LCA's version of mutual aid
- Clarification needed: Is "giving pool" = mutual aid layer? Or are they distinct?

**Design question for Todd/Cameron:**
- Does the **giving pool** (Layer 1 patronage) fund the **rings/flow funding** (mutual aid layer)?
- Or are they **parallel systems** with separate funding sources?

---

## Updated P374 Scope

The original gap analysis recommended **P374: Capital Recycling Implementation** to fill P319 gaps. Based on rooftop insights, P374 scope should expand:

### P374: Layered Economic Memory + Treasury Architecture Implementation

**Scope:**
1. **Four-layer schema** (Labor, Patronage, Equity, Royalty) with inter-layer coordination
2. **Multi-book accounting** (tax capital, labor FMV, patronage allocation, dividend, contribution)
3. **Three-pool treasury** with time horizons, velocity constraints, health metrics
4. **BLS-anchored labor FMV** lookup and role mapping
5. **Transferability rules** per economic unit type, vesting schedules
6. **Pool governance** (steward commitments, disbursement workflows from P319)
7. **Member-facing UI** that frames pools as "ways of relating" (identity expression)

**Dependencies:**
- R2-B (P367): Capital accounts + IRC 704(b) foundations
- BLS data integration (external API or periodic manual updates)
- Ventures registry (Layer 2 equity)
- IP registry (Layer 3 royalties)

**Estimated complexity:** XL (10-15 hours)

**Deliverables:**
- Full DDL for all four layers
- Multi-book accounting schema
- Pool health metrics and governance workflows
- BLS integration spec
- Member-facing pool allocation UI wireframes

---

## Recommendations

1. **Clarify mutual aid relationship:** Is "giving pool" the LCA implementation of mutual aid, or are they separate systems? This affects whether rings/flow funding is in scope for P374.

2. **Prioritize Layer 0 (Labor):** Patronage allocations (Layer 1) depend on contribution tracking (Layer 0). P374 should implement labor FMV tracking first, then build patronage on top.

3. **Prototype multi-book UI:** Members need to see their labor ledger, patronage allocations, and dividend book as **separate views**. Prototype this before full implementation to validate the member-facing story.

4. **Time horizon governance:** Each pool's time horizon should have **matching governance rules** (e.g., investing pool requires board approval for disbursements > $X, giving pool has steward discretion up to $Y).

5. **Extend R4 identity bridge:** If equity (Layer 2) and royalties (Layer 3) tie to external ventures and IP, the identity bridge (R4-A from earlier review) becomes critical for cross-system attribution.

---

## Cross-Reference

- **Original gap analysis:** /workspace/group/p319-gap-analysis.md
- **R4 roadmap review:** /workspace/group/r4-roadmap-review.md
- **Rooftop conversation source:** Provided by Todd 2026-04-07T01:56:18

---

*Dianoia · 2026-04-07 · Execution Intelligence Agent*
