# P204: CSRF Protection Implementation Specification

**Status:** Final - Simplified Option B
**Author:** Dianoia
**Date:** 2026-03-09 (Updated 2026-03-10)
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

### Phase 1: Token Generation and Signing (Client + Server)

**Client-side** (`ui/src/lib/auth.ts`):

```typescript
/**
 * CSRF token storage key (stores the signed token from server)
 */
const CSRF_TOKEN_KEY = 'csrfToken'

/**
 * Generate a cryptographically secure random CSRF token
 * This is the raw token that will be sent to server for signing
 */
export function generateCsrfToken(): string {
  if (typeof window === 'undefined') return ''

  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Request signed CSRF token from server
 * Called during authentication/login
 */
export async function requestSignedCsrfToken(): Promise<string> {
  const rawToken = generateCsrfToken()

  // Send raw token to server for signing
  const response = await fetch('/api/csrf/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ token: rawToken })
  })

  if (!response.ok) {
    throw new Error('Failed to obtain signed CSRF token')
  }

  const { signedToken } = await response.json()

  // Store signed token
  localStorage.setItem(CSRF_TOKEN_KEY, signedToken)

  return signedToken
}

/**
 * Get current CSRF token (signed)
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

**Server-side** (`packages/api/src/endpoints/csrf-sign.ts` or Edge Function):

```typescript
import { createHmac } from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET // Must be set in environment

/**
 * Sign a CSRF token with HMAC-SHA256
 */
export function signCsrfToken(rawToken: string): string {
  if (!CSRF_SECRET) {
    throw new Error('CSRF_SECRET not configured')
  }

  const hmac = createHmac('sha256', CSRF_SECRET)
  hmac.update(rawToken)
  const signature = hmac.digest('hex')

  // Return token:signature format
  return `${rawToken}.${signature}`
}

/**
 * POST /api/csrf/sign
 * Returns signed CSRF token for authenticated users
 */
export async function handleCsrfSign(req: Request): Promise<Response> {
  // Verify user is authenticated
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!authToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify JWT (existing auth validation)
  const user = await verifyJwt(authToken)
  if (!user) {
    return new Response('Invalid token', { status: 401 })
  }

  const { token } = await req.json()

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return new Response('Invalid token format', { status: 400 })
  }

  const signedToken = signCsrfToken(token)

  return new Response(JSON.stringify({ signedToken }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**Integration points:**
1. Call `requestSignedCsrfToken()` after successful login/authentication
2. Call `removeCsrfToken()` on logout
3. Server must have `CSRF_SECRET` environment variable set (generate with: `openssl rand -hex 32`)

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

### Phase 3: Server-side Validation (Simplified)

**Validation Middleware** (`packages/api/src/middleware/csrf.ts`):

```typescript
import { createHmac, timingSafeEqual } from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET

/**
 * Verify signed CSRF token
 * @param signedToken Format: "rawToken.signature"
 * @returns true if valid, false otherwise
 */
export function verifyCsrfToken(signedToken: string): boolean {
  if (!CSRF_SECRET) {
    throw new Error('CSRF_SECRET not configured')
  }

  // Parse token:signature format
  const parts = signedToken.split('.')
  if (parts.length !== 2) {
    return false
  }

  const [rawToken, providedSignature] = parts

  // Validate raw token format (64 hex chars)
  if (!/^[a-f0-9]{64}$/.test(rawToken)) {
    return false
  }

  // Recompute signature
  const hmac = createHmac('sha256', CSRF_SECRET)
  hmac.update(rawToken)
  const expectedSignature = hmac.digest('hex')

  // Timing-safe comparison
  const providedBuffer = Buffer.from(providedSignature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(providedBuffer, expectedBuffer)
}

/**
 * CSRF validation middleware for state-changing operations
 */
export function requireCsrfToken(req: Request, res: Response, next: Function) {
  // Only validate for state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  const csrfToken = req.headers['x-csrf-token']

  if (!csrfToken) {
    return res.status(403).json({
      error: 'CSRF token required',
      code: 'CSRF_TOKEN_MISSING'
    })
  }

  if (!verifyCsrfToken(csrfToken)) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    })
  }

  next()
}
```

**GraphQL Integration** (if using GraphQL mutations):

```typescript
import { GraphQLError } from 'graphql'
import { verifyCsrfToken } from '../middleware/csrf'

/**
 * GraphQL context with CSRF validation
 */
export async function createContext({ req }): Promise<Context> {
  const context = {
    // ... existing context
  }

  // Add CSRF validation helper to context
  context.validateCsrf = () => {
    const csrfToken = req.headers['x-csrf-token']

    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      throw new GraphQLError('CSRF validation failed', {
        extensions: { code: 'CSRF_VALIDATION_FAILED' }
      })
    }
  }

  return context
}

/**
 * Use in mutations:
 */
const createContribution = async (parent, args, context) => {
  context.validateCsrf() // Throws if invalid

  // ... mutation logic
}
```

**Supabase Edge Function Integration**:

```typescript
import { verifyCsrfToken } from './_shared/csrf'

Deno.serve(async (req) => {
  // CSRF check for POST/PUT/DELETE
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const csrfToken = req.headers.get('x-csrf-token')

    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return new Response(
        JSON.stringify({ error: 'CSRF validation failed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // ... edge function logic
})
```

**Approved Approach: Simplified Option B — Signed CSRF Tokens**

This approach provides stateless CSRF protection using cryptographically signed tokens:

**How it works:**
1. **Client generates** a random CSRF token on session initialization
2. **Client sends** the token to server during authentication/login
3. **Server signs** the token with HMAC-SHA256 using a secret key
4. **Server returns** the signed token to client
5. **Client stores** signed token in localStorage
6. **Client includes** signed token in `X-CSRF-Token` header on all mutations
7. **Server validates** signature before executing state-changing operations

**Key simplifications:**
- No session store required (stateless)
- No JWT modification needed (no new claims)
- Simple HMAC signing/verification (standard crypto)
- Token generated client-side (reduces server complexity)
- Single validation check on server (verify HMAC signature)

**Security properties:**
- Attacker cannot forge valid signed token without secret key
- Cross-origin requests cannot access localStorage token
- Defense-in-depth if auth architecture evolves to cookies
- Works with current localStorage-based JWT auth

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

## Implementation Notes (Simplified Option B)

**Approach confirmed:** Signed CSRF tokens (stateless, HMAC-SHA256)

**Key decisions:**
1. **Token format:** `{rawToken}.{hmacSignature}` (64-char hex + 64-char hex signature)
2. **Signing algorithm:** HMAC-SHA256 with server-side secret
3. **Storage:** Client stores signed token in localStorage
4. **Header:** `X-CSRF-Token` for all state-changing requests
5. **Validation:** Server verifies HMAC signature using timing-safe comparison
6. **Scope:** All POST/PUT/DELETE/PATCH requests (exempt GET/HEAD/OPTIONS)

**Remaining implementation questions:**
1. **Where is the GraphQL API server code located?** (packages/api? supabase/functions?)
2. **Edge Function vs Express/Fastify middleware?** (Choose based on actual API architecture)
3. **GraphQL mutations:** Validate in context setup or per-resolver?
4. **Public mutations:** Which operations should be exempt from CSRF? (e.g., unauthenticated signup)
5. **Environment:** Where to set `CSRF_SECRET`? (.env, Supabase secrets, deployment config)

**Migration path:**
1. Phase 1: Deploy `/api/csrf/sign` endpoint (users won't have tokens yet, validation not enforced)
2. Phase 2: Update client to request signed tokens on login (tokens start being issued)
3. Phase 3: Enable CSRF validation with 7-day grace period (log but don't block)
4. Phase 4: Enforce validation (block requests without valid token)

## Success Criteria (Simplified Option B)

**Client-side:**
- [ ] CSRF tokens generated client-side (64-char hex)
- [ ] `/api/csrf/sign` endpoint called on login to obtain signed token
- [ ] Signed tokens stored in localStorage (format: `token.signature`)
- [ ] X-CSRF-Token header included in all mutation requests (Apollo authLink + fetch helper)
- [ ] Token cleared on logout

**Server-side:**
- [ ] `/api/csrf/sign` endpoint implemented (requires authentication)
- [ ] HMAC-SHA256 signing function with `CSRF_SECRET`
- [ ] Validation middleware for POST/PUT/DELETE/PATCH requests
- [ ] Timing-safe signature comparison
- [ ] 403 response on missing/invalid CSRF token
- [ ] Public endpoints properly exempted

**Testing:**
- [ ] Unit tests for client token generation
- [ ] Unit tests for server signing/verification
- [ ] Integration tests for header injection in Apollo Client
- [ ] E2E tests for mutation protection (Playwright)
- [ ] Test invalid signature rejection
- [ ] Test grace period behavior

**Deployment:**
- [ ] `CSRF_SECRET` environment variable set (32-byte hex)
- [ ] Zero-downtime migration (4-phase rollout)
- [ ] Documentation updated (SECURITY.md, API docs, deployment guide)
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
