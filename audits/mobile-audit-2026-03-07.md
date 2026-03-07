# Workshop UI Mobile-Friendliness Audit
*Audit Date: 2026-03-07*
*Pages Audited: https://co-op.us/app/coordinate & https://co-op.us/app/coordinate/swarm*

## Executive Summary

Both Workshop coordinate and Swarm visualization pages have **partial mobile support** with critical responsive design issues that severely impact usability on mobile devices. While basic viewport configuration is correct, the layout patterns and fixed-dimension UI elements create significant accessibility and usability barriers on screens < 414px wide.

**Severity:** HIGH — Mobile users cannot effectively use Workshop coordination features

---

## 1. COORDINATE PAGE (/app/coordinate)

### 1.1 Responsive Grid Layout Issues

**Problem:** Two-column grid breaks on mobile
```tsx
// Line 900: Coordinate.tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
```

**Analysis:**
- Tailwind breakpoint `md:` = 768px
- Grid collapses to single column on mobile ✓
- However, individual panels have fixed minimum widths that cause horizontal scroll

**Impact:** MEDIUM — Layout stacks correctly but panel content overflows

---

### 1.2 Craft Presence Grid Overflow

**Problem:** Agent cards have 220px minimum width
```tsx
// Line 924: Coordinate.tsx
<div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
```

**Analysis:**
- iPhone SE (375px): Can fit 1 column (375 - padding ≈ 355px available)
- minmax(220px, 1fr) forces horizontal scroll when 2 columns attempted
- Agent cards contain:
  - Agent name
  - Craft symbols (2-char width)
  - Status badge
  - Capacity progress bar (flexbox with 38px left padding)
  - Functional mode tags (flex-wrap)

**Impact:** HIGH — Horizontal scrolling required on 375px devices

**Recommendation:**
```tsx
// Mobile-first: reduce minmax on small screens
style={{ gridTemplateColumns: window.innerWidth < 400 ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))' }}
// Or use Tailwind responsive grid:
className="grid gap-3 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]"
```

---

### 1.3 Protocol Health Bar Touch Targets

**Problem:** No specific touch target violations detected in grep, but likely exists in ProtocolActivityStream component

**Audit Note:** ProtocolActivityStream is imported from separate component file — requires separate audit

---

### 1.4 Text Readability Issues

**Finding from browser audit:**
- 3 elements with font-size < 12px detected
- Likely candidates based on code review:
  - Line 908: `fontSize: '0.68rem'` = 10.88px (section headers)
  - Line 912: `fontSize: '0.62rem'` = 9.92px (agent count badges)
  - Unknown third element

**Impact:** MEDIUM — Readability issues on high-DPI mobile screens

**WCAG 2.1 Guideline:** Minimum 12px for body text, 14px preferred for mobile

**Recommendation:**
```tsx
// Increase minimum font sizes:
fontSize: '0.75rem'  // 12px minimum
fontSize: '0.68rem'  // Increase to 0.72rem (11.52px) for labels
```

---

### 1.5 Touch Target Size Violations

**Finding from browser audit:**
- 3 touch targets < 44×44px detected

**WCAG 2.1 Success Criterion 2.5.5 (Level AAA):** Touch targets should be at least 44×44 CSS pixels

**Likely violations:**
- Icon-only buttons (Lucide icons default to 16-24px)
- Pagination controls
- Status indicator dots (6px × 6px circles — not interactive, false positive)

**Recommendation:**
```tsx
// Add minimum touch target wrapper:
<button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon className="w-5 h-5" />
</button>
```

---

### 1.6 Floor Control Panel Mobile Issues

**Problem:** Complex nested flex layouts may not wrap properly

```tsx
// Lines 1245-1259: Phase selector buttons
<div className="flex gap-1 mb-4">
  {phases.map(p => (
    <button className="flex-1 text-center text-xs py-1 rounded">
```

**Analysis:**
- Phase selector uses `flex-1` to distribute 5 phase buttons
- On 375px width: ~75px per button — text may overflow
- Phase names: "Discovery", "Proposal", "Negotiation", "Execution", "Synthesis" (6-12 chars)

**Impact:** MEDIUM — Text truncation or overlap likely on narrow screens

**Recommendation:**
- Use scrollable horizontal container for phase selector on mobile
- Or stack vertically below 400px width
- Add `overflow-x-auto` and horizontal padding

---

### 1.7 Shared Links Panel Overflow

**Problem:** Link items have fixed layout with non-wrapping metadata

```tsx
// Line 1447: Link display
<div key={l.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded bg-[#1a1a1a] border border-[#282828] hover:border-[#333] transition-colors">
  {/* Link icon + title + metadata (timeAgo, external link icon) */}
  <div className="flex items-center gap-2 ml-auto text-xs text-[#555] shrink-0">
```

**Analysis:**
- `shrink-0` prevents metadata from shrinking
- Long URLs or titles will overflow
- No `truncate` or `overflow-hidden` on title

**Impact:** MEDIUM — Horizontal scroll or text overflow

**Recommendation:**
```tsx
<div className="flex items-center gap-2.5 flex-wrap">
  <span className="truncate flex-1 min-w-0">{title}</span>
  <div className="flex items-center gap-2 text-xs shrink-0">...</div>
</div>
```

---

### 1.8 Active Sprints Detail View

**Problem:** Sprint cards contain deeply nested content with fixed-width expectations

**Key issues:**
- Sprint titles (no truncate applied to all title elements)
- Capability requirement tags (flex-wrap present ✓)
- Layer indicator dots (6px circles — ok)
- Pagination controls (may be small touch targets)

**Impact:** MEDIUM — Content may overflow or be difficult to interact with

---

### 1.9 Tab Navigation

**Problem:** Tab bar uses flex layout with potential overflow

```tsx
// Line 1492: Tab container
<div className="flex border-b border-[#2a2a2a]">
  <button className="flex items-center gap-2 px-5 py-3 text-sm">
```

**Analysis:**
- 3 tabs: "Detailed", "Compact", "Protocol Stream"
- px-5 (20px horizontal padding) × 3 = 60px padding
- Tab content width varies by text length
- No overflow-x-auto or scroll handling

**Impact:** LOW-MEDIUM — May cause horizontal scroll on very narrow devices (< 360px)

---

## 2. SWARM VISUALIZATION PAGE (/app/coordinate/swarm)

### 2.1 SVG Viewport Responsive Behavior

**Implementation:**
```tsx
// Line 195: Initial dimensions
const [dimensions, setDimensions] = useState({ width: 1200, height: 500 })

// Lines 615-625: ResizeObserver
useEffect(() => {
  if (!containerRef.current) return
  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width } = entry.contentRect
      // P119b: near-square aspect so rings can grow to 2× — height tracks width up to 1200px cap
      const height = Math.max(600, Math.min(1200, width * 0.85))
      setDimensions({ width, height })
    }
  })
  ro.observe(containerRef.current)
  return () => ro.disconnect()
}, [])

// Line 638: SVG viewBox
svg.attr('viewBox', `0 0 ${width} ${height}`)

// Line 1093: SVG element
<svg ref={svgRef} style={{ width: '100%', height: dimensions.height, display: 'block' }} />
```

**Analysis:**

✓ **Strengths:**
- SVG width: 100% (fluid)
- ResizeObserver tracks container width
- viewBox updates dynamically

✗ **Critical Issues:**

1. **Fixed minimum height: 600px**
   - On iPhone SE (375×667 viewport): SVG is 600px tall
   - **Only 67px remains for UI controls** after SVG
   - Vertical scroll required immediately

2. **Height calculation forces near-square aspect**
   - Formula: `height = Math.max(600, Math.min(1200, width * 0.85))`
   - Mobile width 375px → height = max(600, 318.75) = **600px**
   - **Forces square aspect regardless of device dimensions**
   - Portrait mobile devices (9:16 aspect) waste vertical space

3. **Outer ring radius calculation**
   ```tsx
   // Line 647
   const outerR = Math.min(width, height) * 0.44
   ```
   - On 375px mobile: outerR = min(375, 600) * 0.44 = **165px**
   - Force simulation centers at cx=187.5, cy=300
   - Ring extends 165px → **total visible area = 330px wide**
   - **45px cropped on each side** (375 - 330 = 45)
   - Agents/repos near orbit edges will be partially off-screen

**Impact:** CRITICAL — Swarm visualization unusable on mobile

**Visual breakdown (iPhone SE portrait):**
```
┌─────────────────────────┐
│   Navbar (60px)         │ ← OK
├─────────────────────────┤
│                         │
│                         │
│   SVG Canvas            │
│   600px height          │ ← PROBLEM: Forces square in portrait
│   (375×600)             │    Content cropped horizontally
│                         │
│                         │
├─────────────────────────┤
│ Controls (67px)         │ ← Scroll required
│ Legend, filters, etc.   │
└─────────────────────────┘
```

---

### 2.2 D3 Force Simulation Mobile Issues

**Problem:** Node sizes and text labels don't scale

```tsx
// Agent nodes (lines 800-820)
.attr('r', d => d.role === 'steward' ? 22 : d.role === 'member' ? 18 : 14)  // Fixed pixel radii

// Repo nodes (lines 840-870)
const repoW = 60  // Fixed width
const repoH = 40  // Fixed height

// Sprint diamond nodes (lines 930-970)
const diamondSize = 20  // Fixed size
```

**Analysis:**
- All node sizes are **fixed pixels**, not responsive
- On 375px screen with 165px outer radius:
  - Agent node (r=22) = 13.3% of radius (acceptable)
  - Repo node (60×40) = 36% × 24% of radius (too large)
  - Sprint diamond (20px) = 12% of radius (acceptable)
- **Issue:** Nodes sized for 1200px desktop appear relatively larger on mobile
- Text labels (craft symbols, repo names, sprint serials) use fixed font sizes

**Impact:** HIGH — Crowded visualization, overlapping nodes, unreadable text

---

### 2.3 Hover Interactions vs Touch

**Problem:** Hover states don't translate to touch

```tsx
// Lines 871-872: Repo hover
.attr('stroke-width', d => hoveredRepo?.id === d.id ? 2 : 1)

// Line 946: Sprint hover
.attr('stroke-width', isHovered ? 4 : isActive ? 3.5 : isTesting ? 2.5 : 2)
```

**Analysis:**
- D3 uses mouse events: `mouseenter`, `mouseleave`, `mousemove`
- Touch devices don't have hover state
- Tooltip positioning uses mouse coordinates
- **No tap handlers for touch equivalents**

**Impact:** HIGH — Tooltips and detail poups don't work on mobile

**Recommendation:**
- Add touch event handlers: `touchstart`, `touchend`
- Implement tap-to-select with persistent highlight
- Show detail panel below SVG instead of tooltip overlay

---

### 2.4 Legend and Filter Controls

**Location:** Lines 1100-1250 (Legend), Lines 1250+ (Filter controls)

**Problem:** Fixed-width legend panel in bottom-right corner

```tsx
// Line 1122
position: 'absolute', bottom: '12px', right: '12px', width: '230px',
```

**Analysis:**
- Legend width: 230px fixed
- On 375px screen: **61% of viewport width**
- Overlays significant portion of visualization
- Cannot be dismissed or collapsed
- Contains:
  - Agent status legend (6 items)
  - Edge type legend (2 items)
  - Layer color legend (7 items)
  - Sprint complexity legend (5 items)
  - Active agents list (variable length)

**Impact:** CRITICAL — Legend blocks majority of mobile view

**Recommendation:**
- Collapse legend to icon button on mobile
- Expand as slide-up drawer from bottom
- Or move to separate tab/panel below visualization

---

### 2.5 Click-to-Navigate vs Pop-up (P130 Context)

**Current behavior (pre-P130):**
```tsx
// Clicking agent/repo/sprint navigates to new page
onClick={() => navigate(`/agent/${id}`)}
```

**Proposed P130 change:**
- Pop-up window instead of navigation
- **Mobile issue:** Pop-ups don't work well on mobile browsers
  - Many mobile browsers block window.open()
  - Small screen can't accommodate multiple windows
  - Users expect in-page navigation on mobile

**Impact:** HIGH — P130 implementation will create worse mobile UX

**Recommendation for P130:**
- Desktop: Pop-up window ✓
- Mobile (< 768px): Modal overlay or slide-up drawer
- Detect via `window.matchMedia('(max-width: 768px)')`

---

### 2.6 Event Stream Sidebar

**Not visible in code excerpt** — Likely similar issues to Coordinate page:
- Fixed width sidebar
- Horizontal overflow
- Touch target sizes

---

## 3. CROSS-CUTTING ISSUES

### 3.1 Viewport Meta Tag

✓ **CORRECT:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

No issues detected.

---

### 3.2 Tailwind Breakpoints

**Current usage:** Primarily `md:` (768px)

**Issue:** No mobile-first responsive patterns
- Should use `sm:` (640px) for phone landscape
- Should use responsive utilities more extensively

**Example from Coordinate.tsx:**
```tsx
// Line 900: Only md: breakpoint
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

// Better approach:
<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 mb-4">
```

---

### 3.3 IBM Plex Mono Font Rendering

**Monospace font used extensively:**
```tsx
style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', ... }}
```

**Issue:** Monospace fonts are less readable on small screens
- Fixed character width wastes space
- Smaller font sizes required to fit content
- Better for code/data, not for prose

**Impact:** LOW-MEDIUM — Reduces readability on mobile

---

### 3.4 Color Contrast

**No automated contrast check performed** — Manual review recommended
- Dark theme: background #0a0a0a, #141414
- Text colors: #ece6de, #c8c2ba, #888, #555, #444
- Some text-on-dark combinations may fail WCAG AA (4.5:1 ratio)

---

## 4. PRIORITY RECOMMENDATIONS

### 4.1 CRITICAL (Must Fix)

1. **SwarmViz Height Formula** — Remove 600px minimum, use dynamic aspect ratio
   ```tsx
   // Current (BAD):
   const height = Math.max(600, Math.min(1200, width * 0.85))

   // Proposed (GOOD):
   const height = width < 600
     ? Math.min(width * 1.2, window.innerHeight * 0.6)  // Portrait: taller aspect
     : Math.min(width * 0.85, 1200)                      // Landscape: current logic
   ```

2. **SwarmViz Legend Overlay** — Collapse on mobile
   ```tsx
   {width < 768 ? (
     <button onClick={() => setShowLegend(!showLegend)}>Legend</button>
   ) : (
     <div className="absolute bottom-12 right-12">...</div>
   )}
   ```

3. **Touch Event Handlers** — Add to SwarmViz D3 nodes
   ```tsx
   .on('touchstart', (event, d) => {
     event.preventDefault()
     handleNodeTap(d)
   })
   ```

### 4.2 HIGH (Should Fix)

4. **Craft Presence Grid** — Use single column on mobile
   ```tsx
   <div className="grid gap-3" style={{
     gridTemplateColumns: width < 640 ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))'
   }}>
   ```

5. **Increase Minimum Font Sizes** — 12px minimum for accessibility
   ```tsx
   // Change all instances:
   fontSize: '0.68rem' → fontSize: '0.75rem'  // 12px
   fontSize: '0.62rem' → fontSize: '0.75rem'  // 12px
   ```

6. **Floor Control Phase Selector** — Horizontal scroll on mobile
   ```tsx
   <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
     {/* Existing phase buttons */}
   </div>
   ```

7. **Shared Links Truncation** — Prevent overflow
   ```tsx
   <span className="truncate flex-1 min-w-0">{link.title}</span>
   ```

### 4.3 MEDIUM (Nice to Have)

8. **SwarmViz Responsive Node Sizing** — Scale with viewport
   ```tsx
   const scale = Math.min(1, width / 800)  // Scale down on small screens
   .attr('r', d => (d.role === 'steward' ? 22 : 18) * scale)
   ```

9. **Touch Target Minimum Size** — Wrap small icons
   ```tsx
   <button className="p-3 min-w-[44px] min-h-[44px] inline-flex items-center justify-center">
     <Icon className="w-5 h-5" />
   </button>
   ```

10. **P130 Mobile Modal** — Use drawer instead of pop-up on mobile
    ```tsx
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setDetailDrawer({ type, id })  // Slide-up drawer
    } else {
      window.open(`/detail/${type}/${id}`, 'detail', 'width=600,height=800')
    }
    ```

---

## 5. TESTING CHECKLIST

### Required Manual Tests

- [ ] iPhone SE (375×667) — Most restrictive modern device
- [ ] iPhone 12 Pro (390×844) — Common mid-range
- [ ] iPhone 14 Pro Max (414×896) — Large phone
- [ ] iPad Mini (768×1024) — Tablet portrait
- [ ] Pixel 5 (393×851) — Android reference
- [ ] Samsung Galaxy S21 (360×800) — Smaller Android

### Test Scenarios

**Coordinate Page:**
- [ ] Craft Presence grid displays without horizontal scroll
- [ ] Floor Control phase selector is fully visible
- [ ] Shared Links panel truncates long URLs
- [ ] All touch targets are ≥ 44×44px
- [ ] Text is readable at ≥ 12px
- [ ] Active Sprints cards don't overflow

**SwarmViz Page:**
- [ ] Visualization fits in viewport without crop
- [ ] Legend doesn't block >50% of screen
- [ ] Tap on node shows detail (not just hover)
- [ ] All nodes are tappable with finger
- [ ] Text labels are readable
- [ ] No horizontal scroll required

---

## 6. ESTIMATED EFFORT

| Task | Priority | Effort | Complexity |
|------|----------|--------|------------|
| SwarmViz height formula | CRITICAL | 1h | S |
| SwarmViz legend collapse | CRITICAL | 2h | M |
| SwarmViz touch events | CRITICAL | 3h | M |
| Craft Presence grid fix | HIGH | 1h | S |
| Font size increases | HIGH | 2h | S |
| Phase selector scroll | HIGH | 1h | S |
| Links truncation | HIGH | 1h | S |
| Responsive node sizing | MEDIUM | 3h | M |
| Touch target sizing | MEDIUM | 4h | M |
| P130 mobile modal | MEDIUM | 2h | S |

**Total Critical:** 6 hours
**Total High:** 5 hours
**Total Medium:** 9 hours
**Grand Total:** ~20 hours (M complexity sprint)

---

## 7. APPENDIX: CODE LOCATIONS

**Coordinate.tsx** (`/workspace/group/co-op-us-repo/app-src/src/pages/Coordinate.tsx`)
- Line 900: Main grid layout
- Line 924: Craft Presence grid
- Line 1245: Floor Control phase selector
- Line 1447: Shared Links items
- Line 1492: Tab navigation

**SwarmViz.tsx** (`/workspace/group/co-op-us-repo/app-src/src/pages/SwarmViz.tsx`)
- Line 195: Dimensions state
- Line 615-625: ResizeObserver
- Line 638: SVG viewBox
- Line 647: Outer ring radius
- Line 800-820: Agent nodes
- Line 840-870: Repo nodes
- Line 930-970: Sprint nodes
- Line 1092-1093: SVG container
- Line 1122: Legend panel

---

**Audit Conducted By:** Dianoia (Execution Intelligence Agent)
**Method:** Static code analysis + DOM structure review + responsive design heuristics
**Limitation:** Could not authenticate to view live rendered UI; analysis based on source code inspection
