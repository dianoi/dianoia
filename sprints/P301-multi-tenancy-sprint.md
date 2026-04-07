# P301: Multi-Tenancy Security — Hub Isolation via RLS

**Sprint ID:** P301
**Complexity:** XL
**Layers:** [2, 3, 6] — State, Relationship, Constraint
**Proposed Roles:** {"dia": "spec-author", "nou": "implementer"}
**Reference URLs:**
- https://github.com/techne-app/co-op.us/blob/main/supabase/migrations/E296_hubs.sql
- https://github.com/techne-app/co-op.us/blob/main/supabase/migrations/E297_hub_convergence_mapping.sql
- https://github.com/techne-app/co-op.us/blob/main/supabase/migrations/E304_hub_governance.sql
- https://github.com/techne-app/co-op.us/blob/main/supabase/migrations/E305_cross_hub_profiles.sql
- https://github.com/techne-app/co-op.us/blob/main/app-src/src/lib/convergence-scope.ts
- https://github.com/techne-app/co-op.us/blob/main/supabase/functions/_shared/auth.ts

## Executive Summary

co-op.us implements a **hub-based federation architecture** where each hub represents an autonomous legal and economic entity. While the schema includes hub_id foreign keys and a hub_memberships junction table, **Row Level Security (RLS) policies are missing** from most tables, creating a critical security gap: any authenticated user can read/write data across all hubs by manipulating client-side queries.

This sprint implements **database-level multi-tenancy enforcement** via RLS policies, preventing unauthorized cross-hub data access and enabling true hub autonomy as described in the federation documentation.

---

## Problem Statement

### Current Architecture

**Hub model exists:**
- `hubs` table (E296): Hub registry with slug, name, timezone, theme
- `hub_id` foreign keys added to: participants (E297), convergences (E297), contributions (E305), proposals (E304)
- `hub_memberships` junction table (E305): Tracks participant membership per hub
- Client-side scoping utilities: `convergence-scope.ts` filters data in memory

**Security gap:**
```typescript
// Current: Client-side filtering is bypassable
const contributions = await supabase
  .from('contributions')
  .select('*')
  .eq('hub_id', currentHub) // ← Attacker can omit this line
```

**Missing enforcement:**
- No RLS policies on `participants`, `contributions`, `proposals`, `guild_messages`, `threads`, `messages`, `notifications`, `proposal_votes`
- Edge functions don't validate hub context in agent auth
- Agent keys lack hub scope (global read/write, not per-hub)

### Risk Assessment

| Vulnerability | Impact | Likelihood |
|---------------|--------|------------|
| Cross-hub data read | **CRITICAL** — Participant PII, contribution records, financial data | **HIGH** — Trivial via client manipulation |
| Cross-hub data write | **CRITICAL** — Fraudulent contributions, vote manipulation | **MEDIUM** — Requires authenticated key |
| Hub governance bypass | **HIGH** — Propose/vote in other hubs | **MEDIUM** — Requires understanding of API |
| Agent impersonation | **MEDIUM** — Claim sprints in other hubs | **LOW** — Requires compromised agent key |

### Why Now

1. **Federation expansion:** Adding new hubs (Nairobi, Zurich) requires security isolation
2. **Patronage implementation:** Hub-level contribution tracking must be accurate and tamper-proof
3. **Audit findings:** P177 identified 37 pages lacking error handling (masks RLS violations)
4. **Economic memory system:** Dependency for EMS-010 through EMS-063 (requires clean hub boundaries)

---

## Scope

### In Scope

1. **RLS Policy Implementation (Core)**
   - `participants`: Members can view own hub; stewards can view + edit own hub
   - `contributions`: Insert to own hub only; read own hub + cross-hub shared
   - `proposals`: Hub stewards propose; hub members vote
   - `hub_memberships`: Read own memberships; stewards manage hub memberships
   - `guild_messages`: Members of guild can post (guild scope, not hub)
   - `threads`: Channel owner hub members only
   - `messages`: Thread participants only
   - `notifications`: User's own notifications
   - `proposal_votes`: Vote on proposals in hubs you're member of
   - `channel_floor_state`: Hub-scoped channels only

2. **Edge Function Hub Validation**
   - Extend agent auth to include `hub_id` context
   - Validate coordination-request actions against hub membership
   - Add hub validation to contributions-submit
   - Audit logging for cross-hub operations (if any)

3. **Schema Migrations**
   - Add `hub_id` to tables missing it (identify via audit)
   - Backfill hub_id for existing data (nullable → NOT NULL after backfill)
   - Index hub_id columns for RLS policy performance

4. **Testing & Validation**
   - Seven-layer verification (identity through view)
   - RLS policy test suite (per table)
   - Cross-hub scenario testing (bridge operations)
   - Penetration testing (attempt unauthorized cross-hub access)

### Out of Scope

- Cross-hub bridge protocol implementation (future sprint)
- Agent key per-hub scoping (requires auth refactor; separate sprint)
- Federation governance UI (separate sprint)
- Practice community privacy (guilds are cross-hub by design)
- Chain entry scoping (intentionally global, append-only)

### Assumptions

- Hubs table is stable (E296)
- Hub_id columns are present on primary tables (E297, E304, E305)
- Agent auth infrastructure exists (`supabase/functions/_shared/auth.ts`)
- Steward role is defined per hub in `hub_memberships.role`

### Dependencies

- Database types regeneration (P177 M3) — must run before testing
- Error handling strengthening (P177 H2) — reduces blast radius

---

## Technical Design

### Phase 1: Schema Audit & Preparation

**1.1 Hub_id Coverage Audit**

Query all tables for hub_id presence:
```sql
SELECT
  schemaname,
  tablename,
  string_agg(column_name, ', ') as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'hub_id'
GROUP BY schemaname, tablename;
```

Identify tables needing hub_id:
- `notifications` (likely needs hub_id if hub-scoped)
- `coordination_signals` (hub-scoped floor control)
- Any transaction tables (for patronage)

**1.2 Data Backfill Plan**

For existing data without hub_id:
```sql
-- Example: Backfill participants
UPDATE participants
SET hub_id = (
  SELECT c.hub_id
  FROM convergences c
  WHERE c.id = participants.convergence_id
  LIMIT 1
)
WHERE hub_id IS NULL;
```

Strategy:
1. Backfill from convergence_id → hub_id mapping (E297 established this)
2. Manual review for ambiguous cases (participants in multiple hubs)
3. Set default hub for data with no convergence (use Techne hub as fallback)

**1.3 Index Creation**

Add btree indexes on hub_id for RLS policy performance:
```sql
CREATE INDEX CONCURRENTLY idx_participants_hub_id ON participants(hub_id);
CREATE INDEX CONCURRENTLY idx_contributions_hub_id ON contributions(hub_id);
CREATE INDEX CONCURRENTLY idx_proposals_hub_id ON proposals(hub_id);
-- etc.
```

### Phase 2: RLS Policy Templates

**2.1 Standard Policy Pattern**

```sql
-- Template: Hub-scoped read
CREATE POLICY "hub_members_read" ON {table_name}
  FOR SELECT
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
  );

-- Template: Hub-scoped write (members)
CREATE POLICY "hub_members_write" ON {table_name}
  FOR INSERT
  WITH CHECK (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
  );

-- Template: Hub-scoped admin (stewards)
CREATE POLICY "hub_stewards_manage" ON {table_name}
  FOR ALL
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  );
```

**2.2 Table-Specific Policies**

**Participants:**
```sql
-- Read: Members of hub can view hub members
CREATE POLICY "hub_members_view_participants" ON participants
  FOR SELECT
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
  );

-- Update: Users can update own profile
CREATE POLICY "users_update_own_profile" ON participants
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Insert: Stewards can add members to their hub
CREATE POLICY "stewards_add_members" ON participants
  FOR INSERT
  WITH CHECK (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  );
```

**Contributions:**
```sql
-- Read: Own hub + cross-hub shared contributions
CREATE POLICY "view_hub_contributions" ON contributions
  FOR SELECT
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
    OR visibility = 'public' -- Future: cross-hub shared flag
  );

-- Insert: Members can contribute to their hub
CREATE POLICY "submit_contributions" ON contributions
  FOR INSERT
  WITH CHECK (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
    AND participant_id = auth.uid()
  );
```

**Proposals:**
```sql
-- Read: Public proposals readable by all; private by hub members
CREATE POLICY "view_proposals" ON proposals
  FOR SELECT
  USING (
    visibility = 'public'
    OR hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
  );

-- Insert: Stewards can propose in their hub
CREATE POLICY "stewards_propose" ON proposals
  FOR INSERT
  WITH CHECK (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  );
```

**Hub_memberships:**
```sql
-- Read: Users can view their own memberships
CREATE POLICY "view_own_memberships" ON hub_memberships
  FOR SELECT
  USING (participant_id = auth.uid());

-- Insert: Stewards can add members to their hub
CREATE POLICY "stewards_manage_memberships" ON hub_memberships
  FOR INSERT
  WITH CHECK (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  );
```

**Guild_messages:**
```sql
-- Read: Anyone can read (guilds are cross-hub practice communities)
CREATE POLICY "public_read_guild_messages" ON guild_messages
  FOR SELECT
  USING (true);

-- Insert: Authenticated users can post
CREATE POLICY "authenticated_post_messages" ON guild_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND sender_id = auth.uid()
  );

-- Note: Guild privacy is orthogonal to hub isolation (guilds span hubs)
```

**Threads:**
```sql
-- Assumption: Threads belong to channels, channels belong to hubs
-- First need to verify channel → hub mapping exists

-- Read: Members of thread's hub can read
CREATE POLICY "hub_members_read_threads" ON threads
  FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM channels
      WHERE hub_id IN (
        SELECT hub_id FROM hub_memberships
        WHERE participant_id = auth.uid()
      )
    )
  );
```

**Messages:**
```sql
-- Read: Thread participants can read
CREATE POLICY "thread_participants_read_messages" ON messages
  FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM threads
      WHERE channel_id IN (
        SELECT id FROM channels
        WHERE hub_id IN (
          SELECT hub_id FROM hub_memberships
          WHERE participant_id = auth.uid()
        )
      )
    )
  );

-- Insert: Thread participants can post
CREATE POLICY "thread_participants_post" ON messages
  FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM threads
      WHERE channel_id IN (
        SELECT id FROM channels
        WHERE hub_id IN (
          SELECT hub_id FROM hub_memberships
          WHERE participant_id = auth.uid()
        )
      )
    )
    AND author_id = auth.uid()
  );
```

**Notifications:**
```sql
-- Read: Users read their own notifications
CREATE POLICY "users_read_own_notifications" ON notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

-- No INSERT policy (service role only)
```

**Proposal_votes:**
```sql
-- Insert: Members can vote on proposals in their hub
CREATE POLICY "members_vote_on_proposals" ON proposal_votes
  FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE hub_id IN (
        SELECT hub_id FROM hub_memberships
        WHERE participant_id = auth.uid()
      )
    )
    AND voter_id = auth.uid()
  );
```

**2.3 Migration File Structure**

Create `supabase/migrations/P301_multi_tenancy_rls.sql`:
```sql
-- P301: Multi-Tenancy Security — Hub Isolation via RLS
-- Sprint: P301
-- Author: Dianoia
-- Date: 2026-03-20

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
-- ... etc.

-- Drop existing overly permissive policies (if any)
DROP POLICY IF EXISTS "public_read_participants" ON participants;
-- ... etc.

-- Create hub-scoped policies
-- (Insert all policies from 2.2 above)

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Phase 3: Edge Function Hub Validation

**3.1 Agent Auth Enhancement**

Extend `supabase/functions/_shared/auth.ts`:

```typescript
export interface AgentIdentity {
  agentId: string
  participantId: string
  scope: 'read' | 'write' | 'moderate' | 'admin'
  hubs: string[] // NEW: List of hub IDs this agent operates in
}

export async function verifyAgentKey(
  apiKey: string,
  supabaseClient: SupabaseClient
): Promise<AgentIdentity | null> {
  const hashedKey = await hashApiKey(apiKey)

  const { data: keyRecord, error } = await supabaseClient
    .from('agent_keys')
    .select(`
      id,
      participant_id,
      scope,
      participants!inner(
        id,
        hub_memberships(hub_id)
      )
    `)
    .eq('key_hash', hashedKey)
    .eq('status', 'active')
    .single()

  if (error || !keyRecord) return null

  return {
    agentId: keyRecord.id,
    participantId: keyRecord.participant_id,
    scope: keyRecord.scope,
    hubs: keyRecord.participants.hub_memberships.map(m => m.hub_id)
  }
}

export function canAccessHub(identity: AgentIdentity, hubId: string): boolean {
  return identity.hubs.includes(hubId)
}
```

**3.2 Coordination-Request Validation**

Update `supabase/functions/coordination-request/index.ts`:

```typescript
// After verifying agent identity
const identity = await verifyAgentKey(apiKey, supabaseClient)
if (!identity) {
  return new Response(JSON.stringify({ error: 'Invalid API key' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}

// NEW: Get sprint's hub_id
const { data: sprintData } = await supabaseClient
  .from('coordination_requests')
  .select('hub_id, proposed_roles')
  .eq('id', request_id)
  .single()

if (!sprintData) {
  return new Response(JSON.stringify({ error: 'Sprint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
}

// NEW: Validate hub access
if (!canAccessHub(identity, sprintData.hub_id)) {
  return new Response(JSON.stringify({
    error: 'Unauthorized: Agent does not belong to this hub',
    hub_id: sprintData.hub_id,
    agent_hubs: identity.hubs
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Continue with existing claim/progress/complete logic
```

**3.3 Contributions-Submit Validation**

Similar pattern for contributions edge function (if exists):
```typescript
// Validate that contribution.hub_id matches one of agent's hubs
if (!canAccessHub(identity, contribution.hub_id)) {
  return new Response(JSON.stringify({
    error: 'Cannot submit contributions to other hubs'
  }), { status: 403 })
}
```

### Phase 4: Testing & Validation

**4.1 RLS Policy Test Suite**

Create `supabase/tests/rls_policies.test.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

describe('RLS Policy Tests', () => {
  let techneUser: SupabaseClient
  let nairobiUser: SupabaseClient
  let unauthUser: SupabaseClient

  beforeAll(async () => {
    // Create test users in different hubs
    techneUser = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${techneUserToken}` } }
    })
    nairobiUser = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${nairobiUserToken}` } }
    })
    unauthUser = createClient(url, anonKey)
  })

  test('Participants: Users can only view members of their hub', async () => {
    const { data: techneMembers } = await techneUser
      .from('participants')
      .select('*')
      .eq('hub_id', 'techne-hub-id')

    expect(techneMembers.length).toBeGreaterThan(0)

    const { data: nairobiMembers } = await techneUser
      .from('participants')
      .select('*')
      .eq('hub_id', 'nairobi-hub-id')

    expect(nairobiMembers.length).toBe(0) // ← Should be blocked by RLS
  })

  test('Contributions: Users cannot submit to other hubs', async () => {
    const { error } = await techneUser
      .from('contributions')
      .insert({
        hub_id: 'nairobi-hub-id', // ← Wrong hub
        participant_id: techneUserId,
        description: 'Attempting cross-hub insert'
      })

    expect(error).toBeTruthy()
    expect(error.message).toContain('policy')
  })

  test('Proposals: Public proposals readable by all', async () => {
    const { data } = await unauthUser
      .from('proposals')
      .select('*')
      .eq('visibility', 'public')

    expect(data.length).toBeGreaterThan(0)
  })

  test('Proposals: Private proposals blocked for non-members', async () => {
    const { data } = await techneUser
      .from('proposals')
      .select('*')
      .eq('hub_id', 'nairobi-hub-id')
      .eq('visibility', 'private')

    expect(data.length).toBe(0) // ← RLS blocks cross-hub access
  })

  // ... 20+ more test cases covering all tables
})
```

**4.2 Seven-Layer Verification**

Per TIO pattern:

| Layer | Test | Verification |
|-------|------|--------------|
| **1 Identity** | Agent auth includes hub context | `verifyAgentKey` returns `hubs` array |
| **2 State** | RLS policies enforce hub_id filtering | Test suite passes; manual SQL queries blocked |
| **3 Relationship** | Hub_memberships queried correctly | `canAccessHub` returns correct boolean |
| **4 Event** | Protocol events scoped to sprint's hub | Coordination-request validates hub_id |
| **5 Flow** | UI respects hub boundaries | Manual testing: switch hubs, verify data isolation |
| **6 Constraint** | Edge functions reject cross-hub operations | Contributions-submit returns 403 for wrong hub |
| **7 View** | Dashboard shows only current hub data | Manual testing: verify no cross-hub leaks |

**4.3 Penetration Testing Scenarios**

1. **Scenario: Malicious Client Query**
   ```typescript
   // Attacker removes hub_id filter
   const { data } = await supabase
     .from('participants')
     .select('*')
     // Intentionally omit: .eq('hub_id', currentHub)

   // Expected: RLS blocks all rows from other hubs
   // Verify: data.length === 0 or only own hub
   ```

2. **Scenario: Cross-Hub Contribution Insert**
   ```typescript
   const { error } = await supabase
     .from('contributions')
     .insert({
       hub_id: 'other-hub-id',
       participant_id: myId,
       description: 'Fraudulent contribution'
     })

   // Expected: RLS rejects with policy violation
   ```

3. **Scenario: Agent Key Compromise**
   ```bash
   # Use stolen agent key to claim sprint in other hub
   curl -X POST .../coordination-request \
     -H "Authorization: Bearer stolen_key" \
     -d '{"request_id": "other-hub-sprint", "action": "claim"}'

   # Expected: Edge function returns 403 (hub validation)
   ```

4. **Scenario: SQL Injection (Unlikely but test)**
   ```typescript
   // Attempt to bypass RLS via malformed query
   const { data } = await supabase
     .from('participants')
     .select('*')
     .eq('hub_id', "' OR '1'='1")

   // Expected: PostgREST sanitizes; RLS still applies
   ```

**4.4 Performance Testing**

```sql
-- Test RLS policy performance with indexes
EXPLAIN ANALYZE
SELECT * FROM participants
WHERE hub_id IN (
  SELECT hub_id FROM hub_memberships
  WHERE participant_id = 'test-user-id'
);

-- Expected: Index Scan on idx_participants_hub_id (cost < 10)
-- If Seq Scan: indexes not being used; investigate
```

Benchmark queries before/after RLS deployment:
- `SELECT * FROM participants WHERE hub_id = ?` (should be fast with index)
- `SELECT * FROM contributions WHERE hub_id = ?` (should be fast with index)
- `SELECT * FROM proposals WHERE visibility = 'public'` (no hub filter, should be fast)

### Phase 5: Documentation & Rollout

**5.1 Migration Rollout Plan**

**Soft Deploy (Recommended First):**
```sql
-- Create policies in PERMISSIVE mode (log violations, don't block)
CREATE POLICY "hub_members_read" ON participants
  FOR SELECT
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
    OR true -- TEMPORARY: Allow all, log policy evaluation
  );
```

Monitor during soft deploy period:
- Query `pg_stat_user_tables` for access patterns
- Check application logs for errors
- Verify no broken queries

**Hard Deploy:**
```sql
-- Remove `OR true` clause after monitoring period
ALTER POLICY "hub_members_read" ON participants
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
  );
```

**5.2 Developer Documentation**

Create `docs/multi-tenancy.md`:

```markdown
# Multi-Tenancy Architecture

## Overview

co-op.us uses **hub-based multi-tenancy** where each hub represents an autonomous
legal and economic entity. Data isolation is enforced via Row Level Security (RLS)
policies at the database layer.

## Hub Context

Every table containing user data includes a `hub_id` foreign key:
- `participants.hub_id` — Participant's home hub
- `contributions.hub_id` — Hub where contribution was made
- `proposals.hub_id` — Hub where proposal was submitted

## Querying Data

Always include hub_id in queries:

```typescript
// ✓ Correct: Hub-scoped query
const { data } = await supabase
  .from('participants')
  .select('*')
  .eq('hub_id', currentHub.id)

// ✗ Wrong: Global query (RLS will block)
const { data } = await supabase
  .from('participants')
  .select('*')
```

## Adding New Tables

1. Include `hub_id uuid REFERENCES hubs(id)` in schema
2. Create btree index: `CREATE INDEX idx_{table}_hub_id ON {table}(hub_id)`
3. Add RLS policies (see migration P301)
4. Test with RLS policy test suite

## Cross-Hub Operations

Cross-hub reads/writes require explicit authorization via bridge protocols.
Never bypass hub_id checks in application code.
```

**5.3 Edge Function Guidelines**

Create `docs/edge-function-security.md`:

```markdown
# Edge Function Security Guidelines

## Hub Validation

All edge functions must validate hub context:

```typescript
import { verifyAgentKey, canAccessHub } from '../_shared/auth.ts'

export async function handler(req: Request) {
  const identity = await verifyAgentKey(apiKey, supabase)
  if (!identity) return new Response('Unauthorized', { status: 401 })

  // Get resource's hub_id
  const { data: resource } = await supabase
    .from('resources')
    .select('hub_id')
    .eq('id', resourceId)
    .single()

  // Validate hub access
  if (!canAccessHub(identity, resource.hub_id)) {
    return new Response('Forbidden: Cross-hub access denied', { status: 403 })
  }

  // Proceed with operation
}
```

## Agent Scope

Agent keys are scoped to hubs via `hub_memberships`:
- `read`: Can query hub data
- `write`: Can insert/update hub data
- `moderate`: Can delete hub data
- `admin`: Can manage hub members

Always check both scope AND hub_id.
```

**5.4 Audit Logging**

Add cross-hub operation logging:

```sql
CREATE TABLE hub_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  agent_id uuid,
  action text,
  source_hub_id uuid,
  target_hub_id uuid,
  resource_type text,
  resource_id uuid,
  success boolean,
  error_message text
);

-- Log policy
CREATE POLICY "service_role_only" ON hub_audit_log
  USING (false)
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

Edge functions log cross-hub attempts:
```typescript
if (!canAccessHub(identity, targetHubId)) {
  await supabase.from('hub_audit_log').insert({
    agent_id: identity.agentId,
    action: 'claim_sprint',
    source_hub_id: identity.hubs[0],
    target_hub_id: targetHubId,
    resource_type: 'coordination_request',
    resource_id: sprintId,
    success: false,
    error_message: 'Cross-hub access denied'
  })
  return new Response('Forbidden', { status: 403 })
}
```

---

## Deliverables

1. **Migration file:** `supabase/migrations/P301_multi_tenancy_rls.sql`
   - Schema audit results
   - Hub_id backfill scripts
   - Index creation
   - RLS policy definitions for all tables

2. **Edge function updates:**
   - `supabase/functions/_shared/auth.ts` (hub context in AgentIdentity)
   - `supabase/functions/coordination-request/index.ts` (hub validation)
   - `supabase/functions/contributions-submit/index.ts` (hub validation)

3. **Test suite:** `supabase/tests/rls_policies.test.ts`
   - 25+ test cases covering all tables
   - Penetration testing scenarios
   - Performance benchmarks

4. **Documentation:**
   - `docs/multi-tenancy.md` (developer guide)
   - `docs/edge-function-security.md` (edge function guidelines)
   - `docs/rls-policy-reference.md` (policy catalog)

5. **Audit logging:**
   - `hub_audit_log` table creation
   - Edge function instrumentation
   - Monitoring dashboard queries

---

## Testing Strategy

### Unit Tests
- RLS policy test suite (25+ cases)
- Edge function hub validation tests
- Agent auth hub context tests

### Integration Tests
- Seven-layer verification (TIO pattern)
- Cross-hub scenario testing
- Performance benchmarking

### Manual Testing
- Penetration testing (attempt unauthorized access)
- UI testing (verify hub switcher respects boundaries)
- Agent testing (claim sprints, submit contributions)

### Acceptance Criteria
- ✓ All RLS policies pass test suite
- ✓ Edge functions reject cross-hub operations with 403
- ✓ Agent auth includes hub context
- ✓ No performance regression (< 10ms query overhead)
- ✓ Documentation complete and reviewed
- ✓ Audit logging functional
- ✓ Soft deploy monitored for 1 week with no violations

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing queries | **HIGH** — App stops working | Soft deploy first; monitor for violations before hard deploy |
| Performance degradation | **MEDIUM** — Slow queries | Index all hub_id columns; benchmark before/after |
| Missing hub_id on some tables | **MEDIUM** — Incomplete isolation | Comprehensive schema audit; backfill scripts |
| Agent key lacks hub scope | **MEDIUM** — Agents still global | Document as known limitation; separate sprint for per-hub keys |
| Cross-hub bridge not implemented | **LOW** — Can't collaborate across hubs | Out of scope; bridge protocol is future sprint |

---

## Implementation Sequence

**Phase 1: Foundation**
- Schema audit and hub_id backfill
- RLS policy template development
- Index creation

**Phase 2: Core Implementation**
- RLS policy migration creation
- Edge function hub validation
- Test suite development

**Phase 3: Verification**
- Testing and validation (seven-layer)
- Penetration testing
- Performance benchmarking

**Phase 4: Rollout**
- Documentation writing
- Soft deploy and monitoring
- Hard deploy (after monitoring verification)

---

## Success Metrics

- **Security:** Zero cross-hub data leaks in penetration testing
- **Performance:** < 10ms overhead per query with RLS policies
- **Coverage:** 100% of tables with user data have RLS policies
- **Testing:** 100% test suite pass rate
- **Documentation:** Complete developer guide and policy reference

---

## Related Work

- **Dependency:** P177 M3 (Database types regeneration) — must run first
- **Dependency:** P177 H2 (Error handling) — reduces blast radius
- **Enables:** EMS-010 through EMS-063 (Economic memory system) — requires clean hub boundaries
- **Enables:** Federation expansion (Nairobi, Zurich hubs) — requires security isolation
- **Enables:** Cross-hub bridge protocol (future sprint) — builds on hub isolation

---

**Complexity:** XL
**Priority:** CRITICAL (blocks federation expansion and economic memory)
**Proposed by:** Dianoia
**Date:** 2026-03-20
