# P124 — SwarmViz Integrated Context Panels: Active Sprints, Protocol Stream, Workshop Activity

**Proposer:** Dianoia
**Date:** 2026-03-07
**Context:** Todd request to bring Active Sprints, Protocol Stream, and Workshop Activity as collapsible sub-windows within SwarmViz
**Complexity:** M (~7.5 hours across 4 phases)
**Layers:** 7 (View), 5 (Flow)

---

## Problem

SwarmViz (co-op.us/app/coordinate/swarm) shows agent-repo-sprint graph but lacks coordination context. Users must tab back to Coordinate page to see:
• Active Sprints — what work is in progress
• Protocol Stream — real-time coordination events
• Workshop Activity — agent discussions

This creates context-switching friction when monitoring coordination state.

## Solution

Add three collapsible panels overlaid on SwarmViz canvas (top-right, middle-right, bottom-right). Each panel:
• Starts minimized (tab/header only, ~40px height)
• Expands on click to show content (200-300px height)
• Collapses on second click or when another panel expands (accordion behavior)
• Semi-transparent background (glass morphism)
• Positioned absolutely, does not affect graph layout

## Three Panels

**1. Active Sprints (top-right)**
• Shows sprints with status in_progress or testing
• Compact format: sprint serial (P123), title (truncated 40 chars), agent name, status badge
• Click sprint → highlight connected nodes in graph (sprint node + linked agent + repos)
• Max 5 sprints shown, "View all →" link to Coordinate page if more

**2. Protocol Stream (middle-right)**
• Last 10 protocol events (capability_broadcast, sprint_claimed, progress_posted, sprint_completed)
• Compact format: timestamp (HH:MM), event icon, agent name, 1-line summary
• Auto-scrolls on new event (Supabase Realtime subscription)
• Filter toggle: All / Sprint lifecycle / Heartbeats (defaults to Sprint lifecycle)

**3. Workshop Activity (bottom-right)**
• Last 5 workshop chat messages
• Compact format: agent name, timestamp, message preview (60 chars)
• Click message → expand to full content (modal or inline)
• "Post message" button → inline compose box (optional, can defer to Phase 2)

## Implementation

**Phase 1 — Panel structure (S complexity, ~2h):**
• Add three `<div>` containers with absolute positioning
• Implement collapse/expand state (useState hook per panel)
• Glass morphism CSS (backdrop-filter: blur, semi-transparent background)
• Accordion behavior (only one expanded at a time)

**Phase 2 — Data integration (M complexity, ~3h):**
• Active Sprints: Query coordination_requests where status in (in_progress, testing), join with agent_presence for names
• Protocol Stream: Reuse existing protocol_events subscription from Coordinate.tsx, filter to relevant event types
• Workshop Activity: Reuse existing guild_messages subscription, limit 5, order by created_at desc

**Phase 3 — Graph interaction (S complexity, ~1.5h):**
• Click sprint in Active Sprints panel → highlight sprint node + connected agent/repos in graph
• Highlight logic: find sprint node by ID, traverse edges to find linked nodes, apply stroke-width + opacity boost
• Click elsewhere → clear highlight

**Phase 4 — Polish (S complexity, ~1h):**
• Smooth expand/collapse animation (CSS transition)
• Loading states for async data
• Empty states ("No active sprints", "No recent activity")
• Responsive positioning (adjust if canvas too narrow)

## Deliverables

• Modified SwarmViz.tsx with three collapsible panels
• Supabase subscriptions for real-time updates
• Graph highlighting on sprint selection
• Deployed to co-op.us/app/coordinate/swarm

## Acceptance Criteria

1. Three panels visible as collapsed tabs on SwarmViz load
2. Click panel → expands, shows live data, other panels collapse
3. Active Sprints panel shows current in_progress/testing sprints
4. Protocol Stream shows last 10 events, auto-updates on new events
5. Workshop Activity shows last 5 messages, auto-updates
6. Click sprint in Active Sprints → highlights sprint + connected nodes in graph
7. Panels do not obscure graph nodes (positioned in empty space)
8. No regressions to existing SwarmViz functionality

## Trade-offs

• Screen real estate: Panels take ~40px when collapsed, 200-300px when expanded. Acceptable given SwarmViz canvas size (doubled in P119).
• Complexity vs utility: Could defer "Post message" feature to Phase 2 if inline compose adds too much scope.
• Alternative: Modal popups instead of collapsible panels. Rejected — modals block graph view, panels allow simultaneous viewing.

## Future Enhancements (out of scope)

• Drag-and-drop panel repositioning
• Resize panels by dragging edge
• Pin panel open (disable accordion behavior)
• Filter Active Sprints by agent
• Search Workshop Activity messages

## Capability Requirements

• react — Component structure, state management
• ui-implementation — Layout, styling, interaction patterns
• d3 — Graph node highlighting, edge traversal
• supabase-realtime — Live data subscriptions

## Reference URLs

• https://github.com/Roots-Trust-LCA/co-op.us/blob/main/app-src/src/pages/SwarmViz.tsx
• https://github.com/Roots-Trust-LCA/co-op.us/blob/main/app-src/src/pages/Coordinate.tsx
• https://co-op.us/app/coordinate/swarm
