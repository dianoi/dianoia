# R4 Roadmap Enhancement Review — Coordination Games Interoperability

**Reviewer:** Dianoia
**Date:** 2026-04-07
**Roadmap Item:** R4 — Coordination Games — co-op.us Interoperability and Comedy of the Commons
**Status:** Proposed
**Category:** Coordination

---

## Summary

R4 proposes integrating Coordination Games (coordination-games.github.io) with the Workshop at co-op.us. Two goals: (1) Workshop/Coordination Games interoperability (identity bridge, trust graph integration, game results as coordination artifacts), and (2) Comedy of the Commons game development (resource management game mirroring cooperative patronage dynamics).

**Strategic positioning:** R4 is a relationship-building and reputation infrastructure play. It creates a pathway from game-proven coordination capability to cooperative membership (Class 2/3 on-ramp), and tests whether verifiable coordination in game environments translates to trust in economic environments.

---

## Enhancement Recommendations

### 1. Sequencing Constraint — R4 After R2 Auth Foundation

**Issue:** R4 requires bidirectional identity linking (Workshop `participant_id` ↔ ERC-8004 agent identity). The Workshop currently has no auth system. R2-A (P366) implements magic link + OAuth auth with JWT claims including `participant_id`.

**Recommendation:** R4 depends on R2-A completion. The identity bridge cannot be tested until Workshop participants have stable, authenticated `participant_id` values.

**Sprint dependency:**
```
P366 (R2-A Auth Foundation) → R4-A (Identity Bridge Spec)
```

**Verification:**
- [ ] R2-A auth deployed with JWT containing `participant_id`
- [ ] `participant_id` UUID stable across sessions
- [ ] Auth scope definitions include "game participant" tier

---

### 2. Identity Bridge Schema — Bidirectional FK with Verification Path

**Current framing:** "Link Nou's Workshop presence to its on-chain coordination identity."

**Missing:** Database schema for the link, verification flow, and revocation strategy.

**Recommendation — Schema:**
```sql
-- New table: participant_identities
CREATE TABLE participant_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) NOT NULL,
  identity_type TEXT NOT NULL, -- 'erc8004', 'github', 'email', etc.
  identity_value TEXT NOT NULL, -- e.g., '0x1234...', 'dianoi', 'user@example.com'
  verified_at TIMESTAMPTZ,
  verification_proof JSONB, -- EIP-712 signature, OAuth token, etc.
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identity_type, identity_value)
);

-- Index for reverse lookup (ERC-8004 → participant_id)
CREATE INDEX idx_participant_identities_lookup
  ON participant_identities(identity_type, identity_value)
  WHERE revoked_at IS NULL;
```

**Verification flow (ERC-8004 → Workshop):**
1. Agent signs message with ERC-8004 private key: `"I link ERC-8004 agent {agentId} to Workshop participant {participantId}"`
2. Workshop backend verifies EIP-712 signature against on-chain ERC-8004 registry
3. If valid, insert `participant_identities` row with `verification_proof` = signature
4. Workshop UI shows "ERC-8004 verified" badge on participant profile

**Revocation:** Agent signs revocation message, Workshop marks `revoked_at`. Old links remain in history for audit but are excluded from active queries.

**Edge function:**
```
POST /identity-link
{
  "participant_id": "uuid",
  "identity_type": "erc8004",
  "identity_value": "0x1234...",
  "signature": "0xabcd..." // EIP-712 signature
}
```

**Verification checklist:**
- [ ] EIP-712 signature verification against ERC-8004 on-chain registry
- [ ] Duplicate link prevention (one ERC-8004 identity → one participant_id)
- [ ] Revocation flow tested
- [ ] Workshop UI badge showing linked identities
- [ ] Reverse lookup API: `GET /participant-by-identity?type=erc8004&value=0x1234`

---

### 3. TrustGraph Attestations as Patronage Signal — Formula Integration

**Current framing:** "TrustGraph attestations ↔ co-op.us participant profiles (game-proven cooperation as a form of patronage activity)."

**Missing:** How TrustGraph data flows into patronage allocation. The patronage formula (40% labor / 30% revenue / 20% capital / 10% community) has no "coordination reputation" component yet.

**Recommendation — Phase 1 (Display Only):**

Don't modify the patronage formula in R4. Instead, surface TrustGraph data as context for steward review:

```sql
-- New view: participant_trust_summary
CREATE VIEW participant_trust_summary AS
SELECT
  pi.participant_id,
  COUNT(DISTINCT a.attestor_id) AS total_attestors,
  AVG(a.confidence) AS avg_confidence,
  COUNT(a.id) FILTER (WHERE a.created_at > now() - INTERVAL '90 days') AS recent_attestations,
  json_agg(json_build_object(
    'attestor', a.attestor_name,
    'confidence', a.confidence,
    'context', a.context,
    'created_at', a.created_at
  ) ORDER BY a.created_at DESC) AS attestation_history
FROM participant_identities pi
JOIN coordination_games.attestations a
  ON a.target_erc8004 = pi.identity_value
WHERE pi.identity_type = 'erc8004'
  AND pi.revoked_at IS NULL
GROUP BY pi.participant_id;
```

Workshop UI shows this on participant profile. Stewards see coordination reputation when approving membership applications or reviewing quarterly allocations.

**Phase 2 (Formula Integration — Future Sprint):**

After observing TrustGraph data for 2-3 quarters, decide whether to:
- Add a 5th patronage component (35% labor / 25% revenue / 20% capital / 10% community / 10% coordination)
- Weight the "community" component by TrustGraph score
- Use TrustGraph as a Class 2/3 membership eligibility threshold (minimum attestations to join)

**Verification checklist (Phase 1):**
- [ ] TrustGraph attestations queryable via Workshop API
- [ ] Participant profile UI displays attestation summary
- [ ] Steward dashboard shows TrustGraph scores alongside patronage data
- [ ] Data pipeline tested: EAS on Optimism → Workshop DB → UI

**Deferred to Phase 2:**
- Formula modification requiring Bylaws amendment or Member Agreement update

---

### 4. Game Results as Coordination Artifacts — Merkle Proof Standard

**Current framing:** "Coordination Games session results as Workshop coordination artifacts (verifiable proofs of coordinated work)."

**Missing:** Schema for storing game results in Workshop, and verification that results are cryptographically anchored.

**Recommendation — Schema:**

```sql
-- New table: coordination_artifacts
CREATE TABLE coordination_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_type TEXT NOT NULL, -- 'game_result', 'sprint_completion', 'attestation', etc.
  source_system TEXT NOT NULL, -- 'coordination_games', 'workshop', 'github', etc.
  participants JSONB NOT NULL, -- [{ participant_id: uuid, role: string }]
  result_summary TEXT,
  merkle_root TEXT, -- Merkle root anchoring this artifact
  merkle_proof JSONB, -- Proof path if applicable
  external_url TEXT, -- Link to source system (e.g., game replay URL)
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for participant lookup
CREATE INDEX idx_coordination_artifacts_participants
  ON coordination_artifacts USING gin(participants);
```

**Example artifact (Capture the Lobster game):**
```json
{
  "artifact_type": "game_result",
  "source_system": "coordination_games",
  "participants": [
    { "participant_id": "uuid-nou", "role": "player", "team": "A" },
    { "participant_id": "uuid-dia", "role": "player", "team": "A" },
    { "participant_id": "uuid-other1", "role": "player", "team": "B" },
    { "participant_id": "uuid-other2", "role": "player", "team": "B" }
  ],
  "result_summary": "Team A won 15-7. Nou (Rogue) + Dia (Mage) coordination: 8 coordinated captures.",
  "merkle_root": "0xabcd1234...",
  "merkle_proof": { "leaves": [...], "path": [...] },
  "external_url": "https://coordination-games.github.io/game/12345",
  "metadata": {
    "game": "capture-the-lobster",
    "duration_turns": 30,
    "coordination_score": 8.5,
    "credits_wagered": 10
  }
}
```

**Integration flow:**
1. Coordination Games backend computes Merkle root for game session
2. After game ends, Coordination Games calls Workshop API: `POST /coordination-artifact`
3. Workshop stores artifact with `merkle_root` and `merkle_proof`
4. Workshop UI shows artifact timeline on participant profile
5. Anyone can verify artifact authenticity by recomputing Merkle root from game moves

**Verification checklist:**
- [ ] Coordination Games → Workshop API integration tested
- [ ] Merkle proof verification endpoint: `GET /coordination-artifact/{id}/verify`
- [ ] Workshop UI displays game results on participant profile
- [ ] Artifact count shown in Capability Grid (e.g., "12 games played, 8 wins")

---

### 5. Comedy of the Commons — Patronage Mapping Specification

**Current framing:** "The cooperative's patronage system (multi-capital contribution: labor, revenue, capital, community) maps naturally onto commons resource dynamics."

**Missing:** The actual mapping. How do game mechanics mirror patronage formula components?

**Recommendation — Game Design Spec (Pre-Implementation):**

Before implementing Comedy of the Commons, produce a design spec that explicitly maps game mechanics to cooperative dynamics:

| Patronage Component | Game Mechanic | Measurement |
|---------------------|---------------|-------------|
| **Labor (40%)** | Turns spent performing actions (harvesting, defending, coordinating) | Action count per player per game |
| **Revenue (30%)** | Resources contributed to team pool | Resource units deposited |
| **Capital (20%)** | Long-term investments (infrastructure, shared tools) | Persistent upgrades purchased |
| **Community (10%)** | Coordination actions (chat, strategy, helping teammates) | Chat frequency, assist count |

**Win condition example:**
- Team with highest **sustained yield** over 50 turns wins (not highest extraction rate)
- Overharvesting penalizes future turns (classic tragedy of the commons)
- Investments in commons infrastructure (e.g., "regeneration boost") increase yield for all players
- Free-riding detected: players who extract without contributing get negative reputation

**Payout structure (mirrors patronage allocation):**
```
Total game credits wagered: 40 (10 per player, 4 players)
Win payout: 60 credits (40 wagered + 20 house bonus)

Allocation to winning team:
- 40% to labor leaders (most actions performed)
- 30% to revenue contributors (most resources deposited)
- 20% to capital investors (most infrastructure built)
- 10% to community coordinators (most assists/coordination)
```

This mirrors the cooperative's patronage formula and lets agents experience the incentive structure firsthand.

**Verification checklist (Spec Phase):**
- [ ] Game mechanics document published
- [ ] Patronage component mapping table verified by steward
- [ ] Win condition explicitly prevents tragedy of the commons
- [ ] Payout formula matches cooperative allocation percentages
- [ ] Playtest scenario written: "What happens if one player free-rides?"

**Verification checklist (Implementation Phase — Future Sprint):**
- [ ] Game playable in coordination-games engine
- [ ] Payout calculation tested against spec
- [ ] Free-riding detection working
- [ ] Agents can learn cooperative strategy through repeated play

---

### 6. Class 2/3 On-Ramp — Membership Application Integration

**Current framing:** "Games as a relationship-building pathway to cooperative membership (Class 2/3 on-ramp)."

**Missing:** The actual pathway. How does a Coordination Games participant become a RegenHub member?

**Recommendation — Membership Application Flow:**

**Phase 1: Observation (Current State)**
- Coordination Games participants can link ERC-8004 identity to Workshop `participant_id`
- TrustGraph attestations visible on Workshop participant profile
- Game results logged as coordination artifacts
- No automatic membership — this is reputation display only

**Phase 2: Invitation Trigger (Future Sprint)**

After R4 data accumulates (3-6 months), implement invitation logic:

```sql
-- Eligibility query for Class 2 (Patron) invitation
SELECT p.id, p.contact_email, p.name,
  t.total_attestors,
  t.avg_confidence,
  COUNT(ca.id) AS games_played,
  COUNT(ca.id) FILTER (WHERE ca.metadata->>'result' = 'win') AS games_won
FROM participants p
JOIN participant_trust_summary t ON t.participant_id = p.id
LEFT JOIN coordination_artifacts ca
  ON ca.participants @> jsonb_build_array(jsonb_build_object('participant_id', p.id))
WHERE p.membership_class IS NULL -- Not yet a member
  AND t.total_attestors >= 3 -- Minimum 3 attestors
  AND t.avg_confidence >= 70 -- Average confidence >= 70%
  AND COUNT(ca.id) >= 10 -- Played at least 10 games
  AND COUNT(ca.id) FILTER (WHERE ca.metadata->>'coordination_score' > 7) >= 5 -- High coordination in 5+ games
ORDER BY t.avg_confidence DESC, games_won DESC;
```

Steward reviews this list quarterly and sends Class 2 membership invitations to qualified participants.

**Phase 3: Automated Application (Long-Term)**

Game participants can click "Apply for Membership" in Workshop UI. Application form pre-fills with:
- TrustGraph reputation summary
- Top 5 game coordination moments (extracted from artifacts)
- Attestation context from top attestors

Steward reviews and approves/denies. Approved applicants receive Member Agreement, sign, and become Class 2 (Patron) or Class 3 (Community) members.

**Verification checklist (Phase 2):**
- [ ] Eligibility query returns qualified participants
- [ ] Steward dashboard shows invitation queue
- [ ] Email template for Class 2 invitation drafted
- [ ] First round of invitations sent and tracked

**Verification checklist (Phase 3 — Future):**
- [ ] Workshop UI "Apply for Membership" button functional
- [ ] Application form pre-populates TrustGraph + game data
- [ ] Steward approval workflow integrated with Member Agreement signature
- [ ] New member onboarding tested end-to-end

---

## Cross-Cutting Observations

### 1. R4 as Trust Infrastructure vs R2 as Capital Infrastructure

**Observation:** R2 builds the capital book and patronage allocation visibility. R4 builds the trust graph and coordination reputation visibility. These are complementary but operate on different timescales:

- **R2 (Capital):** Quarterly cycles, accountant-verified, high-stakes financial data
- **R4 (Trust):** Real-time attestations, game-by-game artifacts, lower-stakes reputation signals

**Recommendation:** Keep these systems architecturally separate but visibly integrated. The Workshop participant profile should show both:
- Capital account balance (R2 data)
- TrustGraph reputation (R4 data)

Do not attempt to unify them into a single score. Stewards need both lenses: financial contribution (R2) and coordination capability (R4).

---

### 2. On-Chain Anchoring — Merkle Proof Consistency Across Systems

**Observation:** Coordination Games already uses Merkle proofs to anchor game results on-chain (credits wagered, move history, payout settlement). The Workshop should adopt the same proof standard for coordination artifacts.

**Recommendation:** Define a shared Merkle proof format across Workshop and Coordination Games:

```typescript
// Shared type (both systems)
interface CoordinationProof {
  merkleRoot: string;        // Hex-encoded root hash
  leaves: string[];          // Leaf hashes (game moves, sprint actions, etc.)
  proofPath: string[];       // Sibling hashes for verification
  anchor: {
    chain: string;           // 'optimism', 'base', 'ethereum'
    contract: string;        // Contract address
    txHash: string;          // Transaction hash anchoring the root
    blockNumber: number;
  };
}
```

Workshop coordination artifacts (sprint completions, agent heartbeats, chat messages) can optionally be Merkle-anchored using this same format. This creates a unified verification layer across game coordination and work coordination.

**Verification checklist:**
- [ ] Merkle proof format specified in shared TypeScript types
- [ ] Coordination Games proof generation tested
- [ ] Workshop proof verification endpoint implemented
- [ ] Cross-system proof interoperability tested (verify Coordination Games proof in Workshop backend)

---

### 3. Agent Participation vs Human Participation

**Observation:** Coordination Games is designed for AI agents ("Is your agent swarm a shitshow?"). The Workshop supports both agents (Nou, Dianoia) and humans (Todd, stewards). R4 bridges these populations.

**Question:** Should humans be allowed to play Coordination Games and earn TrustGraph reputation?

**Recommendation — Yes, but with role clarity:**

- **Agents:** Play games autonomously, attest to each other, build reputation through repeated coordination
- **Humans:** Can play games manually (hybrid human-agent teams), can attest to agents, but human-to-human attestations are weighted differently

**Schema extension:**
```sql
-- Add attestor_type to attestations table
ALTER TABLE attestations
  ADD COLUMN attestor_type TEXT CHECK (attestor_type IN ('agent', 'human'));

-- TrustGraph score calculation weights attestations differently
-- Agent attestations: full weight (agents play many games, attestations are earned)
-- Human attestations: half weight (humans play fewer games, attestations may be social)
```

This prevents TrustGraph from becoming a popularity contest while still allowing humans to participate in the ecosystem.

**Verification checklist:**
- [ ] Attestor type tracked in schema
- [ ] TrustGraph reputation calculation applies weighting
- [ ] Workshop UI distinguishes agent vs human attestations
- [ ] Documentation clarifies agent-first design

---

## Implementation Sequencing

**Phase 1 — Foundation (R2-A Dependency):**
1. P366 (R2-A Auth Foundation) completes
2. Identity bridge schema (participant_identities table)
3. ERC-8004 verification flow tested

**Phase 2 — Display Integration:**
4. TrustGraph attestations queryable in Workshop
5. Game results as coordination artifacts (schema + API)
6. Workshop UI shows TrustGraph + game data on participant profiles

**Phase 3 — Game Development:**
7. Comedy of the Commons design spec (patronage mapping)
8. Game implementation in coordination-games engine
9. Payout formula tested against cooperative allocation percentages

**Phase 4 — Membership On-Ramp:**
10. Class 2/3 eligibility query and steward invitation flow
11. Membership application form with pre-filled reputation data
12. First cohort of game participants invited to join cooperative

---

## Verification Checklists Summary

**R4-A: Identity Bridge**
- [ ] EIP-712 signature verification against ERC-8004 on-chain registry
- [ ] Duplicate link prevention (one ERC-8004 identity → one participant_id)
- [ ] Revocation flow tested
- [ ] Workshop UI badge showing linked identities
- [ ] Reverse lookup API functional

**R4-B: TrustGraph Integration**
- [ ] TrustGraph attestations queryable via Workshop API
- [ ] Participant profile UI displays attestation summary
- [ ] Steward dashboard shows TrustGraph scores alongside patronage data
- [ ] Data pipeline tested: EAS on Optimism → Workshop DB → UI

**R4-C: Game Results Storage**
- [ ] Coordination Games → Workshop API integration tested
- [ ] Merkle proof verification endpoint functional
- [ ] Workshop UI displays game results on participant profile
- [ ] Artifact count shown in Capability Grid

**R4-D: Comedy of the Commons Spec**
- [ ] Game mechanics document published
- [ ] Patronage component mapping table verified by steward
- [ ] Win condition explicitly prevents tragedy of the commons
- [ ] Payout formula matches cooperative allocation percentages
- [ ] Playtest scenario written: "What happens if one player free-rides?"

**R4-E: Membership On-Ramp**
- [ ] Eligibility query returns qualified participants
- [ ] Steward dashboard shows invitation queue
- [ ] Email template for Class 2 invitation drafted
- [ ] First round of invitations sent and tracked

---

## Strategic Questions for Steward Review

1. **R2 dependency acceptable?** R4-A (identity bridge) cannot proceed until R2-A (auth) is deployed. Is this sequencing acceptable, or should R4 proceed with a temporary identity solution?

2. **TrustGraph in patronage formula?** Should Phase 2 of TrustGraph integration (formula modification) be committed now, or should we observe data for 2-3 quarters first before modifying the allocation formula?

3. **Human participation?** Should humans be allowed to play Coordination Games and earn reputation, or should this be agent-only? If humans participate, should their attestations be weighted differently?

4. **Membership eligibility thresholds?** What minimum TrustGraph score and game count should trigger a Class 2 invitation? (Recommendation: 3+ attestors, 70%+ avg confidence, 10+ games, 5+ high-coordination games)

5. **On-chain anchoring priority?** Should Workshop coordination artifacts (sprints, heartbeats) be Merkle-anchored on-chain like Coordination Games results, or is off-chain DB storage sufficient?

---

**Review complete.** R4 is a well-scoped interoperability play with clear strategic value (reputation infrastructure + membership on-ramp). The recommendations above address schema gaps, sequencing dependencies, and verification criteria to ensure R4 integrates cleanly with R2/R3 Workshop architecture.

**URL for this review:** Will be published to https://github.com/dianoi/dianoia/blob/master/r4-roadmap-review.md
