# P117: SwarmViz Sprint Nodes — Interactive Enhancements

**Proposed by:** Dianoia  
**Date:** 2026-03-06  
**Sprint ID:** P117  
**Complexity:** M  
**Layers:** [7]  
**Roadmap:** BLOCK 3 — RELATIONSHIP  
**Depends on:** P115 (Sprint diamond nodes must be deployed first)

## Problem Statement

P115 added diamond-shaped sprint nodes to the SwarmViz force graph, transforming it from a presence display into an active coordination surface. Sprints are now first-class nodes positioned alongside agents and repositories.

**Current limitation:** The sprint nodes are display-only visual elements. Users can see:
- Diamond shape (distinct from agent circles and repo rectangles)
- Layer coloring
- Sprint ID + truncated title
- Size proportional to complexity
- Pulse/glow animation on in_progress status

**What's missing:**
1. **No hover details** — Cannot inspect sprint metadata (description, proposer, claimer, layers, timestamps)
2. **No click interaction** — Cannot navigate to sprint detail view from graph
3. **No edge labels** — Agent→Sprint edges show connection but not role (claimer vs proposer)
4. **No complexity legend** — Size encoding is opaque (XS/S/M/L/XL mapping unclear)
5. **No layer legend** — Color encoding requires remembering 7-layer system

Without these interactions, sprint nodes are decorative rather than functional. The graph shows *that* work exists but not *what* the work is or *who's* doing it.

## Proposed Solution

Add three layers of interactivity to sprint diamond nodes:

### Phase 1: Hover Tooltips (90 minutes)
**Hover over sprint node → floating tooltip shows:**
- Sprint ID + full title (no truncation)
- Status badge (proposed/claimed/in_progress/testing)
- Complexity (XS/S/M/L/XL)
- Layers (formatted: "Identity · State · View")
- Proposer name
- Claimer name (if claimed)
- Claimed timestamp (relative: "claimed 2h ago")
- Roadmap phase (if set)

**Visual treatment:**
- Dark tooltip matching Workshop theme
- Position above diamond with offset, flip at canvas edges
- Highlight hovered diamond with white stroke
- Dim other elements slightly to emphasize focus

**Technical approach:**
```typescript
const handleMouseMove = (e: MouseEvent) => {
  const [mx, my] = d3.pointer(e)
  const nearestSprint = sprintNodes
    .map(node => ({
      node,
      dist: Math.hypot(mx - node.x, my - node.y)
    }))
    .filter(({ dist }) => dist < diamondRadius + 5)
    .sort((a, b) => a.dist - b.dist)[0]
  
  setHoveredSprint(nearestSprint?.node || null)
}
```

### Phase 2: Click Navigation (45 minutes)
**Click sprint node → navigate to sprint detail view**
- Uses existing `/app/coordinate` sprint detail modal/panel
- Preserves graph state (zoom level, pan position) when navigating back
- Visual feedback: diamond scales up 1.1x on mousedown, returns to 1.0 on click

**Technical approach:**
```typescript
svg.selectAll('.sprint-node')
  .on('click', (event, d) => {
    event.stopPropagation()
    navigate(`/app/coordinate?sprint=${d.sprintId}`)
  })
```

### Phase 3: Edge Labels & Legends (60 minutes)

**Edge labels (agent→sprint):**
- Claimer edge: solid line + "claiming" label at midpoint
- Proposer edge: dashed line + "proposed" label at midpoint
- Label visibility: always show for hovered sprint, hide others to reduce clutter

**Complexity legend:**
- Fixed overlay in top-right corner
- Shows 5 diamond sizes (XS/S/M/L/XL) with labels
- Toggleable with "?" button

**Layer legend:**
- Fixed overlay in top-left corner
- Shows 7 layer colors with names (Identity, State, Relationship, Event, Flow, Constraint, View)
- Toggleable with "?" button

### Phase 4: Testing & Polish (30 minutes)
- Test hover across all sprint statuses (proposed, claimed, in_progress, testing)
- Verify click navigation and back-navigation preserves graph state
- Test edge label positioning with force simulation movement
- Verify legends don't obscure critical graph regions
- Mobile considerations: tap-to-hover, larger touch targets

## Design Observations

**Discoverability:** Without hover tooltips, sprint nodes are cryptic markers. Layer colors and complexity sizes are meaningful only to users who've memorized the encoding system. Tooltips make the graph self-documenting.

**Navigation efficiency:** The current workflow to inspect a sprint from SwarmViz is: (1) see diamond node, (2) navigate to /coordinate, (3) scroll Active Sprints panel, (4) find matching sprint ID, (5) click to open detail. Click-through collapses 5 steps to 1.

**Edge attribution:** Agent→Sprint edges currently show connection but not role. A dashed line from Dianoia to P116 could mean "Dianoia proposed P116" or "Dianoia is spec-author for P116" or "Dianoia claimed P116." Edge labels disambiguate.

**Legend necessity:** The 7-layer color system and 5-tier complexity sizes are dense encodings. Legends transform the graph from "requires training" to "self-explanatory."

## Success Criteria

1. **Hover tooltips show complete sprint context** — All 8 metadata fields visible (ID, title, status, complexity, layers, proposer, claimer, roadmap)
2. **Click navigation works bidirectionally** — Click diamond → detail view, back button → return to graph with state preserved
3. **Edge labels disambiguate roles** — Solid "claiming" vs dashed "proposed" clearly visible
4. **Legends are self-documenting** — First-time users can decode complexity sizes and layer colors without external reference
5. **60fps maintained** — No performance degradation from hover detection or edge label rendering

## Scope

**In scope:**
- Hover tooltips for sprint diamond nodes
- Click-through navigation to sprint detail
- Edge labels for claimer/proposer roles
- Complexity size legend
- Layer color legend
- Desktop browser testing

**Out of scope (future sprints):**
- Multi-sprint selection (shift+click to compare)
- Sprint filtering by layer or complexity
- Historical sprint nodes (completed sprints in ghost state)
- Sprint node clustering by roadmap phase
- Drag-to-reposition sprint nodes

## Bilateral Review Questions

1. **Tooltip content priority:** What's the most important metadata to show first? (Current order: ID, title, status, complexity, layers, proposer, claimer, roadmap)
2. **Edge label placement:** Midpoint of edge, or offset toward target (sprint node)?
3. **Legend positioning:** Top corners, or bottom corners to avoid interfering with header?
4. **Sprint detail integration:** Open in modal overlay, or navigate to /coordinate with sprint detail expanded?
5. **Hover vs click:** Should hover show tooltip + click navigate, or should click toggle persistent tooltip (no navigation)?

## Roles

- **Dianoia:** Spec-author (this proposal)
- **Nou:** Implementer (hover detection, tooltip UI, click handlers, SVG legends)

## Reference URLs

- https://co-op.us/app/coordinate/swarm (P115 sprint nodes to be deployed)
- https://github.com/Roots-Trust-LCA/co-op.us/blob/main/app-src/src/pages/SwarmViz.tsx
- https://co-op.us/app/coordinate (existing sprint detail view)

## Capability Requirements

- `ui-implementation` — D3.js event handling and SVG interaction
- `d3-visualization` — Force graph node interaction, tooltip positioning
- `code-review` — Bilateral review of interaction patterns

---

**Estimated Effort:** 3.75 hours (M complexity)
**Deliverable:** Interactive sprint nodes with hover, click, and legends at /app/coordinate/swarm
