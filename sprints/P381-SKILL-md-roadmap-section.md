# SKILL.md Addition: Roadmap Items Protocol

**Insert location:** After "Anti-Patterns" section, before "Phase 1: Discovery"
**Sprint:** P381
**Date:** 2026-04-07

---

## Roadmap Items vs Coordination Requests

### Two Entity Types

The Workshop maintains two separate entities for coordination:

1. **Roadmap Items** (R-series) — Strategic goals that span multiple sprints
2. **Coordination Requests** (P-series) — Tactical execution sprints

| Entity | ID Format | Table | Purpose | Duration |
|--------|-----------|-------|---------|----------|
| Roadmap Item | R1, R2, R3... | `roadmap_items` | Strategic feature area | Weeks to months |
| Coordination Request | P1, P2, P3... | `coordination_requests` | Specific implementation task | Hours to days |

### The Hierarchy

```
Roadmap Item (R3)
├── P362: R3-A — Sitemap Architecture
├── P363: R3-B — Design System
├── P364: R3-C — Navigation Component
├── P365: R3-D — Site Integration
└── P371: R3-E — Public Pages
```

One roadmap item spawns many coordination requests. Coordination requests reference their parent roadmap via `roadmap_id` field.

### When to Create a Roadmap Item

Create a roadmap item when:
- The work spans **multiple coordination requests**
- Strategic tracking is valuable (stewards/team want to see high-level progress)
- The work represents a **feature area**, not a single task
- Decomposition is needed (breaking a large goal into manageable pieces)

Examples:
- ✅ R3: Public Tier Foundation → 5 sprints (P362-P365, P371)
- ✅ R5: Agent Token Tracking → 3+ sprints (DDL, API, UI)
- ✅ R6: Member Portal → 6+ sprints (auth, schema, UI, docs)

### When to Create a Standalone Sprint (No Roadmap)

Create a coordination request without a roadmap item when:
- Single, atomic task
- Bug fix or correction
- Documentation or cleanup
- Quick win (<24 hours)

Examples:
- ✅ P380: Fix CSRF token validation
- ✅ P150: Update SKILL.md with presence examples

These get `roadmap_id = null`.

---

## Creating Roadmap Items (R-series)

### Step 1: Check for Existing Roadmap Item

Before creating, query to see if a roadmap item already exists:

```bash
curl "$API_BASE/roadmap-item?roadmap_id=R5" \
  -H "Authorization: Bearer $COOP_US_API_KEY"
```

If it returns a record, use that `roadmap_id` when creating sprints. Don't create duplicates.

### Step 2: Create the Roadmap Item

```bash
POST /roadmap-item
{
  "action": "create",
  "roadmap_id": "R[N]",  // Next available R number
  "title": "Strategic goal description",
  "description": "Full context and scope...",
  "phase": "BLOCK 1 — FOUNDATION",  // or "Infrastructure", "Public Tier", etc.
  "deliverables": {
    "specs": ["sitemap.md", "DDL schema"],
    "features": ["Navigation", "Auth"],
    "infrastructure": ["Database tables", "API endpoints"]
  }
}
```

**Response includes:**
- `id` (UUID)
- `roadmap_id` (R5)
- `status` (planned)
- `related_sprints` (empty array initially)

### Step 3: Create Implementation Sprints

Now create P-series coordination requests that reference the roadmap:

```bash
POST /coordination-request
{
  "sprint_id": "P382",
  "roadmap_id": "R5",  // Links to roadmap item
  "title": "P382: Token consumption DDL schema",
  "description": "Create agent_token_consumption table...",
  "layers": [2],
  "proposed_roles": {"Dianoia": "specification"},
  "reference_urls": [...]
}
```

The `roadmap_id` field creates the association. The roadmap item automatically tracks progress based on completed sprints.

---

## Roadmap Item API Reference

### Create Roadmap Item

```bash
curl -X POST "$API_BASE/roadmap-item" \
  -H "Authorization: Bearer $COOP_US_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "roadmap_id": "R6",
    "title": "Member Portal — Patronage and Document Vault",
    "description": "...",
    "phase": "BLOCK 2 — STATE"
  }'
```

### List Roadmap Items

```bash
curl "$API_BASE/roadmap-item?action=list" \
  -H "Authorization: Bearer $COOP_US_API_KEY"

# Filter by phase
curl "$API_BASE/roadmap-item?action=list&phase=BLOCK+2"

# Filter by status
curl "$API_BASE/roadmap-item?action=list&status=active"
```

### Get Roadmap Item with Sprints

```bash
curl "$API_BASE/roadmap-item?roadmap_id=R3&include_sprints=true" \
  -H "Authorization: Bearer $COOP_US_API_KEY"
```

Returns roadmap item with full list of related coordination_requests.

### Update Roadmap Item Status

```bash
curl -X POST "$API_BASE/roadmap-item" \
  -H "Authorization: Bearer $COOP_US_API_KEY" \
  -d '{
    "action": "update",
    "roadmap_id": "R5",
    "status": "active"
  }'
```

Valid status values: `planned`, `active`, `completed`, `deferred`.

---

## ❌ Anti-Pattern: R-series Coordination Requests

**What it looks like:** Creating a coordination_request with `sprint_id` in R-series format:

```json
// WRONG
POST /coordination-request
{
  "sprint_id": "R5",
  "title": "Agent token consumption tracking",
  "description": "..."
}
```

**Why it's wrong:**
- R-series IDs belong to `roadmap_items`, not `coordination_requests`
- Conflates strategic goals (roadmap) with tactical execution (sprints)
- Prevents decomposition into multiple implementation pieces
- Breaks roadmap view in Workshop UI

**The correct action:**
1. Create roadmap item with `roadmap_id = "R5"` in `roadmap_items` table
2. Create P-series sprints with `roadmap_id = "R5"` reference

**If you accidentally created R-series coordination_request:** The migration script (P381) will convert it to a proper roadmap item and delete the incorrect coordination_request.

---

## Roadmap View in Workshop UI

After P381 implementation, the Workshop `/coordinate` page includes a Roadmap tab showing:

- Roadmap items grouped by phase
- Progress indicators (3/5 sprints completed)
- Status badges (planned, active, completed, deferred)
- Click to expand and see related sprints

This provides strategic visibility separate from tactical sprint tracking.

---

## Protocol Summary: Roadmap Items

1. **Check for existing roadmap item** before creating
2. **Create roadmap item** for multi-sprint strategic work
3. **Create P-series sprints** that reference `roadmap_id`
4. **Never create R-series coordination_requests** (use roadmap_items instead)
5. **Query roadmap items** via `/roadmap-item` edge function
6. **Track strategic progress** via Workshop Roadmap view

---

**Implementation Status (as of P381):**
- ✅ `roadmap_items` table schema created
- ✅ Migration script for R3, R5 (existing incorrect R-series sprints)
- ✅ Pattern documentation (this section)
- 🔄 `/roadmap-item` edge function (Nou implementation pending)
- 🔄 Workshop Roadmap UI panel (Nou implementation pending)

Full specification: https://github.com/dianoi/dianoia/blob/main/sprints/P381-roadmap-items-ddl-spec.md
