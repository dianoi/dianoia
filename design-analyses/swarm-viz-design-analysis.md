# Swarm-Viz Design Analysis — Visual Patterns for Workshop Capability Grid

*Analysis of https://nou-techne.github.io/swarm-viz/*
*Conducted: 2026-03-06*

## Executive Summary

The swarm-viz visualization demonstrates a physics-based, organic approach to representing agent coordination. It uses SVG, force-directed layout, and a sophisticated dark theme with muted colors. The design prioritizes spatial relationships and visual weight over rigid grid structures.

---

## 1. Overall Page Layout & Structure

**Viewport**: 1184×642px (1.84:1 aspect ratio)
**Technology**: SVG with viewBox="0,0,1182,640"
**Background gradient**:
- Body: `#0a0a0a` (near-black)
- Visualization container: `#141414` (slightly lighter)
- Repository cards: `#111` (darkest)

**Layout approach**:
- Single-page scroll layout
- Hero visualization at top
- Text content below (philosophy, roadmap, credits)
- No visible UI chrome or controls overlaying the visualization
- Organic spatial distribution (force-directed graph, not grid)

---

## 2. Agent Node Representation

### Visual Structure

Each agent node consists of **4 layers**:

1. **Halo** (outer circle)
   - Stroke-only, no fill (`fill="none"`)
   - Larger radius (32–40px)
   - Creates visual breathing room
   - Class: `.halo`

2. **Core** (inner filled circle)
   - Solid color fill
   - Smaller radius (26–35px)
   - Represents the agent's identity
   - Class: `.core`

3. **Initials** (centered text)
   - 2-letter abbreviation (NO, DI, AR, KA, PR, ER)
   - Font: 11px, weight 500
   - Fill: `#0a0a0a` (dark, contrasts with core)
   - Class: `.initials`

4. **Labels** (positioned below core)
   - Agent name: 13px, `#c8c2ba` (cream), class `.name-label`
   - Craft pairing: 9px, `#555` (dim gray), class `.craft-label`

### Size Encoding

Node radius varies by importance/activity:
- Smallest: 26.3px (Ergon)
- Largest: 34.7px (Dianoia)
- Variation suggests **relative capacity or activity level**

### Color Palette — Agent Cores

| Agent | Color | Hex |
|-------|-------|-----|
| Nou | Muted blue | `#7a9ab5` |
| Dianoia | Sage green | `#8aba8a` |
| Arete | Cyan | `#06b6d4` |
| Kairos | Sage green | `#8aba8a` |
| Praxis | Muted blue | `#7a9ab5` |
| Ergon | Sage green | `#8aba8a` |

**Pattern**: Colors repeat across agents, suggesting **craft affinity** rather than unique identity colors.

---

## 3. Repository/Artifact Representation

**Visual element**: Rounded rectangles with stroke outlines
- Width: 100–120px
- Height: 20–52px
- Fill: `#111` (dark background)
- Stroke: Varied accent colors matching connected agents
- Class: `.repo-bg`

**Labels** (inside rectangles):
- Repository name: `.repo-name`
- Commit count: `.repo-commits`
- Description (truncated): `.repo-desc` with ellipsis

**Examples**:
- `co-op.us` — 287 commits, stroke `#c4956a` (warm tan)
- `watershed-data` — 53 commits, stroke `#06b6d4` (cyan)
- `the-habitat` — 94 commits, stroke `#8aba8a` (sage)
- `swarm-viz` — 12 commits, stroke `#9a7ab5` (purple)
- `nou-techne` — 157 commits, stroke `#f59e0b` (amber)

---

## 4. Connections & Relationships

**Connection lines**:
- Element: `<line>`
- Count: Only 2 visible lines in current view
- Stroke: `#ece6de` (cream)
- Stroke width: 1.8px
- No dashed patterns
- Minimal use — suggests **sparse, intentional connections**

**Small decorative circles**:
- Radius: 3px
- Count: 21 total
- Colors: Match repository accent colors (e.g., `#c4956a`)
- Likely represent **contribution points** or **activity markers**

---

## 5. Typography

### Font Stack

- **Body text**: `"Source Serif 4", serif` — traditional, readable serif
- **Headings**: `Cormorant, serif` — elegant display serif
- **SVG labels**: System default (likely sans-serif for clarity)

### Text Hierarchy in SVG

| Element | Size | Weight | Color | Purpose |
|---------|------|--------|-------|---------|
| Agent name | 13px | 400 | `#c8c2ba` | Primary identity |
| Initials | 11px | 500 | `#0a0a0a` | Badge/icon |
| Craft label | 9px | 400 | `#555` | Secondary context |
| Repo name | ~10px | 400 | Light | Repository identity |
| Art title | 8px | 400 | `#888` | Decorative context |

---

## 6. Color System

### Background Layers

```
#0a0a0a  ← Body (deepest black)
#141414  ← Visualization container
#111     ← Repository card backgrounds
```

### Text Colors

```
#ece6de  ← Cream (primary text, connections)
#c8c2ba  ← Light cream (agent names)
#888     ← Medium gray (metadata)
#555     ← Dim gray (craft labels)
#0a0a0a  ← Dark (initials on light cores)
```

### Accent Colors

**Agents**: `#7a9ab5` (blue), `#8aba8a` (green), `#06b6d4` (cyan)

**Repositories**: `#c4956a` (tan), `#06b6d4` (cyan), `#8aba8a` (sage), `#9a7ab5` (purple), `#f59e0b` (amber)

**Design principle**: Muted, desaturated palette. No harsh neon or pure primaries. Organic, earthy tones.

---

## 7. Spatial Layout & Physics

**Approach**: Force-directed graph simulation
- Nodes drift into natural equilibrium
- No rigid grid or alignment
- Spacing suggests **relational proximity** (agents near related repos)
- Central clustering with outward dispersion

**Visual weight**:
- Larger nodes (agents) act as gravitational centers
- Smaller artifacts orbit around them
- Empty space is generous — not densely packed

---

## 8. Interaction Patterns

**Observed limitations** (static analysis):
- No visible hover states detected in DOM structure
- No tooltips or info panels observed
- No filtering controls visible
- Likely **read-only visualization** prioritizing contemplation over manipulation

**Inferred interactions** (based on structure):
- Clicking nodes might navigate to repositories (several `<link>` elements point to GitHub, co-op.us, the-habitat.org)
- Hovering might highlight connected elements
- Physics might allow dragging nodes

---

## 9. Information Architecture

### Data Displayed

**Per agent**:
- Name
- Initials
- Craft pairing (e.g., "Code × Water")
- Visual size (implied activity/capacity)
- Spatial relationship to other agents and repos

**Per repository**:
- Name
- Commit count
- Short description
- Stroke color (project identity)

**Relationships**:
- Sparse line connections
- Small circle markers (contribution activity?)
- Spatial proximity

### What's Missing (compared to Workshop protocol)

- Agent status (active/idle/executing)
- Current capacity (0-100)
- Functional mode (e.g., "code:verifying")
- Real-time heartbeat indicators
- Sprint associations
- Protocol events stream

---

## 10. Visual Hierarchy & Design Elements

### Primary elements (highest contrast)
1. Agent core circles (color-filled, largest)
2. Agent names (`#c8c2ba`, 13px)

### Secondary elements
3. Repository rectangles (outlined, not filled)
4. Initials badges (dark on light)
5. Connection lines (`#ece6de`)

### Tertiary elements
6. Craft labels (`#555`, small)
7. Small marker circles (3px)
8. Repository metadata

**Principle**: Visual weight through **size** and **color saturation**, not through borders or shadows.

---

## 11. Responsive/Adaptive Design

- Fixed SVG viewBox (1182×640) scales proportionally
- No observed breakpoints or mobile-specific layout
- Text sizes are absolute (px), not responsive (em/rem)
- Likely **desktop-first** design

---

## 12. Design Patterns Applicable to Workshop Capability Grid

### What to Adopt

1. **Dark theme with muted accents** — reduces eye strain, focuses attention
2. **Halo + core circle pattern** — creates visual breathing room without cluttering
3. **Size encoding for capacity/activity** — intuitive visual weight
4. **Color-coded craft affinities** — agents with similar roles share palette
5. **Sparse connections** — only show meaningful relationships, not everything
6. **Generous whitespace** — don't pack the grid tightly
7. **Layered text hierarchy** — name prominent, metadata recedes
8. **Cream/beige text on dark** — softer than pure white

### What to Adapt (Not Direct Copy)

1. **Force-directed layout → Grid layout** — Workshop needs structured rows/columns for scanning
2. **Organic positioning → Aligned cells** — agents need predictable locations
3. **Static visualization → Live updates** — Workshop must reflect real-time protocol state
4. **Minimal interactivity → Rich tooltips** — Workshop users need details on demand
5. **No status indicators → Active heartbeat pulses** — Workshop must show who's alive
6. **Initials only → Full agent names** — Workshop is a coordination tool, not art

### What to Avoid

1. **Pure aesthetic over function** — swarm-viz is contemplative; Workshop is operational
2. **Physics simulation** — adds complexity without coordination value
3. **Hidden metadata** — Workshop needs capacity/status/mode visible at a glance
4. **Desktop-only design** — Workshop must work on tablets/phones

---

## 13. Key Takeaways for Workshop Redesign

### Visual Language

- **Dark backgrounds** (`#0a0a0a` to `#141414`) with **soft text** (`#c8c2ba`, `#ece6de`)
- **Muted accent palette** — blues, greens, tans, not bright primaries
- **Serif typography** for warmth (Cormorant, Source Serif) vs. sterile sans-serif
- **Circle motifs** for agents (organic, collaborative) vs. sharp rectangles

### Information Design

- **Layered labels** — primary identifier large, metadata small
- **Size as signal** — larger nodes = higher capacity or activity
- **Color grouping** — similar crafts share palette
- **Selective connections** — show only active relationships, not all possible

### Interaction Model

- **Hover for details** — keep grid clean, show context on demand
- **Real-time pulse** — subtle animation for heartbeats (not in swarm-viz, but needed)
- **Status badges** — small indicators for active/idle/executing (overlay on halo?)
- **Click for deep info** — agent profile, sprint history, capabilities

---

## 14. Design Assets for Reference

**Screenshots**:
- `/tmp/swarm-viz-initial.png` — Full page view
- `/tmp/swarm-viz-scrolled.png` — Lower content
- `/tmp/swarm-viz-final.png` — Final state

**Color Palette** (extracted):
```
Agent cores: #7a9ab5, #8aba8a, #06b6d4
Repo strokes: #c4956a, #9a7ab5, #f59e0b
Backgrounds: #0a0a0a, #141414, #111
Text: #ece6de, #c8c2ba, #888, #555
```

**Fonts**:
- Cormorant (display serif)
- Source Serif 4 (body serif)

---

## 15. Next Steps for Workshop Implementation

1. **Prototype dark theme** — test `#141414` background with capability grid
2. **Design agent circle component** — halo + core + initials + status badge
3. **Create capacity encoding** — map 0-100 capacity to circle radius (20–40px range)
4. **Build color system** — craft-based palette for agent grouping
5. **Add real-time pulse** — subtle scale animation on heartbeat reception
6. **Design hover state** — tooltip with full status, capabilities, current sprint
7. **Test on mobile** — ensure grid remains scannable at 375px width

---

*Analysis complete. The swarm-viz visualization demonstrates that agent coordination can feel organic and contemplative while still conveying technical relationships. Workshop should adopt its **visual warmth** and **spatial clarity** while adding the **real-time operational data** required for active coordination.*
