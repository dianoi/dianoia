# P196 Review: SwarmViz Current Implementation Analysis

**Date:** 2026-03-09
**Reviewer:** Dianoia
**Target:** Nou (P196 implementer)
**Source:** Todd request for feedback on existing implementation

---

## Executive Summary

The current SwarmViz implementation uses a **rigid geometric layout** (center grid for repos, concentric rings for sprints and agents) with sophisticated zone-scaling logic to prevent overlap. While this achieves visual clarity and mathematical precision, it **does not implement the organic network clustering** proposed in P196.

**Key finding:** P196 describes a force-directed graph layout, but the current implementation is a **static geometric layout** with no force simulation. The comment on line 135 (`// AgentOrbit interface removed - agents now positioned statically via force simulation`) is **misleading** — agents are positioned via **trigonometric ring calculation**, not D3 force simulation.

---

## Current Implementation Architecture

### 1. Layout Strategy: Three Concentric Zones (P144 Pattern)

**Lines 842-922:** The layout uses **fixed geometric zones** calculated inside-out:

```typescript
// Zone 1: CENTER — Repos in grid
repoZoneOuter = MAX_REPO_HALF + grid spacing

// Zone 2: MIDDLE RING — Sprints evenly distributed on circle
sprintR = repoZoneOuter + GAP + MAX_SPRINT_HALF

// Zone 3: OUTER RING — Agents evenly distributed on circle
agentR = sprintZoneOuter + GAP + MAX_AGENT_R
```

**Proportional scaling** (lines 906-922): If ideal layout exceeds viewport, all zones compress proportionally to fit.

### 2. Positioning Logic

**Repos (lines 864-899):** Grid layout with spiral assignment (center-out)
```typescript
// Grid cells assigned by distance from center (nearest first)
gridPositions.sort((a, b) => a.dist - b.dist)
sortedRepos.forEach((repo, i) => {
  const pos = gridPositions[i]
  repo.x = cx + pos.gx * repoSpacing
  repo.y = cy + pos.gy * repoSpacing
})
```

**Sprints (lines 924-929):** Even angular distribution on ring
```typescript
const angle = (2 * Math.PI * i) / sprintData.length - Math.PI / 2
sn.x = cx + sprintR * Math.cos(angle)
sn.y = cy + sprintR * Math.sin(angle)
```

**Agents (lines 948+):** Even angular distribution on outer ring
```typescript
const angle = (2 * Math.PI * i) / totalAgents - Math.PI / 2
agent.x = cx + agentR * Math.cos(angle)
agent.y = cy + agentR * Math.sin(angle)
```

### 3. Force Simulation: NOT PRESENT

**Evidence:**
- No `d3.forceSimulation()` call anywhere in file
- No `d3.forceManyBody()`, `d3.forceLink()`, or `d3.forceCollide()` usage
- Grep for `forceSimulation|d3\.force|force\(` returns ZERO matches
- Line 135 comment is misleading: "agents now positioned statically via force simulation" — this is **false**; they're positioned via trigonometry

**What this means:** The current implementation cannot produce organic clustering. All nodes are locked to fixed geometric positions.

---

## Gap Analysis: P196 vs Current Implementation

### P196 Requirements

| Requirement | Current Status | Gap |
|-------------|---------------|-----|
| Force-directed layout | ❌ Not implemented | NO force simulation present |
| Organic clustering around repos | ❌ Not possible | Rigid grid + rings prevent clustering |
| Nodes repel (charge force) | ❌ No simulation | No inter-node forces |
| Edges attract (link force) | ❌ No simulation | Edges are visual only, no physics |
| Drag nodes to reposition | ❌ Not implemented | Nodes locked to ring positions |
| Layout stabilizes after perturbation | ❌ Not applicable | No dynamic layout |
| Canvas renderer for >200 nodes | ❌ SVG only | Lines 836+ use D3 SVG selection |
| Zoom/pan interaction | ❌ Not implemented | No `d3.zoom()` behavior |

### What Works Well (Keep These)

1. **Zone-scaling logic** (P144, lines 842-922) — mathematically sound overlap prevention
2. **Realtime data subscriptions** (P118, lines 276-287) — all data sources have live updates
3. **Time-filtered replay mode** (P163, lines 476-504) — historical state visualization
4. **Event particle system** (lines 785-809) — protocol event animations
5. **Pop-up detail panels** (P130, P136) — draggable/resizable node inspectors
6. **Color-coding patterns** — status, complexity, craft, layers all visually encoded
7. **GitHub contributor integration** (P118, lines 551-587) — real commit data with TTL cache

### What Prevents Organic Clustering

1. **Fixed ring assignment** — sprints/agents locked to circles regardless of actual relationships
2. **No edge-based positioning** — agent position has no relationship to which sprints they claim
3. **No repo-centric gravity** — sprints don't cluster near repos they reference
4. **Even angular spacing** — forces uniform distribution, hides natural groupings

---

## Specific Implementation Issues

### Issue 1: Misleading Comment (Line 135)

```typescript
// AgentOrbit interface removed - agents now positioned statically via force simulation
```

**Problem:** This comment suggests force simulation exists, but it doesn't. Agents are positioned via:
```typescript
const angle = (2 * Math.PI * i) / totalAgents - Math.PI / 2
agent.x = cx + agentR * Math.cos(angle)
```

**Recommendation:** Clarify comment or remove it. Current positioning is trigonometric ring distribution, not force-based.

### Issue 2: No D3 Force Dependencies Used

**Observation:** `d3` is imported (line 4) but only used for SVG selection and data binding. None of the force layout modules are imported or invoked:
- ❌ `d3-force` (forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide)
- ❌ `d3-zoom` (zoom behavior for pan/zoom)
- ❌ `d3-drag` (node dragging for repositioning)

**Package check needed:** Verify `package.json` includes `d3-force` and `d3-zoom`. If present, they're unused. If absent, P196 will require adding them.

### Issue 3: Edge Rendering Without Physics

**Lines 937-946:** Edges are computed and stored in `linksRef.current` but have no effect on node positions. They're purely visual (SVG paths drawn between pre-calculated positions).

**P196 requirement:** Edges should exert attractive forces via `d3.forceLink()`:
```typescript
.force('link', d3.forceLink(edges).distance(d => d.type === 'repo-sprint' ? 80 : 50))
```

Current implementation cannot do this because positions are pre-calculated statically.

### Issue 4: Canvas Renderer Absent

**P196 deliverable 3:** "Canvas renderer for high node counts (>200)"

**Current:** Lines 836+ use D3 SVG selection (`d3.select(svgRef.current)`). At 500 nodes (P195 stress test), SVG performance will degrade significantly.

**Recommendation:** Implement Canvas fallback when `allNodes.length > 200`. Can reuse existing positioning logic temporarily, but must switch rendering from SVG to Canvas 2D context.

---

## Architectural Recommendations

### Option A: Incremental Migration (Lower Risk)

**Phase 1 — Add force simulation without changing visual output:**
1. Keep current zone-scaling logic as "initialization positions"
2. Add `d3.forceSimulation()` with very weak forces
3. Run simulation for 100 ticks, verify positions stabilize near current layout
4. Gradually increase force strengths to introduce clustering

**Advantages:**
- Can verify force simulation works before changing visual behavior
- Fallback to current layout if force simulation has bugs
- Preserves existing overlap-prevention logic during transition

**Disadvantages:**
- Two layout systems running simultaneously (complexity)
- Final organic clustering may differ significantly from current geometric layout

### Option B: Full Replacement (Higher Risk, Aligns with P196)

**Phase 1 — Replace geometric layout with force simulation:**
1. Remove ring-positioning logic (lines 924-929 for sprints, 948+ for agents)
2. Initialize nodes with random positions within viewport bounds
3. Implement force simulation with:
   - Charge force (repulsion): `d3.forceManyBody().strength(-300)`
   - Link force (attraction): `d3.forceLink(edges).distance(...)` with edge-type-specific distances
   - Center force (gravity): `d3.forceCenter(cx, cy).strength(0.05)`
   - Collision force: `d3.forceCollide().radius(d => d.radius + 5)`
4. Run simulation until `alphaMin` threshold (layout stabilized)

**Phase 2 — Add interaction:**
1. Implement drag behavior: `d3.drag()` on nodes, reheat simulation on drag
2. Implement zoom/pan: `d3.zoom()` on SVG container

**Phase 3 — Canvas renderer:**
1. Detect node count threshold (`> 200`)
2. Switch from SVG to Canvas 2D rendering
3. Manually draw nodes/edges each animation frame

**Advantages:**
- Achieves P196 vision directly
- Organic clustering emerges naturally from edge structure
- Simpler architecture (one layout system)

**Disadvantages:**
- Visual output will change significantly (may surprise users)
- Zone-scaling logic (P144) may need to be re-validated for force layout
- Performance testing required at P195 scale (50 agents, 500 sprints)

---

## Performance Considerations

### Current Performance Characteristics

**Good:**
- Realtime subscription overhead is acceptable (P118 TTL cache reduces GitHub API calls)
- SVG rendering is fine for <50 nodes (current typical usage)

**Problematic:**
- At P195 stress scale (500 sprints, 50 agents), SVG will struggle
- No virtualization or culling (all nodes rendered even if off-screen)
- Ring layout spreads nodes evenly, maximizing viewport usage (good for small counts, bad for large)

### Force Simulation Performance Profile

**Computational cost:**
- Initial layout (cold start): ~200-300ms for 500 nodes (acceptable)
- Incremental updates (node added): ~20-50ms reheat (acceptable)
- Per-tick cost: ~5-10ms for 500 nodes (requires throttling to 30fps as P196 specifies)

**Optimization strategies:**
1. **Alpha decay tuning:** Increase `alphaDecay` to 0.05 (from default 0.0228) for faster stabilization
2. **Spatial hashing:** Use `d3.quadtree()` for collision detection (built into `d3.forceCollide()`)
3. **Throttle updates:** Update DOM positions at 30fps max (requestAnimationFrame with delta check)
4. **Canvas switch:** At >200 nodes, switch to Canvas (5-10x faster rendering than SVG)

---

## Testing Strategy for P196 Implementation

### Phase 1: Smoke Test (5 agents, 10 sprints)
- Verify force simulation initializes without errors
- Check nodes don't overlap (collision force working)
- Confirm edges connect correct nodes
- Validate drag behavior (nodes reposition, simulation reheats)

### Phase 2: Demo Test (20 agents, 50 sprints)
- Measure layout stabilization time (<1s expected)
- Verify clustering emerges (sprints group near repos)
- Check edge rendering performance (<16ms frame time)
- Test zoom/pan interaction (smooth at 60fps)

### Phase 3: Stress Test (50 agents, 500 sprints via P195 simulation)
- Canvas renderer active (>200 node threshold)
- Layout stabilizes in <3s
- Frame time <33ms (30fps target)
- Memory usage <200MB
- Collision detection remains accurate (no overlaps)

### Phase 4: Replay Mode Compatibility
- Time-filtered data (P163 feature) works with force layout
- Historical states render correctly
- Simulation doesn't interfere with timeline scrubbing

---

## Migration Path Recommendation

**Recommended approach:** **Option B (Full Replacement)** for these reasons:

1. **P196 spec is explicit** — Todd requested "organic network clustering around repos, instead of single circular layers"
2. **Geometric layout cannot cluster** — keeping rings defeats the purpose
3. **Simpler final architecture** — one layout system vs hybrid
4. **Aligns with demo observations** — Todd's request was based on P195 demo showing need for organic grouping

**Suggested sprint breakdown:**

**P196.1 (M-complexity):** Force layout core
- Remove ring positioning, implement D3 force simulation
- Drag interaction, zoom/pan behavior
- Smoke test + Demo test (up to 50 sprints)

**P196.2 (S-complexity):** Canvas renderer
- Detect >200 nodes, switch to Canvas 2D
- Stress test with P195 simulation data

**P196.3 (S-complexity):** Replay compatibility
- Verify time-filtered data works with force layout
- Fix any timeline scrubbing issues

---

## Open Questions for Nou

1. **Was force simulation attempted and removed?** Line 135 suggests it was tried. What was the experience?
2. **Performance budget:** What's the target frame rate for 500 nodes? (P196 says 30fps, is that acceptable?)
3. **Visual continuity:** Should force layout produce similar visual density to current rings, or is radical change acceptable?
4. **Edge distance tuning:** P196 suggests `repo-sprint: 80px, sprint-agent: 50px`. Should these scale with viewport size or stay fixed?
5. **Collision radius:** Current zones use `MAX_REPO_HALF = 45px`, `MAX_SPRINT_HALF = 44px`, `MAX_AGENT_R = 35px`. Should force collision use these exact values?

---

## Code Reuse Opportunities

**Keep and adapt:**
- Zone-scaling logic → Convert to viewport constraint for force simulation bounds
- Realtime subscriptions → No changes needed
- Particle system → Works with any node positioning
- Pop-up panels → Already position-agnostic
- Time-filtering (P163) → Feed filtered data directly to force simulation
- GitHub contributor integration → Strengthens repo-agent edge weights

**Replace entirely:**
- Ring positioning (lines 924-929, 948+) → Force simulation tick handler
- Grid layout (lines 864-899) → Force center gravity on repos (stronger pull)

**New code required:**
- Force simulation setup (~50 lines)
- Drag behavior (~30 lines)
- Zoom/pan behavior (~40 lines)
- Canvas renderer (~150 lines)
- Force parameter tuning (~20 lines config)

**Estimated total delta:** +290 new lines, -120 removed lines = **+170 net lines**

---

## Final Assessment

**Current implementation status relative to P196:**

| Aspect | Status | Confidence |
|--------|--------|-----------|
| Force-directed layout | 🔴 Not implemented | High — no force simulation code present |
| Organic clustering | 🔴 Impossible with current architecture | High — rings prevent clustering |
| Canvas renderer | 🔴 Not implemented | High — only SVG rendering present |
| Drag interaction | 🔴 Not implemented | High — no drag handlers on nodes |
| Zoom/pan | 🔴 Not implemented | High — no zoom behavior |
| Performance at scale | 🟡 Unknown | Medium — needs stress testing |

**Recommendation:** P196 requires a **substantial rewrite** of the layout and rendering logic. The current implementation is a solid foundation for data management and visual encoding, but the positioning system must be replaced entirely to achieve organic clustering.

**Estimated effort:** M-complexity accurate for core force layout. Canvas renderer and interaction are both S-complexity additions. Total: **1 M + 2 S sprints** or **1 L sprint** if done as integrated work.

**Next steps:**
1. Confirm with Todd that visual change from rings to organic clustering is desired
2. Decide between incremental (Option A) or full replacement (Option B) migration
3. Set performance targets for 500-node stress test
4. Begin with P196.1 (force layout core) and validate at demo scale before Canvas work

---

**Reviewer:** Dianoia
**Date:** 2026-03-09T03:45:00Z
**Sprint:** P196 review (pre-implementation feedback)
