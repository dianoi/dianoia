# P66 Draft — Secondary Functional Modes for Workshop Coordination

**Sprint ID:** P66
**Title:** Secondary Functional Modes — Optional Coordination Context Augmentation
**Proposer:** Dianoia (at Todd's direction)
**Proposed Roles:** {"spec-author": "dianoia", "implementer": "nou"}
**Complexity:** S (protocol extension + UI enhancement)
**Layers:** [2, 7] (State, View)

---

## Problem

P27 established primary functional modes (e.g., `code:implementing`, `code:verifying`) that reflect an agent's current operational state. These are singular — an agent is in one mode at a time.

**Gap:** Coordination often involves multiple simultaneous contexts that don't fit into a single mode:

- An agent implementing code while also learning a new pattern (learning mode)
- An agent verifying tests while also documenting findings (documentation mode)
- An agent debugging while also mentoring another agent (mentorship mode)
- An agent in any primary mode while explicitly available for interruption (availability mode)

**Current limitation:** The single functional_mode field can't express these coordination nuances. Agents must choose: am I implementing, or am I available for questions? The answer is often "both."

---

## Proposal: Secondary Functional Modes

Extend agent_presence with **optional secondary functional modes** — additional coordination context that augments (not replaces) the primary mode.

### Schema Change

```sql
ALTER TABLE agent_presence
ADD COLUMN secondary_modes text[] DEFAULT '{}';
```

### Valid Secondary Modes (Cross-Craft)

Unlike primary modes (craft-specific), secondary modes are **coordination-universal**:

| Secondary Mode | Meaning | Use Case |
|----------------|---------|----------|
| `learning` | Actively learning new pattern/tool/domain | Agent implementing while learning new framework |
| `teaching` | Available for mentorship/explanation | Agent available to explain decisions to others |
| `documenting` | Writing documentation alongside work | Agent implementing + writing docs |
| `researching` | Deep investigation mode (slower response) | Agent exploring options before proposing |
| `pairing` | Collaborative work with another agent | Two agents working synchronously on same sprint |
| `interruptible` | Explicitly available for questions | Agent focused but signals availability |
| `deep-focus` | Do not interrupt except urgent | Agent in flow state, minimize disturbance |
| `winding-down` | Completing current work, not starting new | Agent finishing sprint before going offline |

### Heartbeat Extension

```json
{
  "status": "active",
  "capacity": 85,
  "functional_mode": "code:implementing",
  "secondary_modes": ["learning", "interruptible"],
  "capabilities": ["..."],
  "context": "Building authentication system",
  "skill_hash": "..."
}
```

---

## UI Integration

### Capability Grid

**Current:** Shows primary functional_mode as single badge

**Enhanced:**
- Primary mode badge (prominent): `code:implementing`
- Secondary mode chips (subtle): `learning` `interruptible`
- Hover tooltip explains what each secondary mode signals

### Agent Presence Display

**Current:**
```
Dianoia
{ } code
code:implementing
85% capacity
```

**Enhanced:**
```
Dianoia
{ } code
code:implementing
+ learning, interruptible
85% capacity
```

### Coordination Intelligence

The Workshop can use secondary modes for smart suggestions:

- If Nou is `code:implementing` + `interruptible` and Dianoia signals `teaching`, suggest pairing
- If agent is `code:debugging` + `deep-focus`, suppress non-urgent notifications
- If agent is `researching`, recommend sprints in discovery/proposal phase (not execution)
- If agent is `learning`, connect them to relevant documentation in Shared Links

---

## Why This Matters

**Current friction:**
- Agents must oversimplify their coordination state (am I implementing OR available?)
- Humans don't know if it's okay to interrupt an agent in focus mode
- The Workshop can't make intelligent coordination suggestions without context

**After enhancement:**
- Agents express complex coordination states accurately
- Availability signals become explicit (interruptible vs deep-focus)
- Learning/teaching moments become visible (opportunities for knowledge transfer)
- The Workshop becomes smarter about suggesting phase-appropriate work

**Alignment with Clawsmos principles:**
- **Transparent Agency:** Agent state is fully visible, not just operational mode
- **Room-as-Facilitator:** Workshop uses secondary modes to make context-aware suggestions
- **Human-Agent Parity:** Both humans and agents benefit from explicit availability signals

---

## Implementation Scope

### Backend (Nou)

**Database:**
- Add `secondary_modes text[]` column to `agent_presence` (nullable, defaults to empty array)
- Add validation: secondary modes must be from allowed list (or custom if steward-approved)

**Edge Function:**
- Extend `presence-heartbeat` to accept `secondary_modes` array (optional)
- Return secondary_modes in presence query responses

**Business Logic:**
- Define canonical list of secondary modes (8 initial modes listed above)
- Add validation for mode combinations (some modes mutually exclusive: `interruptible` + `deep-focus` = invalid)

### Frontend (Nou)

**Capability Grid:**
- Display secondary mode chips below primary mode badge
- Color-coded chips (learning=blue, teaching=green, deep-focus=red, interruptible=yellow, etc.)
- Hover tooltip explains each mode

**Presence Selector (if agents can self-report via UI):**
- Checkbox list of secondary modes when updating presence
- Real-time validation (can't select mutually exclusive modes)

**Protocol Stream:**
- Log secondary mode changes as events ("Dianoia entered learning mode")

---

## Testing Strategy

1. **Heartbeat with secondary modes:** Send heartbeat with `["learning", "interruptible"]` → verify stored in database
2. **UI display:** Verify Capability Grid shows secondary mode chips correctly
3. **Mode validation:** Attempt mutually exclusive modes → verify API rejects
4. **Protocol events:** Change secondary modes → verify logged in protocol_events
5. **Coordination intelligence:** Agent with `learning` mode → verify Workshop highlights relevant documentation

---

## Deliverables

1. **Database migration:** Add `secondary_modes` column to `agent_presence`
2. **Backend validation:** Secondary mode list + mutual exclusion rules
3. **Frontend components:** Secondary mode chips in Capability Grid
4. **Documentation:** Updated SKILL.md with secondary modes protocol
5. **Test report:** Validation + UI display verification

---

## Extension: Custom Secondary Modes

**Future consideration:** Allow steward-approved custom secondary modes for specific coordination contexts.

Example: A bioregional coordination group might add `field-work` secondary mode to signal agents are operating in the physical world with limited connectivity.

**Implementation:** Add `custom_secondary_modes` table with steward approval workflow.

---

## Reference URLs

- https://co-op.us/app/coordinate (Capability Grid display)
- https://github.com/nou-techne/nou-techne/blob/main/docs/coordination/WORKSHOP_COORDINATE_SKILL.md (P27 functional modes)
- P27 sprint (primary functional modes foundation)

---

**Dianoia · Code (Execution Intelligence) · 2026-03-03T03:25**
