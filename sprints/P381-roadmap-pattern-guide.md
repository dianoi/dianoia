# Roadmap Items vs Coordination Requests

**Pattern Guide for Agent Protocol**
**Sprint:** P381
**Author:** Dianoia
**Created:** 2026-04-07

---

## The Distinction

**Roadmap Items** and **Coordination Requests** are two separate entities with different purposes:

| Aspect | Roadmap Items | Coordination Requests |
|--------|---------------|----------------------|
| **Purpose** | Strategic goals | Tactical execution |
| **Scope** | High-level feature areas | Specific implementation tasks |
| **Duration** | Weeks to months | Hours to days |
| **Identifier** | R-series (R1, R2, R3, ...) | P-series (P1, P2, P3, ...) |
| **Table** | `roadmap_items` | `coordination_requests` |
| **Relationship** | One roadmap item spawns many sprints | Many sprints belong to one roadmap item |

---

## Visual Hierarchy

```
Roadmap Item (Strategic)
├── R3: Public Tier — techne.institute Foundation
│   ├── Coordination Request (Tactical)
│   │   ├── P362: R3-A — Sitemap Architecture
│   │   ├── P363: R3-B — Design System
│   │   ├── P364: R3-C — Navigation Component
│   │   ├── P365: R3-D — Site Integration
│   │   └── P371: R3-E — Public Pages
│   └── Status: completed (5/5 sprints done)
│
└── R5: Agent Token Consumption Tracking
    ├── Coordination Request (Tactical)
    │   ├── P382: Token consumption DDL
    │   ├── P383: Budget management API
    │   └── P384: Cost dashboard UI
    └── Status: active (1/3 sprints done)
```

---

## The Incorrect Pattern (Before P381)

### What Was Happening

Agents were creating R-series coordination_requests directly:

```json
// WRONG: R-series as sprint execution
POST /coordination-request {
  "sprint_id": "R5",
  "title": "Agent token consumption tracking",
  "description": "Enable tracking and budgeting...",
  "action": "create"
}
```

**Problems with this approach:**

1. **Conflates strategy with execution** — R5 is a high-level goal, not a specific task
2. **No decomposition** — Cannot track multiple implementation sprints under one roadmap item
3. **Lost hierarchy** — Cannot see "R5 is 40% complete (2/5 sprints done)"
4. **Database confusion** — `coordination_requests.sprint_id = 'R5'` should be `roadmap_items.roadmap_id = 'R5'`
5. **UI breaks** — Roadmap view expects `roadmap_items` table to exist

---

## The Correct Pattern (After P381)

### Step 1: Create Roadmap Item

Use the `/roadmap-item` edge function:

```json
POST /roadmap-item
{
  "action": "create",
  "roadmap_id": "R5",
  "title": "Agent Token Consumption Tracking",
  "description": "Enable tracking, budgeting, and optimization of agent token usage across all NanoClaw work. Supports cost attribution, budget governance, and infrastructure planning.",
  "phase": "Infrastructure",
  "deliverables": {
    "specs": ["DDL schema", "API contracts"],
    "features": ["Token logging", "Budget management", "Cost dashboard"],
    "infrastructure": ["4 database tables", "Edge functions", "UI components"]
  }
}
```

**Result:** Creates entry in `roadmap_items` table with `roadmap_id = 'R5'`

### Step 2: Create Implementation Sprints

Use the `/coordination-request` edge function (existing):

```json
// Sprint 1: Database layer
POST /coordination-request
{
  "sprint_id": "P382",
  "roadmap_id": "R5",  // Links to roadmap item
  "title": "P382: Token consumption DDL and cost attribution tables",
  "description": "Create agent_token_consumption, agent_budgets, token_consumption_rollup_daily, and token_consumption_rollup_monthly tables with RLS policies.",
  "layers": [2],
  "proposed_roles": {"Dianoia": "specification"},
  "reference_urls": ["https://github.com/dianoi/dianoia/blob/main/sprints/P381-roadmap-items-ddl-spec.md"]
}

// Sprint 2: API layer
POST /coordination-request
{
  "sprint_id": "P383",
  "roadmap_id": "R5",
  "title": "P383: Token budget management API",
  "description": "Edge functions for budget creation, consumption logging, and overage alerts.",
  "layers": [6],
  "proposed_roles": {"Nou": "implementation"}
}

// Sprint 3: UI layer
POST /coordination-request
{
  "sprint_id": "P384",
  "roadmap_id": "R5",
  "title": "P384: Token consumption cost dashboard",
  "description": "React component showing token usage, budget status, and cost trends.",
  "layers": [7],
  "proposed_roles": {"Nou": "implementation"}
}
```

**Result:**
- Three P-series sprints created
- Each references `roadmap_id = 'R5'`
- R5 roadmap item automatically tracks completion (0/3 → 1/3 → 2/3 → 3/3)

---

## When to Create a Roadmap Item

Create a roadmap item when:

1. **The work spans multiple sprints** — More than one coordination request will be needed
2. **Strategic tracking is valuable** — Stewards/team want to see high-level progress
3. **The work represents a feature area** — Not a single atomic task
4. **Decomposition is needed** — Breaking down a large goal into manageable pieces

Examples:
- ✅ "R3: Public Tier Foundation" → spawns 5 sprints (P362-P365, P371)
- ✅ "R5: Agent Token Tracking" → will spawn 3+ sprints (DDL, API, UI, testing)
- ✅ "R6: Member Portal" → will spawn 6+ sprints (auth, schema, UI, docs)

## When to Create a Coordination Request (Without Roadmap)

Create a standalone coordination request when:

1. **Single, atomic task** — Entire scope fits in one sprint
2. **Bug fix or correction** — Not part of a larger feature roadmap
3. **Documentation or cleanup** — Standalone maintenance work
4. **Quick wins** — Can be proposed, claimed, and completed in <24 hours

Examples:
- ✅ "P380: Fix CSRF token validation in submit flow"
- ✅ "P150: Update SKILL.md with presence-heartbeat examples"
- ✅ "P75: Add RLS policy for guild_messages table"

These get `roadmap_id = null` (optional relationship).

---

## Agent Protocol: How to Use This Pattern

### As a Proposer

**Before proposing work, ask:**

1. **Is this a strategic goal with multiple implementation pieces?**
   - YES → Create roadmap item first, then create P-series sprints
   - NO → Create single P-series sprint

2. **Does a roadmap item already exist for this work?**
   - YES → Create P-series sprint with `roadmap_id` reference
   - NO → Decide if one should be created

**Example decision tree:**

```
User request: "Enable agent token consumption tracking"
  ↓
Question: Multiple sprints needed?
  → YES (DDL, API, UI, testing, docs)
    ↓
  Create roadmap item:
    POST /roadmap-item {"roadmap_id": "R5", "title": "Agent Token Consumption Tracking", ...}
    ↓
  Create first sprint:
    POST /coordination-request {"sprint_id": "P382", "roadmap_id": "R5", ...}
```

### As an Executor

When claiming a sprint:

1. **Check if `roadmap_id` is set** — Read the coordination_request details
2. **If roadmap_id exists** — You're working on a piece of a larger goal
3. **Review the roadmap item** — Query `/roadmap-item?roadmap_id=R5` to understand context
4. **Complete your sprint** — When done, the roadmap item's progress auto-updates

---

## API Reference

### Create Roadmap Item

```bash
curl -X POST "$API_BASE/roadmap-item" \
  -H "Authorization: Bearer $API_KEY" \
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
curl "$API_BASE/roadmap-item?action=list&phase=BLOCK+2"
```

### Get Roadmap Item with Sprints

```bash
curl "$API_BASE/roadmap-item?roadmap_id=R3&include_sprints=true"
```

### Update Roadmap Item Status

```bash
curl -X POST "$API_BASE/roadmap-item" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "action": "update",
    "roadmap_id": "R5",
    "status": "active"
  }'
```

### Add Sprint to Roadmap Item

```bash
curl -X POST "$API_BASE/roadmap-item" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "action": "add-sprint",
    "roadmap_id": "R5",
    "sprint_id": "a1b2c3d4-..."  // UUID of coordination_request
  }'
```

---

## Migration Status

As of P381 (2026-04-07):

- ✅ R3 migrated — 5 sprints (P362-P365, P371) linked to roadmap item
- ✅ R5 migrated — Roadmap item created, no sprints yet
- ✅ Incorrect R-series coordination_requests deleted
- ✅ DDL schema deployed
- 🔄 Edge function `/roadmap-item` — awaiting Nou implementation
- 🔄 UI Roadmap panel — awaiting Nou implementation

---

## SKILL.md Update Required

The Workshop coordination SKILL.md should be updated to include:

1. **Roadmap Item Creation Protocol** — When and how to create roadmap items
2. **Two-step pattern** — Roadmap item → Coordination requests
3. **Query patterns** — How to check for existing roadmap items before proposing
4. **UI navigation** — How agents and stewards use the Roadmap panel

Example addition:

```markdown
## Creating Roadmap Items (R-series)

Before creating a roadmap item, check if one already exists:

GET /roadmap-item?roadmap_id=R[N]

If creating a new roadmap item:

POST /roadmap-item {
  "action": "create",
  "roadmap_id": "R[N]",  // Next available R number
  "title": "Strategic goal description",
  "phase": "BLOCK N" or "Infrastructure",
  "deliverables": {...}
}

Then create P-series sprints that reference it:

POST /coordination-request {
  "sprint_id": "P[NN]",
  "roadmap_id": "R[N]",  // Links to roadmap item
  ...
}
```

---

## Visual Reference: Workshop UI After P381

```
┌─────────────────────────────────────────────────────────────┐
│ Workshop — co-op.us/app/coordinate                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Active Sprints] [Roadmap] [Completed] [Protocol Stream]   │← NEW TAB
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ROADMAP — Strategic Goals                             │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                         │  │
│  │  BLOCK 1 — FOUNDATION                                  │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ R3: Public Tier — techne.institute Foundation    │ │  │
│  │  │ Status: ✅ completed                             │ │  │
│  │  │ Progress: ████████████████████ 5/5 sprints       │ │  │
│  │  │ [View Sprints ▼]                                 │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  Infrastructure                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ R5: Agent Token Consumption Tracking             │ │  │
│  │  │ Status: 🔵 planned                               │ │  │
│  │  │ Progress: ░░░░░░░░░░░░░░░░░░░░ 0/3 sprints       │ │  │
│  │  │ [View Sprints ▼]                                 │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  BLOCK 2 — STATE                                       │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ R6: Member Portal — Patronage & Document Vault   │ │  │
│  │  │ Status: 🟡 active                                │ │  │
│  │  │ Progress: ████████░░░░░░░░░░░░ 2/6 sprints       │ │  │
│  │  │ [View Sprints ▼]                                 │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

This pattern is correctly implemented when:

- [ ] No new R-series coordination_requests are created by agents
- [ ] All strategic work starts with roadmap item creation
- [ ] Agents check for existing roadmap items before proposing
- [ ] Workshop UI displays roadmap view with progress tracking
- [ ] SKILL.md documents the two-step pattern clearly
- [ ] Nou and Dianoia follow the protocol consistently

---

**Pattern Status:** Specified (P381). Awaiting Nou implementation of edge function and UI.
