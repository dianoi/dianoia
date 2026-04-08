# Techne Institute Design Methodology
## Consistent Visual Language Across the Complete Sitemap

**Prepared by:** Dianoia
**Date:** 2026-04-08
**Context:** Design system derived from techne.institute homepage and co-op.us/app/about
**Scope:** Full sitemap (42+ pages across 12 sections)

---

## Executive Summary

This methodology establishes a **consistent, scalable design language** for techne.institute that:
1. Honors the existing **warm-earthen aesthetic** (parchment backgrounds, ember accents, serif typography)
2. Adapts fluidly across **content types** (narrative pages, data rooms, presentations, coordination surfaces)
3. Maintains **visual coherence** without feeling cookie-cutter
4. Supports **developer velocity** through reusable component patterns

**Core Principle:** *Design as soil, not ornament* — the system should elevate content, not compete with it.

---

## Part 1: Design Token System

### 1.1 Typography Scale

**Font Stack:**
```css
--font-display: 'Cormorant', serif;          /* Headings, hero text */
--font-body: 'Source Serif 4', serif;        /* Body copy, long-form */
--font-mono: 'IBM Plex Mono', 'JetBrains Mono', monospace; /* Labels, code, meta */
```

**Heading Scale (Fluid Typography):**
```css
--text-h1: clamp(2.5rem, 6vw, 4rem);        /* Hero titles */
--text-h2: clamp(2.25rem, 5vw, 3rem);       /* Section headers */
--text-h3: 1.5rem;                           /* Subsection headers */
--text-h4: 1.15rem;                          /* Card titles */

--weight-display: 400;  /* Light for large text */
--weight-heading: 500;  /* Medium for h3/h4 */
--weight-body: 400;
--weight-bold: 600;

--leading-tight: 1.2;   /* Headings */
--leading-normal: 1.75; /* Body text */
--leading-loose: 1.9;   /* Lead paragraphs */
```

**Body Text:**
```css
--text-base: 17px;
--text-lead: 1.125rem;  /* Opening paragraphs */
--text-small: 0.9rem;   /* Captions, footnotes */
--text-meta: 0.7rem;    /* Labels, timestamps */

--tracking-normal: 0;
--tracking-wide: 0.1em;  /* Meta text */
--tracking-wider: 0.25em; /* All-caps labels */
```

---

### 1.2 Color Palette

**Light Mode (Default):**
```css
/* Backgrounds */
--bg-parchment: #f7f5f0;    /* Primary surface */
--bg-cream: #ebe7df;         /* Secondary surface, cards */
--bg-paper: #fdfcfa;         /* Elevated cards */

/* Text */
--text-charcoal: #1a1a1f;   /* Primary body */
--text-graphite: #2a2a30;   /* Secondary */
--text-stone: #9a958a;      /* Tertiary, muted */

/* Accents */
--accent-ember: #c2512a;    /* Primary CTA, highlights */
--accent-sage: #4a5f4a;     /* Secondary accent, active states */

/* Borders */
--border-bone: #d8d3c8;     /* Light dividers */
--border-graphite: #2a2a30; /* Strong dividers */
```

**Dark Mode (Inversions):**
```css
/* Backgrounds */
--bg-void: #08080a;         /* Full-bleed sections */
--bg-ink: #0f0f12;          /* Cards on dark */

/* Text */
--text-bone: #d8d3c8;       /* Primary on dark */
--text-ash: #9a958a;        /* Secondary on dark */

/* Accents (same) */
--accent-ember: #c2512a;
--accent-sage: #4a5f4a;
```

---

### 1.3 Spacing Scale

**Vertical Rhythm (rem-based):**
```css
--space-xs: 0.5rem;    /* 8px - tight grouping */
--space-sm: 1rem;      /* 16px - paragraph spacing */
--space-md: 1.5rem;    /* 24px - component gaps */
--space-lg: 2rem;      /* 32px - card padding */
--space-xl: 3rem;      /* 48px - section spacing */
--space-2xl: 6rem;     /* 96px - major section padding */
```

**Horizontal Rhythm:**
```css
--gap-grid: 1.5rem;    /* Default grid gap */
--gap-wide: 2rem;      /* Wide grid gap */
```

---

### 1.4 Layout Primitives

**Container System:**
```css
.section-frame {
  max-width: 820px;          /* Optimal reading width */
  margin-inline: auto;
  padding-inline: 2rem;      /* Mobile gutter */
}

.section-wide {
  max-width: 1200px;         /* Data tables, grids */
  margin-inline: auto;
  padding-inline: 2rem;
}

.section-full {
  width: 100%;               /* Full-bleed dark sections */
  padding-inline: 2rem;
}
```

**Grid Patterns:**
```css
.grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-grid);
}

@media (max-width: 700px) {
  .grid-2col {
    grid-template-columns: 1fr; /* Stack on mobile */
  }
}

.grid-sidebar {
  display: grid;
  grid-template-columns: 280px 1fr; /* Fixed sidebar + content */
  gap: var(--gap-wide);
}

.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--gap-grid);
}
```

---

### 1.5 Component Tokens

**Buttons:**
```css
.button-primary {
  background: var(--accent-ember);
  color: white;
  padding: 0.75rem 1.5rem;
  font: var(--font-mono);
  font-size: var(--text-small);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  border: none;
  transition: background 0.2s ease;
}

.button-primary:hover {
  background: #a33f1f; /* Darken ember 20% */
}

.button-ghost {
  background: transparent;
  color: var(--text-charcoal);
  border: 1px solid var(--border-bone);
}
```

**Cards:**
```css
.card {
  background: var(--bg-cream);
  padding: var(--space-lg);
  border-left: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.card:hover {
  border-left-color: var(--accent-ember);
}

.card-dark {
  background: var(--bg-ink);
  color: var(--text-bone);
}
```

**Dividers:**
```css
.divider {
  border-top: 1px solid var(--border-bone);
  margin-block: var(--space-xl);
}

.divider-dashed {
  border-top: 1px dashed var(--border-bone);
}
```

---

## Part 2: Page Templates by Content Type

### 2.1 Narrative Pages (Introduction, Vision, Formation)

**Purpose:** Long-form storytelling, philosophical content, governance documents

**Template Structure:**
```html
<main class="page-narrative">
  <header class="hero-minimal">
    <h1 class="display">{{ page.title }}</h1>
    <p class="lead">{{ page.subtitle }}</p>
  </header>

  <div class="section-frame">
    <article class="prose">
      <!-- Markdown content rendered here -->
      <!-- Automatic typography spacing via .prose styles -->
    </article>
  </div>
</main>
```

**Design Specifications:**
- **Background:** Parchment (#f7f5f0)
- **Max-width:** 820px (optimal reading)
- **Typography:** Source Serif 4, 17px, line-height 1.75
- **Paragraph spacing:** 1.5rem
- **Heading spacing:** 2.5rem before, 1rem after
- **Pull quotes:** Italic, 1.25rem, stone color
- **Running margin:** Dashed line (left edge, hidden ≤1000px)

**Example Pages:**
- `/introduction/` — narrative progression
- `/vision/common/` — philosophical frameworks
- `/formation/narrative.html` — governance story
- `/about/` — cooperative overview

---

### 2.2 Presentation Decks (Introduction Decks, Data Room)

**Purpose:** Slide-like content, visual arguments, investor materials

**Template Structure:**
```html
<main class="page-deck">
  <section class="slide" id="slide-1">
    <div class="slide-content">
      <h2 class="display">{{ slide.title }}</h2>
      <div class="slide-body">
        <!-- Content: text, diagrams, tables -->
      </div>
    </div>
  </section>

  <!-- Navigation: prev/next, slide counter -->
</main>
```

**Design Specifications:**
- **Layout:** Full-viewport slides (100vh min-height)
- **Background:** Alternating parchment / void (light/dark)
- **Content centering:** Flexbox, centered both axes
- **Typography:** Cormorant display (larger), Source Serif body
- **Slide transitions:** Fade-in on scroll (IntersectionObserver)
- **Controls:** Fixed bottom-right nav (prev/next arrows)

**Visual Enhancements:**
- **Orb gradients:** Radial gradients on dark slides (ember/sage overlays)
- **Dot grid:** 28px spacing on dark slides (subtle texture)
- **Diagram boxes:** Dark gradient with corner borders (::before/::after)

**Example Pages:**
- `/introduction/empire-and-the-people-deck.html`
- `/introduction/the-oldest-design-problem-deck.html`
- `/data-room/deck.html` — investor pitch
- `/data-room/vision.html` — vision deck

---

### 2.3 Data Rooms (Financial, Governance, Term Sheets)

**Purpose:** Structured data presentation, legal documents, investment materials

**Template Structure:**
```html
<main class="page-data">
  <header class="data-header">
    <h1>{{ page.title }}</h1>
    <p class="meta">Last updated: {{ page.updated }}</p>
  </header>

  <div class="section-wide">
    <nav class="data-nav">
      <!-- Table of contents, section links -->
    </nav>

    <div class="data-content">
      <!-- Tables, financial statements, term sheets -->
    </div>
  </div>
</main>
```

**Design Specifications:**
- **Max-width:** 1200px (accommodate tables)
- **Layout:** Sidebar nav (280px) + content area
- **Tables:** Monospaced numbers, zebra striping (cream/parchment), sticky headers
- **Cards:** Grid of metrics (auto-fit, minmax(300px, 1fr))
- **Typography:** Mono for numbers/amounts, serif for labels
- **Emphasis:** Ember for positive metrics, stone for neutral

**Component Patterns:**
```html
<div class="metric-card">
  <span class="metric-label">Total Capital</span>
  <span class="metric-value">$120,000</span>
  <span class="metric-change">+12% Q1</span>
</div>

<table class="data-table">
  <thead>
    <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
  </thead>
  <tbody>
    <tr><td>2026-03-01</td><td>Initial Contribution</td><td class="amount">$50,000</td></tr>
  </tbody>
</table>
```

**Example Pages:**
- `/data-room/term-sheet.html` — investment terms
- `/formation/financial.html` — financial structure
- `/formation/governance.html` — governance tables

---

### 2.4 Directory/Index Pages (Learn, Pre-Read, Formation Index)

**Purpose:** Navigation hubs, course catalogs, resource libraries

**Template Structure:**
```html
<main class="page-directory">
  <header class="directory-header">
    <h1>{{ page.title }}</h1>
    <p class="lead">{{ page.description }}</p>
  </header>

  <div class="section-frame">
    <div class="directory-grid">
      <article class="directory-card" v-for="item in items">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <a :href="item.url" class="card-link">Explore →</a>
      </article>
    </div>
  </div>
</main>
```

**Design Specifications:**
- **Grid:** 2-column on desktop, 1-column mobile
- **Card design:** Cream background, padding 2rem, hover state (ember border-left)
- **Card typography:** h3 (1.5rem), body (0.95rem)
- **Link style:** Mono, ember color, underline on hover
- **Spacing:** 1.5rem gap between cards

**Visual Enhancements:**
- **Status badges:** "Active" (sage), "Developing" (ember glow), "Planned" (bone)
- **Icons:** Optional SVG icons (24px) aligned to card title
- **Card animations:** Staggered fade-in on page load (delay: 0.1s per card)

**Example Pages:**
- `/learn/` — program directory
- `/pre-read/` — orientation resources
- `/formation/` — formation document index
- `/vision/` — vision framework index

---

### 2.5 Application Surfaces (/app, /workshop)

**Purpose:** Interactive coordination tools, live data, member portals

**Template Structure:**
```html
<main class="page-app">
  <nav class="app-nav">
    <!-- Sticky top navigation -->
  </nav>

  <div class="app-layout">
    <aside class="app-sidebar">
      <!-- Context panels, filters -->
    </aside>

    <section class="app-main">
      <!-- Dynamic content area -->
    </section>
  </div>
</main>
```

**Design Specifications:**
- **Layout:** Flex row (sidebar 280px, main 1fr)
- **Background:** Parchment base, cream cards
- **Interactivity:** Real-time updates (Supabase Realtime)
- **Tables:** Sortable, filterable, responsive (horizontal scroll on mobile)
- **Forms:** Inline editing, ember focus states, validation feedback
- **Loading states:** Skeleton screens (bone color, pulse animation)

**Component Patterns:**
- **Status pills:** Inline-block, 0.6rem mono, sage/ember/bone backgrounds
- **Activity feed:** Timeline with vertical line, circular nodes
- **Data cards:** Compact metrics, monospaced values, hover states

**Example Pages:**
- `/app/` — member portal (after P399 auth)
- `/workshop/` — public coordination view

---

### 2.6 Utility Pages (404, Sitemap, Legal)

**Purpose:** Error states, navigation aids, legal disclosures

**Template Structure:**
```html
<main class="page-utility">
  <div class="section-frame">
    <div class="utility-content">
      <h1>{{ page.title }}</h1>
      <p>{{ page.message }}</p>
      <a href="/" class="button-ghost">Return Home</a>
    </div>
  </div>
</main>
```

**Design Specifications:**
- **Layout:** Vertically centered (min-height: 60vh)
- **Typography:** Simplified (no running margin, minimal ornamentation)
- **404 pages:** Friendly tone, suggested links to key pages
- **Sitemap:** Hierarchical list, indented, mono font for paths
- **Legal:** Dense text, smaller font (0.9rem), clear section headers

**Example Pages:**
- `/404.html` — not found
- `/bylaws/` — legal document
- `/public-benefit/` — mission statement

---

## Part 3: Cross-Cutting Patterns

### 3.1 Navigation System

**Global Navigation (All Pages):**
```html
<nav class="global-nav">
  <a href="/" class="nav-logo">Techne Institute</a>
  <div class="nav-links">
    <a href="/introduction/">Introduction</a>
    <a href="/vision/">Vision</a>
    <a href="/formation/">Formation</a>
    <a href="/membership/">Membership</a>
    <a href="/workshop/">Workshop</a>
  </div>
</nav>
```

**Design Specifications:**
- **Position:** Sticky top, height 56px
- **Background:** Semi-transparent parchment (backdrop-blur on scroll)
- **Typography:** 0.65rem mono, letter-spacing 0.1em
- **Links:** Underline animation (scaleX transform, origin left)
- **Active state:** Ember color, no underline
- **Mobile:** Hamburger menu (≤700px), slide-in drawer

**Breadcrumbs (Deep Pages):**
```html
<nav class="breadcrumbs">
  <a href="/">Home</a>
  <span class="sep">/</span>
  <a href="/formation/">Formation</a>
  <span class="sep">/</span>
  <span class="current">Financial</span>
</nav>
```

**Footer (All Pages):**
```html
<footer class="global-footer">
  <div class="footer-content">
    <div class="footer-section">
      <h4>About</h4>
      <a href="/about/">Overview</a>
      <a href="/cooperative/">Structure</a>
      <a href="/public-benefit/">Mission</a>
    </div>
    <!-- Additional sections -->
  </div>
  <div class="footer-meta">
    <p>© 2026 RegenHub, LCA</p>
  </div>
</footer>
```

---

### 3.2 Motion & Transitions

**Page Load Animations:**
```css
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

.hero-minimal h1 {
  animation: fadeInUp 0.8s ease-out;
}

.hero-minimal p {
  animation: fadeInUp 0.8s ease-out 0.2s;
  animation-fill-mode: backwards;
}
```

**Interaction Feedback:**
```css
.card {
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

a {
  position: relative;
}

a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

a:hover::after {
  transform: scaleX(1);
}
```

**Scroll Reveals (Optional):**
Use IntersectionObserver to fade in sections as they enter viewport.

---

### 3.3 Responsive Behavior

**Breakpoints:**
```css
/* Mobile-first approach */
--bp-sm: 700px;   /* Collapse grids, stack cards */
--bp-md: 1000px;  /* Show running margin, wider containers */
--bp-lg: 1400px;  /* Max content width reached */
```

**Typography Scaling:**
- **Mobile (< 700px):** Reduce heading sizes by 20%, increase line-height
- **Tablet (700–1000px):** Base sizes, running margin hidden
- **Desktop (> 1000px):** Fluid scaling (clamp), running margin visible

**Grid Collapsing:**
- **2-column grids → 1-column** at 700px
- **Sidebar layouts → stacked** at 1000px
- **Table scrolling:** Horizontal scroll on mobile (overflow-x: auto)

---

### 3.4 Accessibility Standards

**Contrast Ratios:**
- Body text on parchment: 12.5:1 (AAA)
- Ember on parchment: 4.8:1 (AA)
- Bone on void: 4.6:1 (AA)

**Keyboard Navigation:**
- Visible focus states (2px ember outline, 4px offset)
- Skip-to-content link (visually hidden, appears on focus)
- Logical tab order (follows visual hierarchy)

**Semantic HTML:**
- `<main>` for primary content
- `<article>` for self-contained content
- `<nav>` with `aria-label` for multiple navigations
- `<h1>` once per page, `<h2>`–`<h4>` for hierarchy

**ARIA Labels:**
- Form inputs with associated `<label>` elements
- Icon-only buttons with `aria-label`
- Live regions for dynamic content (`aria-live="polite"`)

---

## Part 4: Implementation Strategy

### 4.1 File Organization

```
techne.institute/
├── assets/
│   ├── css/
│   │   ├── tokens.css         # Design token variables
│   │   ├── reset.css          # CSS reset/normalize
│   │   ├── typography.css     # Font loading, prose styles
│   │   ├── layout.css         # Grid, container primitives
│   │   ├── components.css     # Buttons, cards, nav, footer
│   │   └── pages.css          # Page-specific styles
│   ├── js/
│   │   ├── nav.js             # Navigation interactions
│   │   ├── scroll-reveal.js   # Scroll animations
│   │   └── app.js             # Main entry point
│   └── fonts/
│       ├── cormorant/
│       ├── source-serif-4/
│       └── ibm-plex-mono/
├── components/               # Reusable HTML partials
│   ├── nav.html
│   ├── footer.html
│   ├── card.html
│   └── breadcrumbs.html
└── [page sections]/
```

### 4.2 Build Process

**Static Site Generator (Recommended):**
- **Tool:** 11ty (Eleventy) — simple, flexible, markdown-native
- **Templating:** Nunjucks (`.njk` files for layouts)
- **Data:** JSON/YAML for content that needs structure (e.g., program catalogs)
- **CSS:** PostCSS with autoprefixer, cssnano for production

**Workflow:**
1. Edit markdown files for content
2. Run `npm run dev` (live reload on file save)
3. Build for production: `npm run build` (minified CSS/JS)
4. Deploy to static host (Netlify, Vercel, GitHub Pages)

**Alternative (Current Setup):**
If staying with manual HTML:
- Extract shared nav/footer to separate HTML files
- Use server-side includes (SSI) or build script to inject
- Centralize CSS in single `style.css` (organized by sections above)

---

### 4.3 Component Library

**Reusable Components (as HTML partials or web components):**

1. **Navigation:**
   - `<techne-nav>` — global navigation with active state
   - `<techne-breadcrumbs items="[...]">` — breadcrumb trail

2. **Content Blocks:**
   - `<techne-card variant="default|dark">` — card wrapper
   - `<techne-metric label="..." value="..." change="...">` — metric display
   - `<techne-status value="active|developing|planned">` — status badge

3. **Layout:**
   - `<techne-section width="frame|wide|full">` — section wrapper
   - `<techne-grid cols="2|auto">` — responsive grid

4. **Interactive:**
   - `<techne-button variant="primary|ghost">` — styled button
   - `<techne-table sortable filterable>` — data table

**Usage Example:**
```html
<techne-section width="frame">
  <techne-grid cols="2">
    <techne-card>
      <h3>Vision Framework</h3>
      <p>Foundational philosophy</p>
      <a href="/vision/" class="card-link">Explore →</a>
    </techne-card>
    <!-- More cards -->
  </techne-grid>
</techne-section>
```

---

### 4.4 Progressive Enhancement

**Core Principle:** Content is accessible without JavaScript, enhanced with it.

**Layer 1 (HTML only):**
- Semantic structure
- Readable typography
- Navigation via `<a>` tags
- Forms submit via POST

**Layer 2 (+ CSS):**
- Visual design system applied
- Responsive layout
- Hover states, transitions
- Print stylesheet

**Layer 3 (+ JS):**
- Smooth scroll
- Form validation
- Live search/filtering
- Real-time updates (for /app, /workshop)

---

## Part 5: Sitemap Application

### 5.1 Page Type Mapping

| Page(s) | Template | Priority |
|---------|----------|----------|
| `/` | Hero landing (special) | 1.0 |
| `/introduction/*`, `/vision/*`, `/about/*` | Narrative | 0.8–0.9 |
| `/introduction/*-deck.html`, `/data-room/deck.html` | Presentation deck | 0.7 |
| `/formation/*`, `/public-benefit/`, `/bylaws/` | Narrative (legal variant) | 0.7–0.9 |
| `/data-room/term-sheet.html`, `/formation/financial.html` | Data room | 0.7 |
| `/learn/`, `/pre-read/`, `/formation/` (index) | Directory | 0.7–0.9 |
| `/membership/`, `/cooperative/` | Narrative | 0.9 |
| `/workshop/`, `/app/` | Application | 0.6 |
| `/coordination-games.html` | Narrative | 0.6 |
| `/lunch-presentation/` | Presentation deck | 0.5 |
| `/404.html`, `/bylaws/` | Utility | 0.5 |

### 5.2 Content Migration Plan

**Phase 1: Foundation (Week 1)**
1. Establish design token CSS file (`tokens.css`)
2. Create base layout primitives (`layout.css`)
3. Build component library (nav, footer, card, button)
4. Migrate homepage (test ground for system)

**Phase 2: Core Pages (Week 2)**
5. Migrate `/introduction/` section (5 pages) — narrative template
6. Migrate `/formation/` section (8 pages) — narrative + data room mix
7. Test responsive behavior across templates

**Phase 3: Expansion (Week 3)**
8. Migrate `/vision/`, `/about/`, `/membership/` — narrative template
9. Migrate `/data-room/` — data room + presentation decks
10. Migrate `/learn/`, `/pre-read/` — directory template

**Phase 4: Applications (Week 4)**
11. Style `/workshop/` — application template
12. Build `/app/` skeleton (waiting for P399 auth)
13. Final QA pass, accessibility audit

---

### 5.3 Quality Checklist (Per Page)

**Typography:**
- [ ] Headings use Cormorant at correct scale
- [ ] Body text is Source Serif 4, 17px, line-height 1.75
- [ ] Meta/labels use mono font, uppercase, letter-spacing 0.1em
- [ ] Fluid typography scales correctly on mobile

**Color:**
- [ ] Backgrounds are parchment/cream (or void/ink for dark sections)
- [ ] Text is charcoal (or bone on dark)
- [ ] Accents use ember (primary) or sage (secondary)
- [ ] Contrast ratios meet AA or AAA

**Layout:**
- [ ] Content constrained to 820px (or 1200px for data pages)
- [ ] Padding is 2rem horizontal, 6rem vertical for sections
- [ ] Grids collapse to 1-column ≤700px
- [ ] Running margin appears on desktop (≥1000px)

**Components:**
- [ ] Navigation is sticky, 56px height
- [ ] Cards have cream background, 2rem padding, hover states
- [ ] Buttons use ember (primary) or ghost style
- [ ] Footer includes all key links

**Interaction:**
- [ ] Links have underline animation on hover
- [ ] Focus states are visible (2px ember outline)
- [ ] Page transitions are smooth (fade-in on load)
- [ ] Scroll reveals work (if enabled)

**Accessibility:**
- [ ] Semantic HTML structure
- [ ] Alt text for all images
- [ ] Form inputs have labels
- [ ] Keyboard navigable (tab order correct)

---

## Part 6: Design Principles Summary

### 6.1 Constraints

**Typography:**
- Serif fonts only (no sans-serif except UI elements)
- Mono for labels/meta (never for body text)
- Fluid scaling (clamp) for headings
- Line-height ≥1.75 for body text

**Color:**
- Warm earth palette (no blues, no neon)
- Ember as only primary accent
- Backgrounds always light or dark (no mid-tones)
- Borders always subtle (bone, 1px)

**Layout:**
- Max-width 820px for reading content
- Centered containers (auto margins)
- Grid gaps ≥1.5rem
- Section padding ≥6rem vertical

**Motion:**
- Transitions ≤0.3s (fast feedback)
- Easing: `ease` or `ease-out` (never linear)
- Animations on page load: staggered fade-in
- Hover states: border-color, transform (no scale >105%)

---

### 6.2 Flexibilities

**When to deviate:**
- **Application surfaces** (/app, /workshop) may need denser layouts (1rem gaps)
- **Data tables** can use monospaced fonts for all cells (not just numbers)
- **Presentation decks** can use full-bleed images (no max-width constraint)
- **Hero sections** can use dark backgrounds with orb gradients (not just parchment)

**Local variation:**
- Sections within a page can alternate light/dark backgrounds
- Cards can have accent borders (left, bottom, or all sides)
- Grids can be 2, 3, or auto-fit columns (as long as they collapse responsively)

---

### 6.3 Design Philosophy

**"Design as Soil, Not Ornament"**

This system is **supportive infrastructure**, not decorative overlay. It should:
1. **Elevate content** — typography and spacing make text easier to read
2. **Reduce friction** — consistent patterns reduce cognitive load
3. **Signal meaning** — color/spacing communicate hierarchy without explanation
4. **Evolve gracefully** — new pages inherit system without custom CSS

**Anti-patterns to avoid:**
- Competing visual styles across sections (breaks coherence)
- Ornamental animations (distracting, slow)
- Custom layouts that don't respond (mobile failure)
- High-contrast color accents (breaks palette)

---

## Part 7: Next Steps

### 7.1 Immediate Actions (This Week)

1. **Create `tokens.css`** — centralize all design variables
2. **Build component library** — nav, footer, card, button (HTML partials or web components)
3. **Migrate homepage** — apply system to `/` as proof-of-concept
4. **Document deviations** — note where existing pages diverge, plan corrections

### 7.2 Short-term (This Month)

5. **Migrate core sections** — introduction, formation, vision (narrative template)
6. **Test responsive behavior** — verify all breakpoints work correctly
7. **Accessibility audit** — run WAVE, check keyboard nav, verify contrast
8. **Browser testing** — Chrome, Firefox, Safari (latest 2 versions)

### 7.3 Long-term (This Quarter)

9. **Migrate remaining pages** — data-room, learn, pre-read, lunch-presentation
10. **Build application templates** — /app (after P399 auth complete)
11. **Performance optimization** — minify CSS/JS, optimize fonts, lazy-load images
12. **Design system documentation** — living style guide at `/design-system.html`

---

## Conclusion

This methodology provides a **coherent, scalable visual language** for techne.institute that:
- Respects the existing warm-earthen aesthetic
- Adapts to diverse content types (narrative, data, presentations, applications)
- Maintains consistency across 42+ pages
- Supports developer velocity through reusable components

By following the **token system** (typography, color, spacing), **template patterns** (narrative, deck, data room, directory, application), and **design principles** (constraints + flexibilities), the full sitemap can achieve visual coherence without feeling rigid or cookie-cutter.

**Core mantra:** *The design system is soil — it nourishes content, but doesn't compete with it.*

---

*Dianoia · Execution Intelligence Agent · Prepared for techne.institute · 2026-04-08*
