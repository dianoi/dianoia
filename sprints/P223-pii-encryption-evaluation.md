# P223: PII Encryption Evaluation

**Sprint:** S31 (P223)
**Source:** P179 Tier 3 (Dianoia security assessment)
**Complexity:** M | **Severity:** MEDIUM
**Author:** Dianoia
**Date:** 2026-03-14

## Executive Summary

The `participants` table stores two PII fields in plaintext:
- `email` (text, nullable) — email addresses for notifications and contact
- `bio` (text) — user-provided biographical information

**Recommendation:** **Option C — Hybrid Approach** (Supabase Vault for email, plaintext bio with privacy controls)

This balances security (protecting the most sensitive PII), performance (no encryption overhead on frequently-displayed bio), regulatory compliance (email encryption for GDPR/CCPA), and implementation complexity.

---

## Current State

### Schema Analysis

```sql
-- participants table (simplified)
CREATE TABLE participants (
  id uuid PRIMARY KEY,
  auth_user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  email text,  -- PII: stored in plaintext
  bio text,    -- PII: stored in plaintext
  -- ... other fields
);
```

**Email usage:**
- Nullable (not all participants have email)
- Used for notification delivery (digest emails, immediate alerts)
- Not displayed publicly in UI
- Accessed primarily by backend edge functions for email delivery

**Bio usage:**
- Stores user-provided biographical information
- Displayed publicly on member profiles
- Frequently read for profile rendering
- User-controlled content (users choose what to share)

### Privacy Risk Assessment

**Email:**
- **HIGH sensitivity:** Direct identifier, can be used to contact/track users
- **Regulatory exposure:** GDPR Article 32 requires "appropriate technical measures" for personal data
- **Attack surface:** Database breach would expose all emails
- **Current visibility:** Backend-only (not exposed in public UI)

**Bio:**
- **MEDIUM sensitivity:** User-controlled disclosure, not a direct identifier
- **User expectation:** Bio is intended to be public/semi-public (like a social media profile)
- **Attack surface:** Already visible to application users
- **Privacy control:** User decides what to include

---

## Option A: Supabase Vault (Column-Level Encryption)

### Overview

Supabase Vault provides transparent column-level encryption using PostgreSQL's `pgsodium` extension. Encrypted columns are stored as `bytea` and decrypted via SQL functions.

### Implementation

```sql
-- Enable Vault
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create encryption key in Vault
SELECT pgsodium.create_key('participants-pii-key');

-- Add encrypted columns
ALTER TABLE participants
  ADD COLUMN email_encrypted bytea,
  ADD COLUMN bio_encrypted bytea;

-- Migrate existing data
UPDATE participants
SET email_encrypted = pgsodium.crypto_aead_det_encrypt(
  email::bytea,
  '{"context":"participants.email"}'::jsonb
);

UPDATE participants
SET bio_encrypted = pgsodium.crypto_aead_det_encrypt(
  bio::bytea,
  '{"context":"participants.bio"}'::jsonb
);

-- Drop plaintext columns after migration
ALTER TABLE participants
  DROP COLUMN email,
  DROP COLUMN bio;

-- Create views with automatic decryption
CREATE VIEW participants_decrypted AS
SELECT
  id,
  name,
  pgsodium.crypto_aead_det_decrypt(
    email_encrypted,
    '{"context":"participants.email"}'::jsonb
  )::text AS email,
  pgsodium.crypto_aead_det_decrypt(
    bio_encrypted,
    '{"context":"participants.bio"}'::jsonb
  )::text AS bio,
  -- ... other fields
FROM participants;
```

### Pros

✅ **Security:** Data encrypted at rest, keys stored in Vault (separate from data)
✅ **Compliance:** Meets GDPR "encryption of personal data" requirement
✅ **Transparent:** Application code can query `participants_decrypted` view without changes
✅ **Native:** Uses PostgreSQL built-in encryption, no external dependencies
✅ **Key rotation:** Vault supports key rotation workflows

### Cons

❌ **Performance:** Decryption overhead on every read (bio is frequently read for profiles)
❌ **Indexing:** Cannot index encrypted columns (breaks email uniqueness constraints)
❌ **Search:** Cannot perform LIKE queries on encrypted bio text
❌ **Complexity:** Migration requires careful orchestration (dual-column period, view updates)
❌ **Vault management:** Key rotation and Vault maintenance add operational overhead
❌ **RLS interaction:** Encrypted columns require view-based RLS (more complex policies)

### Cost

- **Development:** 8-12 hours (migration script, view setup, RLS policy updates, edge function updates)
- **Performance:** ~2-5ms decryption overhead per row read
- **Operational:** Ongoing Vault key management

---

## Option B: Application-Level Encryption (Edge Functions)

### Overview

Encrypt PII fields in application code (edge functions) before writing to database. Store encrypted values as `text` (base64-encoded ciphertext).

### Implementation

```typescript
// supabase/functions/shared/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Deno.env.get('PII_ENCRYPTION_KEY'); // 256-bit key
const ALGORITHM = 'aes-256-gcm';

export function encryptPII(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

export function decryptPII(encrypted: string): string {
  const [ivB64, authTagB64, ciphertext] = encrypted.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage in edge functions
const encryptedEmail = encryptPII(email);
await supabase.from('participants').update({ email: encryptedEmail });

const { data } = await supabase.from('participants').select('email');
const plainEmail = decryptPII(data.email);
```

### Pros

✅ **Flexibility:** Fine-grained control over when/what to encrypt
✅ **Performance:** No database overhead (encryption happens in app layer)
✅ **Simple migration:** No schema changes, just update edge functions
✅ **Key management:** Env var rotation is straightforward
✅ **Selective:** Can encrypt email only, leave bio plaintext

### Cons

❌ **Code complexity:** Every read/write path must handle encryption/decryption
❌ **Error-prone:** Easy to forget encryption in new edge functions
❌ **No indexing:** Encrypted text can't be indexed (breaks UNIQUE constraints)
❌ **No search:** Can't search encrypted bio without decrypting all rows
❌ **RLS bypass:** RLS policies see ciphertext, can't filter on plaintext values
❌ **Key exposure:** Encryption key lives in edge function env (more attack surface than Vault)

### Cost

- **Development:** 12-16 hours (encryption module, update all edge functions, testing)
- **Performance:** ~1-2ms encryption/decryption per operation (client-side)
- **Operational:** Key rotation requires redeploying all edge functions

---

## Option C: Hybrid Approach (Recommended)

### Overview

**Encrypt email via Supabase Vault** (high sensitivity, low read frequency).
**Leave bio as plaintext** (user-controlled content, high read frequency, publicly displayed).

### Rationale

**Email encryption justified:**
- Direct identifier with regulatory requirements
- Not displayed in UI (only used for backend email delivery)
- Low read frequency (only accessed when sending notifications)
- High sensitivity (personal contact information)

**Bio plaintext justified:**
- User-controlled disclosure (like a social media bio)
- High read frequency (displayed on every profile view)
- Already public-facing content
- User expectation: bio is meant to be visible
- Encryption would add overhead without meaningful privacy gain

### Implementation

```sql
-- Encrypt email only
ALTER TABLE participants
  ADD COLUMN email_encrypted bytea;

UPDATE participants
SET email_encrypted = pgsodium.crypto_aead_det_encrypt(
  email::bytea,
  '{"context":"participants.email"}'::jsonb
)
WHERE email IS NOT NULL;

ALTER TABLE participants DROP COLUMN email;

-- Create view with decrypted email
CREATE VIEW participants_with_email AS
SELECT
  id,
  name,
  bio,  -- plaintext, no change
  CASE
    WHEN email_encrypted IS NOT NULL THEN
      pgsodium.crypto_aead_det_decrypt(
        email_encrypted,
        '{"context":"participants.email"}'::jsonb
      )::text
    ELSE NULL
  END AS email,
  -- ... other fields
FROM participants;

-- Update RLS policies to use view
-- Edge functions query participants_with_email when email access needed
```

### Pros

✅ **Balanced security:** Protects most sensitive PII (email) while keeping bio performant
✅ **Regulatory compliance:** Email encryption satisfies GDPR/CCPA requirements
✅ **Performance:** No overhead on bio reads (majority of profile rendering)
✅ **Simpler migration:** Only one column to migrate
✅ **User expectations:** Bio remains visible as intended
✅ **Pragmatic:** Security effort focused where risk is highest

### Cons

❌ **Partial protection:** Bio still plaintext (but this matches user intent)
❌ **Dual schema:** Some queries use base table, some use view (documentation needed)

### Cost

- **Development:** 6-8 hours (email encryption migration, view setup, edge function updates)
- **Performance:** ~2ms overhead only when accessing email (rare)
- **Operational:** Vault management for email key only

---

## Comparison Matrix

| Criterion | Option A (Vault Both) | Option B (App-Level) | Option C (Hybrid) |
|-----------|----------------------|---------------------|-------------------|
| **Security** | Highest | Medium | High |
| **Performance** | Lowest (both encrypted) | Medium | Highest (bio plaintext) |
| **Complexity** | High (Vault + migration) | High (all edge functions) | Medium (email only) |
| **Compliance** | Full | Full | Full (email encrypted) |
| **User expectations** | Mismatch (bio meant to be visible) | Mismatch | Aligned |
| **Operational overhead** | Vault management | Key rotation in env | Vault management (email only) |
| **Search capability** | Lost | Lost | Retained (bio searchable) |
| **Migration effort** | 8-12 hours | 12-16 hours | 6-8 hours |

---

## Recommendation: Option C (Hybrid)

**Encrypt email via Supabase Vault. Leave bio as plaintext.**

### Justification

1. **Risk-aligned:** Email is a direct identifier requiring protection. Bio is user-controlled content already intended to be public.

2. **Performance:** Bio is read on every profile view. Encryption would add 2-5ms per profile without meaningful security benefit (content is already public-facing).

3. **User expectations:** Users write bios intending them to be visible. Encrypting bio would create a mismatch between user intent and implementation.

4. **Regulatory compliance:** GDPR/CCPA require "appropriate" measures for personal data. Encrypting email (direct identifier) meets this. Bio, being user-disclosed public content, has lower regulatory exposure.

5. **Pragmatic security:** Focus encryption effort where risk is highest. Email breach = direct contact/tracking capability. Bio breach = content user already chose to share.

6. **Search capability:** Keeping bio plaintext preserves full-text search for member discovery.

### Implementation Plan

**Phase 1: Email encryption (2 weeks)**

1. **Week 1 — Vault setup and migration script**
   - Enable `pgsodium` extension
   - Create encryption key in Vault
   - Write migration script (`migrations/P223-email-encryption.sql`)
   - Add `email_encrypted` column
   - Migrate existing email values
   - Create `participants_with_email` view

2. **Week 2 — Edge function updates and testing**
   - Update all edge functions that read email to use view
   - Update notification delivery functions
   - Test email delivery pipeline end-to-end
   - Verify RLS policies work with view
   - Drop plaintext `email` column after verification

**Phase 2: Documentation and privacy controls (1 week)**

3. **Documentation**
   - Document encryption approach in `docs/security/pii-encryption.md`
   - Update schema documentation
   - Add Vault key rotation procedure

4. **Privacy controls for bio**
   - Add bio visibility setting to `participants` (public/members-only/private)
   - Update RLS policies to respect visibility setting
   - UI toggle in profile settings

### Alternative: If full encryption required

If regulatory or policy requirements mandate encrypting bio despite performance costs, **Option A (Vault Both)** is preferred over **Option B (App-Level)** because:
- Vault encryption is more secure (keys separated from data)
- Database-level encryption is harder to bypass than app-level
- Operational overhead is similar (Vault vs env var key management)

---

## Open Questions for Steward Review

1. **Regulatory interpretation:** Does co-op.us's data processing require encrypting user-disclosed public content (bio), or is email encryption sufficient?

2. **Performance tolerance:** Is 2-5ms decryption overhead acceptable on profile views? (Current bio reads are <1ms)

3. **Bio visibility controls:** Should we implement visibility settings for bio (public/members-only/private) as part of this sprint, or defer to future work?

4. **Key rotation policy:** What is the desired key rotation schedule for Vault keys? (Recommendation: annual rotation)

5. **Backup encryption:** Are database backups encrypted at rest? (This affects overall security posture independent of column-level encryption)

---

## Retrospective (Post-Implementation)

*To be filled after sprint completion*

**What went well:**

**What to change:**

**Pattern to carry forward:**

---

## References

- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [PostgreSQL pgsodium Extension](https://github.com/michelp/pgsodium)
- [GDPR Article 32: Security of Processing](https://gdpr-info.eu/art-32-gdpr/)
- P179 Tier 3 Audit Backlog (S31)
- co-op.us `participants` table schema

---

**Next steps:** Steward review and decision on Option A/B/C. If Option C approved, proceed to Phase 1 implementation.
