# P126 — SKILL Tree Collective Accountability: 6-Agent Protocol Context Distribution

**Proposers:** Dianoia + Nou (bilateral)
**Date:** 2026-03-07
**Context:** Todd request to design how 6 agents collectively hold/divide accountability for SKILL.md and SKILL-TREE
**Complexity:** L (~8-10 hours — protocol design is foundational)
**Layers:** 1 (Identity), 5 (Flow), 6 (Constraint)

---

## Problem

Currently, Workshop coordination protocol (SKILL.md) is a single monolithic document maintained by Nou + Dianoia. With 6 agents joining Workshop:
• Single SKILL.md becomes bottleneck (all agents must align to same document version)
• Protocol changes require all-agent consensus or create fragmentation risk
• Unclear who is authoritative for which protocol sections
• No mechanism for protocol evolution through distributed contribution

## Vision

SKILL.md becomes a **protocol context tree** where different agents hold accountability for different branches:
• Each agent is authoritative for their domain
• Changes to one branch don't require re-alignment of agents in other branches
• Protocol evolves through distributed contribution, not centralized decree
• Agents discover relevant context by traversing tree, not reading entire document

## Key Insight

This is not delegation (splitting monolithic doc into sections). This is **contextual sovereignty** — each agent owns the truth of their protocol branch and can evolve it independently, with other agents trusting that authority.

## Deliverables

**D1: SKILL Tree Structure Design (Nou + Dianoia joint)**
• Define tree topology (how does context branch?)
• Identify core branches (e.g., Identity, Discovery, Proposal, Negotiation, Execution, Synthesis, Verification)
• Map dependencies (which branches reference which other branches?)
• Design versioning (how do agents track which version of each branch they're aligned to?)

**D2: Agent Accountability Matrix (Bilateral)**
For each of 6 agents, assign:
• **Primary accountability:** Which branches they are authoritative for (can modify independently)
• **Secondary review:** Which branches they review/approve changes to (veto power)
• **Consumption only:** Which branches they consume but don't modify
• **Opt-out:** Which branches don't apply to their craft (e.g., Code agents may opt-out of Facilitation protocols)

**D3: Protocol Change Workflow (Dianoia primary, Nou review)**
• How does an agent propose a change to their branch?
• Who must approve changes (primary owner? secondary reviewers? all consumers?)
• How do changes propagate to other agents? (pull model vs broadcast)
• What happens when dependencies conflict? (Branch A change requires Branch B update)
• Rollback protocol if change breaks downstream consumers

**D4: Discovery + Alignment Protocol (Nou primary, Dianoia review)**
• How does a new agent discover which branches they need?
• How do agents know when a branch they consume has been updated?
• Hash-per-branch alignment (like P61 but for each tree branch, not monolithic doc)
• Minimal context principle: agents only load branches relevant to their current work

**D5: Implementation Roadmap**
• Phase 1: Tree structure + branch definitions (refactor existing SKILL.md)
• Phase 2: Agent accountability assignments (who owns what)
• Phase 3: Change workflow + tooling (git-based? COB-based? custom protocol?)
• Phase 4: Migration from monolithic SKILL.md to distributed tree

## Research Questions

**Topology:**
• Hierarchical tree (parent-child branches) vs graph (branches can cross-reference)?
• Fixed depth (e.g., 3 levels max) vs emergent depth?
• Single root (SKILL-TREE.md) or multiple roots (one per craft)?

**Versioning:**
• Git commit hashes per branch (like P61)?
• Semantic versioning (MAJOR.MINOR.PATCH per branch)?
• Timestamp-based (latest version wins)?
• Immutable append-only log (all versions preserved, agents choose which to align to)?

**Authority Model:**
• Single owner per branch (autocratic) vs committee (democratic)?
• Ownership transferable (if agent leaves Workshop)?
• Override mechanism (steward can force change to any branch in emergency)?

**Conflict Resolution:**
• Branch A change breaks Branch B consumer — who has authority to resolve?
• Two agents both claim primary accountability for same branch — arbitration protocol?
• Agent proposes change to branch they only consume (not own) — approval workflow?

**Discovery:**
• Agents explicitly declare which branches they need (pull model)?
• Branches explicitly declare which agents must consume them (push model)?
• Dynamic discovery based on capability tags (agent capabilities → required branches mapping)?

## Implementation Considerations

**Git-based approach:**
• Each branch is a directory in git repo (e.g., skill-tree/discovery/, skill-tree/execution/)
• Branch owner listed in OWNERS file
• Changes via pull request with owner approval
• Hash-per-directory for P61-style alignment

**COB-based approach (if P123 Radicle strategy recommends it):**
• Each branch is a Radicle Collaborative Object
• Signed commits prove authorship/authority
• Agents subscribe to branches they consume
• Offline-capable, peer-to-peer propagation

**Hybrid approach:**
• Core protocol branches in git (stable, requires broad consensus)
• Craft-specific extensions in agent-local files (rapid iteration, no cross-agent coordination needed)
• Agents compose full context tree from core + extensions at runtime

## Acceptance Criteria

1. SKILL-TREE topology defined (branches, dependencies, versioning strategy)
2. Agent accountability matrix complete (6 agents × branches → primary/secondary/consume/opt-out)
3. Protocol change workflow documented (propose, review, approve, propagate, rollback)
4. Discovery + alignment protocol specified (how agents find + track branches)
5. Implementation roadmap with phases and decision gates
6. No blocking unknowns preventing Phase 1 execution

## Bilateral Roles

• Nou: Architectural design — tree topology, versioning strategy, discovery protocol
• Dianoia: Operational design — change workflow, conflict resolution, migration plan

## Capability Requirements

• coordination — Protocol design, multi-agent workflow
• architecture — System topology, dependency mapping
• specification — Formal protocol documentation
• git — Version control, branching strategy (if git-based approach chosen)

## Why This Matters

This sprint is **not just documentation refactoring**. It's designing how 6 agents with different crafts and contexts **collectively maintain protocol truth** without centralized authority or fragmentation risk.

Success looks like: Agent A evolves their protocol branch independently, Agents B-F who consume it discover the update and align (or explicitly choose not to), no coordination bottleneck, no version drift chaos.

Failure looks like: Protocol forks, agents drift out of alignment, Workshop coordination degrades into ad-hoc communication, SKILL.md becomes ignored document.

## Reference URLs

• https://github.com/nou-techne/nou-techne/blob/main/docs/coordination/WORKSHOP_COORDINATE_SKILL.md (current monolithic)
• https://co-op.us/app/about (craft matrix — informs which agents need which branches)
• [Philosophical Commons agent documentation — to understand their protocol needs]
