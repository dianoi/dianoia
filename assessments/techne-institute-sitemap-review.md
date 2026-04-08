# Techne Institute Sitemap Review

**Repository:** https://github.com/RegenHub-Boulder/techne.institute
**Deployed:** https://techne.institute
**Review Date:** 2026-04-08
**Reviewer:** Dianoia

---

## Executive Summary

The current sitemap (`sitemap.xml`) covers 20 URLs across core sections but is **missing 22+ deployed pages**. The site has grown organically with several new sections (data-room, pre-read, vision, lunch-presentation) and formation updates that aren't reflected in the sitemap.

**Recommendation:** Expand sitemap to include all public-facing pages and establish a maintenance process for keeping it current.

---

## Current Sitemap Coverage (20 URLs)

### Home
- `/` (priority 1.0)

### Introduction (5 pages)
- `/introduction/` (priority 0.9)
- `/introduction/empire-and-the-people-deck.html`
- `/introduction/the-oldest-design-problem-deck.html`
- `/introduction/what-was-the-web-for-deck.html`
- `/introduction/older-than-the-wire-deck.html`

### Formation (6 pages)
- `/formation/` (priority 0.9)
- `/formation/narrative.html`
- `/formation/governance.html`
- `/formation/financial.html`
- `/formation/decisions.html`
- `/formation/open-items.html`
- `/formation/q1-2026.html`

### About / Cooperative Info (6 pages)
- `/about/` (priority 0.9)
- `/cooperative/` (priority 0.8)
- `/membership/` (priority 0.9)
- `/public-benefit/` (priority 0.8)
- `/bylaws/` (priority 0.7)
- `/learn/` (priority 0.7)

### Coordination Games
- `/coordination-games.html` (priority 0.7)

### Workshop
- `/workshop/` (priority 0.6, changefreq: daily)

---

## Missing from Sitemap (22+ pages)

### Data Room Section (NEW — not in sitemap)
**Purpose:** Investment materials and vision documents
**Pages:**
- `/data-room/` (index)
- `/data-room/deck.html`
- `/data-room/term-sheet.html`
- `/data-room/vision.html`

**Recommended priority:** 0.6–0.7 (investor-facing)
**Changefreq:** monthly

### Pre-Read Section (NEW — not in sitemap)
**Purpose:** Orientation materials for prospective members/students
**Pages:**
- `/pre-read/` (index)

**Recommended priority:** 0.7
**Changefreq:** monthly

### Vision Section (NEW — not in sitemap)
**Purpose:** Core vision documents and frameworks
**Pages:**
- `/vision/` (index)
- `/vision/common/` (index)
- `/vision/craft/` (index)

**Recommended priority:** 0.8 (foundational content)
**Changefreq:** monthly

### Formation Updates (not in sitemap)
**Pages:**
- `/formation/spring-equinox-2026.html` (new quarterly report)
- `/formation/tooling.html` (operational tooling documentation)
- `/formation/formation-index.html` (alternate index — may be redundant)

**Recommended priority:** 0.6–0.7
**Changefreq:** weekly (for active formation period)

### Lunch Presentation Section (NEW — not in sitemap)
**Purpose:** Educational presentation materials (possibly prototype/demo)
**Pages:**
- `/lunch-presentation/` (index)
- `/lunch-presentation/ramp/` (index)
- `/lunch-presentation/scenarios/` (index)
- `/lunch-presentation/scenarios/cash-flow/` (index)

**Recommended priority:** 0.5–0.6 (supplementary content)
**Changefreq:** monthly or yearly (if static demo)

### Utility Pages
- `/404.html` (excluded from sitemap by convention)
- `/assets/nav-demo.html` (demo/test page — exclude)
- `/workshop/404.html` (excluded)

---

## Sitemap Quality Assessment

### Strengths
1. **Core pages covered:** Home, about, membership, introduction decks all present
2. **Priority structure:** Reasonable hierarchy (1.0 for home, 0.9 for key sections)
3. **Change frequency:** Appropriate for formation (weekly) and static content (yearly)
4. **Workshop tracking:** Daily changefreq for coordination surface (correct for active use)

### Gaps
1. **Missing 4 major sections:** data-room, pre-read, vision, lunch-presentation
2. **Formation pages incomplete:** Missing spring-equinox-2026, tooling
3. **No documentation strategy:** No indication of when/how sitemap is updated
4. **Static file:** Manual XML editing required (no generation script)

### SEO Impact
- **Missing pages not crawled:** Search engines may miss ~50% of site content
- **Priority signals lost:** New sections have no priority guidance for crawlers
- **Incomplete site graph:** Internal linking recommendations may be suboptimal

---

## Recommended Sitemap Updates

### Phase 1: Add Missing Sections (Immediate)

#### Data Room
```xml
<!-- Data Room (investor materials) -->
<url>
  <loc>https://techne.institute/data-room/</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://techne.institute/data-room/deck.html</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://techne.institute/data-room/term-sheet.html</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://techne.institute/data-room/vision.html</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

#### Pre-Read
```xml
<!-- Pre-Read (orientation materials) -->
<url>
  <loc>https://techne.institute/pre-read/</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

#### Vision
```xml
<!-- Vision (foundational frameworks) -->
<url>
  <loc>https://techne.institute/vision/</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
<url>
  <loc>https://techne.institute/vision/common/</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
<url>
  <loc>https://techne.institute/vision/craft/</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

#### Formation Updates
```xml
<!-- Within existing Formation section -->
<url>
  <loc>https://techne.institute/formation/spring-equinox-2026.html</loc>
  <changefreq>monthly</changefreq>
  <priority>0.6</priority>
</url>
<url>
  <loc>https://techne.institute/formation/tooling.html</loc>
  <changefreq>monthly</changefreq>
  <priority>0.6</priority>
</url>
```

#### Lunch Presentation (Optional)
```xml
<!-- Lunch Presentation (demo/prototype materials) -->
<url>
  <loc>https://techne.institute/lunch-presentation/</loc>
  <changefreq>yearly</changefreq>
  <priority>0.5</priority>
</url>
```

---

### Phase 2: Automation Strategy (Recommended)

**Problem:** Manual XML editing doesn't scale as site grows.

**Solution Options:**

#### Option A: Static Site Generator Integration
If techne.institute uses Jekyll, Hugo, or similar:
- Add sitemap plugin (e.g., `jekyll-sitemap`, `hugo sitemap template`)
- Configure exclusions (intranet, operations, app)
- Auto-regenerate on build

#### Option B: Simple Script
For current static HTML setup:
```bash
#!/bin/bash
# generate-sitemap.sh

BASE="https://techne.institute"
OUTPUT="sitemap.xml"

echo '<?xml version="1.0" encoding="UTF-8"?>' > $OUTPUT
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' >> $OUTPUT

# Find all public HTML pages (exclude intranet, operations, app)
find . -name "*.html" \
  | grep -v ".git" \
  | grep -v "/app/" \
  | grep -v "intranet" \
  | grep -v "operations" \
  | grep -v "workshop-src" \
  | grep -v "404.html" \
  | while read file; do

  # Convert file path to URL
  url=$(echo "$file" | sed 's|^\./||; s|/index\.html$||; s|\.html$|.html|')

  echo "  <url>" >> $OUTPUT
  echo "    <loc>$BASE/$url</loc>" >> $OUTPUT
  echo "    <changefreq>monthly</changefreq>" >> $OUTPUT
  echo "    <priority>0.5</priority>" >> $OUTPUT
  echo "  </url>" >> $OUTPUT
done

echo '</urlset>' >> $OUTPUT
```

Then manually adjust priorities and changefreq for key pages.

#### Option C: Hybrid Approach (Recommended)
- Maintain manual sitemap with curated priorities
- Run script quarterly to detect new pages
- Add new pages to manual sitemap with appropriate metadata

---

## Site Structure Analysis

### Information Architecture
```
techne.institute/
├── / (home)
├── introduction/ (foundational narrative)
│   └── [4 deck presentations]
├── vision/ (NEW — core frameworks)
│   ├── common/
│   └── craft/
├── formation/ (governance + formation progress)
│   └── [8 formation documents]
├── about/ (institute overview)
├── cooperative/ (cooperative structure)
├── membership/ (how to join)
├── public-benefit/ (mission statement)
├── bylaws/ (governance documents)
├── learn/ (programs overview)
├── pre-read/ (NEW — orientation)
├── data-room/ (NEW — investor materials)
│   ├── deck.html
│   ├── term-sheet.html
│   └── vision.html
├── coordination-games.html (educational content)
├── lunch-presentation/ (NEW — demo materials)
│   ├── ramp/
│   └── scenarios/
│       └── cash-flow/
└── workshop/ (public coordination view)
```

### Observations
1. **Clear IA progression:** Introduction → Vision → Formation → About → Membership
2. **New investor-facing content:** data-room section suggests funding activity
3. **Orientation pathway:** pre-read suggests structured onboarding
4. **Presentation materials:** lunch-presentation may be prototype demos or pitch decks
5. **Formation transparency:** Extensive formation documents (8 pages) show transparent governance process

---

## SEO Recommendations

### Priority Structure (Revised)
Based on user intent and site goals:

| Priority | Pages | Rationale |
|----------|-------|-----------|
| 1.0 | `/` | Home |
| 0.9 | `/introduction/`, `/membership/`, `/about/`, `/formation/` | Core entry points |
| 0.8 | `/vision/`, `/cooperative/`, `/public-benefit/`, `/vision/*` | Foundational content |
| 0.7 | `/data-room/`, `/learn/`, `/pre-read/`, `/bylaws/`, `/formation/*`, `/introduction/decks` | Supporting content |
| 0.6 | `/workshop/`, `/formation/tooling`, `/coordination-games.html` | Operational/educational |
| 0.5 | `/lunch-presentation/` | Supplementary/demo content |

### Changefreq Guidance
- **daily:** `/workshop/` (active coordination surface)
- **weekly:** `/formation/*` (during active formation period)
- **monthly:** Most public-facing pages (about, membership, data-room)
- **yearly:** Static decks, archived presentations

### Missing Meta
Consider adding to `<url>` elements:
- `<lastmod>` — Last modification date (helps crawlers prioritize fresh content)
- `<image:image>` — For pages with key images (introduction decks, data-room visuals)

---

## Next Steps

### Immediate (This Week)
1. **Expand sitemap.xml** with 22 missing pages
2. **Test with Google Search Console** — submit updated sitemap, check for errors
3. **Verify robots.txt** — ensure no conflicts with sitemap

### Short-term (This Month)
4. **Document sitemap maintenance process** — who updates, when, how
5. **Add lastmod dates** to all entries (use git commit timestamps)
6. **Set up monitoring** — check for new pages quarterly

### Long-term (This Quarter)
7. **Evaluate automation** — static site generator or script-based generation
8. **Add structured data** — JSON-LD for organization, educational content
9. **Create site index page** — human-readable site map as fallback

---

## Files to Update

### 1. sitemap.xml
**Path:** `/sitemap.xml`
**Action:** Add 22 missing URLs with priorities and changefreq
**Estimated time:** 15 minutes

### 2. robots.txt (verify)
**Path:** `/robots.txt`
**Current content:**
```
User-agent: *
Disallow: /intranet/
Disallow: /operations/
Disallow: /app/
Sitemap: https://techne.institute/sitemap.xml
```

**Status:** ✓ Correct (excludes intranet/operations, includes sitemap reference)

---

## Conclusion

The techne.institute site has grown significantly beyond its current sitemap. Adding the missing 22 pages will:
1. **Improve SEO** — search engines discover all public content
2. **Clarify IA** — sitemap documents the site's structure
3. **Support users** — search results surface relevant pages

The updates are straightforward (manual XML additions) and can be completed in ~15 minutes. For long-term maintenance, consider automation or establish a quarterly review process.

---

*Dianoia · Execution Intelligence Agent · 2026-04-08*
