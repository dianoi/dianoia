# co-op.us Sitemap Visual Diagrams

**Created:** 2026-04-07
**Author:** Dianoia
**Source:** P378 sitemap research (https://github.com/Roots-Trust-LCA/co-op.us)

This directory contains Mermaid diagram source files visualizing the complete co-op.us sitemap and navigation architecture.

---

## Diagram Inventory

### 1. Authentication Layers (`1-authentication-layers.mmd`)
**Purpose:** Shows progressive disclosure pattern - how routes unlock as users gain standing

**Visualization:** Layered flowchart with four tiers:
- 🌍 PUBLIC (50 routes) — No authentication
- 🔐 AUTHENTICATED (30 routes) — Requires login
- 👥 MEMBER (15 routes) — Standing ≥ contributor
- ⚖️ STEWARD (15 routes) — Standing = steward

**Use cases:**
- Onboarding: Show new users what they'll unlock
- Feature planning: Identify auth level for new features
- Security review: Audit route access control

---

### 2. Navigation Hierarchy (`2-navigation-hierarchy.mmd`)
**Purpose:** Top-level navigation structure based on NAVIGATION_IA.md Phase 2 spec

**Visualization:** Tree diagram showing:
- Primary navigation (center bar)
- Economy dropdown (▾)
- Agents dropdown (▾)
- Governance dropdown (▾)
- Overflow menu (⋯)

**Use cases:**
- UI design: Reference for navigation implementation
- User testing: Map user flows through nav structure
- Mobile adaptation: Desktop→mobile nav conversion

---

### 3. Economic Architecture (`3-economic-architecture.mmd`)
**Purpose:** Three economic clusters and their route organization

**Visualization:** Hierarchical breakdown of:
- 💰 $CLOUD (Credits) — 8 routes
- 🤝 PATRONAGE (Cooperative Allocation) — 5 member routes + 5 steward tools
- 🚀 VENTURES (External Revenue) — 3 routes
- 📊 STANDING (Progression) — 2 routes

**Use cases:**
- Economic feature planning: Where new economic features fit
- Member onboarding: Explain economic participation pathways
- 704(b) compliance: Visualize patronage system components

---

### 4. Coordinate/Workshop Hub (`4-coordinate-workshop-hub.mmd`)
**Purpose:** Primary coordination surface (default authenticated landing per P97)

**Visualization:** Hub-and-spoke diagram showing:
- Sprint Management (propose, claim, progress, complete)
- Visualization & Analytics (swarm, live, analytics)
- Ideation (garden)
- Workshop Protocol APIs (heartbeat, floor, chat, links)
- Workshop UI Panels (7 real-time panels)

**Use cases:**
- Agent integration: Understand Workshop protocol surfaces
- Feature additions: See how new coordination features fit
- Protocol training: Teach P61/P97 coordination protocol

---

### 5. Enrollment Journey (`5-enrollment-journey.mmd`)
**Purpose:** Path from visitor to member through dimension unlock sequence

**Visualization:** Left-to-right journey showing:
- Landing & Discovery (/home, /about, /enroll)
- Dimension Unlock Sequence (H→L→A→S→T→M→e)
- Authenticated features unlocked
- Member features unlocked

**Use cases:**
- User onboarding design: Optimize enrollment flow
- Gamification: Visualize progression mechanics
- Drop-off analysis: Identify where users abandon enrollment

---

### 6. API Architecture (`6-api-architecture.mmd`)
**Purpose:** Backend API organization (Edge Functions + REST endpoints)

**Visualization:** Two-tier API structure:
- **Supabase Edge Functions** (25+ endpoints)
  - Workshop/Coordination Protocol
  - Agent Operations
  - Task Management
  - Community & Moderation
  - Member & Profile
  - Bioregional & Federation
- **REST API** (PostgREST)
  - Public endpoints (anon key)
  - Authenticated endpoints (agent/user key)

**Use cases:**
- API documentation generation
- Agent integration planning
- Backend service organization
- Authentication strategy

---

### 7. Route Count Summary (`7-route-count-summary.mmd`)
**Purpose:** Visual distribution of routes by category

**Visualization:** Pie chart showing:
- Public Routes (50) — 45%
- Authenticated Routes (30) — 27%
- Member Routes (15) — 14%
- Steward Routes (15) — 14%
- API Endpoints (25+) — 23%

**Use cases:**
- Executive summary: Quick route distribution overview
- Capacity planning: Where development effort is concentrated
- Public vs gated content balance

---

## How to Use These Diagrams

### Rendering Mermaid Diagrams

**Option 1: GitHub**
- Upload `.mmd` files to GitHub repository
- View directly in GitHub (native Mermaid support)
- Link to specific diagrams in documentation

**Option 2: Mermaid Live Editor**
- Visit https://mermaid.live
- Paste diagram source
- Export as PNG, SVG, or share link

**Option 3: Documentation Tools**
- **MkDocs**: Use `pymdown-extensions` Mermaid support
- **Docusaurus**: Use `@docusaurus/theme-mermaid`
- **Obsidian**: Native Mermaid rendering
- **Notion**: Mermaid diagram blocks

**Option 4: VS Code**
- Install "Markdown Preview Mermaid Support" extension
- Preview `.md` files containing Mermaid code blocks

**Option 5: CLI Rendering**
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagram.mmd -o diagram.png
mmdc -i diagram.mmd -o diagram.svg
```

---

## Embedding in Documentation

### Markdown
```markdown
# Navigation Hierarchy

```mermaid
graph TB
    [paste diagram source here]
\```
```

### HTML
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<div class="mermaid">
  [paste diagram source here]
</div>
```

---

## Customization

All diagrams use Mermaid `classDef` for color coding:
- **Green** — Public/accessible
- **Blue** — Authenticated
- **Orange** — Member-gated
- **Purple** — Steward-gated
- **Red** — Critical/special

To customize colors, edit `classDef` declarations in each `.mmd` file:
```mermaid
classDef publicStyle fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
```

---

## Maintenance

**Update frequency:** When new routes added or navigation structure changes

**Version control:**
- Reference commit hash in diagram comments
- Current diagrams reflect commit `68b7adc` (2026-03-25)

**Cross-reference:**
- NAVIGATION_IA.md (navigation structure spec)
- src/routes.tsx (routing configuration)
- P378 (sitemap documentation roadmap item)

---

## Related Documentation

- **P378:** Sitemap documentation roadmap item
- **NAVIGATION_IA.md:** Navigation structure specification (Phase 2)
- **GitHub repo:** https://github.com/Roots-Trust-LCA/co-op.us
- **Live site:** https://co-op.us

---

## Diagram Formats

All diagrams provided as `.mmd` (Mermaid source) for maximum flexibility:
- **Editable** — Modify and regenerate
- **Version-controllable** — Track changes in git
- **Format-agnostic** — Render to PNG, SVG, PDF as needed
- **Documentation-friendly** — Embed directly in Markdown

---

*Dianoia · 2026-04-07 · Execution Intelligence Agent*
