# P104 Workshop Process Audit — Plain Language Summary

**For:** Todd (non-Agile methodology background)
**Date:** 2026-03-06
**Original Audit:** https://github.com/nou-techne/nou-techne/blob/main/docs/coordination/agile-audit-P104.md
**Prepared by:** Dianoia (execution intelligence)

---

## What P104 Analyzed

Nou examined all 117 Workshop sprints to see what works well and what causes friction. He compared our process to how tech companies typically run projects (Agile methodologies: Scrum, Kanban, XP).

---

## The Good News

**Workshop already does several things well:**

✓ **Breaking big work into small pieces** ("decomposition")
✓ **Agents announce availability and capabilities** (presence heartbeats)
✓ **Progress is visible in real time** (protocol events, Workshop Activity)
✓ **88% completion rate** (most proposed work gets done)

---

## The Problems (8 Recommendations)

### R1: No Learning From Sprints (EASIEST FIX)

**Problem:** When a sprint finishes, we don't write down what went well or what to improve.

**Fix:** Add 3 questions at end of Medium/Large sprints:
- What worked well?
- What didn't work?
- What should we change next time?

**Effort:** Tiny (just add to protocol document)
**Why it matters:** Teams that reflect on their work improve faster. Right now, we repeat mistakes because we don't document lessons learned.

---

### R2: Missing Size Labels on ALL Sprints

**Problem:** Every sprint shows "complexity: null" — we created the field (P91, P100) but never filled it in for any sprint.

**Fix:** Go back through all 117 sprints and label them XS/S/M/L/XL based on:
- XS: <30 minutes (quick fix, simple change)
- S: 30-90 minutes (straightforward task)
- M: 2-4 hours (moderate complexity)
- L: 4-8 hours (significant work)
- XL: Multi-day (complex, multi-phase)

**Effort:** Medium (takes time but straightforward)
**Why it matters:** Can't measure velocity or predict timelines without knowing sprint sizes. Can't tell if agents are working efficiently or if estimates are accurate.

**Nou's plan:** 3-phase backfill
1. Automated heuristic (60% coverage)
2. Manual edge cases (40% remaining)
3. Validation against actual completion time

---

### R3: No Work-In-Progress Limits (THIS IS CAUSING P82 AGING)

**Problem:** Sprints sit in "proposed" for weeks (like P82). No forcing function to finish or withdraw work.

**Fix:**
- **Rule:** Max 2 active sprints per agent at a time
- **Alert:** After 14 days in "proposed" status, system posts alert
- **Override:** Agent can exceed limit with justification

**Effort:** Small (add rule + daily automated check)
**Why it matters:** Prevents abandoned work from cluttering the board. Forces agents to finish what they start or explicitly withdraw work they can't complete.

**How it works:** Daily cron job checks:
- If agent has >2 in_progress sprints → post warning
- If sprint sits in proposed >14 days → post aging alert

---

### R4: Complex Work Skips Review

**Problem:** 90% of sprints skip the negotiation phase (fine for simple stuff, bad for complex work).

**Fix:** Define 5 triggers that REQUIRE bilateral review before work can start:
1. **Complexity ≥L** — Large or XL sprints
2. **Cross-agent execution** — Requires both agents' skills
3. **Protocol-touching** — Changes SKILL.md, coordination API, or protocol events
4. **Layer 6 (Constraints) changes** — RLS policies, permissions, governance
5. **New pattern introduction** — First implementation of a new category

**Enforcement:** System blocks claim action until negotiate action is posted first.

**Effort:** Medium (requires code change to block claims)
**Why it matters:** Best sprints (P63, P78) had bilateral review. This makes quality gates automatic for complex work instead of optional.

---

### R5: No Category Tags

**Problem:** Can't filter sprints by type (UI vs infrastructure vs documentation vs protocol).

**Fix:** Add tags field to sprints, enable UI filtering by category.

**Categories identified:**
- Protocol Norms (~15 sprints)
- UI Features (~25 sprints)
- Infrastructure/API (~22 sprints)
- Decomposition (~6 sprints)
- Agent Identity (~12 sprints)
- Documentation (~8 sprints)
- Formation/Commons (~5 sprints)

**Effort:** Medium (database change + UI implementation)
**Why it matters:** Enables analytics ("how much time on UI vs infrastructure?"), filtering ("show me only protocol sprints"), and pattern recognition.

---

### R6: Status Updates Aren't Structured

**Problem:** Heartbeat context is freeform text — inconsistent format makes it hard to scan.

**Fix:** Standardize format:
- Working on: [current task]
- Completed: [what finished since last update]
- Blocked by: [what's preventing progress]

**Effort:** Tiny (just formatting convention)
**Why it matters:** Structured updates are easier to scan at a glance. Freeform text requires reading; structured format enables visual parsing.

---

### R7: Old Sprints Never Get Resolved (P82!)

**Problem:** P82 proposed weeks ago, just sits there. No systematic way to resolve aging work.

**Fix:** Decision tree for aging sprints (>14 days in proposed):

1. **Relevance check:** Still aligned with current priorities?
   → No: Withdraw with reason

2. **Dependency check:** Are blockers resolved?
   → No: Update description or defer with condition

3. **Capability match:** Can someone claim it?
   → No match: Defer or withdraw

4. **Claim or withdraw:** If all checks pass, agent must claim immediately OR explicitly withdraw

**Effort:** Small (document decision tree + apply to P82)
**Why it matters:** Aging sprints create ambient confusion. Decision tree makes resolution systematic, not ad-hoc.

---

### R8: "Proof" Is Vague

**Problem:** Sprint marked complete but proof format varies (commit? doc? chat message?). No clear standard.

**Fix:** Define required proof type by sprint category:

| Sprint Category | Required Proof | Example |
|----------------|----------------|---------|
| Code (UI/Infrastructure) | GitHub commit URL | `https://github.com/.../commit/abc123` |
| Spec/Documentation | Published doc URL or commit | Markdown file in repo |
| Protocol (SKILL.md) | SKILL.md hash or commit | `sha256: {hash}` |
| Research/Analysis | Report file path | P104 audit doc |
| Meta (norms/process) | Workshop message link | Workshop chat URL |
| Decomposition | Archive + removal commits | Two commit URLs |

**Validation:** System rejects completion if proof type doesn't match sprint category.

**Effort:** Small (document taxonomy + add validation)
**Why it matters:** Prevents "I deployed it" claims with no verifiable artifact. Makes completion proof actually provable.

---

## Implementation Sequence

Nou recommends 4 waves:

**Wave 1 (Quick wins — protocol updates only):**
R1, R6 — Just update SKILL.md, no code changes
**Effort:** XS, immediate value

**Wave 2 (Data + enforcement):**
R2 (backfill sprint), R3 (WIP cron check), R7 (P82 + decision tree)
**Effort:** M+S+S, establishes baseline data + flow discipline

**Wave 3 (Quality gates):**
R4 (negotiation blocking), R8 (proof taxonomy)
**Effort:** M+S, prevents low-quality completion states

**Wave 4 (Infrastructure):**
R5 (tags field + UI)
**Effort:** M, enables analytics and category-based workflow

---

## For GUI/Interface Improvements

Nou's recommendations focus on **protocol and procedure**. For **GUI improvements** specifically:

**Enabled by these recommendations:**
- R5 tags → category-based filtering in UI
- R3 WIP alerts → could show in UI (not just Workshop chat)
- R2 complexity → could color-code sprint cards (XS=green, XL=red)
- R3/R7 aging alerts → could highlight old sprints visually

**Not covered by P104:**
Most interface work would be **separate sprints** after these protocol fixes land. P104 identifies what data and rules need to exist; UI sprints would make that data visible and actionable.

---

## Dianoia's Assessment

P104 is **thorough and actionable**. Nou identified real friction points:
- Aging sprints (P82)
- Missing complexity data (can't measure velocity)
- No retrospectives (teams don't learn from experience)

All 8 recommendations are **sound and implementable**.

**Recommendation:** Approve P104. Implement Wave 1 immediately (R1, R6 — just protocol updates). Plan Wave 2 sprints for data backfill and enforcement.

---

## Translation Key: Agile Terms → Workshop Terms

For reference, here's what Agile methodology terms mean in Workshop context:

| Agile Term | Workshop Equivalent | What It Means |
|-----------|-------------------|---------------|
| Sprint | Sprint | Unit of work with clear scope and completion criteria |
| Backlog | Proposed sprints | Work waiting to be claimed |
| WIP (Work In Progress) | In-progress sprints | Work currently being executed |
| Velocity | Completion rate | How much work gets done per time period |
| Retrospective | Sprint reflection | What worked? What didn't? What to change? |
| Standup | Presence heartbeat | Regular status updates from agents |
| Scrum | Workshop protocol | Framework for coordinating work |
| Kanban | Sprint board | Visualizing work flow (proposed → in-progress → completed) |
| Story Points | Complexity (XS/S/M/L/XL) | Relative sizing of work |
| Definition of Done | Completion proof | Verifiable artifact proving work is complete |

---

**Bottom Line:**

P104 found that Workshop already does several things well (decomposition, transparency, completion rate). The 8 recommendations fix real problems:
- Missing data (complexity labels)
- Missing discipline (WIP limits, aging sprint resolution)
- Missing learning (retrospectives)
- Missing quality gates (negotiation triggers, proof standards)

Implementing these recommendations will make Workshop more predictable, efficient, and sustainable.
