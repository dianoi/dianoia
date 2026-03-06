# P114: Sprint Taxonomy System — Post-Completion Visibility and Discoverability

**Proposer:** Dianoia
**Date:** 2026-03-06T20:00 UTC
**Complexity:** L
**Layers:** [2, 4, 7]
**Proposed Roles:** {"Dianoia": "spec-author", "Nou": "implementer"}
**Capability Requirements:** ["specification", "sql", "api-design", "ui-design"]

---

## Problem Statement

**Gap identified:** When sprints are marked `completed`, they disappear from the Active Sprints panel and become hidden in the UI. However, completed sprints fall into fundamentally different categories:

**Category A: One-off fixes** — Bug fixes, typos, simple corrections that are done and unlikely to be revisited
- Example: "Fix typo in README"
- Example: "Increase URL truncation from 8 to 14 chars" (P108)

**Category B: Design patterns and evolutionary features** — Work that introduces new patterns, establishes conventions, or implements features that are foundational but not yet fully realized
- Example: "Workshop Capability Grid with swarm-viz integration" (P105)
- Example: "Protocol Stream visualization" (P107)
- Example: "Sprint Review Protocol Gap" (P112) — establishes bilateral review pattern

**Current behavior:** ALL completed sprints are hidden equally, regardless of their long-term significance.

**Impact:** Stewards and agents lose visibility into design patterns, established conventions, and evolutionary features that should remain discoverable for reference, iteration, and completion.

---

## User Story (Todd's Need)

> "Just because a sprint was completed, doesn't mean I want it hidden, but we don't have a way for me to easily surface those sprints which have patterns and features that are not yet fully implemented."

**Specific use cases:**
1. **Review design patterns** — Find sprints that established new patterns (e.g., bilateral review protocol, hash alignment)
2. **Identify evolutionary features** — Surface sprints that introduced features not yet fully realized (e.g., swarm-viz integration planned but not deployed)
3. **Audit protocol changes** — Filter for sprints that modified SKILL.md, coordination protocol, or governance
4. **Track iterative work** — See sprints that represent incremental progress toward a larger goal

---

## Technical Analysis

### Current State

**Database schema (coordination_requests table):**
- `status`: proposed | active | completed | paused
- `complexity`: XS | S | M | L | XL (nullable, many are null per P104 R2)
- `layers`: Array of integers [1-7]
- NO taxonomy/categorization field for completed sprints

**UI filtering:**
- Active Sprints panel shows only `status IN ('proposed', 'active', 'paused')`
- Completed sprints are invisible unless manually queried or searched
- No way to filter completed sprints by type, significance, or reusability

**P104 recommendation R5 (Category Tags):**
P104 identified this gap and proposed category tags:
- Protocol Norms (~15 sprints)
- UI Features (~25 sprints)
- Infrastructure/API (~22 sprints)
- Decomposition (~6 sprints)
- Agent Identity (~12 sprints)
- Documentation (~8 sprints)
- Formation/Commons (~5 sprints)

However, R5 focused on **work type** (what domain the sprint touches), not **post-completion significance** (whether the sprint should remain visible for reference).

---

## Proposed Solution: Dual Taxonomy

### Taxonomy 1: Work Type (R5 from P104)

**Field:** `work_type` (string enum or array of strings)

**Categories:**
- `protocol` — Changes to SKILL.md, coordination protocol, Workshop API
- `ui` — User interface features, panels, visualizations
- `infrastructure` — Database schema, API endpoints, backend systems
- `documentation` — Specs, guides, READMEs, tutorials
- `agent-identity` — Agent presence, capabilities, craft, formations
- `process` — Meta-work about how work happens (retrospectives, audits, protocol gaps)
- `deployment` — Releases, migrations, infrastructure provisioning
- `fix` — Bug fixes, corrections, one-off maintenance

**Purpose:** Enables filtering by domain (show me all UI sprints, show me all protocol changes)

### Taxonomy 2: Post-Completion Visibility (NEW)

**Field:** `visibility_tier` (string enum)

**Tiers:**

**Tier 1: Foundational** — Design patterns, protocol changes, architectural decisions that establish conventions
- Should remain highly visible
- Likely to be referenced frequently
- Examples: P112 (bilateral review protocol), P61 (hash alignment), P104 (process audit)

**Tier 2: Evolutionary** — Features that are implemented but incomplete, representing incremental progress toward a larger vision
- Should be discoverable for iteration
- May spawn follow-up sprints
- Examples: P105 (swarm-viz integration), P107 (protocol stream), P71 (Workshop Activity panel)

**Tier 3: Operational** — Completed work that functions correctly but has low long-term reference value
- Can be archived/hidden by default
- Surfaced only by explicit search or filter
- Examples: P108 (URL truncation), typo fixes, simple parameter adjustments

**Tier 4: Deprecated** — Work that was completed but later superseded or replaced
- Should be marked explicitly to avoid confusion
- Retained for provenance but not recommended for reference
- Examples: Sprints implementing patterns that were later refactored

**Purpose:** Enables post-completion filtering (show me Tier 1 foundational work, hide Tier 3 operational)

---

## Implementation Phases

### Phase 1: Schema Extension (SQL DDL)

Add two new fields to `coordination_requests` table:

```sql
ALTER TABLE coordination_requests
ADD COLUMN work_type TEXT,
ADD COLUMN visibility_tier TEXT CHECK (visibility_tier IN ('foundational', 'evolutionary', 'operational', 'deprecated'));

-- Create indexes for filtering
CREATE INDEX idx_coordination_requests_work_type ON coordination_requests(work_type);
CREATE INDEX idx_coordination_requests_visibility_tier ON coordination_requests(visibility_tier);
CREATE INDEX idx_coordination_requests_status_visibility ON coordination_requests(status, visibility_tier);
```

**Optional:** Make `work_type` an array to support sprints touching multiple domains:
```sql
ALTER TABLE coordination_requests
ADD COLUMN work_type TEXT[];
```

### Phase 2: Backfill Historical Data

**Challenge:** 113 completed sprints need categorization

**Approach:**

1. **Automated heuristics (70% coverage):**
   - `work_type = 'protocol'` IF description mentions "SKILL.md" OR completion_proof links to nou-techne repo
   - `work_type = 'ui'` IF description mentions "Coordinate.tsx", "panel", "visualization"
   - `work_type = 'fix'` IF title contains "fix", "typo", "bug" OR complexity = 'XS'
   - `work_type = 'documentation'` IF completion_proof links to .md files

2. **Manual review (30% remaining):**
   - Agent (Dianoia) reviews ambiguous cases
   - Steward (Todd) approves `visibility_tier` assignments for Tier 1 (foundational)

3. **Validation:**
   - Cross-check against P104 analysis (117 sprints categorized by domain)
   - Verify tier assignments align with actual reuse patterns

### Phase 3: UI Implementation

**Three new UI features:**

1. **Completed Sprints Panel (NEW)**
   - Separate panel showing completed sprints
   - Default filter: `visibility_tier IN ('foundational', 'evolutionary')`
   - Toggle to show all tiers
   - Groupable by `work_type`
   - Sortable by completion date, tier, complexity

2. **Sprint Card Badges**
   - Visual indicators on sprint cards:
     - 🏛️ Foundational (Tier 1)
     - 🌱 Evolutionary (Tier 2)
     - ⚙️ Operational (Tier 3)
     - 📦 Deprecated (Tier 4)
   - Color-coded work_type tags (similar to layer badges)

3. **Archive/Unarchive Action**
   - Steward can promote Operational → Evolutionary if sprint becomes reference
   - Steward can demote Evolutionary → Operational if no longer relevant
   - Deprecated tier requires explicit steward action (prevents accidental deprecation)

### Phase 4: API Extensions

**New Edge Function endpoints:**

```typescript
// POST /coordination-request with new fields
{
  "sprint_id": "P114",
  "title": "...",
  "work_type": "protocol",  // NEW
  "visibility_tier": "foundational",  // NEW (optional, defaults to 'operational')
  ...
}

// PATCH /coordination-request (update taxonomy)
{
  "request_id": "<uuid>",
  "action": "update_taxonomy",
  "work_type": "ui",
  "visibility_tier": "evolutionary"
}
```

**Validation rules:**
- `visibility_tier` can only be set on completed sprints (status = 'completed')
- Changing tier to 'deprecated' requires steward role
- Setting tier to 'foundational' triggers notification to steward for approval

### Phase 5: Documentation

**Update SKILL.md:**
- Document work_type categories with examples
- Document visibility_tier system and tier definitions
- Explain when to set each tier (proposer guidance)
- Note that tier can be adjusted post-completion

**Add to CLAUDE.md:**
- Agents should propose `visibility_tier` when completing sprints that introduce patterns
- Stewards review and approve Tier 1 assignments
- Tier defaults to 'operational' if not specified

---

## Acceptance Criteria

Sprint considered complete when:

1. ✓ Schema extended with `work_type` and `visibility_tier` fields
2. ✓ Indexes created for filtering performance
3. ✓ Automated backfill applied to 113 completed sprints (70% coverage)
4. ✓ Manual review completed for remaining 30%
5. ✓ Completed Sprints panel implemented with tier filtering
6. ✓ Sprint card badges deployed for visual tier identification
7. ✓ API endpoints extended to support taxonomy updates
8. ✓ SKILL.md documentation updated
9. ✓ Verification: Todd can filter Tier 1 foundational sprints and surface design patterns
10. ✓ Verification: Tier 3 operational sprints are hidden by default but searchable

---

## Design Observations

### Why Two Taxonomies?

**Work type** answers: "What domain does this sprint touch?"
- Enables filtering by area of expertise (show me all UI work)
- Supports capability matching (who has done infrastructure sprints?)
- Informs roadmap organization (how much protocol work vs UI work?)

**Visibility tier** answers: "Should this sprint remain visible after completion?"
- Enables post-completion curation (what should stay discoverable?)
- Prevents important patterns from being hidden
- Allows operational work to be archived without losing reference to foundational work

**Both are needed** because domain != significance:
- A UI sprint can be foundational (e.g., first implementation of swarm-viz pattern)
- A protocol sprint can be operational (e.g., minor SKILL.md typo fix)

### Tier Assignment Philosophy

**Foundational (Tier 1):** Ask "Will future sprints reference this pattern?"
- Establishes a convention that others should follow
- Documents a decision that resolves ambiguity
- Introduces a reusable pattern or abstraction

**Evolutionary (Tier 2):** Ask "Is this feature complete or just started?"
- First iteration of a multi-phase feature
- Proof-of-concept that needs refinement
- Incremental progress toward a larger vision

**Operational (Tier 3):** Ask "Is this done and unlikely to be revisited?"
- Solves a specific problem with no broader implications
- No pattern to extract or convention to establish
- Success criteria: works correctly, no follow-up needed

**Deprecated (Tier 4):** Ask "Has this been superseded or replaced?"
- Pattern was valid but better approach emerged
- Feature was removed or refactored
- Retained for historical provenance only

---

## Risk Assessment

### Risk 1: Subjective Tier Assignment

Tier assignment (especially Tier 1 vs Tier 2) requires judgment. Agents may disagree on significance.

**Mitigation:**
- Default to Tier 3 (operational) unless explicitly justified
- Tier 1 assignments require steward approval
- Document tier rationale in result_summary when proposing higher tiers

### Risk 2: Backfill Accuracy

113 completed sprints is a large backfill. Automated heuristics may misclassify.

**Mitigation:**
- Start with automated pass for high-confidence cases
- Manual review for ambiguous sprints
- Allow tier adjustment post-backfill if misclassification discovered

### Risk 3: UI Complexity

Adding Completed Sprints panel increases UI surface area. May clutter interface.

**Mitigation:**
- Make panel collapsible or optional (user preference)
- Default to showing only Tier 1+2 (high-value completed work)
- Ensure panel doesn't obscure active sprints (primary workflow)

---

## Related Work

**P104 Recommendation R5 (Category Tags):**
- Identified need for domain-based categorization
- Proposed 7 categories (Protocol, UI, Infrastructure, etc.)
- Did not address post-completion visibility gap

**P112 (Sprint Review Protocol Gap):**
- Example of Tier 1 foundational sprint
- Established bilateral review pattern that future sprints should reference

**This sprint (P114) implements R5 AND extends it** with visibility tier system to address Todd's specific need.

---

## Reference URLs

1. https://github.com/Roots-Trust-LCA/co-op.us (repository)
2. https://co-op.us/app/coordinate (Workshop UI)
3. https://github.com/nou-techne/nou-techne/blob/main/docs/coordination/WORKSHOP_COORDINATE_SKILL.md (protocol)
4. https://github.com/nou-techne/nou-techne/blob/main/docs/coordination/agile-audit-P104.md (P104 audit with R5 recommendation)
5. https://supabase.com/docs/guides/database/tables (Supabase table schema)

---

## Estimated Effort

**Complexity: L (4-8 hours)**

Breakdown:
- Phase 1 (Schema): 30 minutes
- Phase 2 (Backfill): 3 hours (automated + manual review of 113 sprints)
- Phase 3 (UI): 2 hours (panel + badges)
- Phase 4 (API): 1 hour (taxonomy update endpoints)
- Phase 5 (Documentation): 30 minutes

Total: 7 hours

**Note:** Dianoia can handle Phases 1, 2 (automated), 4, and 5. Nou better suited for Phase 3 (UI implementation). Phase 2 manual review may benefit from bilateral collaboration.

---

## Roadmap Linkage

**Roadmap ID:** roadmap-patronage-ventures-coordination-v2
**Roadmap Phase:** BLOCK 2 — STATE (sprint metadata and categorization)

Proper sprint categorization is state management. It enables the system to track not just what was done, but what kind of work it was and whether it should remain visible.

---

**Status:** Ready for proposal to Workshop
**Next Step:** Post to coordination-request API, await bilateral convergence
