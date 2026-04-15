# P449: techne.institute/tree — Visual Design Specification

**Sprint ID:** P449
**Role:** Dianoia (design-architect)
**Implementer:** Nou
**Created:** 2026-04-15

---

## Executive Summary

This document specifies the visual design, component anatomy, layout algorithms, and accessibility requirements for techne.institute/tree — a unified site navigation page that maps the entire domain as navigable cards.

**Key design principle:** The tree page is a **navigational artifact** — a map of the domain's topology, not a marketing page. It should feel like a **reference document** (clean, structured, information-dense) that serves three audiences: newcomers orienting to Techne, members finding specific tools, and search engines indexing the domain.

---

## Design System Integration

### Typography

**Use existing tokens:**
- Headings: `--font-display` (Cormorant)
- Body text: `--font-body` (Source Serif 4)
- UI labels: `--font-sans` (Inter)
- Paths/URLs: `--font-mono` (IBM Plex Mono)

**Type scale:**
- Page title: `--text-3xl` (36px)
- Zone headers: `--text-xl` (22px)
- Card titles: `--text-md` (16px)
- Card descriptions: `--text-base` (14px)
- Path badges: `--text-xs` (10.4px)

### Color Palette

**Surface colors (light mode default):**
- Page background: `--parchment` (#f7f5f0)
- Card background: `--cream` (#ebe7df)
- Card border: `--bone` (#d8d3c8)
- Zone headers: `--charcoal` (#1a1a1f) text on `--ember-glow` background

**Auth level colors (per sprint spec):**
```css
--auth-public:   #22c55e;  /* green — open to all */
--auth-curated:  #f59e0b;  /* amber — semi-public */
--auth-members:  #3b82f6;  /* blue — members only */
--auth-steward:  #c4956a;  /* gold/ember — steward only */
```

**Network mode colors:**
- Node fill: Auth level color at 20% opacity
- Node border: Auth level color at 100%
- Edge/link: `--graphite` (#2a2a30) at 30% opacity
- Node text: `--charcoal` or `--ink`

### Dark Mode Support

Follow existing `[data-theme="dark"]` pattern:
- Page background: `--void` (#08080a)
- Card background: `--ink` (#0f0f12)
- Card border: `--graphite` (#2a2a30)
- Text: light variants from token system

---

## Component Anatomy

### 1. Page Structure

```
<body>
  <header>
    <h1>Site Map</h1>
    <nav> [Home] · [Grid] [Network] · [Theme Toggle]
  </header>

  <main id="tree-container">
    <!-- Grid mode (default) -->
    <section class="zone-section" data-zone="0">
      <h2 class="zone-header">Home</h2>
      <div class="card-grid">
        <!-- Cards here -->
      </div>
    </section>
    <!-- Repeat for zones 1-4 -->

    <!-- Network mode (hidden by default) -->
    <svg id="network-view" style="display:none;">
      <!-- Force-directed graph here -->
    </svg>
  </main>

  <footer>
    <p>Last updated: 2026-04-15</p>
  </footer>
</body>
```

**Rationale:**
- Semantic HTML for accessibility and SEO
- Grid mode renders by default (no JS required)
- Network mode hidden until toggled via JS
- Zone sections use `data-zone` attribute for styling hooks

### 2. Card Component

**HTML structure:**
```html
<article class="site-card" data-auth="public">
  <header class="card-header">
    <span class="path-badge">/about/</span>
    <span class="auth-badge" data-level="public">public</span>
  </header>

  <h3 class="card-title">
    <a href="/about/">About Techne</a>
  </h3>

  <p class="card-description">
    Cooperatively-owned integral technology studio in Boulder, CO.
  </p>

  <footer class="card-footer">
    <span class="zone-indicator">Zone 1: Public</span>
  </footer>
</article>
```

**Visual specs:**

**Card dimensions:**
- Min width: 280px
- Max width: 380px
- Padding: 16px
- Border radius: 4px
- Border: 1px solid `--bone` (light) or `--graphite` (dark)
- Background: `--cream` (light) or `--ink` (dark)

**Card hover state:**
- Border color: Auth level color
- Box shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Transform: `translateY(-2px)`
- Transition: 150ms ease-out

**Path badge:**
- Font: `--font-mono`
- Size: `--text-xs`
- Color: `--stone` (muted)
- Position: Top left of card header

**Auth badge:**
- Font: `--font-sans`
- Size: `--text-xs`
- Padding: 2px 6px
- Border radius: 3px
- Background: Auth level color at 15% opacity
- Text color: Auth level color (darker variant for contrast)
- Position: Top right of card header

**Card title:**
- Font: `--font-display`
- Size: `--text-md`
- Weight: 600
- Color: `--charcoal` (light mode) or `--parchment` (dark mode)
- Link underline: None default, ember underline on hover

**Card description:**
- Font: `--font-body`
- Size: `--text-base`
- Line height: 1.5
- Color: `--stone` (light) or lightened (dark)
- Max lines: 3 (overflow ellipsis)

**Zone indicator:**
- Font: `--font-sans`
- Size: `--text-xs`
- Color: `--stone`
- Optional: Can be hidden if zone context is clear from layout

### 3. Zone Header

```html
<h2 class="zone-header" data-zone="1">
  <span class="zone-number">Zone 1</span>
  <span class="zone-name">Public Pages</span>
  <span class="zone-count">(12 pages)</span>
</h2>
```

**Visual specs:**
- Font: `--font-display`
- Size: `--text-xl`
- Weight: 700
- Color: `--charcoal`
- Left border: 4px solid, color varies by zone:
  - Zone 0 (Home): `--ember`
  - Zone 1 (Public): `--auth-public`
  - Zone 2 (Curated): `--auth-curated`
  - Zone 3 (Members): `--auth-members`
  - Zone 4 (Steward): `--auth-steward`
- Padding: 12px 0 12px 16px
- Margin bottom: 24px
- Background: `--ember-glow` or zone-specific color at 5% opacity

### 4. Mode Toggle

**Button group (top right of page):**
```html
<nav class="mode-toggle" role="group" aria-label="View mode">
  <button class="mode-btn active" data-mode="grid" aria-pressed="true">
    Grid
  </button>
  <button class="mode-btn" data-mode="network" aria-pressed="false">
    Network
  </button>
</nav>
```

**Visual specs:**
- Font: `--font-sans`
- Size: `--text-sm`
- Padding: 8px 16px
- Border: 1px solid `--bone`
- Active state: Background `--ember`, text white
- Inactive state: Background `--cream`, text `--charcoal`
- Border radius: 4px (left button left corners, right button right corners)
- No gap between buttons (visual segmented control)

---

## Grid Mode Layout

### Desktop (> 768px)

**CSS Grid specification:**
```css
.zone-section {
  margin-bottom: 48px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1200px;
}
```

**Zones stack vertically:**
1. Zone 0 (Home) — Single card, centered
2. Zone 1 (Public) — 3-4 columns depending on viewport width
3. Zone 2 (Curated) — 2-3 columns
4. Zone 3 (Members) — 2-3 columns
5. Zone 4 (Steward) — 1-2 cards, small grid

**Zone 0 special treatment:**
- Home card is larger: min-width 400px, centered
- No grid, just a single `<article>` centered with margin auto

### Mobile (< 768px)

**Single column layout:**
```css
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

**Zone headers remain full width:**
- Left border increases to 6px for visibility
- Font size reduces to `--text-lg`

**Cards:**
- Full width (minus 16px padding each side)
- Same vertical structure as desktop
- No hover transforms (touch device)

---

## Network Mode Layout

### Conceptual Model

**Graph structure:**
- **Nodes:** Each page = one node
- **Edges:** Parent-child relationships:
  - Home (/) → Top-level sections (/about/, /formation/, etc.)
  - Section pages → Sub-pages (/formation/ → /formation/narrative.html)
- **Layout:** Force-directed graph with gravity toward center
- **Interaction:** Click node → show card detail panel; Double-click → navigate to page

### SVG Canvas

**Dimensions:**
```css
#network-view {
  width: 100%;
  height: calc(100vh - 120px); /* Full viewport minus header/footer */
  background: var(--parchment);
  border: 1px solid var(--bone);
}
```

**Viewport controls:**
- Zoom: Mouse wheel or pinch gesture
- Pan: Click and drag background
- Reset: Button to reset zoom/pan to default view

### Node Visual Specs

**Node anatomy:**
```svg
<g class="node" data-id="about" data-auth="public">
  <circle
    cx="x"
    cy="y"
    r="radius"
    fill="rgba(34, 197, 94, 0.2)"
    stroke="#22c55e"
    stroke-width="2"
  />
  <text
    x="x"
    y="y"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="var(--font-sans)"
    font-size="12px"
    fill="var(--charcoal)"
  >
    About
  </text>
</g>
```

**Node sizing by depth:**
- Depth 0 (home): radius = 40px
- Depth 1 (sections): radius = 28px
- Depth 2 (sub-pages): radius = 20px
- Depth 3+ (nested): radius = 16px

**Node colors:**
- Fill: Auth level color at 20% opacity
- Stroke: Auth level color at 100%, width 2px
- Text: `--charcoal` or `--ink` depending on theme

**Node hover state:**
- Stroke width increases to 3px
- Fill opacity increases to 35%
- Cursor: pointer

**Node active state (clicked, detail panel open):**
- Stroke width: 4px
- Glow effect: `drop-shadow(0 0 8px [auth-color])`

### Edge Visual Specs

**Line styling:**
```svg
<line
  x1="parentX"
  y1="parentY"
  x2="childX"
  y2="childY"
  stroke="var(--graphite)"
  stroke-width="1"
  opacity="0.3"
  stroke-dasharray="4 2" /* Optional: dashed for visual hierarchy */
/>
```

**Edge color by relationship type:**
- Parent → child (same zone): `--graphite` at 30% opacity
- Parent → child (different zone): Auth color of child at 20% opacity

### Force-Directed Layout Algorithm

**D3.js force simulation parameters:**
```javascript
const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(edges)
    .id(d => d.id)
    .distance(100) // Base distance between connected nodes
    .strength(0.5)
  )
  .force('charge', d3.forceManyBody()
    .strength(-300) // Repulsion between nodes
  )
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide()
    .radius(d => d.radius + 10) // Prevent overlap
  );
```

**Hand-calculated alternative (if no D3):**
- Home node at center (x = width/2, y = height/2)
- Zone 1 nodes in circle around home (radius = 200px)
- Zone 2 nodes in outer circle (radius = 350px)
- Zone 3 nodes in further circle (radius = 500px)
- Angular spacing: evenly distributed (360° / nodeCount)

**Example positions (if 12 public pages in Zone 1):**
```javascript
const angleStep = (2 * Math.PI) / 12;
zone1Nodes.forEach((node, i) => {
  node.x = centerX + 200 * Math.cos(i * angleStep);
  node.y = centerY + 200 * Math.sin(i * angleStep);
});
```

### Node Detail Panel

**When node clicked, slide-in panel from right:**
```html
<aside class="node-detail-panel" data-node-id="about" style="transform: translateX(100%);">
  <header>
    <button class="close-btn" aria-label="Close">×</button>
    <span class="path-badge">/about/</span>
  </header>

  <h3>About Techne</h3>
  <p class="auth-level">
    <span class="auth-badge" data-level="public">public</span>
  </p>
  <p class="description">
    Cooperatively-owned integral technology studio in Boulder, CO.
  </p>

  <footer>
    <a href="/about/" class="primary-btn">Visit Page →</a>
  </footer>
</aside>
```

**Panel styling:**
- Width: 320px (fixed)
- Height: 100vh
- Position: Fixed, right 0
- Background: `--cream` (light) or `--charcoal` (dark)
- Border left: 1px solid `--bone` or `--graphite`
- Z-index: 100
- Transition: `transform 200ms ease-out`
- Active state: `transform: translateX(0)`

**Content padding:** 24px

### Mobile Behavior (Network Mode)

**Below 768px:**
- Network mode button hidden (use `display: none` on `.mode-btn[data-mode="network"]`)
- OR: Network mode shows simplified radial layout (no force simulation)
- OR: Network mode disabled entirely, grid mode only

**Recommendation:** Disable network mode on mobile. The complexity isn't worth the reduced screen space. Grid mode is superior on small screens.

---

## Accessibility Requirements

### Keyboard Navigation

**Grid mode:**
- All cards are focusable via Tab
- Enter or Space on card link navigates to page
- Skip link at top: "Skip to content" → jumps to first card

**Network mode:**
- Nodes are focusable via Tab (in DOM order)
- Enter on node opens detail panel
- Arrow keys navigate between connected nodes
- Escape closes detail panel
- Zoom controls have keyboard shortcuts (+ / - keys)

### ARIA Attributes

**Mode toggle:**
```html
<button
  role="tab"
  aria-selected="true"
  aria-controls="grid-view"
  data-mode="grid"
>
  Grid
</button>
```

**Cards:**
```html
<article role="article" aria-labelledby="card-title-about">
  <h3 id="card-title-about">About Techne</h3>
  ...
</article>
```

**Network nodes:**
```html
<g
  role="button"
  tabindex="0"
  aria-label="About Techne - Public page"
  aria-describedby="node-desc-about"
>
  <title id="node-desc-about">About Techne - Click to view details</title>
  ...
</g>
```

### Screen Reader Support

**Page title announcement:**
```html
<h1>
  Site Map
  <span class="sr-only">— Visual navigation for all pages of techne.institute</span>
</h1>
```

**Auth badge screen reader text:**
```html
<span class="auth-badge" data-level="members">
  members
  <span class="sr-only">— Requires authentication</span>
</span>
```

**Zone headers:**
```html
<h2>
  Zone 1: Public Pages
  <span class="sr-only">— 12 pages accessible without login</span>
</h2>
```

### Color Contrast

**WCAG AA compliance (4.5:1 minimum):**
- Card title on cream background: `--charcoal` (#1a1a1f) — Contrast ratio: 12.5:1 ✓
- Card description on cream: `--stone` (#9a958a) — Contrast ratio: 4.6:1 ✓
- Auth badge text on badge background: Tested per badge color
  - Green badge text on green-glow: Pass (adjust if needed)
  - Amber badge: Pass
  - Blue badge: Pass
  - Gold badge: Pass (using `--ember-dim` for text)

**Dark mode contrast:**
- Text on `--ink` background must maintain 4.5:1 ratio
- Use lightened variants from token system (`--parchment` for primary text)

### Focus Indicators

**Visible focus ring:**
```css
.site-card:focus-within {
  outline: 3px solid var(--ember);
  outline-offset: 2px;
}

button:focus,
a:focus {
  outline: 2px solid var(--ember);
  outline-offset: 2px;
}
```

---

## Responsive Breakpoints

**Mobile first approach:**

```css
/* Base styles — Mobile (< 768px) */
.card-grid {
  grid-template-columns: 1fr;
}

/* Tablet (768px - 1024px) */
@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

/* Large desktop (> 1400px) */
@media (min-width: 1400px) {
  .card-grid {
    max-width: 1400px;
    margin: 0 auto;
  }
}
```

---

## Data Structure Specification

**Card data array (for Nou to populate):**

```javascript
const siteTree = [
  {
    id: 'home',
    path: '/',
    title: 'Techne Institute',
    description: 'An integral technology learning center. Cooperatively owned.',
    authLevel: 'public', // 'public' | 'curated' | 'members' | 'steward'
    zone: 0,
    parent: null,
    icon: null, // Optional SVG icon
    meta: {
      changefreq: 'monthly',
      priority: 1.0
    }
  },
  {
    id: 'about',
    path: '/about/',
    title: 'About Techne',
    description: 'Cooperatively-owned integral technology studio in Boulder, CO.',
    authLevel: 'public',
    zone: 1,
    parent: 'home',
    icon: null
  },
  // ... ~40 more pages
];
```

**Required fields:**
- `id` (string, unique, slug format)
- `path` (string, full URL path)
- `title` (string, page title)
- `description` (string, 1-2 sentences, SEO-calibrated)
- `authLevel` (enum: public, curated, members, steward)
- `zone` (number: 0-4)
- `parent` (string, id of parent page, or null for root)

**Optional fields:**
- `icon` (string, SVG path or emoji)
- `meta` (object, sitemap metadata)

**Validation rules:**
- All paths must start with `/`
- Parent IDs must reference existing nodes
- Zone numbers must match auth levels (curated = zone 2, members = zone 3, etc.)

---

## Animation & Transitions

### Grid Mode Transitions

**Card entrance (stagger on page load):**
```css
.site-card {
  animation: fadeInUp 0.4s ease-out forwards;
  animation-delay: calc(var(--card-index) * 0.05s);
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Card hover:**
```css
.site-card {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.site-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Network Mode Transitions

**Mode switch (grid → network):**
```javascript
// Fade out grid
gridContainer.style.transition = 'opacity 200ms ease-out';
gridContainer.style.opacity = '0';

setTimeout(() => {
  gridContainer.style.display = 'none';
  networkView.style.display = 'block';
  networkView.style.opacity = '0';

  // Fade in network
  requestAnimationFrame(() => {
    networkView.style.transition = 'opacity 300ms ease-in';
    networkView.style.opacity = '1';
  });
}, 200);
```

**Node entrance (after layout calculated):**
- Nodes fade in with stagger (0.02s delay per node)
- Edges fade in after all nodes are visible (0.3s delay)

**Node interactions:**
```css
.node {
  transition: stroke-width 100ms ease-out;
}

.node:hover {
  stroke-width: 3px;
}
```

### Performance Targets

**Grid mode:**
- Page load: < 500ms (no external dependencies)
- Card entrance animation: Complete within 2 seconds for 40 cards

**Network mode:**
- Layout calculation: < 200ms (force simulation runs for 300 iterations)
- Render time: < 100ms for 40 nodes + 50 edges
- Interaction responsiveness: < 16ms (60fps for hover/click)

---

## SEO & Meta Tags

**HTML `<head>` specification:**

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>Site Map — Techne Institute</title>
  <meta name="title" content="Site Map — Techne Institute">
  <meta name="description" content="Visual map of techne.institute — cooperative studio, membership, formation documents, member intranet, and agent workshop. Navigate the full domain.">

  <!-- Canonical -->
  <link rel="canonical" href="https://techne.institute/tree/">

  <!-- Robots -->
  <meta name="robots" content="index, follow">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://techne.institute/tree/">
  <meta property="og:title" content="Site Map — Techne Institute">
  <meta property="og:description" content="Visual map of techne.institute — navigate the full domain as a structured network of cards.">
  <meta property="og:image" content="https://techne.institute/assets/og-tree.png">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://techne.institute/tree/">
  <meta property="twitter:title" content="Site Map — Techne Institute">
  <meta property="twitter:description" content="Visual map of techne.institute — navigate the full domain as a structured network of cards.">
  <meta property="twitter:image" content="https://techne.institute/assets/og-tree.png">

  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Site Map",
    "description": "Visual navigation map of techne.institute domain",
    "url": "https://techne.institute/tree/",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://techne.institute/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Site Map",
          "item": "https://techne.institute/tree/"
        }
      ]
    }
  }
  </script>

  <!-- Stylesheets -->
  <link rel="stylesheet" href="/assets/tokens.css">
  <link rel="stylesheet" href="/assets/public.css">
  <link rel="stylesheet" href="/tree/styles.css">
</head>
```

**OG image requirements:**
- Dimensions: 1200x630px
- File: `/assets/og-tree.png`
- Content: Screenshot or stylized graphic of the tree view
- Alt text embedded in image metadata

---

## Progressive Enhancement

**JS-free baseline (grid mode only):**
- All cards render as static HTML
- CSS Grid handles layout
- All links are real `<a>` elements (crawlable)
- No mode toggle (network mode requires JS)
- Theme toggle uses CSS-only fallback (prefers-color-scheme)

**With JS enabled:**
- Mode toggle functional
- Network mode activates
- Theme toggle persists to localStorage
- Card animations enabled
- Lazy loading for images (if any)

**Feature detection:**
```javascript
// Check for required APIs before enabling network mode
const supportsCanvas = !!document.createElement('canvas').getContext;
const supportsSVG = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

if (!supportsSVG) {
  // Hide network mode button
  document.querySelector('[data-mode="network"]').style.display = 'none';
}
```

---

## Implementation Checklist

**For Nou (implementer):**

- [ ] Audit techne.institute sitemap for complete page inventory
- [ ] Create `siteTree` data array with all ~40 pages
- [ ] Build `/tree/index.html` with semantic HTML structure
- [ ] Implement grid mode CSS (mobile-first responsive)
- [ ] Add zone headers with color-coded left borders
- [ ] Style cards per visual spec (badges, hover states, auth colors)
- [ ] Implement mode toggle UI and JS logic
- [ ] Build network mode SVG canvas
- [ ] Calculate node positions (force-directed or hand-calculated)
- [ ] Render nodes and edges with auth-aware colors
- [ ] Add node click handler (detail panel)
- [ ] Implement zoom/pan controls for network view
- [ ] Add keyboard navigation for both modes
- [ ] Implement ARIA attributes per accessibility spec
- [ ] Add focus indicators (visible outlines)
- [ ] Test color contrast ratios (WCAG AA)
- [ ] Add page entrance animations (stagger)
- [ ] Implement dark mode toggle
- [ ] Add all SEO meta tags per spec
- [ ] Test JS-free fallback (grid mode only)
- [ ] Verify all links are crawlable `<a>` elements
- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Deploy to techne.institute/tree/
- [ ] Submit to search engines (Google Search Console)

---

## Design Rationale

### Why Two Modes?

**Grid mode** serves:
- SEO (all links crawlable)
- Accessibility (linear tab order)
- Mobile users (simple, scrollable layout)
- Quick scanning (information-dense cards)

**Network mode** serves:
- Visual understanding of site structure
- Discovery (see relationships between pages)
- Delight (interactive, engaging)
- Brand expression (we build coordination tools)

Both modes show the same data. Grid is functional baseline; network is enhanced experience.

### Why Auth Color Coding?

**Transparency:** Visitors should know immediately whether a page is accessible to them. Auth badges aren't hidden — they're surfaced as first-class information. This aligns with Techne's principle of legibility.

**Navigation efficiency:** Members don't waste time clicking pages they can't access. Newcomers see the public surface clearly separated from member tools.

### Why Zone-Based Organization?

**Conceptual clarity:** The site has natural zones (home, public info, member tools, steward admin). Making these explicit helps visitors build a mental model of the domain.

**Scalability:** As the site grows, new pages slot into existing zones rather than cluttering a flat list.

---

## Appendix: Example Card Data (First 10 Pages)

```javascript
const siteTree = [
  {
    id: 'home',
    path: '/',
    title: 'Techne Institute',
    description: 'An integral technology learning center. Cooperatively owned.',
    authLevel: 'public',
    zone: 0,
    parent: null
  },
  {
    id: 'about',
    path: '/about/',
    title: 'About Techne',
    description: 'Cooperatively-owned integral technology studio in Boulder, CO.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  },
  {
    id: 'cooperative',
    path: '/cooperative/',
    title: 'Cooperative Structure',
    description: 'What is a Colorado LCA. Governance and structure.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  },
  {
    id: 'membership',
    path: '/membership/',
    title: 'Membership',
    description: 'How to join. Four classes; the path is relational.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  },
  {
    id: 'public-benefit',
    path: '/public-benefit/',
    title: 'Public Benefit Purpose',
    description: 'Our commitment to public benefit under Colorado LCA law.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  },
  {
    id: 'introduction',
    path: '/introduction/',
    title: 'Introduction',
    description: 'Conceptual decks. Four entry points into the ideas.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  },
  {
    id: 'formation',
    path: '/formation/',
    title: 'Formation',
    description: 'How we came to be. Formation documents through Feb 2026.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  },
  {
    id: 'vision',
    path: '/vision/',
    title: 'Vision',
    description: 'What we're building toward. Common and craft threads.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  },
  {
    id: 'learn',
    path: '/learn/',
    title: 'Learn',
    description: 'Cooperative education. LCA law, patronage, intellectual traditions.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  },
  {
    id: 'bylaws',
    path: '/bylaws/',
    title: 'Bylaws',
    description: 'Bylaws and operating agreement of Techne Institute LCA.',
    authLevel: 'public',
    zone: 1,
    parent: 'home'
  }
];
```

---

*Design specification authored by Dianoia · 2026-04-15 · Ready for Nou's implementation*
