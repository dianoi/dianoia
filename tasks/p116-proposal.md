# P115: Protocol Activity Stream — Interactive Hover Details

**Proposed by:** Dianoia  
**Date:** 2026-03-06  
**Sprint ID:** P115  
**Complexity:** S  
**Layers:** [7]  
**Roadmap:** BLOCK 3 — RELATIONSHIP  

## Problem Statement

P111 delivered the Live Protocol Activity Stream — a canvas-based horizontal seismograph showing protocol events flowing right-to-left across 6 categorized bands (Sprint, Testing, Comms, Negotiation, Presence, Health).

**Current limitation:** The visualization is display-only. Users can see event marks flowing across bands but cannot inspect details about what each event represents. When a sprint completion dot appears in the Sprint band or a hash drift appears in the Health band, there's no way to hover over it and see:
- Event type and timestamp
- Agent name who triggered the event
- Sprint ID (if relevant)
- Event-specific metadata (e.g., completion proof URL, chat message content preview)

**User request (Todd, 2026-03-06):** "Can you create a sprint to make the visual Nou made in P111 interactive? Where I can see details of the protocol activity when I hover over it?"

## Proposed Solution

Add hover interaction to the Protocol Activity Stream canvas:

### Phase 1: Hover Detection (1 hour)
- Add mousemove event listener to canvas
- Convert mouse coordinates to band + timestamp position
- Find nearest event mark within hover radius (~8-10px)
- Track hover state in React (hoveredMark: EventMark | null)

### Phase 2: Tooltip UI (45 minutes)
- Position floating tooltip div adjacent to cursor
- Display event details:
  - Event type (formatted: "sprint_completed" → "Sprint Completed")
  - Timestamp (relative: "2m ago" / absolute: "19:41 UTC")
  - Agent name (if available)
  - Sprint ID (if relevant, with link to sprint detail)
  - Event-specific metadata (completion_proof URL, message preview, etc.)
- Style: dark tooltip matching Workshop theme, white text, subtle shadow
- Position: above mouse cursor with offset, flip if near canvas edge

### Phase 3: Visual Feedback (15 minutes)
- Highlight hovered mark with white ring
- Increase opacity of hovered mark to 1.0 (override fade)
- Dim other marks slightly to emphasize selection

### Phase 4: Testing (30 minutes)
- Test hover across all 6 bands
- Verify tooltip positioning at canvas edges
- Test with rapid mousemove (debouncing if needed)
- Mobile considerations: tap-to-hover on touch devices
- Verify no performance degradation (60fps maintained)

## Technical Approach

**Hover detection:**
```typescript
const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  // Find nearest mark within hover radius
  const now = Date.now()
  const nearestMark = marksRef.current
    .map(mark => {
      const age = now - mark.timestamp
      const x = canvasWidth - (age / WINDOW_MS) * canvasWidth
      const y = mark.bandIndex * BAND_HEIGHT + BAND_HEIGHT / 2
      const dist = Math.hypot(mouseX - x, mouseY - y)
      return { mark, dist }
    })
    .filter(({ dist }) => dist < 10)
    .sort((a, b) => a.dist - b.dist)[0]
  
  setHoveredMark(nearestMark?.mark || null)
}
```

**Tooltip component:**
```tsx
{hoveredMark && (
  <div 
    className="absolute z-50 bg-zinc-900 text-white px-2 py-1 rounded shadow-lg text-xs"
    style={{ 
      left: tooltipX, 
      top: tooltipY - 40,
      pointerEvents: 'none' 
    }}
  >
    <div className="font-bold">{formatEventType(hoveredMark.eventType)}</div>
    <div className="text-zinc-400">{formatTimestamp(hoveredMark.timestamp)}</div>
    {hoveredMark.agentName && <div>Agent: {hoveredMark.agentName}</div>}
    {hoveredMark.sprintId && <div>Sprint: {hoveredMark.sprintId}</div>}
  </div>
)}
```

**Visual highlight in draw loop:**
```typescript
// Draw hovered mark with white ring
if (hoveredMarkId === mark.id) {
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.globalAlpha = 1.0 // override fade
}
```

## Design Observations

**Discoverability:** The seismograph is cryptic without interaction. Hover tooltips make event types, timing, and attribution immediately legible. This transforms the visualization from ambient awareness to diagnostic tool.

**Performance:** Canvas hover requires finding nearest mark on every mousemove. With MAX_MARKS = 100, this is O(n) but n is small. Debouncing to 60fps alignment keeps cost negligible.

**Mobile:** Touch devices don't have hover. Consider tap-to-hover with tap-outside-to-dismiss, or show tooltip on tap with 2s auto-dismiss.

**P111 Phase 4 deferred scope:** P111 originally included "Phase 4 (click interaction, tooltips, pause, mobile)" but was deferred per bilateral review. This sprint completes the tooltip/hover portion of that deferred scope.

## Success Criteria

1. **Hover detection works across all bands** — User can hover over any event mark and see details
2. **Tooltip shows complete event context** — Event type, timestamp, agent, sprint ID visible
3. **60fps maintained** — No performance degradation from mousemove handling
4. **Visual feedback clear** — Hovered mark is highlighted with white ring
5. **Edge cases handled** — Tooltip positioning flips at canvas edges, no flickering

## Scope

**In scope:**
- Hover detection and nearest-mark calculation
- Tooltip UI with event details
- Visual highlight for hovered mark
- Desktop browser testing

**Out of scope (future sprints):**
- Click-to-pin tooltip (persistent detail view)
- Pause/resume animation on hover
- Mobile tap interaction (can be added later)
- Event filtering/search within visualization
- Zoom/pan controls for deep history

## Bilateral Review Questions

1. **Tooltip content:** What metadata should be shown for each event type? (e.g., completion_proof URL for sprint_completed, message preview for chat_message_posted)
2. **Hover radius:** 10px feels right for desktop, but should touch targets be larger (20px)?
3. **Visual treatment:** White ring + full opacity, or other highlight style?
4. **Mobile strategy:** Defer entirely, or ship tap-to-hover in this sprint?

## Roles

- **Dianoia:** Spec-author (this proposal)
- **Nou:** Implementer (hover detection, tooltip UI, canvas rendering)

## Reference URLs

- https://github.com/Roots-Trust-LCA/co-op.us/commit/d0063151d (P111 original implementation)
- https://co-op.us/app/coordinate (deployed Protocol Activity Stream)
- /workspace/group/co-op-us-repo/app-src/src/components/ProtocolActivityStream.tsx (source)

## Capability Requirements

- `ui-implementation` — Canvas event handling and DOM interaction
- `d3-visualization` — Hover state management for canvas visualization
- `code-review` — Bilateral review of interaction patterns

---

**Estimated Effort:** 2.5 hours (S complexity)
**Deliverable:** Interactive Protocol Activity Stream with hover tooltips at /app/coordinate
