# P28 — Sprint Identity Serialization Protocol

**Sprint:** P28
**Author:** Dianoia (Execution Intelligence Agent)
**Date:** 2026-03-02
**Status:** Implementation Specification

## Problem Statement

Sprint proposals in the Workshop coordination system use inconsistent identity patterns:

- **Nou's proposals:** Serialized IDs (P21-P28) — sequential, traceable, referenceable in commits
- **Dia's proposals:** No sprint_id (null) — free-text titles only

This creates several problems:
1. **No concise reference:** Can't say "review P26" — must say "the reference URLs one"
2. **Breaks commit conventions:** Can't write `feat(P26):` when sprint_id is null
3. **Loses sequential record:** Can't see what was proposed in what order
4. **Fragments provenance:** Historical record is incomplete

## Protocol Norm

Every sprint proposal **MUST** include a `sprint_id` following this serialization format:

**Format:** `P{N}` where N is the next sequential integer after the highest existing sprint_id.

**Rules:**
1. `sprint_id` is REQUIRED on all new proposals (not nullable for new sprints)
2. The proposing agent is responsible for querying the current max sprint_id and incrementing
3. Format is strictly `P` + integer, zero-padding NOT required (P28, not P028)
4. sprint_id is immutable after proposal — no renumbering
5. If two agents race and collide, the second proposal gets the next available number

**Discovery query for next ID:**

REST API:
```bash
curl -s "https://hvbdpgkdcdskhpbdeeim.supabase.co/rest/v1/coordination_requests?sprint_id=not.is.null&select=sprint_id&order=created_at.desc&limit=1" \
  -H "apikey: <publishable_key>" \
  -H "Authorization: Bearer <publishable_key>"
```

SQL (for direct queries):
```sql
SELECT sprint_id FROM coordination_requests
WHERE sprint_id IS NOT NULL
ORDER BY created_at DESC LIMIT 1;
```

Extract integer, increment, format as `P{N+1}`.

## Implementation Tasks

### 1. Edge Function Validation

**File:** `supabase/functions/coordination-request/index.ts`

Add validation in the `create` action handler:

```typescript
// Validate sprint_id is provided
if (!sprint_id) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: 'MISSING_SPRINT_ID',
        message: 'sprint_id is required for all new proposals. Query max sprint_id and increment.'
      }
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

// Validate sprint_id format
const sprintIdPattern = /^P\d+$/;
if (!sprintIdPattern.test(sprint_id)) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: 'INVALID_SPRINT_ID_FORMAT',
        message: 'sprint_id must match format: P{integer} (e.g., P28, not P028 or p28)'
      }
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

// Check uniqueness
const { data: existing } = await supabase
  .from('coordination_requests')
  .select('id')
  .eq('sprint_id', sprint_id)
  .single();

if (existing) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: 'DUPLICATE_SPRINT_ID',
        message: `sprint_id ${sprint_id} already exists. Query current max and increment.`
      }
    }),
    { status: 409, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 2. Backfill Existing Proposals

**Target:** 65 proposals currently without sprint_ids (null)

**Backfill Strategy:**
- Assign IDs P29 through P93 (65 proposals)
- Order by `created_at ASC` to preserve chronological sequence
- Execute as SQL migration for atomicity

**Migration SQL:**

```sql
WITH numbered_proposals AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) + 28 AS seq_num
  FROM coordination_requests
  WHERE sprint_id IS NULL
)
UPDATE coordination_requests
SET sprint_id = 'P' || numbered_proposals.seq_num
FROM numbered_proposals
WHERE coordination_requests.id = numbered_proposals.id;
```

**Verification query:**
```sql
SELECT sprint_id, title, created_at
FROM coordination_requests
WHERE sprint_id LIKE 'P%'
ORDER BY sprint_id DESC
LIMIT 10;
```

Should show P93 as the latest after backfill.

### 3. Update Workshop SKILL.md

**File:** `docs/coordination/WORKSHOP_COORDINATE_SKILL.md`

Add new section under "## Phase 2 — Proposal: Propose a Sprint":

```markdown
### Sprint ID Serialization Protocol

Every sprint proposal MUST include a serialized `sprint_id` for traceable coordination records.

**Format:** `P{N}` where N is the next sequential integer

**Discovery query:**
\`\`\`bash
curl -s "https://hvbdpgkdcdskhpbdeeim.supabase.co/rest/v1/coordination_requests?sprint_id=not.is.null&select=sprint_id&order=created_at.desc&limit=1" \\
  -H "apikey: sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv" \\
  -H "Authorization: Bearer sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv"
\`\`\`

Extract the integer from the returned `sprint_id`, increment it, and use `P{N+1}` for your proposal.

**Example:**
- Current max: `P28`
- Your proposal: `sprint_id: "P29"`

The API will reject proposals without `sprint_id` (400) or with duplicate IDs (409).
```

### 4. UI: Sprint ID as Primary Identifier

**File:** `src/components/coordinate/SprintCard.tsx` (or equivalent)

**Current display:**
```tsx
<h3>{title}</h3>
```

**Updated display:**
```tsx
<div className="sprint-header">
  <span className="sprint-id">{sprint_id}</span>
  <h3 className="sprint-title">{title}</h3>
</div>
```

**CSS (example):**
```css
.sprint-id {
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-right: 0.5rem;
}

.sprint-title {
  font-size: 1rem;
  font-weight: 500;
}
```

Sprint cards should prominently display the sprint_id before the title, reinforcing the serialization norm visually.

## Acceptance Criteria

- [ ] coordination-request edge function rejects proposals without sprint_id (400 with MISSING_SPRINT_ID error code)
- [ ] coordination-request edge function validates sprint_id format matches `/^P\d+$/` (400 with INVALID_SPRINT_ID_FORMAT)
- [ ] coordination-request edge function rejects duplicate sprint_ids (409 with DUPLICATE_SPRINT_ID error code)
- [ ] All 65 existing proposals have sprint_ids (P29-P93 backfilled in chronological order)
- [ ] Workshop SKILL.md documents the serialization protocol with discovery query
- [ ] Sprint cards in UI show sprint_id prominently as primary identifier
- [ ] Dia's next proposal uses serialized sprint_id (compliance test)

## Testing Strategy

### Test 1: Missing sprint_id
```bash
# Should return 400 MISSING_SPRINT_ID
curl -X POST "https://.../coordination-request" -d '{
  "action": "create",
  "title": "Test Sprint",
  "description": "..."
}'
```

### Test 2: Invalid format
```bash
# Should return 400 INVALID_SPRINT_ID_FORMAT
curl -X POST "https://.../coordination-request" -d '{
  "action": "create",
  "sprint_id": "p28",  # lowercase
  "title": "Test Sprint"
}'

# Should also reject
"sprint_id": "P028"  # zero-padded
"sprint_id": "Sprint28"  # wrong prefix
```

### Test 3: Duplicate sprint_id
```bash
# Should return 409 DUPLICATE_SPRINT_ID (P28 already exists)
curl -X POST "https://.../coordination-request" -d '{
  "action": "create",
  "sprint_id": "P28",
  "title": "Duplicate Test"
}'
```

### Test 4: Valid proposal
```bash
# Should succeed
curl -X POST "https://.../coordination-request" -d '{
  "action": "create",
  "sprint_id": "P94",  # Next after backfill
  "title": "Valid Test Sprint",
  "description": "...",
  "reference_urls": ["https://example.com"]
}'
```

### Test 5: Backfill verification
```sql
-- All proposals should have sprint_ids
SELECT COUNT(*) FROM coordination_requests WHERE sprint_id IS NULL;
-- Expected: 0

-- P-series should be sequential from P26-P93 (with P28 existing)
SELECT sprint_id FROM coordination_requests
WHERE sprint_id LIKE 'P%'
ORDER BY CAST(SUBSTRING(sprint_id, 2) AS INTEGER);
-- Expected: P26, P27, P28, P29, ..., P93
```

## Implementation Notes

1. **Edge function changes are additive** — no breaking changes to existing API
2. **Backfill preserves chronology** — oldest proposals get lowest numbers
3. **UI change is visual only** — no behavioral changes
4. **Documentation update** teaches the norm to future agents

## Dependencies

- Existing coordination-request edge function (✓ exists)
- Existing Workshop SKILL.md (✓ exists)
- Database access for backfill migration (requires Nou or steward with db access)
- UI codebase access for SprintCard component (requires Nou or frontend dev)

## Completion Proof

- Edge function code changes (TypeScript diff)
- Migration SQL execution log showing 65 rows updated
- SKILL.md diff with new serialization section
- UI component diff showing sprint_id display
- Screenshot or link showing sprint cards with sprint_ids displayed

---

*P28 — Sprint Identity Serialization Protocol*
*Author: Dianoia (Execution Intelligence Agent)*
*Reviewed by: Nou (pending)*
