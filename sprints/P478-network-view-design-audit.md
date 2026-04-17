# P478: Network View Design Audit — Implementation Feasibility & Execution Path

**Sprint:** P478 (bilateral with Nou)
**Author:** Dianoia (Execution Intelligence)
**Date:** 2026-04-17
**Role:** Implementation feasibility analysis and execution path design
**Context:** https://techne.institute/tree/ — Network view mode

---

## Executive Summary

This audit evaluates the current Network view implementation at techne.institute/tree/ from an **implementation feasibility** perspective. The current implementation uses a **concentric zone layout** with **parent→child hierarchy edges only**. The sprint proposes adding 53 cross-page edges from SITE_LINKS and conducting a bilateral design audit.

**Key Findings:**
1. **Current Implementation:** Simple, maintainable, performs well — but **underutilizes the relationship graph**
2. **SITE_LINKS Integration:** Technically straightforward (15-20 lines) — **high impact, low cost**
3. **Force-Directed Layout:** Would require D3.js force simulation — **moderate complexity, unclear ROI**
4. **Progressive Disclosure:** Current fixed-circle layout makes this natural — **leverage existing structure**

**Recommended Execution Path:**
- **Phase 1** (immediate): Add SITE_LINKS edges with visual differentiation
- **Phase 2** (evaluate after Phase 1): Node sizing by degree, enhanced detail panel
- **Phase 3** (deferred): Force-directed layout only if concentric zones prove limiting

---

## Current Implementation Analysis

### Architecture

**Technology Stack:**
- Vanilla JavaScript (no framework)
- SVG for rendering (not Canvas)
- Manual layout calculation (no D3.js force simulation)
- Static HTML page (no build step)

**Layout Algorithm:**
```javascript
// Concentric zones: 0 (center), 1, 2, 3, 4, 5 (outer rings)
const radii = {
  0: 0,                          // Home at center
  1: Math.min(W,H) * 0.18,      // Public zone
  2: Math.min(W,H) * 0.32,      // Curated zone
  3: Math.min(W,H) * 0.45,      // Members zone
  4: Math.min(W,H) * 0.57,      // Steward zone
  5: Math.min(W,H) * 0.70       // Discovered zone
}

// Circular distribution within each zone
const angle = pages.length > 1
  ? (2*Math.PI*i/pages.length) - Math.PI/2
  : -Math.PI/2

node.x = cx + r * Math.cos(angle)
node.y = cy + r * Math.sin(angle)
```

**Edge Rendering (Current):**
```javascript
// Only renders parent→child hierarchy edges
for (const page of PAGES) {
  if (!page.parent) continue  // Skip root
  const pn = netNodes.find(n => n.id === page.parent)
  const cn = netNodes.find(n => n.id === page.id)
  // Draw line from parent to child
}
```

**Observations:**
- ✅ **Predictable layout:** Zones are always in the same position
- ✅ **Scalable:** O(n) layout calculation, no iterative simulation
- ✅ **Accessible:** Keyboard navigation works, ARIA labels present
- ⚠️ **Static:** No force simulation, no dynamic repositioning
- ⚠️ **Limited edges:** Only hierarchy, not relationships

### Current Features

**Interaction:**
- Pan (click-drag on background)
- Zoom (mouse wheel, zoom buttons)
- Click node → detail panel (right side)
- Keyboard navigation (Tab, Enter, Escape)

**Detail Panel:**
- Page title, path, description
- "Visit page" link
- Close button (×)

**Visual Encoding:**
- **Color:** Zone classification (home=ember, public=green, curated=ember, members=blue, steward=ember-dim)
- **Size:** Fixed per zone (zone 0=20px, zone 1=14px, zones 2-4=10-12px)
- **Position:** Concentric circles (zone determines radius)
- **Edges:** Solid gray lines, 0.5 opacity

### Performance Profile

**DOM Complexity:**
- 36 nodes (current page count)
- ~20 hierarchy edges
- Total SVG elements: ~120 (manageable)

**Rendering Cost:**
- Static layout (calculated once)
- No animation loop
- Pan/zoom via SVG transform (GPU-accelerated)

**Bottlenecks:**
- None detected at current scale
- Would scale to ~200 nodes before performance concerns

---

## Audit Scope: Three Evaluation Areas

### A. Standard Practices for Network Graph Visualization

**Current vs. Best Practices:**

| Practice | Current | Standard | Gap | Priority |
|----------|---------|----------|-----|----------|
| **Force-directed layout** | Manual concentric | D3 force simulation | Medium | LOW |
| **Edge bundling** | None | Curved/bundled paths | Low | LOW |
| **Degree-based sizing** | Zone-based only | Size ∝ link count | Medium | MEDIUM |
| **Clustering** | Implicit (zones) | Explicit groups | Low | LOW |
| **Focus+context** | None | Fisheye/semantic zoom | Medium | LOW |
| **Progressive disclosure** | None | Collapse/expand clusters | High | MEDIUM |

**Analysis:**

**Force-Directed Layout:**
- **Standard:** D3.js `forceSimulation()` with charge, link, center forces
- **Current:** Manual circular positioning
- **Gap:** No physics-based layout, no automatic spacing
- **Implementation Cost:** Moderate (requires D3.js dependency, ~100 LOC)
- **Value Proposition:** **Questionable** — current concentric zones communicate **semantic structure** (public vs. members vs. steward) better than force-directed would
- **Recommendation:** **DEFER** — Keep zone-based layout. Force-directed loses the semantic meaning of zones.

**Edge Bundling:**
- **Standard:** Curved paths that bundle parallel edges to reduce visual clutter
- **Current:** Straight lines
- **Gap:** With 53 SITE_LINKS edges added, visual density will increase significantly
- **Implementation Cost:** Low-moderate (D3 `linkRadial()` or manual Bezier curves)
- **Value Proposition:** **LOW at current scale** — 73 total edges (20 hierarchy + 53 SITE_LINKS) is manageable with opacity differentiation
- **Recommendation:** **DEFER** — Add SITE_LINKS first with dashed/opacity differentiation. Re-evaluate if visual clutter becomes problematic.

**Degree-Based Sizing:**
- **Standard:** Node radius proportional to link degree (in-degree + out-degree)
- **Current:** Fixed size per zone
- **Gap:** High-degree nodes (e.g., "Formation" with 4 in + 4 out = 8 links) not distinguished from low-degree nodes
- **Implementation Cost:** LOW (already computed in `links_in`/`links_out`, just map to radius)
- **Value Proposition:** **HIGH** — Immediately surfaces high-connectivity nodes
- **Recommendation:** **PHASE 2** — Implement after SITE_LINKS edges are rendered. Formula: `r = BASE_R[zone] + (degree * SCALE_FACTOR)`

**Clustering:**
- **Standard:** Visual grouping of related nodes (convex hulls, background shapes)
- **Current:** Implicit via zone circles
- **Gap:** None — zones **are** clusters
- **Recommendation:** **NO ACTION** — Current approach is semantically correct.

**Focus+Context:**
- **Standard:** Fisheye lens, semantic zoom (detail on demand)
- **Current:** Fixed detail level at all zoom levels
- **Gap:** No progressive detail (labels always visible, no hierarchy of information)
- **Implementation Cost:** Moderate (requires viewport-aware rendering)
- **Value Proposition:** **LOW at current scale** — 36 nodes fit comfortably on screen
- **Recommendation:** **DEFER** — Monitor if page count grows beyond ~80 nodes.

**Progressive Disclosure:**
- **Standard:** Collapse/expand node groups, show/hide detail layers
- **Current:** All nodes always visible
- **Gap:** No way to reduce visual complexity for large graphs
- **Implementation Cost:** LOW (already implemented in HUD mode with collapsible children)
- **Value Proposition:** **MEDIUM** — Could allow collapsing entire zones or sub-hierarchies
- **Recommendation:** **PHASE 3** — Add zone toggle (show/hide all nodes in a zone) after SITE_LINKS integration.

---

### B. Card-Based Organization Patterns

**Current vs. Standard Patterns:**

| Pattern | Current | Standard | Gap | Priority |
|---------|---------|----------|-----|----------|
| **Node cards with preview** | Detail panel (side) | Inline cards on canvas | Medium | LOW |
| **Filter by zone/path/auth** | None (Network mode) | Searchable, filterable | High | MEDIUM |
| **Search** | None | Text search + autocomplete | High | MEDIUM |
| **Minimap** | None | Overview+detail | Low | LOW |

**Analysis:**

**Node Cards with Preview:**
- **Standard:** Hoverable cards directly on the graph canvas with rich previews (thumbnails, metadata, actions)
- **Current:** Click opens side detail panel
- **Gap:** No hover preview, no rich metadata display
- **Implementation Cost:** Moderate (requires HTML overlay positioning or foreignObject SVG)
- **Value Proposition:** **LOW** — Side detail panel works well for current use case
- **Recommendation:** **NO ACTION** — Current approach is simpler and avoids z-index/positioning complexity.

**Filter/Search:**
- **Standard:** Filter controls (zone, auth level, keyword search) + live graph update
- **Current:** Network mode shows all nodes always; no filtering
- **Gap:** **HIGH** — HUD mode has zone filters, but Network mode doesn't
- **Implementation Cost:** LOW (UI exists in HUD mode, just needs Network mode integration)
- **Value Proposition:** **HIGH** — Essential for graphs >50 nodes, useful even at current scale
- **Recommendation:** **PHASE 2** — Add zone filter buttons (reuse HUD mode UI). Filtering hides nodes + incident edges.

**Minimap:**
- **Standard:** Small overview map showing viewport position
- **Current:** None
- **Gap:** At current zoom levels and scale, not needed
- **Implementation Cost:** Moderate (requires separate small SVG viewport indicator)
- **Value Proposition:** **LOW at current scale** — Becomes valuable only when zoomed in significantly
- **Recommendation:** **DEFER** — Add only if user feedback indicates disorientation at high zoom.

---

### C. Interaction Design

**Current vs. Best Practices:**

| Interaction | Current | Standard | Gap | Priority |
|-------------|---------|----------|-----|----------|
| **Drag nodes** | No (drag pans canvas) | Drag to reposition | Low | LOW |
| **Zoom** | Wheel + buttons | Wheel + pinch + buttons | Low | LOW |
| **Click-to-expand** | Opens detail panel | Expands/collapses clusters | Medium | MEDIUM |
| **Keyboard nav** | Tab + Enter | Arrow keys + spatial nav | Medium | LOW |
| **Detail panel UX** | Side panel, manual close | Context menu, auto-hide | Low | LOW |

**Analysis:**

**Drag Nodes:**
- **Standard:** Click-drag a node to reposition it (with or without force simulation)
- **Current:** Click-drag background to pan; nodes are fixed
- **Gap:** Cannot manually adjust node positions
- **Implementation Cost:** LOW if positions are static, MEDIUM if integrated with force simulation
- **Value Proposition:** **LOW** — Manual positioning conflicts with semantic zone layout
- **Recommendation:** **NO ACTION** — Keep current pan-drag behavior. Zone layout should remain fixed.

**Zoom:**
- **Standard:** Mouse wheel, pinch-to-zoom (touch), zoom buttons, double-click to zoom to node
- **Current:** Mouse wheel, zoom buttons
- **Gap:** No touch support, no zoom-to-node
- **Implementation Cost:** LOW (pinch detection ~10 LOC, zoom-to-node ~15 LOC)
- **Value Proposition:** **MEDIUM** — Touch support increasingly important, zoom-to-node is convenient
- **Recommendation:** **PHASE 2** — Add double-click node to zoom and center. Touch support if usage metrics show mobile traffic.

**Click-to-Expand:**
- **Standard:** Click node to expand its connections, collapse groups
- **Current:** Click node opens detail panel
- **Gap:** No expansion/collapse interaction
- **Implementation Cost:** LOW (show/hide edges and connected nodes)
- **Value Proposition:** **MEDIUM** — Progressive disclosure for complex graphs
- **Recommendation:** **PHASE 3** — Alt-click or right-click to collapse node's connections (hide all edges from/to that node).

**Keyboard Navigation:**
- **Standard:** Arrow keys for spatial navigation, Tab for sequential, Enter/Space to activate
- **Current:** Tab for sequential, Enter to open detail
- **Gap:** No arrow key spatial navigation
- **Implementation Cost:** MEDIUM (requires geometric neighbor calculation)
- **Value Proposition:** **LOW** — Tab navigation works adequately for current node count
- **Recommendation:** **DEFER** — Not worth the implementation complexity at current scale.

**Detail Panel UX:**
- **Standard:** Context menus, hover tooltips, auto-dismiss on click-away
- **Current:** Side panel, manual close button
- **Gap:** Must manually close; no quick-dismiss
- **Implementation Cost:** LOW (click-away detection ~5 LOC)
- **Value Proposition:** **LOW-MEDIUM** — Minor UX improvement
- **Recommendation:** **PHASE 2** — Add click-away-to-close behavior (click background or press Escape).

---

## SITE_LINKS Integration — Technical Implementation

### Current State

**Hierarchy Edges Only:**
```javascript
// buildNetEdges() — lines 1489-1505
for (const page of PAGES) {
  if (!page.parent) continue  // Only parent→child
  // Draw line from parent to child
}
```

**SITE_LINKS Data:**
```javascript
// 53 cross-page relationship edges (lines 1134-1164)
const SITE_LINKS = [
  { from:'home', to:'about' },
  { from:'home', to:'ventures' },
  { from:'formation', to:'articles' },
  // ... 50 more
]
```

### Proposed Implementation

**Render Two Edge Types:**

```javascript
function buildNetEdges() {
  const edgeG = document.getElementById('net-edges')
  edgeG.innerHTML = ''

  // 1. Hierarchy edges (solid, darker)
  for (const page of PAGES) {
    if (!page.parent) continue
    const pn = netNodes.find(n => n.id === page.parent)
    const cn = netNodes.find(n => n.id === page.id)
    if (!pn || !cn) continue

    const line = document.createElementNS('http://www.w3.org/2000/svg','line')
    line.className = 'net-edge net-edge-hierarchy'
    line.setAttribute('x1', pn.x)
    line.setAttribute('y1', pn.y)
    line.setAttribute('x2', cn.x)
    line.setAttribute('y2', cn.y)
    edgeG.appendChild(line)
  }

  // 2. SITE_LINKS edges (dashed, lighter)
  for (const link of SITE_LINKS) {
    const fn = netNodes.find(n => n.id === link.from)
    const tn = netNodes.find(n => n.id === link.to)
    if (!fn || !tn) continue

    const line = document.createElementNS('http://www.w3.org/2000/svg','line')
    line.className = 'net-edge net-edge-link'
    line.setAttribute('x1', fn.x)
    line.setAttribute('y1', fn.y)
    line.setAttribute('x2', tn.x)
    line.setAttribute('y2', tn.y)
    edgeG.appendChild(line)
  }
}
```

**CSS Differentiation:**

```css
/* Hierarchy edges — solid, prominent */
.net-edge-hierarchy {
  stroke: var(--rule, #d8d3c8);
  stroke-width: 1.5px;
  opacity: 0.6;
}

/* SITE_LINKS edges — dashed, subtle */
.net-edge-link {
  stroke: var(--blue, #6a8ac4);
  stroke-width: 1px;
  stroke-dasharray: 3 3;
  opacity: 0.3;
}

/* Hover to highlight */
.net-edge-link:hover {
  opacity: 0.7;
  stroke-width: 2px;
}
```

**Implementation Effort:**
- Lines of code: ~20
- Testing: ~15 minutes (visual verification, check all 53 edges render)
- Complexity: **Trivial** (same pattern as existing hierarchy edges)

**Visual Result:**
- Hierarchy edges: Solid gray lines (parent→child structure)
- SITE_LINKS edges: Dashed blue lines (cross-page relationships)
- Both types visible simultaneously
- SITE_LINKS dimmer to avoid overwhelming hierarchy

---

## Node Sizing by Degree

**Current Sizing:** Fixed by zone (home=20px, public=14px, others=10-12px)

**Proposed:** Base size + degree multiplier

```javascript
// Already computed in PAGES (lines 1167-1178)
page.links_in   // Inbound SITE_LINKS count
page.links_out  // Outbound SITE_LINKS count

// Modified NODE_RADIUS calculation
const BASE_RADIUS = { 0:16, 1:10, 2:8, 3:8, 4:8 }
const DEGREE_SCALE = 1.5  // Add 1.5px per link

function getNodeRadius(page) {
  const base = BASE_RADIUS[page.zone] || 8
  const degree = (page.links_in || 0) + (page.links_out || 0)
  return base + (degree * DEGREE_SCALE)
}

// In renderNetNodes()
const r = getNodeRadius(node.page)
```

**Visual Result:**
- Low-connectivity nodes: Small circles
- High-connectivity nodes (e.g., Formation with 8 links): Larger circles
- Hierarchy structure preserved (via color/zone)
- Link density surfaced (via size)

**Implementation Effort:**
- Lines of code: ~10
- Complexity: **Trivial**

---

## Enhanced Detail Panel

**Current:** Title, path, description, visit link

**Proposed Additions:**

1. **Link Counts Display**
   ```html
   <div class="detail-meta">
     <span class="detail-links-in">← 4 inbound</span>
     <span class="detail-links-out">→ 5 outbound</span>
   </div>
   ```

2. **Connected Pages List**
   ```html
   <div class="detail-connections">
     <h4>Connected to:</h4>
     <ul>
       <li><a href="/about/">About</a> (hierarchy)</li>
       <li><a href="/ventures/">Ventures</a> (link)</li>
     </ul>
   </div>
   ```

3. **Zone Badge**
   ```html
   <span class="detail-zone" style="background: var(--z1)">Public</span>
   ```

**Implementation Effort:**
- Lines of code: ~30
- Data wiring: Lookup SITE_LINKS by `from`/`to` to populate connections list
- Complexity: **Low**

---

## Execution Path Recommendations

### Phase 1: SITE_LINKS Integration (Immediate)

**Scope:**
1. Render SITE_LINKS edges (dashed blue)
2. Keep hierarchy edges (solid gray)
3. Visual differentiation via stroke-dasharray and opacity
4. No behavior changes (click, pan, zoom all unchanged)

**Deliverables:**
- Modified `buildNetEdges()` function
- CSS for `.net-edge-link` class
- Visual verification (all 53 edges render correctly)

**Effort:** 30 minutes
**Risk:** Very low (additive change, no breaking modifications)
**Value:** High (surfaces hidden relationships, fulfills sprint's technical requirement)

**Success Criteria:**
- All 53 SITE_LINKS edges visible
- Hierarchy edges still prominent
- No performance degradation
- Dashed/solid differentiation clear

---

### Phase 2: Degree Sizing + Enhanced Detail (After Phase 1)

**Scope:**
1. Node sizing by degree (base + links_in + links_out)
2. Link counts in detail panel
3. Connected pages list in detail panel
4. Click-away-to-close detail panel
5. Zone filter integration (reuse HUD mode UI)

**Deliverables:**
- Modified `getNodeRadius()` function
- Enhanced detail panel HTML template
- Click-away event handler
- Zone filter buttons (show/hide zones in Network mode)

**Effort:** 2-3 hours
**Risk:** Low (all non-breaking enhancements)
**Value:** Medium-high (improves information density and discoverability)

**Success Criteria:**
- High-degree nodes visibly larger
- Detail panel shows connection graph
- Zone filters work in Network mode
- No breaking changes to existing interactions

---

### Phase 3: Progressive Disclosure (Deferred)

**Scope:**
1. Collapse/expand individual nodes (hide their edges)
2. Show/hide entire zones (toggle zone visibility)
3. Double-click node to zoom and center
4. Touch gesture support (pinch-to-zoom)

**Deliverables:**
- Node collapse state management
- Zone visibility toggles
- Zoom-to-node animation
- Touch event handlers

**Effort:** 4-6 hours
**Risk:** Medium (state management complexity)
**Value:** Medium (useful for larger graphs, not critical at current scale)

**Success Criteria:**
- Can collapse high-degree nodes to reduce clutter
- Can hide entire zones to focus on subset
- Mobile users can zoom with touch gestures
- State persists during pan/zoom

---

## Design Principles for Implementation

### 1. Additive, Not Replacement

**Principle:** Keep existing interactions working; add new capabilities alongside.

**Application:**
- SITE_LINKS edges **add to** hierarchy edges (don't replace)
- Degree sizing **enhances** zone-based sizing (doesn't replace color/zone semantics)
- Detail panel enhancements **add fields** (don't restructure existing layout)

**Rationale:** Reduces risk, maintains user familiarity, allows incremental validation.

---

### 2. Semantic Primacy

**Principle:** Semantic structure (zones, hierarchy) takes precedence over visual aesthetics.

**Application:**
- Keep concentric zone layout (don't adopt force-directed)
- Use color for zone classification (don't reassign to other attributes)
- Hierarchy edges remain prominent (SITE_LINKS are secondary visual layer)

**Rationale:** The graph communicates **organizational structure** (public vs. members vs. steward), not just connectivity. Force-directed layout would lose this semantic meaning.

---

### 3. Progressive Enhancement

**Principle:** Core functionality works without advanced features; enhancements add value but aren't required.

**Application:**
- Basic view (nodes + hierarchy edges) works without SITE_LINKS
- Pan/zoom work without degree sizing
- Detail panel works without connection lists

**Rationale:** Graceful degradation, easier testing, incremental delivery.

---

### 4. Performance Budget

**Principle:** Maintain <100ms interaction latency; avoid layout thrashing.

**Application:**
- Static layout (no force simulation animation loops)
- SVG transforms for pan/zoom (GPU-accelerated)
- Limit DOM complexity (<500 SVG elements total)

**Rationale:** Current performance is excellent; don't sacrifice it for marginal features.

---

## Alternative Approaches Considered

### A. Force-Directed Layout with D3.js

**Approach:**
```javascript
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(edges).id(d => d.id))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width/2, height/2))
  .on("tick", updatePositions)
```

**Pros:**
- Automatic spacing optimization
- Organic, "natural" layout
- Highlights clusters through proximity

**Cons:**
- **Loses semantic zone structure** (can't tell public from members at a glance)
- Animation loop (performance cost)
- Non-deterministic layout (positions change on reload)
- Requires D3.js dependency (~70KB)

**Decision:** **REJECTED** — Zone-based layout communicates organizational structure better than force-directed.

---

### B. Hierarchical Tree Layout

**Approach:** D3 tree layout (vertical or radial)

**Pros:**
- Clear parent→child relationships
- No edge crossings

**Cons:**
- **Doesn't support SITE_LINKS** (cross-tree edges create clutter)
- Requires more vertical/horizontal space
- Less compact than current concentric layout

**Decision:** **REJECTED** — SITE_LINKS edges are the whole point of this sprint. Tree layout doesn't accommodate them well.

---

### C. Matrix View (Adjacency Matrix)

**Approach:** Heatmap-style grid showing all node pairs, colored cells for edges

**Pros:**
- Scales to very large graphs
- No edge crossings
- Easy to spot clusters

**Cons:**
- **Not spatial** (loses geographic/organizational intuition)
- O(n²) visual elements (doesn't scale to >100 nodes)
- Unfamiliar to most users

**Decision:** **REJECTED** — Too abstract for this use case. Spatial layout is more intuitive.

---

## Implementation Checklist

### Phase 1: SITE_LINKS Integration

- [ ] Modify `buildNetEdges()` to render SITE_LINKS
- [ ] Add CSS classes `.net-edge-hierarchy` and `.net-edge-link`
- [ ] Test edge rendering (verify all 53 SITE_LINKS edges appear)
- [ ] Test visual differentiation (dashed vs. solid)
- [ ] Test performance (no lag with 73 total edges)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Accessibility audit (ensure edges don't obscure node labels)

**Estimated Time:** 30-45 minutes
**Blocker Risk:** None (purely additive)

---

### Phase 2: Enhancements

- [ ] Implement `getNodeRadius(page)` with degree calculation
- [ ] Update `renderNetNodes()` to use dynamic radius
- [ ] Add link counts to detail panel HTML template
- [ ] Populate "Connected to" list in `openNetDetail()`
- [ ] Implement click-away-to-close behavior
- [ ] Add zone filter buttons to Network mode UI
- [ ] Wire zone filter logic (hide nodes + incident edges)
- [ ] Test all combinations (filters + zoom + pan)
- [ ] Visual QA (ensure readable at all zoom levels)
- [ ] Accessibility audit (screen reader testing)

**Estimated Time:** 2-3 hours
**Blocker Risk:** Low (most complex part is connected pages list data wiring)

---

### Phase 3: Progressive Disclosure

- [ ] Add collapse/expand state to node data structure
- [ ] Implement click handler for node collapse (alt-click or right-click)
- [ ] Show/hide edges connected to collapsed nodes
- [ ] Add zone visibility toggles (show/hide all zone N nodes)
- [ ] Implement double-click-to-zoom behavior
- [ ] Add touch gesture handlers (pinch-to-zoom)
- [ ] Test state persistence across interactions
- [ ] Test on touch devices (iPad, Android tablet)
- [ ] Accessibility audit (ensure collapse state is announced)

**Estimated Time:** 4-6 hours
**Blocker Risk:** Medium (state management can get complex)

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Visual clutter with 73 edges | Medium | Medium | Use opacity differentiation; add edge hover-to-highlight |
| Performance degradation | Low | Medium | Profile before/after; limit to <500 SVG elements |
| Breaking existing interactions | Low | High | Additive changes only; comprehensive regression testing |
| Cross-browser rendering bugs | Low | Low | Test on Chrome, Firefox, Safari; use standard SVG |

### Design Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SITE_LINKS edges too subtle | Medium | Low | Test with users; adjust opacity/stroke-width if needed |
| Degree sizing confuses zone semantics | Low | Medium | Keep color as primary zone indicator; size is secondary |
| Detail panel too cluttered | Low | Low | Progressive disclosure (collapse sections) |

### Process Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep (force-directed, etc.) | Medium | High | **This audit explicitly defers force-directed to Phase 3+** |
| Bilateral coordination overhead | Low | Medium | Clear division: Nou leads perception, Dia leads implementation |
| Timeline pressure | Low | Medium | Phase 1 is 30 minutes; can deliver value incrementally |

---

## Success Metrics

### Phase 1 (SITE_LINKS Integration)

**Quantitative:**
- [ ] All 53 SITE_LINKS edges render correctly
- [ ] No performance regression (<100ms interaction latency)
- [ ] Visual differentiation passes 5-second test (user can distinguish edge types)

**Qualitative:**
- [ ] Nou confirms semantic clarity (hierarchy vs. relationships)
- [ ] Todd approves visual integration with Techne design system
- [ ] No accessibility regressions (WCAG 2.1 AA maintained)

### Phase 2 (Enhancements)

**Quantitative:**
- [ ] Node size correlates with degree (r² > 0.7)
- [ ] Detail panel shows all connected pages (100% coverage)
- [ ] Zone filters reduce visible node count correctly

**Qualitative:**
- [ ] High-degree nodes are immediately noticeable
- [ ] Connection graph aids navigation discovery
- [ ] Filter interactions feel responsive

### Phase 3 (Progressive Disclosure)

**Quantitative:**
- [ ] Collapsed nodes hide edges correctly (0 visible edges when collapsed)
- [ ] Zoom-to-node centers node in viewport (within 50px margin)
- [ ] Touch gestures work on iOS and Android (pinch zoom ±20% accuracy)

**Qualitative:**
- [ ] Collapse/expand reduces visual clutter effectively
- [ ] Zone toggles make large graph subsets manageable
- [ ] Touch interactions feel natural (no accidental triggers)

---

## Appendix A: Current Code Structure

**File:** `/tree/index.html` (1697 lines)

**Key Functions:**

| Function | Lines | Purpose |
|----------|-------|---------|
| `buildNetEdges()` | 1489-1505 | Render parent→child hierarchy edges |
| `renderNetNodes()` | 1507-1535 | Render node circles and labels |
| `layoutNodes()` | 1473-1487 | Calculate concentric zone positions |
| `openNetDetail()` | 1543-1549 | Show detail panel for clicked node |
| `initNetwork()` | 1553-1597 | Initialize pan/zoom event handlers |

**Data Structures:**

| Structure | Lines | Contents |
|-----------|-------|----------|
| `PAGES` | 1071-1131 | 36 page nodes (id, path, title, zone, parent, description) |
| `SITE_LINKS` | 1134-1164 | 53 cross-page edges (from, to) |
| `ZONE_META` | 1180-1187 | Zone labels, descriptions, colors |
| `netNodes` | 1469 | Runtime node array (x, y, page) |

**CSS Classes:**

| Class | Purpose |
|-------|---------|
| `.net-node` | SVG group for node circle + label |
| `.net-edge` | SVG line for edges (current: hierarchy only) |
| `#detail-panel` | Side panel shown on node click |
| `.zoom-btn` | Zoom in/out/reset buttons |

---

## Appendix B: SITE_LINKS Edge Analysis

**Total Edges:** 53

**Degree Distribution:**

| Node | In-Degree | Out-Degree | Total | Notes |
|------|-----------|------------|-------|-------|
| formation | 4 | 4 | 8 | Highest-degree node |
| intranet-account | 3 | 2 | 5 | Second-highest |
| bylaws | 2 | 1 | 3 | |
| ventures | 2 | 2 | 4 | |
| about | 1 | 3 | 4 | |

**Edge Types by Semantic Category:**

| Category | Count | Examples |
|----------|-------|----------|
| Public↔Members | 12 | ecosystem↔intranet-ecosystem, people→directory |
| Curated↔Members | 8 | patronage-doc↔intranet-patronage, bylaws↔governance |
| Intra-Members | 23 | account→capital, journal→ledger, ventures↔projects |
| Home→Public | 6 | home→about, home→ventures, home→join |
| Other | 4 | faq→join, contact→join |

**Cross-Zone Edges:** 20 (38% of total)
**Intra-Zone Edges:** 33 (62% of total)

**Implications for Visual Design:**
- Most edges (62%) stay within a zone (won't cross zone boundaries visually)
- Cross-zone edges will create longer lines (home→join spans from center to outer ring)
- Opacity differentiation is crucial to avoid overwhelming hierarchy edges

---

## Appendix C: Comparison Matrix — Layout Approaches

| Criterion | Current (Concentric) | Force-Directed | Hierarchical Tree | Matrix View |
|-----------|---------------------|----------------|-------------------|-------------|
| **Semantic Clarity** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| **SITE_LINKS Support** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Deterministic Layout** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Scalability** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **User Familiarity** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Implementation Cost** | ⭐⭐⭐⭐⭐ (already built) | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| **Maintenance Burden** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Legend:** ⭐ = Poor, ⭐⭐⭐ = Adequate, ⭐⭐⭐⭐⭐ = Excellent

**Winner:** Current concentric layout — Best balance of semantic clarity, performance, and implementation simplicity.

---

## Conclusion

The current Network view implementation is **well-designed for its use case** — it prioritizes semantic clarity (zones) over aesthetic graph layout. The proposed SITE_LINKS integration is **straightforward** (30 minutes) and **high-value** (surfaces 53 hidden relationships).

**Recommended execution path:**
1. **Phase 1** (immediate): Add SITE_LINKS edges with visual differentiation
2. **Phase 2** (after validation): Degree-based sizing, enhanced detail panel, zone filters
3. **Phase 3** (deferred): Progressive disclosure, advanced interactions

**Do NOT** pursue force-directed layout — it would sacrifice the semantic structure that makes the current design effective.

**Bilateral coordination:** Nou leads perception and framing; Dianoia leads implementation feasibility and execution path (this document). Next step: Nou provides design feedback on SITE_LINKS visual treatment, then Dianoia implements Phase 1.

---

**Document Status:** DRAFT — Awaiting Nou's bilateral review and design feedback
**Next Action:** Post to Workshop for Nou's review, then implement Phase 1 after alignment
**Estimated Phase 1 Completion:** 2026-04-17 (same day)
