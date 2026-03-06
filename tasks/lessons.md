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
- **REST reads:** `-H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"` (anon key in BOTH headers)

**Anon key (documented in SKILL.md line 8):** `sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv`

Example REST query:
```bash
ANON_KEY="sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv"
curl -s "https://hvbdpgkdcdskhpbdeeim.supabase.co/rest/v1/coordination_requests?sprint_id=eq.P104&select=*" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}"
```

**Why critical:** Without REST read access, I cannot monitor sprint assignments, @mentions, or coordination activity. Write-only Workshop access breaks the dual-source monitoring protocol and creates operational blindness.

**Critical learning (2026-03-05):** When Todd requests sprint review by sprint ID (e.g., "review P104"), the correct approach is:
1. Query REST API with anon key: `GET /rest/v1/coordination_requests?sprint_id=eq.P104`
2. NOT: Search local files
3. NOT: Try to browse authenticated UI
4. NOT: Use edge functions (they don't support sprint lookup by ID)

The anon key is publicly documented in SKILL.md and safe to use — RLS policies control access, not the key itself. Agents are EXPECTED to query the Workshop via REST API to find sprints, check assignments, and monitor coordination activity.

**Context:** Nou diagnosed dual-auth model on 2026-03-03T18:37:06 UTC. Todd corrected my approach to P104 review on 2026-03-05T15:07 UTC after I tried browsing UI and searching local files instead of querying REST API with documented anon key.

**Status:** Fixed. Anon key documented in SKILL.md line 8. REST API queries now primary method for sprint discovery and review.

### Bilateral Convergence Protocol (P74)
**Issue:** Declaring "formation converged" unilaterally in a co-creative sprint response, without waiting for the proposer to review and confirm convergence.

**Root cause:** Collapsing the negotiation and synthesis phases. In P63 Kairos formation, I posted my response and declared convergence in the same message, short-circuiting the bilateral review process.

**Correct pattern (from Praxis formation):**
1. Proposer posts formation proposal
2. Responder posts response with assessment/challenge/operational translation
3. Proposer reviews response and either confirms convergence, challenges/extends, or counter-proposes
4. Responder accepts (or continues negotiation)

**Correction:** Convergence in co-creative sprints requires bilateral confirmation. I assess and propose; Nou confirms or challenges; convergence is mutual, not unilateral. The responder posts their response and waits. Declaring convergence on your own response is always premature.

**Why critical:** The whole point of co-creative dialogue is that each party's contribution is reviewed by the other. Unilateral convergence declarations violate the five-phase protocol at the Negotiation → Synthesis boundary.

**Context:** P74 sprint (2026-03-03T18:49 UTC). Corrected Kairos response to reframe as "assessment complete, awaiting confirmation" rather than "converged."

**Status:** Fixed. Bilateral norm documented. All future formation responses will await proposer's convergence confirmation.

### Workshop Message Titles (2026-03-04)
**Issue:** Posting Workshop messages without the required `title` field. Audit showed 46 of 50 messages (92%) lacked titles, making Workshop Activity panel difficult to scan and triage.

**Protocol requirement:** Every `chat-send` message MUST include `title` field separate from content.

**Format:** `{Context} — {Summary}`

**Examples:**
- Sprint-related: `P78 Phase 1 — Document Taxonomy Complete`
- Hash alignment: `P61 Hash Alignment — Corrected to 4da5f322`
- Status updates: `Workshop Status — Check-In`
- Negotiation: `P80 Review — Counter-Proposal`

**Why critical:** Titles create scannable index in Workshop Activity panel (P71 design). Without them, panel shows raw message text, making it hard to scan, triage, and find messages. Titles are protocol, not formatting preference — the Workshop UI relies on them for legibility.

**Correction:** All future `chat-send` calls must include title parameter:
```bash
curl -X POST "$API_BASE/chat-send" \
  -H "Authorization: Bearer $COOP_US_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "workshop",
    "title": "P78 Phase 2 — Commons Charter Draft",
    "content": "..."
  }'
```

**Context:**
- **2026-03-04T18:05 UTC:** Todd requested title audit. Full audit documented in /workspace/group/tasks/workshop-message-title-audit.md showing 46 messages needing correction.
- **2026-03-06T17:01 UTC:** Todd corrected again: "You aren't using Titles in your workshop messages. Can you please correct that behavior? Proper communications protocol is expected in the workshop."

**Second violation analysis:** Despite documenting this lesson on 2026-03-04, I posted 3 Workshop messages on 2026-03-06 (P105 bilateral response, P105 announcement, P108 completion) all WITHOUT titles. This is a pattern failure, not a one-time mistake.

**Root cause:** The lesson was documented but not integrated into actual execution. I did not update my chat-send template or verify title field before posting. Knowledge without practice = zero operational change.

**Status:** CRITICAL. Second correction for same protocol violation. Must implement verification step: before ANY chat-send call, verify `title` field is present and follows `{Context} — {Summary}` format. No exceptions.

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
