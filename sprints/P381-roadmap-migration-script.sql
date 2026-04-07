-- P381: Migration Script for R-series coordination_requests to roadmap_items
-- Author: Dianoia
-- Created: 2026-04-07
-- Purpose: Convert incorrectly-created R-series coordination_requests to proper roadmap_items

-- ============================================================================
-- STEP 1: Identify R-series coordination_requests (the incorrect pattern)
-- ============================================================================

-- Query to find all R-series sprints currently in coordination_requests
SELECT sprint_id, title, status, created_at, id
FROM coordination_requests
WHERE sprint_id ~ '^R[0-9]+$'
ORDER BY sprint_id;

-- Expected results (as of 2026-04-07):
-- R3 | co-op.us sitemap roadmap item | proposed | ... | [uuid]
-- R5 | Agent token consumption tracking | proposed | ... | [uuid]


-- ============================================================================
-- STEP 2: Create roadmap_items table (if not exists)
-- ============================================================================

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap_id
  ON roadmap_items(roadmap_id);

CREATE INDEX IF NOT EXISTS idx_roadmap_items_status
  ON roadmap_items(status);

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

-- Constraints
ALTER TABLE roadmap_items
  ADD CONSTRAINT IF NOT EXISTS roadmap_id_format
  CHECK (roadmap_id ~ '^R[0-9]+$');

ALTER TABLE roadmap_items
  ADD CONSTRAINT IF NOT EXISTS roadmap_status_valid
  CHECK (status IN ('planned', 'active', 'completed', 'deferred'));

-- RLS Policies
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roadmap_items_read_policy ON roadmap_items;
CREATE POLICY roadmap_items_read_policy ON roadmap_items
  FOR SELECT
  USING (true);  -- All authenticated users can read

DROP POLICY IF EXISTS roadmap_items_write_policy ON roadmap_items;
CREATE POLICY roadmap_items_write_policy ON roadmap_items
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM participants
      WHERE membership_class IN ('steward', 'agent')
    )
  );


-- ============================================================================
-- STEP 3: Migrate R3 (already completed via P362-P365, P371)
-- ============================================================================

-- Insert R3 roadmap item
INSERT INTO roadmap_items (
  roadmap_id,
  title,
  description,
  phase,
  status,
  priority,
  related_sprints,
  deliverables,
  created_at
) VALUES (
  'R3',
  'Public Tier — techne.institute Foundation',
  'Build out techne.institute as a complete public-facing site with navigation, design system, and informational pages. Establishes foundation for cooperative launch.',
  'BLOCK 1 — FOUNDATION',
  'completed',
  3,
  ARRAY[
    'c5b157cf-c3a1-4dbf-ae78-e74dd97d2e6f'::uuid,  -- P362 (R3-A): Sitemap Architecture
    'b78d1be8-e8bc-40f7-9a60-d633cdbd8f38'::uuid,  -- P363 (R3-B): Design System
    'a1102ec1-d44b-44ca-b250-8c6f9af68bec'::uuid,  -- P364 (R3-C): Navigation Component
    '4a38eafb-f6d7-4f3f-b3e3-34b4e768427d'::uuid,  -- P365 (R3-D): Site Integration
    'e8d39908-f02f-4c84-af2b-198d271f113f'::uuid   -- P371 (R3-E): Public Pages
  ],
  '{
    "specs": ["sitemap.md", "auth-scopes.md", "auth-flows.md", "url-migration.md"],
    "features": [
      "Navigation web component (public/investor/intranet modes)",
      "Design tokens (tokens.css, components.css)",
      "Six public pages (/about/, /cooperative/, /membership/, /public-benefit/, /bylaws/, /learn/)"
    ],
    "infrastructure": ["URL architecture", "sitemap.xml", "robots.txt"]
  }'::jsonb,
  (SELECT created_at FROM coordination_requests WHERE sprint_id = 'R3' LIMIT 1)
)
ON CONFLICT (roadmap_id) DO UPDATE
SET
  related_sprints = EXCLUDED.related_sprints,
  status = EXCLUDED.status,
  deliverables = EXCLUDED.deliverables;

-- Update P362-P365, P371 coordination_requests to reference roadmap_id
UPDATE coordination_requests
SET roadmap_id = 'R3'
WHERE id IN (
  'c5b157cf-c3a1-4dbf-ae78-e74dd97d2e6f',  -- P362
  'b78d1be8-e8bc-40f7-9a60-d633cdbd8f38',  -- P363
  'a1102ec1-d44b-44ca-b250-8c6f9af68bec',  -- P364
  '4a38eafb-f6d7-4f3f-b3e3-34b4e768427d',  -- P365
  'e8d39908-f02f-4c84-af2b-198d271f113f'   -- P371
);

-- Delete the incorrect R3 coordination_request (if exists)
DELETE FROM coordination_requests
WHERE sprint_id = 'R3' AND sprint_id ~ '^R[0-9]+$';


-- ============================================================================
-- STEP 4: Migrate R5 (Agent Token Consumption Tracking)
-- ============================================================================

-- Insert R5 roadmap item
INSERT INTO roadmap_items (
  roadmap_id,
  title,
  description,
  phase,
  status,
  priority,
  deliverables,
  created_at
) VALUES (
  'R5',
  'Agent Token Consumption Tracking',
  'Enable tracking, budgeting, and optimization of agent token usage across all NanoClaw work. Supports cost attribution, budget governance, and infrastructure planning.',
  'Infrastructure',
  'planned',
  5,
  '{
    "specs": ["agent_token_consumption DDL", "agent_budgets DDL", "Cost attribution patterns"],
    "features": ["Token consumption logging", "Budget management", "Cost dashboard"],
    "infrastructure": ["4 database tables", "Edge function APIs", "Realtime subscriptions"]
  }'::jsonb,
  (SELECT created_at FROM coordination_requests WHERE sprint_id = 'R5' LIMIT 1)
)
ON CONFLICT (roadmap_id) DO UPDATE
SET
  description = EXCLUDED.description,
  phase = EXCLUDED.phase,
  deliverables = EXCLUDED.deliverables;

-- Delete the incorrect R5 coordination_request (if exists)
DELETE FROM coordination_requests
WHERE sprint_id = 'R5' AND sprint_id ~ '^R[0-9]+$';


-- ============================================================================
-- STEP 5: Add foreign key to coordination_requests (if not exists)
-- ============================================================================

-- Add roadmap_id column if it doesn't exist
ALTER TABLE coordination_requests
  ADD COLUMN IF NOT EXISTS roadmap_id TEXT
  REFERENCES roadmap_items(roadmap_id) ON DELETE SET NULL;

-- Create index for roadmap_id lookups
CREATE INDEX IF NOT EXISTS idx_coordination_requests_roadmap_id
  ON coordination_requests(roadmap_id);


-- ============================================================================
-- STEP 6: Verification Queries
-- ============================================================================

-- Verify roadmap_items were created
SELECT roadmap_id, title, phase, status,
       COALESCE(array_length(related_sprints, 1), 0) as sprint_count
FROM roadmap_items
ORDER BY roadmap_id;

-- Verify coordination_requests now reference roadmap items
SELECT cr.sprint_id, cr.title, cr.roadmap_id, cr.status
FROM coordination_requests cr
WHERE cr.roadmap_id IN ('R3', 'R5')
ORDER BY cr.sprint_id;

-- Verify no R-series coordination_requests remain
SELECT sprint_id, title, status
FROM coordination_requests
WHERE sprint_id ~ '^R[0-9]+$';
-- (Should return zero rows)

-- Get roadmap item with all sprints (full join)
SELECT
  r.roadmap_id,
  r.title as roadmap_title,
  r.status as roadmap_status,
  json_agg(
    json_build_object(
      'sprint_id', cr.sprint_id,
      'title', cr.title,
      'status', cr.status,
      'completed_at', cr.completed_at
    ) ORDER BY cr.sprint_id
  ) FILTER (WHERE cr.id IS NOT NULL) as sprints
FROM roadmap_items r
LEFT JOIN coordination_requests cr ON cr.id = ANY(r.related_sprints)
WHERE r.roadmap_id = 'R3'
GROUP BY r.id, r.roadmap_id, r.title, r.status;


-- ============================================================================
-- STEP 7: Document the migration in protocol_events
-- ============================================================================

INSERT INTO protocol_events (
  event_type,
  agent_id,
  sprint_id,
  payload,
  created_at
) VALUES (
  'system_migration',
  '4ec57cb4-b4f6-4458-aa07-56de1a0d5ea9',  -- Dianoia's agent ID
  'P381',
  jsonb_build_object(
    'migration', 'R-series coordination_requests to roadmap_items',
    'migrated_items', ARRAY['R3', 'R5'],
    'script', 'P381-roadmap-migration-script.sql',
    'sprint', 'P381',
    'reason', 'Restore correct roadmap item entity separation after UI changes removed roadmap_items table'
  ),
  now()
);


-- ============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================================================

-- To rollback this migration:
/*
-- 1. Recreate R-series coordination_requests from roadmap_items
INSERT INTO coordination_requests (sprint_id, title, description, status, roadmap_id)
SELECT roadmap_id, title, description, status, NULL
FROM roadmap_items
WHERE roadmap_id IN ('R3', 'R5');

-- 2. Clear roadmap_id references from P-series sprints
UPDATE coordination_requests
SET roadmap_id = NULL
WHERE roadmap_id IN ('R3', 'R5');

-- 3. Delete roadmap_items
DELETE FROM roadmap_items WHERE roadmap_id IN ('R3', 'R5');

-- 4. Drop table if fully reverting
DROP TABLE IF EXISTS roadmap_items CASCADE;
*/

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
