# P381: roadmap_items DDL Specification

**Sprint:** P381 — Restore roadmap_items entity and roadmap view in Workshop
**Author:** Dianoia (Specification role)
**Created:** 2026-04-07
**Status:** Specification complete, awaiting Nou implementation

---

## Problem Context

The `roadmap_items` table/entity was removed from co-op.us/app/coordinate during recent UI changes. This caused incorrect behavior where agents (Dianoia and Nou) created R-series `coordination_requests` (R3, R5, etc.) instead of proper `roadmap_items` entities.

**Incorrect pattern:**
```sql
-- WRONG: R-series as coordination_requests
INSERT INTO coordination_requests (sprint_id, title, ...)
VALUES ('R5', 'Agent token consumption tracking', ...);
```

**Correct pattern:**
```sql
-- RIGHT: R-series as roadmap_items
INSERT INTO roadmap_items (roadmap_id, title, ...)
VALUES ('R5', 'Agent Token Consumption Tracking', ...);

-- Then create P-series sprints that reference the roadmap
INSERT INTO coordination_requests (sprint_id, roadmap_id, title, ...)
VALUES ('P382', 'R5', 'P382: Token consumption DDL and dashboard', ...);
```

---

## DDL Schema

### Table: `roadmap_items`

```sql
CREATE TABLE IF NOT EXISTS roadmap_items (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Roadmap identifier (R1, R2, R3, etc.)
  roadmap_id TEXT NOT NULL UNIQUE,

  -- Roadmap item metadata
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT,  -- "BLOCK 1", "BLOCK 2", "Infrastructure", etc.
  status TEXT DEFAULT 'planned',  -- planned, active, completed, deferred
  priority INTEGER,  -- Sort order within phase

  -- Relationships
  related_sprints UUID[],  -- Array of coordination_request IDs
  created_by UUID REFERENCES participants(id),

  -- Structured data
  tags TEXT[],  -- ["public-tier", "auth", "ui", ...]
  deliverables JSONB,  -- {specs: [], features: [], tests: []}
  context_refs JSONB[],  -- [{type: "doc", url: "..."}, ...]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for lookups by roadmap_id
CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap_id
  ON roadmap_items(roadmap_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status
  ON roadmap_items(status);

-- Index for phase grouping
CREATE INDEX IF NOT EXISTS idx_roadmap_items_phase
  ON roadmap_items(phase);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_roadmap_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_items_updated_at();
```

---

## Field Specifications

### `roadmap_id` (TEXT, NOT NULL, UNIQUE)
- Format: `R[N]` where N is an integer (e.g., `R1`, `R2`, `R5`, `R10`)
- This is the canonical identifier for the roadmap item
- UNIQUE constraint prevents duplicate roadmap IDs
- Used by `coordination_requests.roadmap_id` foreign key reference

### `status` (TEXT, DEFAULT 'planned')
Valid values:
- **`planned`** — Roadmap item defined but no active work
- **`active`** — At least one related sprint is in_progress
- **`completed`** — All related sprints completed
- **`deferred`** — Postponed to future phase

### `phase` (TEXT, nullable)
Examples:
- `"BLOCK 1 — FOUNDATION"`
- `"BLOCK 2 — STATE"`
- `"Infrastructure"`
- `"Public Tier"`
- `null` for phase-agnostic items

### `related_sprints` (UUID[])
Array of `coordination_requests.id` values representing implementation sprints.

**Example:**
```json
[
  "a1102ec1-d44b-44ca-b250-8c6f9af68bec",  // P364
  "4a38eafb-f6d7-4f3f-b3e3-34b4e768427d",  // P365
  "e8d39908-f02f-4c84-af2b-198d271f113f"   // P371
]
```

**Management:**
- Sprints add themselves to this array when created with `roadmap_id` reference
- Edge function `/roadmap-item` with `action: "add-sprint"` handles updates
- Frontend can query related sprints via array inclusion filter

### `deliverables` (JSONB, nullable)
Structured list of expected outputs.

**Example:**
```json
{
  "specs": ["sitemap.md", "auth-scopes.md"],
  "features": ["Navigation component", "Public pages"],
  "infrastructure": ["roadmap_items table", "API endpoints"],
  "documentation": ["SKILL.md updates", "Pattern guide"]
}
```

### `context_refs` (JSONB[], nullable)
Array of reference documents, similar to `coordination_requests.context_refs`.

**Example:**
```json
[
  {"type": "roadmap_doc", "url": "https://github.com/.../WORKSHOP-ROADMAP.md"},
  {"type": "review", "id": "r2-r3-roadmap-review.md"},
  {"type": "github_issue", "url": "https://github.com/.../issues/42"}
]
```

---

## RLS (Row-Level Security) Policies

### Read Access
```sql
-- Public read for roadmap_items
CREATE POLICY roadmap_items_read_policy ON roadmap_items
  FOR SELECT
  USING (true);  -- All authenticated users can read roadmap
```

### Write Access
```sql
-- Only stewards and agents can create/update roadmap items
CREATE POLICY roadmap_items_write_policy ON roadmap_items
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM participants
      WHERE membership_class IN ('steward', 'agent')
    )
  );
```

---

## Data Integrity Constraints

### 1. Roadmap ID Format
```sql
ALTER TABLE roadmap_items
  ADD CONSTRAINT roadmap_id_format
  CHECK (roadmap_id ~ '^R[0-9]+$');
```

### 2. Status Values
```sql
ALTER TABLE roadmap_items
  ADD CONSTRAINT roadmap_status_valid
  CHECK (status IN ('planned', 'active', 'completed', 'deferred'));
```

---

## Relationship to coordination_requests

The `coordination_requests` table should reference roadmap items via `roadmap_id`:

```sql
-- Already exists in coordination_requests schema
ALTER TABLE coordination_requests
  ADD COLUMN IF NOT EXISTS roadmap_id TEXT
  REFERENCES roadmap_items(roadmap_id) ON DELETE SET NULL;
```

**Foreign key behavior:**
- `ON DELETE SET NULL` — If roadmap item is deleted, sprints remain but lose roadmap reference
- Alternative: `ON DELETE CASCADE` would delete all related sprints (too destructive)

---

## Sample Data

```sql
-- R3: Public Tier — techne.institute foundation
INSERT INTO roadmap_items (roadmap_id, title, description, phase, status, priority, deliverables) VALUES (
  'R3',
  'Public Tier — techne.institute Foundation',
  'Build out techne.institute as a complete public-facing site with navigation, design system, and informational pages. Establishes foundation for cooperative launch.',
  'BLOCK 1 — FOUNDATION',
  'completed',
  1,
  '{
    "specs": ["sitemap.md", "auth-scopes.md", "auth-flows.md"],
    "features": ["Navigation component", "Design tokens", "Six public pages"],
    "infrastructure": ["URL architecture", "sitemap.xml", "robots.txt"]
  }'::jsonb
);

-- R5: Agent Token Consumption Tracking (example of correct future usage)
INSERT INTO roadmap_items (roadmap_id, title, description, phase, status, priority) VALUES (
  'R5',
  'Agent Token Consumption Tracking',
  'Enable tracking, budgeting, and optimization of agent token usage across all NanoClaw work. Supports cost attribution, budget governance, and infrastructure planning.',
  'Infrastructure',
  'planned',
  5
);

-- Link existing R3 sprints
UPDATE roadmap_items
SET related_sprints = ARRAY[
  'c5b157cf-c3a1-4dbf-ae78-e74dd97d2e6f'::uuid,  -- P362 (R3-A)
  'b78d1be8-e8bc-40f7-9a60-d633cdbd8f38'::uuid,  -- P363 (R3-B)
  'a1102ec1-d44b-44ca-b250-8c6f9af68bec'::uuid,  -- P364 (R3-C)
  '4a38eafb-f6d7-4f3f-b3e3-34b4e768427d'::uuid,  -- P365 (R3-D)
  'e8d39908-f02f-4c84-af2b-198d271f113f'::uuid   -- P371 (R3-E)
]
WHERE roadmap_id = 'R3';
```

---

## Query Patterns

### Get all roadmap items with sprint counts
```sql
SELECT
  r.roadmap_id,
  r.title,
  r.phase,
  r.status,
  COALESCE(array_length(r.related_sprints, 1), 0) as total_sprints,
  (
    SELECT COUNT(*)
    FROM coordination_requests cr
    WHERE cr.id = ANY(r.related_sprints) AND cr.status = 'completed'
  ) as completed_sprints
FROM roadmap_items r
ORDER BY r.priority, r.roadmap_id;
```

### Get roadmap item with all related sprints
```sql
SELECT
  r.*,
  json_agg(
    json_build_object(
      'sprint_id', cr.sprint_id,
      'title', cr.title,
      'status', cr.status,
      'completed_at', cr.completed_at
    ) ORDER BY cr.sprint_id
  ) as sprints
FROM roadmap_items r
LEFT JOIN coordination_requests cr ON cr.id = ANY(r.related_sprints)
WHERE r.roadmap_id = 'R3'
GROUP BY r.id;
```

### Find roadmap items by phase
```sql
SELECT roadmap_id, title, status
FROM roadmap_items
WHERE phase = 'BLOCK 1 — FOUNDATION'
ORDER BY priority, roadmap_id;
```

---

## Migration Compatibility

This schema is designed to coexist with existing `coordination_requests` data:

1. **Existing sprints remain valid** — No changes to `coordination_requests` structure required
2. **`roadmap_id` is nullable** — Sprints without roadmap items work fine (backwards compatible)
3. **Gradual migration** — Can populate `roadmap_items` incrementally as R-series patterns are corrected

---

## Implementation Notes for Nou

When implementing the edge function and UI:

1. **Edge function `/roadmap-item`** should support:
   - `action: "create"` — Insert new roadmap item
   - `action: "update"` — Update status, phase, or metadata
   - `action: "add-sprint"` — Append to `related_sprints` array
   - `action: "list"` — Query with filters (phase, status)

2. **UI Roadmap Panel** should display:
   - Roadmap items grouped by phase
   - Progress indicator (completed sprints / total sprints)
   - Click to expand and show related sprints
   - Status badge (planned/active/completed/deferred)

3. **Realtime subscription**:
   ```javascript
   const channel = supabase
     .channel('roadmap_items_changes')
     .on('postgres_changes',
       { event: '*', schema: 'public', table: 'roadmap_items' },
       handleRoadmapChange
     )
     .subscribe();
   ```

---

## Success Criteria

- [ ] `roadmap_items` table created with all indexes and constraints
- [ ] RLS policies applied
- [ ] Sample data inserted (R3, R5)
- [ ] Existing R3 sprints linked via `related_sprints` array
- [ ] Foreign key `coordination_requests.roadmap_id` references `roadmap_items.roadmap_id`
- [ ] Query patterns tested and performant
- [ ] DDL migrated to Supabase production

---

**Next:** Migration script for existing R-series coordination_requests (separate deliverable)
