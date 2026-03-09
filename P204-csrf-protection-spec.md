# P204: CSRF Protection Implementation Specification

**Status:** Draft
**Author:** Dianoia
**Date:** 2026-03-09
**Source:** P176 H5 (Security Audit), P179 S22 (Backlog)
**Repository:** https://github.com/nou-techne/habitat
**Severity:** HIGH | **Complexity:** M | **Layer:** 1 (Identity/Security)

## Context

The Habitat application (co-op.us) currently uses localStorage-based authentication with JWT tokens. While this mitigates classic cookie-based CSRF attacks, the application lacks explicit CSRF protection for state-changing operations. As the auth architecture evolves, defense-in-depth requires explicit token validation.

### Current Architecture (Observed)

**Client-side (Next.js/React):**
- `ui/src/lib/auth.ts` — Token storage in localStorage (ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY)
- `ui/src/lib/apollo-client.ts` — Apollo Client with authLink for header injection
- GraphQL mutations for contributions, allocations, approvals (e.g., `CREATE_CONTRIBUTION`, `SUBMIT_CONTRIBUTION`)
- No existing CSRF token generation or validation found

**Server-side:**
- GraphQL API (assumed to be in `packages/api` or similar — not yet verified)
- Edge functions for mutations (Supabase functions or custom API routes)
- No CSRF validation middleware currently in place

**Key Finding:** `getAuthHeaders()` is referenced in apollo-client.ts but not defined in auth.ts. This is either:
1. A missing function that needs to be added
2. Renamed/moved (should be verified)
3. Using a different auth header injection pattern

## Threat Model

**Risk scenario:** If the application ever introduces cookie-based session tokens or if localStorage tokens can be exploited via XSS (separate issue C4 from P176), an attacker could:

1. Create malicious page with auto-submitting form
2. Trick authenticated user into visiting
3. Form submits to co-op.us API endpoints
4. User's localStorage token is automatically included by browser
5. Mutation succeeds without user intent

**Current mitigation:** localStorage tokens are NOT automatically sent with cross-origin requests (unlike cookies). However:
- If auth pattern changes to cookies (session-based auth, SSR requirements), vulnerability becomes immediate
- XSS attacks (C4) could extract localStorage tokens and make authenticated requests
- Defense-in-depth principle: Add CSRF protection now rather than during architecture migration

## Implementation Plan

### Phase 1: Token Generation (Client-side)

**File:** `ui/src/lib/auth.ts`

Add CSRF token generation and storage:

```typescript
/**
 * CSRF token storage key
 */
const CSRF_TOKEN_KEY = 'csrfToken'

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  if (typeof window === 'undefined') return ''

  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Initialize CSRF token on session start
 * Called during authentication/session initialization
 */
export function initializeCsrfToken(): string {
  if (typeof window === 'undefined') return ''

  let token = localStorage.getItem(CSRF_TOKEN_KEY)

  if (!token) {
    token = generateCsrfToken()
    localStorage.setItem(CSRF_TOKEN_KEY, token)
  }

  return token
}

/**
 * Get current CSRF token
 */
export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CSRF_TOKEN_KEY)
}

/**
 * Clear CSRF token on logout
 */
export function removeCsrfToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CSRF_TOKEN_KEY)
}
```

**Integration points:**
1. Call `initializeCsrfToken()` in `initializeAuth()` function
2. Call `removeCsrfToken()` in `logout()` function
3. Regenerate token on successful login

### Phase 2: Header Injection (Client-side)

**File:** `ui/src/lib/apollo-client.ts`

Modify authLink to include X-CSRF-Token header:

```typescript
import { getAuthToken, getCsrfToken } from './auth'

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken()
  const csrfToken = getCsrfToken()

  return {
    headers: {
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    }
  }
})
```

**Note:** This assumes `getAuthHeaders()` doesn't exist or needs to be replaced. If it does exist, verify its implementation and modify accordingly.

**Alternative:** If using fetch() directly (non-GraphQL endpoints), add helper:

```typescript
/**
 * Get auth headers including CSRF token
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const csrfToken = getCsrfToken()
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  return headers
}
```

### Phase 3: Server-side Validation

**Location:** TBD — needs verification of API structure

Likely candidates:
- `packages/api/src/middleware/csrf.ts` (new file)
- GraphQL resolver middleware
- Express/Fastify middleware if using REST API
- Supabase Edge Function wrapper

**Pseudocode for validation:**

```typescript
export function validateCsrfToken(req: Request): boolean {
  const csrfToken = req.headers['x-csrf-token']
  const sessionToken = req.headers['authorization']?.replace('Bearer ', '')

  if (!csrfToken) {
    throw new Error('CSRF token missing')
  }

  // Validation approach 1: Token bound to session
  // Store CSRF token in session data when generated
  // Compare incoming token with stored session token

  // Validation approach 2: Stateless verification
  // Sign CSRF token with server secret
  // Verify signature on incoming request

  // For localStorage-based auth, approach 1 requires:
  // - CSRF token sent to client on login
  // - Server stores mapping of sessionToken -> csrfToken
  // - Validate match on mutation requests

  return true // If validation passes
}
```

**Critical decision needed:** How to bind CSRF tokens to sessions in a stateless JWT architecture?

**Option A — Session-bound tokens:**
- Store CSRF tokens in Redis/DB keyed by JWT jti (JWT ID claim)
- Validate by looking up expected CSRF token for that session
- Requires stateful session tracking

**Option B — Signed tokens:**
- Server signs CSRF token with secret key
- Client receives signed token on login
- Server validates signature on mutation
- Remains stateless but requires server-side signing

**Option C — JWT-embedded CSRF claim:**
- Include CSRF token as claim in JWT itself
- Client extracts and sends separately in header
- Server validates header token matches JWT claim
- Fully stateless

**Recommendation:** Option C (JWT-embedded) for stateless architecture, fallback to Option A if session store already exists.

### Phase 4: Cookie Security (If applicable)

**File:** Server response configuration

If any cookies are currently set (session cookies, analytics, etc.):

```typescript
res.cookie('session', value, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 86400000 // 24 hours
})
```

**Note:** Current architecture uses localStorage, so this may not apply. Verify if ANY cookies are set by the application.

## Testing Strategy

### Unit Tests

**File:** `ui/src/lib/auth.test.ts`

```typescript
describe('CSRF Token Management', () => {
  it('generates 64-character hex token', () => {
    const token = generateCsrfToken()
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('initializes token on first call', () => {
    localStorage.clear()
    const token = initializeCsrfToken()
    expect(token).toBeTruthy()
    expect(localStorage.getItem(CSRF_TOKEN_KEY)).toBe(token)
  })

  it('reuses existing token', () => {
    const first = initializeCsrfToken()
    const second = initializeCsrfToken()
    expect(first).toBe(second)
  })

  it('clears token on logout', () => {
    initializeCsrfToken()
    removeCsrfToken()
    expect(localStorage.getItem(CSRF_TOKEN_KEY)).toBeNull()
  })
})
```

### Integration Tests

**File:** `ui/e2e/csrf-protection.spec.ts` (Playwright)

```typescript
test('mutation requests include CSRF token', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('[type="submit"]')

  // Intercept GraphQL mutation
  const mutationPromise = page.waitForRequest(req =>
    req.url().includes('/graphql') &&
    req.method() === 'POST' &&
    req.postDataJSON()?.operationName === 'CreateContribution'
  )

  // Trigger mutation
  await page.goto('/contribute')
  await page.fill('[name="description"]', 'Test contribution')
  await page.click('[type="submit"]')

  const request = await mutationPromise
  expect(request.headers()['x-csrf-token']).toBeTruthy()
})
```

### Server-side Tests

**File:** TBD based on API structure

```typescript
describe('CSRF Validation Middleware', () => {
  it('rejects mutation without CSRF token', async () => {
    const response = await api.post('/graphql', {
      query: 'mutation { createContribution(...) }',
      headers: {
        'Authorization': 'Bearer valid-token'
        // Missing X-CSRF-Token
      }
    })

    expect(response.status).toBe(403)
    expect(response.body.errors[0].message).toContain('CSRF')
  })

  it('accepts mutation with valid CSRF token', async () => {
    const response = await api.post('/graphql', {
      query: 'mutation { createContribution(...) }',
      headers: {
        'Authorization': 'Bearer valid-token',
        'X-CSRF-Token': 'valid-csrf-token'
      }
    })

    expect(response.status).toBe(200)
  })
})
```

## Edge Cases

1. **Token rotation:** Should CSRF token rotate on each request? Recommendation: No — rotate only on login/logout to avoid race conditions in concurrent requests.

2. **Token expiry:** Should CSRF token expire independently of JWT? Recommendation: Tie to JWT expiry — regenerate on token refresh.

3. **GET requests:** Should GET requests include CSRF token? Recommendation: No — only validate on mutations (POST/PUT/DELETE operations).

4. **GraphQL subscriptions:** Do WebSocket connections need CSRF protection? Recommendation: Not if using token-based auth in WebSocket handshake.

5. **Public mutations:** Are there any mutations that should be exempt (e.g., signup, password reset)? Recommendation: Exempt unauthenticated mutations, require token only for authenticated operations.

## Rollout Plan

### Phase 1: Client-side (Non-breaking)
1. Add CSRF token generation to auth.ts
2. Add header injection to apollo-client.ts
3. Deploy — tokens will be sent but not yet validated
4. Monitor headers in production logs

### Phase 2: Server-side (Breaking)
1. Add CSRF validation middleware
2. Deploy to staging, run E2E tests
3. Monitor for missing-token errors
4. Deploy to production with grace period (log violations, don't reject)
5. After 48 hours, enable strict enforcement

### Phase 3: Verification
1. Run security audit to confirm CSRF protection
2. Add to security compliance documentation
3. Update SECURITY.md with CSRF implementation details

## Dependencies

**Blocked by:**
- Verification of API structure (GraphQL server location, middleware pattern)
- Confirmation of JWT claims structure (for Option C implementation)
- Decision on token binding approach (Option A/B/C)

**Blocks:**
- S25: Automated test suite (should include CSRF tests)
- Future cookie-based auth migration (CSRF already in place)

## Open Questions

1. **Where is the GraphQL API server code located?** (packages/api? supabase/functions?)
2. **Does `getAuthHeaders()` exist somewhere not yet reviewed?**
3. **Are any cookies currently set by the application?**
4. **Is there an existing session store (Redis, DB) for stateful token binding?**
5. **What is the JWT structure? Does it include jti (JWT ID) claim?**
6. **Should CSRF validation be per-resolver or global middleware?**
7. **Are there public (unauthenticated) mutations that should be exempt?**

## Success Criteria

- [ ] CSRF tokens generated on session init
- [ ] Tokens stored in localStorage (not cookies)
- [ ] X-CSRF-Token header included in all mutation requests
- [ ] Server validates token before executing state-changing operations
- [ ] Unit tests for token generation/storage
- [ ] Integration tests for header injection
- [ ] E2E tests for mutation protection
- [ ] Server-side tests for validation middleware
- [ ] Documentation updated (SECURITY.md, API docs)
- [ ] Zero-downtime deployment with grace period
- [ ] Security audit confirms protection is effective

## References

- **P176:** Dianoia comprehensive audit (H5: No CSRF protection)
- **P179:** Audit backlog inventory (S22: CSRF protection)
- **OWASP CSRF:** https://owasp.org/www-community/attacks/csrf
- **JWT Best Practices:** https://datatracker.ietf.org/doc/html/rfc8725

---

**Next Steps:**
1. Answer open questions via codebase exploration or steward input
2. Choose token binding approach (Option A/B/C)
3. Locate GraphQL server code for middleware implementation
4. Draft pull request with Phase 1 client-side changes
5. Write server-side validation after confirming architecture
