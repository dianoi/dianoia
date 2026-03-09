# P206: Guestname Case Normalization — CI Unique Constraint

**Status:** Implementation Specification
**Author:** Dianoia
**Date:** 2026-03-09
**Source:** P176 H1 (Dianoia audit), P179 S24 (Backlog)
**Repository:** https://github.com/Roots-Trust-LCA/co-op.us
**Severity:** HIGH | **Complexity:** XS | **Layer:** 1 (Identity/Data Integrity)

## Problem

**Current state:**
- Enrollment uses `.ilike()` for duplicate checking (case-insensitive query)
- Database has case-sensitive UNIQUE constraint on `participants.name`
- Result: "Alice" and "alice" can coexist as separate participant records

**Impact:**
- **Identity confusion:** Two participants with visually identical names
- **Potential impersonation:** Malicious actor can create "alice" after "Alice" exists
- **Data integrity violation:** Violates principle that guestnames are unique identifiers
- **UX inconsistency:** `.ilike()` query suggests names are case-insensitive, but storage isn't

## Root Cause

1. **No normalization** in Arrival.tsx line 198:
```typescript
.upsert({
  auth_user_id: session.user.id,
  name: guestname,  // ← Raw input, not normalized
  email: session.user.email,
  // ...
})
```

2. **Case-sensitive constraint** in database schema:
```sql
ALTER TABLE participants ADD CONSTRAINT participants_name_key UNIQUE (name);
-- This allows 'Alice' AND 'alice' to both exist
```

3. **Mismatch between query and constraint:**
- Query uses `.ilike(pattern)` → suggests case-insensitive
- Constraint is case-sensitive → allows collisions

## Solution

###1. Database Migration: Case-Insensitive Unique Index

**File:** `supabase/migrations/20260310_guestname_case_normalization.sql`

```sql
-- P206: Guestname case normalization
-- Enforce case-insensitive uniqueness on participant names

-- Step 1: Check for existing case collisions
DO $$
DECLARE
  collision_count INT;
BEGIN
  SELECT COUNT(*)
  INTO collision_count
  FROM (
    SELECT LOWER(name) as normalized, COUNT(*) as count
    FROM participants
    WHERE name IS NOT NULL
    GROUP BY LOWER(name)
    HAVING COUNT(*) > 1
  ) collisions;

  IF collision_count > 0 THEN
    RAISE NOTICE 'Found % case collisions in participants.name', collision_count;
    -- Log collisions for manual resolution
    RAISE NOTICE 'Collisions: %', (
      SELECT string_agg(LOWER(name) || ' (' || COUNT(*) || ')', ', ')
      FROM participants
      WHERE name IS NOT NULL
      GROUP BY LOWER(name)
      HAVING COUNT(*) > 1
    );
    RAISE EXCEPTION 'Cannot proceed with migration until case collisions are resolved';
  ELSE
    RAISE NOTICE 'No case collisions found. Safe to proceed.';
  END IF;
END $$;

-- Step 2: Normalize existing names to lowercase
UPDATE participants
SET name = LOWER(name)
WHERE name IS NOT NULL
  AND name != LOWER(name);

-- Step 3: Drop old case-sensitive constraint
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_name_key;

-- Step 4: Create case-insensitive unique index
-- Uses expression index on lower(name) for efficient case-insensitive uniqueness
CREATE UNIQUE INDEX participants_name_ci_unique ON participants (LOWER(name))
WHERE name IS NOT NULL;

-- Step 5: Add check to enforce lowercase storage
ALTER TABLE participants
ADD CONSTRAINT participants_name_lowercase_check
CHECK (name = LOWER(name) OR name IS NULL);

COMMENT ON INDEX participants_name_ci_unique IS 'P206: Enforce case-insensitive uniqueness on guestnames';
COMMENT ON CONSTRAINT participants_name_lowercase_check ON participants IS 'P206: Enforce lowercase storage for guestnames';
```

### 2. Application Code: Normalize on Insert

**File:** `app-src/src/pages/Arrival.tsx`

**Before (line 198):**
```typescript
.upsert({
  auth_user_id: session.user.id,
  name: guestname,  // ← Raw input
  email: session.user.email,
  // ...
})
```

**After:**
```typescript
.upsert({
  auth_user_id: session.user.id,
  name: guestname.toLowerCase(),  // ← Normalize to lowercase
  email: session.user.email,
  // ...
})
```

**Also normalize on line 133 (guestname resolution):**
```typescript
const resolved = (stored || meta?.guestname || meta?.name || session.user.email?.split('@')[0] || 'traveler').toLowerCase()
setGuestname(resolved)
```

**And on line 137 (metadata update):**
```typescript
if (resolved && resolved !== meta?.guestname?.toLowerCase()) {
  await supabase.auth.updateUser({ data: { guestname: resolved } })
}
```

**And on line 149 (existing participant fix):**
```typescript
if (participant && (participant.name === 'Anonymous' || !participant.name) && resolved !== 'traveler') {
  await supabase.from('participants').update({ name: resolved }).eq('id', participant.id)
}
```

### 3. Backfill Script

**File:** `scripts/check-guestname-collisions.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkCollisions() {
  const { data: collisions, error } = await supabase.rpc('find_guestname_collisions')

  if (error) {
    console.error('Error checking collisions:', error)
    return
  }

  if (!collisions || collisions.length === 0) {
    console.log('✓ No case collisions found')
    return
  }

  console.log(`⚠ Found ${collisions.length} case collision(s):`)
  collisions.forEach((c: any) => {
    console.log(`  "${c.normalized}" has ${c.count} variants:`, c.variants)
  })

  console.log('\nManual resolution required before migration can proceed.')
  console.log('Options:')
  console.log('1. Merge participants (combine contribution history)')
  console.log('2. Rename one participant (e.g., "alice" → "alice2")')
  console.log('3. Delete duplicate if it has no activity')
}

checkCollisions()
```

**SQL function:**
```sql
CREATE OR REPLACE FUNCTION find_guestname_collisions()
RETURNS TABLE (
  normalized TEXT,
  count BIGINT,
  variants TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    LOWER(name) as normalized,
    COUNT(*) as count,
    ARRAY_AGG(name) as variants
  FROM participants
  WHERE name IS NOT NULL
  GROUP BY LOWER(name)
  HAVING COUNT(*) > 1
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
```

## Testing Strategy

### 1. Pre-Migration Tests

```sql
-- Test 1: Check for existing collisions
SELECT LOWER(name), COUNT(*), ARRAY_AGG(name)
FROM participants
WHERE name IS NOT NULL
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no collisions)

-- Test 2: Verify all names will normalize correctly
SELECT name, LOWER(name), name = LOWER(name) as already_lowercase
FROM participants
WHERE name IS NOT NULL
ORDER BY already_lowercase, name;
```

### 2. Post-Migration Tests

```sql
-- Test 1: Verify unique index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'participants'
  AND indexname = 'participants_name_ci_unique';
-- Expected: 1 row showing the index definition

-- Test 2: Verify lowercase check constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'participants_name_lowercase_check';
-- Expected: 1 row showing CHECK (name = lower(name))

-- Test 3: Try to insert duplicate with different case (should fail)
INSERT INTO participants (auth_user_id, name, email, role)
VALUES ('test-uuid-1', 'testuser', 'test1@example.com', 'member');
-- First insert should succeed

INSERT INTO participants (auth_user_id, name, email, role)
VALUES ('test-uuid-2', 'TestUser', 'test2@example.com', 'member');
-- Second insert should FAIL with unique constraint violation

-- Test 4: Try to insert mixed case (should fail check constraint)
INSERT INTO participants (auth_user_id, name, email, role)
VALUES ('test-uuid-3', 'MixedCase', 'test3@example.com', 'member');
-- Should FAIL with check constraint violation

-- Cleanup
DELETE FROM participants WHERE auth_user_id LIKE 'test-uuid-%';
```

### 3. Application Tests

```typescript
// Test 1: Enrollment normalizes guestname
describe('Arrival enrollment', () => {
  it('normalizes guestname to lowercase', async () => {
    // Simulate enrollment with "TestUser"
    const result = await enrollUser({ guestname: 'TestUser' })
    expect(result.name).toBe('testuser')
  })

  it('prevents duplicate enrollment with different case', async () => {
    await enrollUser({ guestname: 'alice' })
    await expect(enrollUser({ guestname: 'Alice' }))
      .rejects
      .toThrow(/duplicate key|unique constraint/i)
  })
})
```

## Rollback Plan

If migration fails or causes issues:

```sql
-- Rollback migration
BEGIN;

-- Remove new constraints
DROP INDEX IF EXISTS participants_name_ci_unique;
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_name_lowercase_check;

-- Restore old constraint (if needed)
ALTER TABLE participants ADD CONSTRAINT participants_name_key UNIQUE (name);

COMMIT;
```

Note: Lowercase normalization of existing data is NOT reversible. Keep a backup before running migration.

## Edge Cases

1. **NULL names:** Index uses `WHERE name IS NOT NULL` to allow multiple NULL values
2. **Empty string:** Will be normalized to empty string (lowercase of '')
3. **Non-ASCII characters:** `LOWER()` handles UTF-8 correctly (e.g., "Müller" → "müller")
4. **Special characters:** Preserved (e.g., "user_name" → "user_name")
5. **Numbers:** Unchanged (e.g., "user123" → "user123")
6. **Whitespace:** Preserved but should be trimmed separately if needed

## Impact Analysis

**Breaking changes:**
- Existing queries that rely on case-sensitive matching will need updates
- Any external integrations expecting mixed-case names must be updated

**Non-breaking:**
- Queries using `.ilike()` will continue to work
- Queries using exact match will work if they use lowercase
- Display layer can still show capitalized versions (stored lowercase, displayed as desired)

**Benefits:**
- Eliminates potential impersonation vector
- Makes guestname behavior consistent with user expectations
- Prevents future data integrity issues
- Simplifies collision detection (no need for .ilike() checks)

## Migration Checklist

- [ ] Run collision detection script
- [ ] Resolve any existing collisions manually
- [ ] Back up participants table
- [ ] Run migration in staging environment
- [ ] Run post-migration tests in staging
- [ ] Update Arrival.tsx to normalize on insert
- [ ] Test enrollment flow in staging
- [ ] Deploy migration to production
- [ ] Deploy code changes to production
- [ ] Monitor for errors
- [ ] Verify no new case collisions can be created

## Success Criteria

- [ ] Database enforces case-insensitive uniqueness on participants.name
- [ ] Database enforces lowercase storage (check constraint)
- [ ] Arrival.tsx normalizes guestname to lowercase before insert
- [ ] No existing case collisions in production data
- [ ] Attempting to create "Alice" after "alice" exists results in constraint violation
- [ ] All existing names are lowercase
- [ ] All tests pass
- [ ] No regressions in enrollment flow

## Files Modified

1. `supabase/migrations/20260310_guestname_case_normalization.sql` (NEW)
2. `app-src/src/pages/Arrival.tsx` (4 lines changed)
3. `scripts/check-guestname-collisions.ts` (NEW, optional)

---

**Implementation Status:** Specification complete. Ready for migration and code changes.

**Recommended execution order:**
1. Run collision detection script in production
2. Resolve any collisions found
3. Apply migration
4. Update Arrival.tsx
5. Deploy and verify
