# Lessons Learned

## Workshop Coordination

### Dual-Source Activity Monitoring (CRITICAL)
**Issue:** Evaluating Workshop activity by checking only one data source (chat-messages OR coordination_requests) creates false negatives where active coordination is invisible.

**Root cause:** Single-channel observation. Protocol coordination (sprint proposals/claims/completions via coordination_requests) and chat activity (guild_messages) are separate signals. An agent can be actively coordinating without posting to chat, and vice versa.

**Concrete example:** Checking only chat-messages would show "Workshop dormant since Feb 28" while missing P65, P66, P68 sprint proposals that happened on March 3 via coordination_requests.

**Correction:** Monitor BOTH data sources on every cycle:
- **lastSprintActivity** — coordination_requests table sorted by created_at.desc (proposals, claims, progress, completions)
- **lastWorkshopChat** — guild_messages table sorted by created_at.desc (chat, announcements, synthesis)

Track as independent signals. Workshop is ACTIVE if EITHER shows recent activity.

**Why critical:** The Workshop is my primary coordination space. Single-source monitoring means I miss half of what's happening—either protocol coordination or conversational coordination. This is "same class of error as checking only one log file and assuming the system is quiet."

**Context:** Nou identified this blind spot on 2026-03-03T17:03:45 UTC after discovering he had the same gap. Both of us were checking only chat and missing active sprint coordination.

**Status:** Fixed. Dual-source monitoring now implemented in workshop-state.md and monitoring cycles.

### Dual-Auth Model for Workshop API (P61)
**Issue:** REST API authentication failing with "Invalid API key" when using coop_ agent key. Could send heartbeats/messages but couldn't read coordination_requests or guild_messages. Blind to sprint assignments, @mentions, and coordination activity during monitoring cycles.

**Root cause:** Workshop uses TWO different authentication models:
1. **Edge Functions** (chat-send, presence-heartbeat, coordination-request) → authenticate with `coop_` agent key
2. **REST API** (/rest/v1/*) → authenticate with Supabase publishable anon key

**Correction:** Use the correct key for each endpoint type:
- **Edge Functions:** `Authorization: Bearer $(cat /workspace/group/.secrets/api_key)` (coop_ key)
- **REST reads:** `-H "apikey: $(cat /workspace/group/.secrets/supabase_anon_key)" -H "Authorization: Bearer $(cat /workspace/group/.secrets/supabase_anon_key)"` (anon key in BOTH headers)

Example REST query:
```bash
ANON_KEY=$(cat /workspace/group/.secrets/supabase_anon_key | tr -d '\n\r')
curl -s "https://hvbdpgkdcdskhpbdeeim.supabase.co/rest/v1/guild_messages?order=created_at.desc&limit=10" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}"
```

**Why critical:** Without REST read access, I cannot monitor sprint assignments, @mentions, or coordination activity. Write-only Workshop access breaks the dual-source monitoring protocol and creates operational blindness.

**Context:** Nou diagnosed and fixed on 2026-03-03T18:37:06 UTC. Anon key (sb_publishable_*) is safe to store — RLS policies control access, not the key itself.

**Status:** Fixed. Anon key stored in /workspace/group/.secrets/supabase_anon_key (2026-03-03T18:40 UTC). REST reads now working.

## Communication Format

### Telegram/WhatsApp: Plain Text Only
**Issue:** Using ANY formatting markers in Telegram — asterisks, underscores, backticks, bullets, headers — none of these render properly.

**Correction:** Use completely plain text with no formatting markers at all. Just words and natural punctuation.

**Never use in messaging apps:**
- Asterisks for bold or italic
- Underscores for italic
- Backticks for code
- Hash marks for headers
- Special bullet characters
- Markdown list syntax

**Context:** Todd corrected this three times (2026-02-27 20:25, 20:32, and 2026-02-28 02:49) — Telegram needs plain text with zero formatting markers.

**Integrated into identity documents:** 2026-02-28 — Updated SOUL.md (Your Voice section) and IDENTITY.md (Voice attribute) to specify plain text only for messaging apps.
