# Trust Network UI & Scenario Engine Review

**Reviewer:** Dianoia (Execution Intelligence)
**Date:** 2026-04-22
**Live Site:** https://cooperation.games/trust/
**Repository:** https://github.com/Roots-Trust-LCA/coordination-games
**Specification:** https://github.com/coordination-games/coordination-games/blob/trust-system-brainstorm/docs/plans/trust-attestations.md

---

## Executive Summary

Nou has implemented a **sophisticated trust network visualization** with strong foundational UI and clear information architecture. The current implementation is a **pre-season illustrative scenario** with mock data, labeled as launching April 24, 2026.

**Strengths:**
- Professional D3.js force-directed graph implementation
- Clean three-column layout with logical information hierarchy
- Comprehensive filtering and magnitude threshold controls
- Real-time graph interactions (drag, zoom, hover, click)
- Accessible theme toggle and responsive design
- Clear visual encoding (node size, color, edge thickness/opacity)

**Opportunities for Enhancement:**
- Scenario engine needs data-driven architecture beyond static mock data
- Missing temporal/historical views (replay, score evolution over time)
- Limited attestation detail visibility (reason text, full edge metadata)
- No stewardship visualization or P&L mechanics exposure
- Agent detail panel could surface more rich metrics
- Missing onboarding/educational layer for new users

---

## Current Implementation Analysis

### UI Components

#### 1. Status Bar (Top)
**Current State:**
```
• Live indicator (green dot + "LIVE")
• Badge: "PRE-SEASON"
• Stats: Agent count (9), Attestations (15), Positive ratio, Network density
• Link to home (cooperation.games)
• Theme toggle
```

**Strengths:**
- Provides critical context at-a-glance
- Live indicator sets expectation for data freshness
- Clean monospace typography

**Enhancement Opportunities:**
- **Season/Game context**: Current scenario shows "Season 1, Game 1" but status bar doesn't surface this
- **Time context**: Add timestamp of last data refresh or "as of Game N"
- **Warning states**: Visual indicator when data is stale, mock, or illustrative
- **Quick actions**: Add "Download data" or "Share view" buttons to status bar

**Recommended Addition:**
```
Status Bar Layout:
[•LIVE] [PRE-SEASON] | Season 1, Game 1 | Agents 9 | Attestations 15 | +82% | ρ=0.42 | [as of Apr 22, 14:30] | ← cooperation.games | ◐
```

---

#### 2. Left Sidebar (Filters & Legend)
**Current State:**
```
• Game filter dropdown (Oathbreaker, Shelling Point, etc.)
• Direction filter: All edges, Positive-only, Negative-only
• Magnitude threshold slider (hide low-confidence edges)
• Legend: Cooperator (Cool), Neutral (Phosphor), Defector (Hot)
```

**Strengths:**
- Logical grouping of controls
- Slider provides fine-grained edge filtering
- Color legend maps to behavioral archetypes

**Enhancement Opportunities:**

**Missing Scope Filter:**
The trust spec defines multiple scopes (CONDUCT, STEWARDSHIP, SKILL:<game-id>). Current UI appears to show only CONDUCT. Need:
```
Scope Selector:
○ Conduct (integrity)
○ Stewardship (judgment quality)
○ Skill: Oathbreaker
○ Skill: Shelling Point
```

**Time Range Filter:**
Trust scores decay over time. Users should be able to view:
```
Time Window:
• Current (live)
• Last 7 days
• Last 30 days
• Season 1 (all)
• Custom range picker
```

**Attester Filter:**
Enable "Show only attestations FROM this agent" or "Show only attestations TO this agent" for ego-centric views.

**Archetype Filter:**
Currently just visual legend. Make it interactive:
```
☑ Cooperators
☑ Neutral
☑ Defectors
```

**Recommended Sidebar Structure:**
```
┌─ FILTERS ──────────────┐
│ Game: [All Games ▼]    │
│ Scope: [Conduct ▼]     │
│ Time: [Current ▼]      │
│                        │
│ Direction:             │
│ ○ All edges            │
│ ○ Positive only        │
│ ○ Negative only        │
│                        │
│ Magnitude Threshold    │
│ [=========○====] 0.3   │
│                        │
│ Show:                  │
│ ☑ Cooperators (Cool)   │
│ ☑ Neutral (Phosphor)   │
│ ☑ Defectors (Hot)      │
│                        │
│ [Export View]          │
└────────────────────────┘
```

---

#### 3. Central Graph Canvas
**Current State:**
- D3.js force-directed simulation
- Nodes: sized by average incoming trust, colored by archetype
- Edges: directed arrows, thickness/opacity by weight, color by polarity
- Interactions: drag nodes, zoom/pan, hover tooltip, click for detail

**Strengths:**
- Professional force simulation (charge, link strength, centering, collision)
- Clear visual hierarchy
- Smooth animations and transitions
- Responsive to window resize

**Enhancement Opportunities:**

**Node Visual Encoding — Expand Information Density:**

Current: Size = avg incoming trust, Color = archetype

Add:
- **Stroke width** = Stewardship level (thicker ring = higher stewardship)
- **Glow/pulse** = Recent activity (attestations received in last N hours)
- **Icon overlay** = Guardian NFT tier (crown, star, badge for Gold/Silver/Bronze)
- **Label visibility** = Currently suppressed at >100 nodes; make this configurable

Example encoding:
```
Node Anatomy:
┌─────────────┐
│   ┌─────┐   │  ← Outer glow (recent activity)
│  ╱       ╲  │
│ │  nova-7 │ │  ← Label (configurable visibility)
│  ╲   👑   ╱  │  ← Crown icon (Guardian Gold)
│   └─────┘   │  ← Thick stroke (high stewardship)
│   (Cool)    │  ← Color (cooperator archetype)
└─────────────┘
```

**Edge Visual Encoding — Surface Confidence & Decay:**

Current: Thickness/opacity = weight, Color = polarity

Add:
- **Dashed line** = Decayed attestation (below certain weight threshold)
- **Animated flow** = Direction indicator (particles moving along edge)
- **Hover tooltip** = Show full edge metadata (polarity, size, scope, reason preview, decay factor)

**Interaction Enhancements:**

1. **Double-click node** → Ego-centric view (dim unconnected nodes, highlight neighbors)
2. **Right-click node** → Context menu (View full profile, Compare with another, Export attestations)
3. **Shift+click edge** → Show full attestation detail in modal
4. **Keyboard shortcuts:**
   - `F` = Fit all nodes to viewport
   - `R` = Restart simulation
   - `E` = Toggle edge labels
   - `L` = Toggle node labels
   - `Esc` = Exit ego-centric view

**Empty State:**
Current: "Single pulsing Cool node, 'Trust network forms when the first game begins.'"

Good! Keep this but add:
- **Visual preview** of what network will look like (ghosted example)
- **Call to action**: "Start playing to build trust" with link to game lobby

---

#### 4. Right Detail Panel
**Current State:**
- Idle: Network summary stats
- Selected: Agent handle, wallet, scores, edges received

**Strengths:**
- Clear state transition (network summary → agent detail)
- Compact presentation of key metrics

**Enhancement Opportunities:**

**Network Summary (Idle State):**

Current shows basic aggregates. Expand to include:
```
NETWORK SUMMARY
───────────────
Agents: 9
Attestations: 15
  ↑ Positive: 12 (80%)
  ↓ Negative: 3 (20%)

Network Density: 0.42
Avg Clustering: 0.68

Top Cooperators:
  1. nova-7 (+0.82)
  2. axiom-4 (+0.71)
  3. verity-1 (+0.65)

Recent Activity:
  • axiom-4 → verity-1 (+0.9)
    2 hours ago
  • nova-7 → mesh-2 (+0.8)
    5 hours ago
```

**Agent Detail (Selected State):**

Current shows: handle, wallet, conduct score, incoming edges

Expand to full profile:
```
┌─ AGENT DETAIL ────────────────┐
│ nova-7                        │
│ 0x1234...5678                 │
│                               │
│ REPUTATION                    │
│ Conduct      +0.82  ████████▌ │
│ Stewardship  +1.45  ██████████│
│ Skill (OB)   +0.33  ████▌     │
│                               │
│ POSITION SUMMARY              │
│ Open Positions: 12            │
│ Unrealized P&L: +3.2          │
│ Closed P&L: +8.7 (lifetime)   │
│                               │
│ GUARDIAN STATUS               │
│ Season 1: Gold (Rank #3)      │
│ 👑 Earned Apr 24, 2026        │
│                               │
│ EDGES (8 received, 5 sent)    │
│                               │
│ Received (newest first):      │
│ ↑ axiom-4   +0.9  conduct     │
│   "Consistent fair play"      │
│   2h ago                      │
│                               │
│ ↑ verity-1  +0.8  conduct     │
│   "Honest report in OB-127"   │
│   1d ago                      │
│                               │
│ ↓ drift-6   -0.6  conduct     │
│   "Cheating attempt detected" │
│   3d ago (decayed to 0.4)     │
│                               │
│ [View Full Attestation Log]   │
│ [Compare with Another Agent]  │
└───────────────────────────────┘
```

**Key Additions:**
- **Stewardship score** (currently missing from UI)
- **P&L metrics** (unrealized + realized)
- **Guardian NFT display** with tier + timestamp
- **Skill scores per game** (not just CONDUCT)
- **Attestation previews** with reason text (first 40 chars)
- **Decay indicators** on old attestations
- **Action buttons** for deeper analysis

---

### Graph Controls

**Current State:**
- "Re-center" button (fit viewport to graph)
- "Restart sim" button (re-run force layout)

**Enhancement Opportunities:**

**Layout Algorithms:**
Add dropdown to switch graph layout:
```
Layout: [Force-directed ▼]
• Force-directed (current)
• Hierarchical (top = high rep)
• Radial (center = highest conduct)
• Community detection (clusters)
```

**Simulation Parameters:**
Expose D3 force parameters for power users:
```
Charge: [-300]
Link Strength: [0.7]
Collision: [15]

[Reset to Defaults]
```

**View Presets:**
Quick views for common analysis tasks:
```
View Preset:
• Network Overview (default)
• Cooperator Cluster
• Defector Warning
• High Stewardship
• Guardian Leaders
```

**Export Controls:**
```
[Download]
• PNG (current view)
• SVG (vector)
• JSON (data)
• CSV (edge list)
```

---

## Scenario Engine Architecture

### Current Implementation Gap

The live site shows a **static illustrative scenario** with hardcoded mock data (9 agents, 15 attestations). The trust system specification describes a sophisticated market-based reputation engine, but there's no evidence of:

1. **Backend API** for live attestation data
2. **Data pipeline** from game events → auto-drip signals
3. **Score computation engine** implementing decay, weighting, tanh normalization
4. **Stewardship calculation** from P&L mechanics
5. **Database storage** of attestations, scores, stewardship snapshots

### Recommended Scenario Engine Design

#### Architecture: Three-Layer Stack

```
┌─────────────────────────────────────────┐
│  PRESENTATION LAYER                     │
│  • cooperation.games/trust/             │
│  • D3.js visualization                  │
│  • React/Vue/Svelte UI components       │
└─────────────────────────────────────────┘
              ↕ REST API
┌─────────────────────────────────────────┐
│  API LAYER (Express/Fastify)            │
│  • GET /api/scores/:wallet/:scope       │
│  • GET /api/attestations?filters        │
│  • GET /api/stewardship/:wallet         │
│  • GET /api/network?game=&time=         │
│  • POST /api/attestations (submit)      │
└─────────────────────────────────────────┘
              ↕ SQL queries
┌─────────────────────────────────────────┐
│  DATA LAYER (PostgreSQL)                │
│  • attestations (event log)             │
│  • att_score_cache (materialized)       │
│  • att_stewardship_snapshots            │
│  • att_open_positions                   │
│  • game_events (read-only consume)      │
└─────────────────────────────────────────┘
```

#### Core Endpoints to Implement

**1. Network Graph Data**
```
GET /api/network?game=<id>&scope=conduct&time=current&threshold=0.3

Response:
{
  "nodes": [
    {
      "id": "0x1234",
      "handle": "nova-7",
      "conduct": 0.82,
      "stewardship": 1.45,
      "archetype": "cooperator",
      "guardian_tier": "gold",
      "recent_activity": 2  // attestations in last 24h
    },
    ...
  ],
  "edges": [
    {
      "from": "0x1234",
      "to": "0x5678",
      "polarity": 1,
      "size": 0.9,
      "weight": 0.87,  // after decay
      "scope": "conduct",
      "reason": "Consistent fair play",
      "created_at": "2026-04-22T10:30:00Z",
      "decay_factor": 0.97
    },
    ...
  ],
  "meta": {
    "agent_count": 9,
    "attestation_count": 15,
    "positive_ratio": 0.8,
    "density": 0.42,
    "timestamp": "2026-04-22T18:00:00Z"
  }
}
```

**2. Agent Detail**
```
GET /api/agents/:wallet/profile?scope=conduct

Response:
{
  "wallet": "0x1234...",
  "handle": "nova-7",
  "scores": {
    "conduct": 0.82,
    "stewardship": 1.45,
    "skill_oathbreaker": 0.33,
    "skill_shelling_point": 0.61
  },
  "positions": {
    "open_count": 12,
    "unrealized_pnl": 3.2,
    "closed_pnl": 8.7
  },
  "guardian": {
    "season": 1,
    "tier": "gold",
    "rank": 3,
    "earned_at": "2026-04-24T00:00:00Z"
  },
  "edges_received": 8,
  "edges_sent": 5
}
```

**3. Attestation History**
```
GET /api/attestations?subject=0x1234&scope=conduct&limit=20&cursor=<id>

Response:
{
  "attestations": [
    {
      "id": "att_xyz",
      "attester": "0x5678",
      "attester_handle": "axiom-4",
      "subject": "0x1234",
      "subject_handle": "nova-7",
      "polarity": 1,
      "size": 0.9,
      "scope": "conduct",
      "reason": "Consistent fair play across 12 games",
      "created_at": "2026-04-22T16:30:00Z",
      "current_weight": 0.87,
      "decay_factor": 0.97,
      "status": "open",
      "unrealized_pnl": 0.15
    },
    ...
  ],
  "cursor": "<next_id>",
  "has_more": true
}
```

**4. Score Time Series**
```
GET /api/scores/:wallet/:scope/history?from=2026-04-01&to=2026-04-22&granularity=daily

Response:
{
  "wallet": "0x1234",
  "scope": "conduct",
  "series": [
    { "date": "2026-04-01", "score": 0.50, "attestation_count": 0 },
    { "date": "2026-04-05", "score": 0.62, "attestation_count": 3 },
    { "date": "2026-04-12", "score": 0.75, "attestation_count": 8 },
    { "date": "2026-04-22", "score": 0.82, "attestation_count": 12 }
  ]
}
```

#### Scenario System: Parameterized Mock Data Generator

For pre-season demonstration and testing, implement a **scenario generator** that creates realistic synthetic data:

```typescript
interface ScenarioConfig {
  agent_count: number;
  cooperator_ratio: number;  // 0.6 = 60% cooperators
  defector_ratio: number;
  attestation_density: number;  // avg edges per agent
  game_count: number;
  time_span_days: number;
  stewardship_distribution: 'uniform' | 'power-law' | 'gaussian';
  narrative?: 'sybil-attack' | 'trust-collapse' | 'recovery' | 'stable';
}

function generateScenario(config: ScenarioConfig): NetworkData {
  // 1. Generate agent population with archetypes
  // 2. Simulate game events and auto-drip signals
  // 3. Generate attestations following behavioral patterns
  // 4. Apply decay mechanics over time
  // 5. Compute scores, stewardship, P&L
  // 6. Return network graph data
}
```

**Example Scenarios:**

**Scenario A: Stable Ecosystem (Current)**
```json
{
  "agent_count": 9,
  "cooperator_ratio": 0.67,
  "defector_ratio": 0.22,
  "attestation_density": 1.7,
  "game_count": 1,
  "time_span_days": 1,
  "narrative": "stable"
}
```

**Scenario B: Sybil Attack Recovery**
```json
{
  "agent_count": 50,
  "cooperator_ratio": 0.70,
  "defector_ratio": 0.20,
  "attestation_density": 3.2,
  "game_count": 8,
  "time_span_days": 30,
  "narrative": "sybil-attack",
  "attack_params": {
    "sybil_count": 15,
    "attack_start_day": 10,
    "target_agent": "0x1234",
    "coordinated_negative_size": 0.8
  }
}
```

**Scenario C: Trust Collapse & Recovery**
```json
{
  "agent_count": 30,
  "cooperator_ratio": 0.40,  // starts low
  "defector_ratio": 0.50,
  "attestation_density": 4.5,
  "game_count": 20,
  "time_span_days": 90,
  "narrative": "recovery",
  "recovery_params": {
    "collapse_day": 15,
    "reform_begins_day": 45,
    "auto_drip_boost": 2.0
  }
}
```

**UI Integration:**

Add scenario selector dropdown in left sidebar:
```
Scenario:
• Live Data (Season 1)         ← when available
• Demo: Stable (9 agents)      ← current
• Demo: Sybil Attack (50 agents)
• Demo: Recovery Arc (30 agents)
• Custom (configure parameters)
```

When custom selected, show parameter form:
```
┌─ CUSTOM SCENARIO ─────────┐
│ Agents: [20]              │
│ Cooperators: [60%]        │
│ Defectors: [20%]          │
│ Attestation density: [2.5]│
│ Games: [5]                │
│ Time span: [14 days]      │
│                           │
│ Narrative:                │
│ ○ Stable ecosystem        │
│ ○ Sybil attack            │
│ ○ Trust collapse          │
│ ○ Recovery arc            │
│                           │
│ [Generate Scenario]       │
└───────────────────────────┘
```

---

## Temporal & Historical Features

### Missing: Time-Based Replay

The trust system is **inherently temporal**:
- Attestations decay over time
- Scores evolve as new attestations arrive
- Stewardship fluctuates with P&L changes
- Auto-drip accumulates from game completions

**Recommended: Replay Interface**

Add timeline scrubber below graph:
```
┌──────────────────────────────────────────────────────────────┐
│  [◀] [▶] [⏸]  Speed: [1x ▼]                                │
│                                                              │
│  ├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┤  │
│  Apr  Apr  Apr  Apr  Apr  Apr  Apr  Apr  Apr  Apr  Apr     │
│  12   14   16   18   20   22   24   26   28   30   May 2   │
│                             ●                                │
│                          [Current]                           │
│                                                              │
│  Event: Game 3 completed (6 auto-drip signals)              │
│  Attestations this hour: 4                                   │
└──────────────────────────────────────────────────────────────┘
```

**Replay Controls:**
- **Play/Pause**: Animate network evolution over time
- **Step forward/back**: Jump to next/previous attestation
- **Speed**: 1x, 5x, 20x playback
- **Event markers**: Vertical lines for games, major attestations, Guardian mints
- **Scrubber position**: Shows current timestamp + event context

**Implementation:**
```typescript
interface ReplayState {
  timestamp: Date;
  playing: boolean;
  speed: number;  // multiplier
  events: TimelineEvent[];
}

interface TimelineEvent {
  timestamp: Date;
  type: 'game' | 'attestation' | 'guardian_mint' | 'threshold_cross';
  description: string;
  affected_agents: string[];
}
```

### Score Evolution Charts

In agent detail panel, add sparkline/chart showing score over time:

```
┌─ CONDUCT SCORE HISTORY ───────┐
│                               │
│  1.0 ┤                        │
│  0.8 ┤         ╭─────╮        │
│  0.6 ┤    ╭────╯     ╰─       │
│  0.4 ┤  ╭─╯                   │
│  0.2 ┤╭─╯                     │
│  0.0 ┼─────────────────────── │
│      Apr 1  Apr 15  Apr 30    │
│                               │
│  ● Game completion (+0.05)    │
│  ▲ Positive attestation       │
│  ▼ Negative attestation       │
└───────────────────────────────┘
```

**Chart Types:**
- **Line chart**: Score over time
- **Bar chart**: Attestation volume per day
- **Stacked area**: Decompose score into components (auto-drip vs attestations)
- **Heatmap**: Daily activity intensity

---

## Educational & Onboarding Layer

### Problem: Complexity Barrier

The trust system has sophisticated mechanics:
- Market-based P&L scoring
- Decay functions with stewardship-dependent half-lives
- Multiple reputation dimensions (CONDUCT, STEWARDSHIP, SKILL)
- Binary polarity with continuous size/weight

**New users won't understand this from the graph alone.**

### Solution: Contextual Education

#### 1. Info Tooltips (Inline)

Add `(?)` icons next to key terms:
```
CONDUCT (?)  +0.82

Tooltip on hover:
┌─────────────────────────────────────┐
│ CONDUCT Score                       │
│                                     │
│ Primary integrity metric measuring  │
│ rule-following, honesty, and fair   │
│ play. Range: -1 (untrusted) to +1  │
│ (highly trusted).                   │
│                                     │
│ New players start at 0.5.           │
│                                     │
│ [Learn more →]                      │
└─────────────────────────────────────┘
```

#### 2. "How It Works" Modal

Add button in status bar or sidebar:
```
[? How Trust Works]
```

Opens modal with tabbed explanation:
```
┌─ TRUST SYSTEM EXPLAINED ──────────────────────┐
│  [Basics] [Attestations] [Scoring] [Stewardship] [FAQ]
│                                               │
│  BASICS TAB:                                  │
│  ───────────                                  │
│  Trust in cooperation.games is built from    │
│  attestations — signed statements where one   │
│  player judges another after games.           │
│                                               │
│  Key Concepts:                                │
│  • Polarity: Positive (+) or Negative (-)    │
│  • Size: Conviction strength (0-1)           │
│  • Scope: What you're judging (conduct/skill)│
│  • Decay: Old attestations fade over time    │
│                                               │
│  Your reputation determines:                  │
│  ✓ Who trusts you to join their games        │
│  ✓ Your voice weight in future attestations  │
│  ✓ Guardian NFT eligibility                  │
│                                               │
│  [Next: Attestations →]                      │
└───────────────────────────────────────────────┘
```

**Tab Contents:**

**ATTESTATIONS:**
- What they are (signed EIP-712 statements)
- When to give them (after meaningful interaction)
- Polarity + Size encoding
- Reason text importance
- Opening vs closing positions

**SCORING:**
- Formula walkthrough (simplified)
- Decay mechanics visualization
- Attester multiplier concept
- tanh normalization (score range)
- Auto-drip from game completion

**STEWARDSHIP:**
- P&L mechanics explanation
- Why early calls earn more
- Slot capacity system
- Guardian NFT rewards

**FAQ:**
- How do I start with good reputation?
- What happens if I get negative attestations?
- Can reputation be gamed?
- How long does recovery take?

#### 3. Interactive Tutorial (First Visit)

Detect first-time visitors and offer guided tour:
```
┌─ WELCOME TO TRUST NETWORK ────────────────┐
│                                           │
│  This visualization shows trust           │
│  relationships between agents in          │
│  Coordination Games Season 1.             │
│                                           │
│  ✓ Each node is a player                 │
│  ✓ Arrows show attestations              │
│  ✓ Colors indicate reputation            │
│                                           │
│  [Start Tour] [Skip]                     │
└───────────────────────────────────────────┘
```

**Tour Steps:**
1. Highlight a node → "This is nova-7, a cooperator with +0.82 CONDUCT"
2. Highlight an edge → "This arrow shows axiom-4 trusts nova-7 (+0.9 attestation)"
3. Show filters → "Filter by game, scope, or edge polarity"
4. Show detail panel → "Click any node to see full profile"
5. Show replay → "Use timeline to see network evolution"

**Implementation:**
```typescript
interface TourStep {
  target: string;  // CSS selector
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'scroll';
}
```

---

## Advanced Features

### 1. Comparative Analysis

**Agent Comparison View:**
```
┌─ COMPARE AGENTS ──────────────────────────┐
│  [nova-7 ▼]  vs  [axiom-4 ▼]             │
│                                           │
│  CONDUCT:   +0.82  ████████  +0.71       │
│  STEWARD:   +1.45  ██████    +0.92       │
│  SKILL(OB): +0.33  ███       +0.58       │
│                                           │
│  EDGES SENT:     5      <    12          │
│  EDGES RECEIVED: 8      >    6           │
│                                           │
│  COMMON ATTESTERS (3):                    │
│  • verity-1  → both positive             │
│  • mesh-2    → nova-7: +0.8, axiom-4: +0.6│
│  • drift-6   → both negative             │
│                                           │
│  DIVERGENT OPINIONS:                      │
│  • lucid-3 trusts nova-7 but not axiom-4 │
│  • quasar-5 neutral on nova-7, + on axiom│
└───────────────────────────────────────────┘
```

### 2. Influence Analysis

**"Who Influences This Agent's Score?"**

Show decomposition of nova-7's CONDUCT score:
```
┌─ SCORE BREAKDOWN: nova-7 ────────────────┐
│  Total: +0.82                            │
│                                          │
│  Top Contributors:                       │
│  1. axiom-4    +0.17  (high stewardship)│
│  2. verity-1   +0.14                     │
│  3. mesh-2     +0.12                     │
│  4. Auto-drip  +0.08  (16 games)        │
│  5. lucid-3    +0.06                     │
│                                          │
│  Detractors:                             │
│  1. drift-6    -0.04  (decayed)         │
│                                          │
│  [View Full Attestation List]            │
└───────────────────────────────────────────┘
```

### 3. Prediction Market Exposure

**Show P&L Mechanics in Action:**

For agents with open positions, visualize unrealized P&L:
```
┌─ OPEN POSITIONS: nova-7 ──────────────────┐
│                                           │
│  ┌─ Position #1 ─────────────────────┐   │
│  │ Subject: axiom-4                  │   │
│  │ Scope: conduct                    │   │
│  │ Opened: Apr 15 at +0.60          │   │
│  │ Current: +0.71                    │   │
│  │ P&L: +0.11 × 0.9 size = +0.099   │   │
│  │ Weight: 0.95 (5 later attest.)   │   │
│  │                                   │   │
│  │ [Close Position]                  │   │
│  └───────────────────────────────────┘   │
│                                           │
│  ┌─ Position #2 ─────────────────────┐   │
│  │ Subject: drift-6                  │   │
│  │ Scope: conduct                    │   │
│  │ Opened: Apr 18 at -0.45          │   │
│  │ Current: -0.62                    │   │
│  │ P&L: -0.17 × -0.8 size = +0.136  │   │
│  │ Weight: 0.88 (decaying)          │   │
│  │                                   │   │
│  │ ✓ Correct negative call!          │   │
│  │ [Close Position]                  │   │
│  └───────────────────────────────────┘   │
│                                           │
│  Total Unrealized: +0.235                │
└───────────────────────────────────────────┘
```

### 4. Cabal/Sybil Detection Alerts

Visual indicators when coordination patterns detected:
```
┌─ NETWORK ALERTS ──────────────────────────┐
│  ⚠ Coordinated Activity Detected          │
│                                           │
│  5 agents all attested against drift-6    │
│  within 2-hour window:                    │
│  • crest-9  → drift-6  -0.7              │
│  • phylon-8 → drift-6  -0.6              │
│  • alt-42   → drift-6  -0.7              │
│  • sybil-1  → drift-6  -0.8              │
│  • sybil-2  → drift-6  -0.7              │
│                                           │
│  Possible cabal attack.                   │
│  Low-stewardship sources → fast decay.    │
│                                           │
│  [View Details]  [Dismiss]                │
└───────────────────────────────────────────┘
```

### 5. Data Export & API Access

**Export Menu:**
```
Download:
• Network graph (JSON)
• Edge list (CSV)
• Agent profiles (CSV)
• Attestations (CSV)
• Score time series (CSV)
• Full database dump (SQL)
• Current view (PNG/SVG)
• Merkle proof (JSON)
```

**Developer API:**
```
API Documentation: /docs/api

Public Endpoints:
• GET /api/network
• GET /api/agents/:wallet
• GET /api/attestations
• GET /api/scores/:wallet/:scope
• GET /api/guardians/:season

Rate Limits:
• Anonymous: 60 req/hour
• Authenticated: 600 req/hour
• Websocket: Real-time updates

Authentication:
• EIP-712 signature
• Guardian NFT holders: unlimited
```

---

## Performance Optimization

### Current State
- D3.js force simulation runs client-side
- All nodes/edges loaded at once
- No virtualization or pagination

### Scalability Concerns

**Season 1 projections:**
- 100 agents → 10,000 possible edges (if fully connected)
- 1,000 attestations per week → 13,000 in a quarter
- Graph rendering will slow significantly at scale

### Recommended Optimizations

#### 1. Server-Side Graph Preprocessing

Don't send all attestations to client. Precompute:
```
Backend pipeline:
1. Load all attestations from database
2. Apply filters (game, scope, time, threshold)
3. Aggregate parallel edges (multiple attestations between same pair)
4. Prune low-weight edges below threshold
5. Return pruned graph (typically 200-500 edges)
```

#### 2. Progressive Loading

For large graphs:
```
Initial load:
• Top 50 nodes by reputation
• Edges with weight > 0.5
• Basic layout

On zoom/pan:
• Load additional nodes in viewport
• Load lower-weight edges for visible nodes
```

#### 3. WebGL Rendering

For >500 nodes, switch from SVG to WebGL:
```
Library options:
• sigma.js (WebGL + Canvas)
• Graphology
• Cytoscape.js with WebGL renderer
```

#### 4. Graph Sampling

For network overview at scale:
```
Sampling strategies:
• Random node sample (Monte Carlo)
• Importance sampling (high-reputation agents)
• Community-preserving sampling
• Edge weight-based sampling
```

Show controls:
```
Display:
○ Full network (982 nodes)
● Sample: 100 nodes (high-reputation)
○ Sample: 200 nodes (random)
○ Custom (configure sampling)

[Regenerate Sample]
```

---

## Mobile Responsiveness

### Current State
The design is responsive with theme toggle and collapsible panels.

### Enhancement Opportunities

**Touch Interactions:**
- **Pinch to zoom** (currently mouse-only)
- **Long-press** for node context menu
- **Swipe** to navigate between detail panel tabs
- **Two-finger rotate** to reorient graph

**Mobile-Optimized Layout:**
```
Mobile (< 768px):
┌─────────────────────┐
│  [Status Bar]       │
├─────────────────────┤
│                     │
│   [Graph Canvas]    │
│                     │
│                     │
├─────────────────────┤
│ [Filters] [Detail]  │  ← Tabbed bottom sheet
└─────────────────────┘

Swipe tabs:
• Filters
• Agent Detail
• Network Stats
• Settings
```

**Gesture Hints:**
Add brief overlay on first mobile visit:
```
Tap node → View profile
Pinch → Zoom
Drag → Pan
Long press → Options
```

---

## Accessibility (a11y)

### Current Gaps

Graph visualizations are inherently challenging for screen readers and keyboard-only users.

### Recommendations

#### 1. Keyboard Navigation

**Full keyboard support:**
```
Tab       → Move between nodes
Enter     → Select node (show detail)
Arrows    → Pan graph
+/-       → Zoom in/out
Esc       → Deselect node
F         → Fit to viewport
/         → Focus search box
1-9       → Quick-select top 9 agents
```

#### 2. Screen Reader Support

**ARIA labels:**
```html
<div role="application" aria-label="Trust network graph">
  <div role="list" aria-label="Agents">
    <div role="listitem" aria-label="nova-7: Cooperator, CONDUCT +0.82, 8 edges received">
  </div>
</div>
```

**Text-based alternative view:**
```
[Switch to List View]

AGENTS (9 total)
────────────────
1. nova-7
   Archetype: Cooperator
   CONDUCT: +0.82 (High)
   STEWARDSHIP: +1.45 (Very High)
   Guardian: Gold (Rank #3)

   Attestations received:
   • ↑ axiom-4: +0.9 "Consistent fair play"
   • ↑ verity-1: +0.8 "Honest report"
   • ↓ drift-6: -0.6 "Cheating attempt" (decayed)

   [View Full Profile]

2. axiom-4
   ...
```

#### 3. Color Blindness Support

**Current issue:** Cool/Hot/Phosphor colors may not be distinguishable

**Solutions:**
- **Pattern overlays**: Add texture/hatching to nodes
- **Shape variation**: Circle = cooperator, Square = defector, Diamond = neutral
- **Label indicators**: Always show archetype text on node
- **Color palette options**: Deuteranopia, Protanopia, Tritanopia-safe palettes

```
Settings:
Color Mode:
○ Default (Cool/Hot/Phosphor)
○ Colorblind-safe (Blue/Orange/Gray)
○ High contrast (Black/White/Yellow)
○ Shapes only (no color encoding)
```

---

## Implementation Priority Matrix

### Phase 1: Foundation (Week 1-2)
**Goal:** Backend data pipeline + API

- [ ] Implement attestation storage (PostgreSQL)
- [ ] Score computation engine (decay, weighting, tanh)
- [ ] Stewardship calculation (P&L mechanics)
- [ ] REST API endpoints (/api/network, /api/agents, /api/attestations)
- [ ] Scenario generator for mock data
- [ ] Replace hardcoded data with API calls

**Deliverable:** Live API serving dynamic network data

---

### Phase 2: Core UI Enhancements (Week 3-4)
**Goal:** Richer visualization

- [ ] Expanded node encoding (stewardship stroke, Guardian icons)
- [ ] Enhanced edge tooltips (full metadata on hover)
- [ ] Agent detail panel expansion (P&L, skill scores, attestation previews)
- [ ] Filter additions (scope, time range, archetype checkboxes)
- [ ] Keyboard shortcuts
- [ ] Export functionality (PNG, SVG, JSON, CSV)

**Deliverable:** Feature-complete trust network UI

---

### Phase 3: Temporal Features (Week 5)
**Goal:** Historical analysis

- [ ] Timeline replay interface
- [ ] Score evolution charts
- [ ] Event markers on timeline
- [ ] Play/pause/step controls
- [ ] Speed adjustment

**Deliverable:** Time-based network analysis

---

### Phase 4: Advanced Analysis (Week 6)
**Goal:** Deep insights

- [ ] Agent comparison view
- [ ] Influence decomposition
- [ ] P&L position tracking
- [ ] Cabal/sybil detection alerts
- [ ] Prediction market exposure UI

**Deliverable:** Advanced trust analytics

---

### Phase 5: Onboarding & Education (Week 7)
**Goal:** Accessibility for new users

- [ ] Contextual tooltips (all key terms)
- [ ] "How It Works" modal (tabbed explainer)
- [ ] Interactive tutorial (first-visit guided tour)
- [ ] FAQ section
- [ ] Educational resources library

**Deliverable:** User-friendly trust interface

---

### Phase 6: Scale & Performance (Week 8)
**Goal:** Production-ready

- [ ] Server-side graph preprocessing
- [ ] Progressive loading (viewport-based)
- [ ] WebGL renderer option (>500 nodes)
- [ ] Graph sampling controls
- [ ] Caching strategy (Redis for score_cache)
- [ ] Rate limiting (API endpoints)

**Deliverable:** Scalable trust system

---

### Phase 7: Mobile & Accessibility (Week 9)
**Goal:** Universal access

- [ ] Touch gesture support
- [ ] Mobile-optimized layout (bottom sheet)
- [ ] Keyboard navigation (full support)
- [ ] Screen reader compatibility (ARIA)
- [ ] Colorblind-safe palette options
- [ ] Text-based alternative view

**Deliverable:** Accessible trust network

---

## Design System Integration

### Current State
The trust page uses a custom color palette (Cool/Hot/Phosphor) and IBM Plex Mono + Inter fonts.

### Recommendation: Unify with cooperation.games Design System

**Colors:**
```css
/* Current (trust page) */
--cool:     #02E2AC;
--hot:      #FF5A1F;
--phosphor: #C9A85D;

/* Match to cooperation.games palette if defined */
/* Or establish trust page as canonical palette */
```

**Typography:**
- IBM Plex Mono (11px, monospace for status bar, data)
- Inter (body text, UI labels)

**Component Library:**
Consider extracting reusable components:
- StatusBar (reusable across pages)
- FilterPanel (sidebar pattern)
- DetailPanel (right panel pattern)
- TimelineControls (replay scrubber)
- ThemeToggle (light/dark switcher)

---

## Security & Privacy Considerations

### Data Exposure

**Public data:**
- Network graph structure
- Attestation content (polarity, size, scope, reason)
- Agent handles and wallets
- Scores and stewardship values

**Private data:**
- Wallet private keys (never transmitted)
- EIP-712 signatures (stored for verification, not exposed in UI)

**Recommendations:**
- [ ] Document what data is public vs private
- [ ] Add privacy notice on first visit
- [ ] Allow agents to opt-out of public graph display (hide from /trust/ but maintain backend score)
- [ ] Redact sensitive reason text (profanity filter, PII detection)

### Rate Limiting

**Attack vectors:**
- API scraping (enumerate all agents/attestations)
- Graph layout computation DoS (request 10K+ node graph repeatedly)
- Websocket flooding (spam real-time updates)

**Mitigations:**
- [ ] Anonymous: 60 req/hour (IP-based)
- [ ] Authenticated: 600 req/hour (wallet-based)
- [ ] Guardian NFT holders: 6000 req/hour (verified on-chain)
- [ ] Websocket: Max 10 connections per IP, heartbeat timeout

### Content Moderation

**Reason text can contain:**
- Profanity
- Personal attacks
- Doxxing attempts
- Spam/advertisements

**Recommendations:**
- [ ] Implement profanity filter (client + server-side)
- [ ] Truncate reason text preview to 40 chars (full text in modal)
- [ ] Add "Report" button for inappropriate content
- [ ] Steward review queue for flagged attestations
- [ ] Auto-hide attestations with >N reports pending review

---

## Testing Strategy

### Unit Tests
- [ ] Score computation (decay, weighting, tanh)
- [ ] Stewardship calculation (P&L, position aggregation)
- [ ] Filter logic (game, scope, time, threshold)
- [ ] Graph data transformations

### Integration Tests
- [ ] API endpoint responses (network, agents, attestations)
- [ ] Database queries (attestations, scores, stewardship)
- [ ] Real-time updates (websocket, score changes)

### Visual Regression Tests
- [ ] Screenshot comparison (graph layouts)
- [ ] Responsive breakpoints (mobile, tablet, desktop)
- [ ] Theme toggle (light/dark mode)

### Performance Tests
- [ ] Graph rendering at scale (100, 500, 1000 nodes)
- [ ] API latency (cold cache vs warm cache)
- [ ] Websocket throughput (concurrent connections)

### User Acceptance Tests
- [ ] First-time visitor flow (tutorial completion)
- [ ] Filter interactions (game, scope, threshold)
- [ ] Agent detail inspection (click node → view profile)
- [ ] Replay functionality (play, pause, step, scrub)
- [ ] Export workflows (PNG, SVG, CSV download)

---

## Metrics & Analytics

### Track User Behavior

**Key metrics:**
- Page views (/trust/ visits)
- Session duration (engagement time)
- Filter usage (which filters most common?)
- Node clicks (which agents most viewed?)
- Export downloads (PNG vs CSV vs JSON)
- Tutorial completion rate
- Mobile vs desktop usage
- Graph zoom/pan interactions

**Implementation:**
```typescript
// Privacy-preserving analytics
analytics.track('node_clicked', {
  archetype: 'cooperator',  // Don't track specific wallet
  conduct_range: '0.8-1.0',
  source: 'graph_canvas'
});

analytics.track('filter_applied', {
  filter_type: 'game',
  filter_value: 'oathbreaker',
  current_node_count: 45
});
```

### Performance Monitoring

**Track technical metrics:**
- Graph render time (initial load)
- API response times (p50, p95, p99)
- Websocket latency (message propagation)
- Error rates (4xx, 5xx responses)
- Browser compatibility (Chrome, Firefox, Safari, Edge)

---

## Conclusion

Nou has built a **strong foundation** for the trust network visualization. The current implementation demonstrates:

✅ Professional D3.js graph rendering
✅ Clean three-column layout
✅ Comprehensive filtering controls
✅ Interactive agent details
✅ Accessible theme toggle

**To reach production readiness, focus on:**

1. **Data Architecture** — Backend API + score computation engine (Phase 1)
2. **Temporal Features** — Replay timeline + score evolution charts (Phase 3)
3. **Educational Layer** — Onboarding tutorial + contextual tooltips (Phase 5)
4. **Scale & Performance** — Server-side preprocessing + progressive loading (Phase 6)
5. **Stewardship Exposure** — P&L mechanics + position tracking UI (Phase 4)

**Highest impact enhancements:**
- Implement live API to replace hardcoded scenario data
- Add replay timeline to show network evolution over time
- Expand agent detail panel to surface stewardship + P&L metrics
- Create "How It Works" educational modal for new users
- Build scenario generator for pre-season demonstrations

The trust attestation specification is sophisticated and well-designed. The UI implementation matches the complexity of the underlying mechanics once the backend data pipeline is complete.

---

**Next Step:** Prioritize Phase 1 (Backend API) to unlock all subsequent features. Without live data, the trust network remains an impressive demo rather than a functional trust system.
