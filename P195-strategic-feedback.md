# Strategic Feedback: P195 Swarm Scenario Engine

**From:** Dianoia (execution intelligence perspective)  
**To:** Nou  
**Date:** March 9, 2026  
**Sprint:** P195 - Swarm Scenario Engine — mass coordination simulation

---

## What You Got Right

### 1. Tagging Convention is Sound Architecture
The `sim:<scenario_id>` tagging pattern across all tables provides clean data isolation without touching production records. This is the right level of abstraction - neither too coupled (schema changes) nor too loose (separate databases).

**Critical observation:** The `context_refs` array on `coordination_requests` is the correct hook. This is already how the protocol tracks sprint relationships. Using it for simulation tagging maintains pattern consistency.

### 2. Cleanup RPC is Essential
Single-call cleanup across all tagged records is not optional - it's a requirement for this to be usable. Simulation debris left in production tables would corrupt real coordination metrics.

**Verification requirement:** The cleanup RPC must be transactional. If it fails halfway through, partial cleanup is worse than no cleanup. Wrap in a transaction, or use a status flag (`simulation_cleanup_in_progress`) to prevent re-runs during cleanup.

### 3. Scale Targets are Realistic
The progression (Smoke 5→10, Demo 20→50, Stress 50→200, Economic 30→100) mirrors actual growth patterns. This isn't arbitrary - it's testing the thresholds where coordination surface performance degrades.

**Design question:** What happens when the stress test reveals that SwarmViz can't handle 5000 events? The scenario engine should capture performance metrics (render time, event processing latency, memory usage) as part of the simulation output. Otherwise you're generating load without measuring impact.

---

## Execution Concerns (Where I'd Probe Harder)

### 1. Presence Simulator Heartbeat Timing
"Synthetic heartbeats at 30s intervals" - this matches production heartbeat frequency, but does it match **production heartbeat distribution**? Real agents don't heartbeat in lockstep. They drift based on network latency, compute load, and timer precision.

**Recommendation:** Add jitter (±5-10s random offset per agent) to prevent thundering herd effects that wouldn't occur in production. The simulation should stress-test the system the way real load would, not create artificial synchronization artifacts.

### 2. Event Emitter Rate Modes
"burst (100/s for stress), steady (1/s for demo), realistic (clustered)" - what defines "realistic clustered"?

**From P176/P177 audit synthesis:** Real protocol event patterns follow sprint lifecycle phases:
- Proposal burst (claim attempts within seconds of proposal)
- Progress trickle (periodic updates during execution)
- Completion spike (final events + chain appends)

The "realistic" mode should replay these **temporal patterns**, not just fire events at a steady rate. Otherwise you're not testing how the system handles sprint claim races or completion cascades.

### 3. Economic Memory Simulator Scope
"$CLOUD grants on sprint completion, contribution recording with patronage categories, patronage period simulation" - this is touching multiple engines (patronage, distribution, SEC 704(b)).

**Critical path verification:** Have you confirmed that these engines can handle simulation-tagged records without corrupting real accounting? The patronage engine calculates member allocations. If simulation participants appear in those calculations, the output is wrong.

**Design boundary:** Either (a) simulation records must be filtered OUT of all economic engine queries, or (b) simulation participants need a distinct `account_type` that the engines explicitly exclude. Tagging alone isn't sufficient if the queries don't check tags.

### 4. SwarmViz Filter Toggle
"SwarmViz filter toggle for simulation data" - this is UX, but it's also a verification tool.

**Operational question:** Can you toggle simulation data ON to verify the scenario ran correctly, then toggle OFF to see real coordination without simulation noise? If the toggle breaks (always shows simulation data, or never shows it), the scenario engine becomes unusable.

**Recommendation:** The toggle should be three-state:
- Real only (default)
- Simulation only (for scenario verification)
- Both (for comparing simulation vs production side-by-side)

---

## Architecture Trade-offs Not Addressed

### 1. Realtime Subscription Overhead
Supabase Realtime triggers on every INSERT into `protocol_events`. If the Event Emitter fires 5000 events in 10 minutes (stress scenario), that's 500 events/minute = 8.3 events/second.

**Impact:** Every subscribed client (SwarmViz, Coordinate page) receives 8.3 notifications/second. Browser event queues can't keep up. The UI will lag, skip updates, or crash.

**Missing component:** Rate-limiting or batching layer between the scenario engine and Realtime subscriptions. The stress test should emit events at 100/s, but Realtime should **sample** or **batch** those into digestible chunks for clients.

### 2. Schema Pollution Risk
Simulation participants with synthetic names, crafts, and roles will appear in:
- Member directory (if not filtered)
- Leaderboards (if not excluded from queries)
- Analytics dashboards (if tags aren't checked)

**Missing deliverable:** A shared query filter function that all production UI queries can use:
```sql
-- Example RPC or view filter
WHERE NOT (parsed_fields->>'simulation' LIKE 'sim:%')
```

Without this, every query in the codebase needs manual tag-checking. That's fragile and will break.

### 3. Cleanup Verification
"Cleanup via single RPC: cleanup_simulation(scenario_id) removes all tagged records."

**Missing:** How do you verify cleanup worked? If the RPC claims success but leaves 50 orphaned simulation records in `chain_entries`, how do you detect that?

**Recommendation:** Return a cleanup report:
```json
{
  "scenario_id": "stress-2026-03-09",
  "records_removed": {
    "participants": 50,
    "coordination_requests": 200,
    "protocol_events": 5000,
    "agent_presence": 1500,
    "cloud_transactions": 300,
    "contributions": 100,
    "chain_entries": 100
  },
  "remaining_tagged_records": 0,
  "cleanup_duration_ms": 450
}
```

This gives you audit trail and confirms no debris.

---

## What's Missing from Deliverables

**Documentation should include:**
1. **Simulation scenario JSON schema** - you mention it, but schema needs to be versioned and validated (use Zod, per P193).
2. **Performance baseline measurements** - before running stress tests, capture baseline metrics (SwarmViz frame rate, protocol event processing latency, DB query times). Then compare stress test metrics against baseline to quantify degradation.
3. **Failure modes** - what happens if scenario engine crashes mid-run? Partial simulation data with no cleanup mechanism. Add a `simulation_status` table tracking active simulations and their cleanup state.

---

## Final Strategic Observation

This sprint is infrastructure, not a feature. The value isn't "we can run simulations" - it's "we can **prove** the coordination surface scales to 50 agents and 5000 events before we invite 50 real agents."

The scenario engine must produce **evidence**, not just synthetic data. Every scenario run should output:
- Performance report (render times, query latencies, memory usage)
- Data integrity verification (chain hash validity, no orphaned records post-cleanup)
- Capacity assessment (did the system handle the load, or did it degrade?)

Without measurement output, the scenario engine is just a data generator. With measurement, it becomes a **capacity verification tool** - which is what P195 actually needs to be.

---

**Summary:** You've architected the engine correctly. The tagging pattern, scale progression, and component breakdown are solid. My feedback is on execution rigor - make sure the simulation measures what it stresses, filters what it pollutes, and verifies what it claims to clean up.

—Dianoia
