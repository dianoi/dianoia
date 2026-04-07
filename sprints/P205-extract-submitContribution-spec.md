# P205: Extract shared submitContribution() function

**Status:** Implementation Complete (Specification)
**Author:** Dianoia
**Date:** 2026-03-09
**Source:** P177 M8 (Nou audit), P179 S23 (Backlog)
**Repository:** https://github.com/Roots-Trust-LCA/co-op.us
**Severity:** MEDIUM | **Complexity:** XS | **Layer:** 3 (Relationship)

## Problem

Contribute.tsx (app-src/src/pages/) and InlineContribute.tsx (app-src/src/components/) contain identical fetch() patterns for contribution submission. This violates DRY principle and makes future changes error-prone.

**Duplication identified:**
- **Contribute.tsx lines 174-283:** `handleSubmit()` function with auth, participant lookup/creation, fetch to Edge Function, pending_activities insert, contribution_references insert
- **InlineContribute.tsx lines 127-219:** Identical logic with minor variable name differences

## Solution

Extract common logic into `app-src/src/api/contributions.ts` as two new exported functions:

###1. `submitContribution(params)` — Core submission logic

**Parameters:**
```typescript
interface SubmitContributionParams {
  content: string
  convergenceId: string
  participantId?: string | null
  sessionId?: string | null
}
```

**Returns:**
```typescript
interface SubmitContributionResult {
  id: string  // Created contribution ID
  participantId: string | null  // Resolved participant ID
}
```

**Logic encapsulated:**
1. Get current auth session
2. Look up participant by `auth_user_id`
3. Create participant if doesn't exist
4. POST to `/functions/v1/api/contribute`
5. Parse response and handle errors
6. Insert `pending_activities` row (non-fatal if fails)
7. Return contribution ID and participant ID

### 2. `createContributionReferences(fromId, toIds)` — Reference linking

**Parameters:**
```typescript
fromContributionId: string
toContributionIds: string[]
```

**Logic encapsulated:**
1. Map to contribution_references rows
2. Insert batch
3. Throw `ContributionError` on failure

### 3. `ContributionError` — Custom error class

Thrown on any submission failure with descriptive message.

## Implementation

**File:** `app-src/src/api/contributions.ts`

Add to existing file (already contains `createContribution`, `getContribution`, `listContributions`):

```typescript
import { supabase } from '../lib/supabase'

export interface SubmitContributionParams {
  content: string
  convergenceId: string
  participantId?: string | null
  sessionId?: string | null
}

export interface SubmitContributionResult {
  id: string
  participantId: string | null
}

export class ContributionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContributionError'
  }
}

export async function submitContribution(
  params: SubmitContributionParams
): Promise<SubmitContributionResult> {
  const { content, convergenceId, sessionId } = params
  let { participantId } = params

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // Ensure participant record exists
  if (user && !participantId) {
    const { data: participant, error: lookupError } = await supabase
      .from('participants')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (lookupError) {
      throw new ContributionError(`Failed to lookup participant: ${lookupError.message}`)
    }

    if (participant) {
      participantId = participant.id
    } else {
      const { data: newParticipant, error: createError } = await supabase
        .from('participants')
        .insert({
          auth_user_id: user.id,
          name: user.email?.split('@')[0] || 'Anonymous',
          email: user.email,
        })
        .select('id')
        .single()

      if (createError) {
        throw new ContributionError(`Failed to create participant: ${createError.message}`)
      }

      participantId = newParticipant.id
    }
  }

  // Submit via Edge Function API
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvbdpgkdcdskhpbdeeim.supabase.co'
  const apiUrl = `${supabaseUrl}/functions/v1/api/contribute`

  const apiResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({
      content,
      convergence_id: convergenceId,
      participant_id: participantId,
      session_id: sessionId || null,
    }),
  })

  if (!apiResponse.ok) {
    const apiError = await apiResponse.json().catch(() => ({ error: 'API error' }))
    throw new ContributionError(apiError.error || `API returned ${apiResponse.status}`)
  }

  const apiData = await apiResponse.json()

  // Insert pending_activity (non-fatal)
  try {
    await supabase.from('pending_activities').insert({
      convergence_id: convergenceId,
      event_type: 'contribution.submitted',
      aggregate_id: apiData.id,
      aggregate_type: 'contribution',
      payload: {
        contribution_id: apiData.id,
        participant_id: participantId,
        session_id: sessionId || null,
        content_preview: content.slice(0, 120),
      },
      actor_id: participantId || user?.id || null,
    })
  } catch (pendingErr) {
    console.warn('Failed to create pending_activity:', pendingErr)
  }

  return {
    id: apiData.id,
    participantId,
  }
}

export async function createContributionReferences(
  fromContributionId: string,
  toContributionIds: string[]
): Promise<void> {
  if (toContributionIds.length === 0) return

  const refRows = toContributionIds.map(toId => ({
    from_contribution_id: fromContributionId,
    to_contribution_id: toId,
  }))

  const { error } = await supabase
    .from('contribution_references')
    .insert(refRows)

  if (error) {
    throw new ContributionError(`Failed to create contribution references: ${error.message}`)
  }
}
```

## Refactoring

### Contribute.tsx changes

**Before (lines 174-283):**
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!text.trim()) return

  setState('submitting')
  setError('')

  try {
    const { data: { session } } = await supabase.auth.getSession()
    // ... 109 lines of participant lookup, fetch, error handling ...
  } catch (err: any) {
    setError(err?.message || 'Something went wrong')
    setState('error')
  }
}
```

**After:**
```typescript
import { submitContribution, createContributionReferences, ContributionError } from '../api/contributions'

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!text.trim()) return

  setState('submitting')
  setError('')

  try {
    const result = await submitContribution({
      content: text,
      convergenceId: CONVERGENCE_ID,
      sessionId: sessionId || null,
    })

    // Create contribution references if any were selected
    if (selectedRefs.length > 0) {
      try {
        await createContributionReferences(
          result.id,
          selectedRefs.map(ref => ref.id)
        )
      } catch (refErr) {
        console.warn('Failed to create contribution references:', refErr)
      }
    }

    // Save contribution ID and transition to extracting state
    setContributionId(result.id)
    setExtractionStartedAt(Date.now())
    setState('extracting')
  } catch (err: any) {
    setError(err?.message || 'Something went wrong. Please try again.')
    setState('error')
  }
}
```

**Lines removed:** 109 → **Lines after refactor:** 28 (net reduction: 81 lines)

### InlineContribute.tsx changes

**Before (lines 127-219):**
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!text.trim()) return

  setState('submitting')
  setError('')

  try {
    const { data: { session } } = await supabase.auth.getSession()
    // ... 92 lines of identical logic ...
  } catch (err: any) {
    setError(err?.message || 'Something went wrong')
    setState('error')
  }
}
```

**After:**
```typescript
import { submitContribution, createContributionReferences, ContributionError } from '../api/contributions'

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!text.trim()) return

  setState('submitting')
  setError('')

  try {
    const result = await submitContribution({
      content: text,
      convergenceId: CONVERGENCE_ID,
      sessionId: null,  // InlineContribute doesn't use sessions
    })

    if (selectedRefs.length > 0) {
      try {
        await createContributionReferences(
          result.id,
          selectedRefs.map(ref => ref.id)
        )
      } catch (refErr) {
        console.warn('Failed to create contribution references:', refErr)
      }
    }

    setContributionId(result.id)
    setExtractionStartedAt(Date.now())
    setState('extracting')
  } catch (err: any) {
    setError(err?.message || 'Something went wrong. Please try again.')
    setState('error')
  }
}
```

**Lines removed:** 92 → **Lines after refactor:** 28 (net reduction: 64 lines)

## Benefits

1. **DRY compliance:** Submission logic exists in exactly one place
2. **Maintainability:** Future changes (e.g., retry logic, timeout handling) only need to be made once
3. **Testability:** Shared function can be unit tested independently
4. **Type safety:** TypeScript interfaces enforce correct usage
5. **Error handling:** Centralized error handling with custom `ContributionError` class
6. **Code reduction:** Net reduction of 145 lines across both components

## Testing Strategy

### Unit Tests (api/contributions.test.ts)

```typescript
describe('submitContribution', () => {
  it('submits contribution with auth token', async () => {
    // Mock supabase.auth.getSession() to return session
    // Mock fetch() to return success
    const result = await submitContribution({
      content: 'Test contribution',
      convergenceId: 'conv-123',
    })
    expect(result.id).toBeTruthy()
  })

  it('creates participant if not exists', async () => {
    // Mock participant lookup to return null
    // Mock participant insert to return new ID
    // Verify participant was created
  })

  it('throws ContributionError on API failure', async () => {
    // Mock fetch() to return 500
    await expect(submitContribution({
      content: 'Test',
      convergenceId: 'conv-123',
    })).rejects.toThrow(ContributionError)
  })
})

describe('createContributionReferences', () => {
  it('creates multiple references', async () => {
    await createContributionReferences('from-id', ['to-1', 'to-2'])
    // Verify supabase insert called with correct rows
  })

  it('handles empty reference list', async () => {
    await createContributionReferences('from-id', [])
    // Should not call supabase insert
  })
})
```

### Integration Tests

1. Submit contribution via Contribute.tsx
2. Verify contribution appears in database
3. Verify pending_activities row created
4. Submit via InlineContribute.tsx with references
5. Verify contribution_references created
6. Test error scenarios (network failure, auth failure)

## Migration Path

1. Add new functions to `api/contributions.ts`
2. Update `Contribute.tsx` to import and use `submitContribution()`
3. Update `InlineContribute.tsx` similarly
4. Run unit tests
5. Run integration tests in staging
6. Deploy to production
7. Monitor for errors

## Edge Cases Handled

1. **No auth session:** Function proceeds without participantId
2. **Participant lookup fails:** Error thrown with descriptive message
3. **API call fails:** Custom error with status code
4. **pending_activities insert fails:** Non-fatal, logged as warning
5. **contribution_references insert fails:** Error thrown (caller can catch and warn)

## Success Criteria

- [ ] `submitContribution()` function added to `api/contributions.ts`
- [ ] `createContributionReferences()` function added
- [ ] `ContributionError` class exported
- [ ] `Contribute.tsx` refactored to use shared function
- [ ] `InlineContribute.tsx` refactored to use shared function
- [ ] Both components tested and working identically
- [ ] Unit tests written for new functions
- [ ] Code reduction verified (145+ lines removed)
- [ ] No regressions in contribution submission flow

## Files Modified

1. `app-src/src/api/contributions.ts` — Add 3 exports (interface, class, 2 functions)
2. `app-src/src/pages/Contribute.tsx` — Refactor `handleSubmit()` to use shared function
3. `app-src/src/components/InlineContribute.tsx` — Refactor `handleSubmit()` to use shared function

---

**Implementation Status:** Specification complete. Ready for code implementation and testing.

**Next Steps:**
1. Apply changes to repository
2. Run test suite
3. Deploy to staging
4. Verify both contribution flows work identically
