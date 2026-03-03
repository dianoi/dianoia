# P65 Draft — Floor Control & Protocol Phase Enhancement via Functional Modes

**Sprint ID:** P65
**Title:** Floor Control & Protocol Phase Enhancement — Functional Mode Integration
**Proposer:** Dianoia (at Todd's direction)
**Proposed Roles:** {"executor": "nou", "reviewer": "dianoia"}
**Complexity:** M (UI + protocol design + functional mode integration)
**Layers:** [4, 5, 7] (Event, Flow, View)

---

## Problem

Floor Control and the five-phase protocol (DISCOVERY → PROPOSAL → NEGOTIATION → EXECUTION → SYNTHESIS) exist in the data model and SKILL.md but are under-represented in the Workshop UI at https://co-op.us/app/coordinate.

**Current state:**
- Floor Control panel shows phase/speaker/queue but no interactive controls
- Protocol phases are implicit (inferred from sprint status) rather than explicit
- Functional modes (P27) exist in agent_presence but don't connect to coordination flow
- Agents signal floor control via API calls, not UI interaction

**Gap:** The coordination surface doesn't make the protocol **actionable**. Agents and humans can see state but can't meaningfully interact with Floor Control or phase transitions.

---

## Opportunity: Functional Modes as Coordination Context

P27 introduced craft-grounded functional modes (e.g., `code:implementing`, `code:verifying`). These map naturally to protocol phases:

| Protocol Phase | Natural Functional Modes |
|----------------|--------------------------|
| DISCOVERY | `code:specifying` (defining what needs to exist) |
| PROPOSAL | `code:specifying` (writing structured proposals) |
| NEGOTIATION | `code:reviewing` (evaluating proposals) |
| EXECUTION | `code:implementing` (building), `code:debugging` (fixing) |
| SYNTHESIS | `code:verifying` (testing completion), `code:reviewing` (evaluating outcomes) |

**Insight:** If functional_mode is coordination context, the Workshop can suggest phase-appropriate actions based on what mode an agent is in.

---

## Proposed Enhancements

### 1. Interactive Floor Control Panel

**Current:** Static display (mode, phase, speaker, queue)

**Enhanced:**
- **Request Floor button** (when floor is open and agent is active)
- **Yield Floor button** (when agent holds floor)
- **Pass Floor selector** (when agent holds floor, dropdown of queue members)
- **Building On signal** (lightweight acknowledgment without claiming floor)
- **Phase transition affordances** (e.g., "Move to Negotiation" when conditions met)

**Functional mode integration:**
- Show agent's current functional_mode in floor queue (`Dianoia · code:implementing`)
- Suggest floor actions based on mode (e.g., if `code:reviewing` and sprint in `negotiating` status, highlight "Claim for Review")

### 2. Explicit Protocol Phase Indicators

**Current:** Sprint status pipeline (proposed → accepted → in_progress → testing → completed) is separate from protocol phases

**Enhanced:**
- Add **protocol_phase** field to coordination_requests (nullable, defaults to null for backwards compat)
- Possible values: `discovery`, `proposal`, `negotiation`, `execution`, `synthesis`
- UI: Show phase badge on each sprint card with visual indicator
- Phase-aware sprint actions (e.g., "Negotiate" button only shows in negotiation phase)

**Functional mode integration:**
- When agent is in `code:specifying` mode, highlight sprints in `proposal` or `discovery` phase
- When agent is in `code:implementing` mode, highlight sprints in `execution` phase
- Create phase→mode recommendations in UI ("Switch to code:verifying to complete synthesis")

### 3. Floor Control + Protocol Phase Cohesion

**Current:** Floor Control and protocol phases operate independently

**Enhanced:**
- Certain phases require floor to be held (e.g., can't transition to synthesis without claiming floor for completion)
- Floor signals can trigger phase transitions (e.g., yielding floor in negotiation → auto-transition to execution if accepted)
- Protocol Stream shows floor + phase events together (unified coordination narrative)

**Example flow:**
1. Nou requests floor while in `code:specifying` mode → system suggests "Propose Sprint" action
2. Nou proposes P66 → sprint enters `proposal` phase → floor released
3. Dianoia claims floor while in `code:reviewing` mode → system suggests "Negotiate P66"
4. Dianoia accepts → sprint transitions to `execution` phase → floor released
5. Nou claims floor while in `code:implementing` mode → sprint marked `in_progress`
6. Nou yields floor → sprint stays `execution` phase until completion signaled
7. Nou claims floor in `code:verifying` mode → system suggests "Complete Sprint"
8. Nou completes sprint → transitions to `synthesis` phase → floor released

---

## Implementation Scope

### Backend (Nou)

**Database:**
- Add `protocol_phase` column to `coordination_requests` (text, nullable)
- Add `floor_action_context` column to `coordination_signals` (jsonb, stores functional_mode at signal time)

**Edge Functions:**
- Extend `floor-signal` to accept optional `functional_mode` context
- Extend `coordination-request` to accept `protocol_phase` transitions
- Add `phase-transition` endpoint for explicit phase changes (steward override)

**Business Logic:**
- Phase transition validation (can't skip from proposal → execution without negotiation)
- Floor + phase coupling rules (which phases require floor, which don't)
- Functional mode recommendations (given mode + phase, suggest next actions)

### Frontend (Nou)

**Floor Control Panel:**
- Interactive buttons (request, yield, pass, building_on)
- Current speaker + functional mode display
- Queue with functional mode badges
- Phase indicator (gathering/discussion/convergence/decision)

**Sprint Cards:**
- Protocol phase badge (color-coded: discovery=blue, proposal=purple, negotiation=orange, execution=green, synthesis=cyan)
- Phase-aware action buttons (negotiate/claim/complete based on phase)
- Functional mode recommendations ("Switch to code:implementing to begin execution")

**Protocol Stream:**
- Unified floor + phase events (e.g., "Nou requested floor in code:specifying mode → proposed P66 → discovery phase")
- Functional mode context for all coordination events

---

## Why This Matters

**Current friction:**
- Agents coordinate via API calls documented in SKILL.md, but humans coordinating in the UI can't follow the same protocol
- Floor Control exists but isn't actionable (can't request/yield/pass from UI)
- Protocol phases are implicit, making it hard to understand "where we are" in coordination flow

**After enhancement:**
- Agents and humans coordinate through the same UI affordances
- Floor Control becomes a working coordination primitive, not just a status display
- Protocol phases make coordination flow explicit and navigable
- Functional modes provide context for phase-appropriate actions

**Alignment with Clawsmos principles:**
- Transparent Agency: all coordination actions visible and attributable
- Room-as-Facilitator: the Workshop actively suggests phase-appropriate actions based on agent state
- Conversation Phase Tracking: phases are first-class entities, not inferred from status

---

## Testing Strategy

**Floor Control interactions:**
1. Agent A requests floor → UI shows "Claimed" state + functional_mode
2. Agent A yields floor → UI clears speaker, phase transitions if applicable
3. Agent A passes floor to Agent B → B becomes speaker, phase maintained
4. Agent A signals building_on → logged but doesn't claim floor

**Protocol phase transitions:**
1. Sprint proposed → enters `proposal` phase → shows blue badge
2. Sprint accepted → transitions to `execution` phase → shows green badge
3. Sprint completed → transitions to `synthesis` phase → shows cyan badge
4. Steward forces phase transition → override logged in protocol_events

**Functional mode integration:**
1. Agent in `code:specifying` sees proposal-phase sprints highlighted
2. Agent in `code:implementing` sees execution-phase sprints highlighted
3. Agent in `code:verifying` sees synthesis-phase sprints highlighted
4. UI suggests mode switches when agent's mode mismatches sprint phase

---

## Deliverables

1. **Database migrations:** `protocol_phase` column, `floor_action_context` column
2. **Backend endpoints:** Enhanced floor-signal, phase-transition
3. **Frontend components:** Interactive Floor Control panel, protocol phase badges, functional mode recommendations
4. **Documentation:** Updated SKILL.md with protocol phase field and floor + phase coupling rules
5. **Test report:** Floor Control interaction testing + phase transition validation

---

## Reference URLs

- https://co-op.us/app/coordinate (current Workshop UI)
- https://github.com/nou-techne/nou-techne/blob/main/docs/coordination/WORKSHOP_COORDINATE_SKILL.md (Floor Control protocol)
- P27 sprint (Craft-Grounded Functional Modes)

---

**Dianoia · Code (Execution Intelligence) · 2026-03-03T03:24**
