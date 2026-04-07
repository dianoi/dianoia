# P228: Chinese (Mandarin) Localization — Complete Translation Infrastructure

**Sprint ID:** P228
**Proposer:** Dianoia
**Created:** 2026-03-16
**Complexity:** XL (Extra Large — multi-week implementation)
**Priority:** HIGH
**Layers:** [7] (View — user-facing presentation layer)

---

## Summary

Implement complete Chinese (Simplified Mandarin) localization for the co-op.us application, establishing a switchable language mode that translates all UI components, page content, error messages, and dynamic text. This includes installing i18n infrastructure (react-i18next), refactoring ~3,330 hardcoded strings, adding CJK font support, and translating all content to Simplified Chinese.

**Source:** Deep audit of co-op.us application and infrastructure (2026-03-16)

---

## Audit Findings

### Current State
- **No i18n infrastructure** — Clean slate for implementation
- **~3,330 translatable strings** across 127 pages, 100 components
- **379 TypeScript files** with inline hardcoded English text
- **204 template literals** with string concatenation requiring refactoring
- **Font stack lacks CJK support** — DM Sans is Latin-only

### Technical Readiness: 7/10

**Strengths:**
- ✅ Modern React 19 + TypeScript stack
- ✅ Clean component separation with lazy loading
- ✅ Centralized design tokens
- ✅ Configuration-driven UI elements
- ✅ Supabase edge function architecture supports localization

**Gaps:**
- ❌ No i18n library installed
- ❌ All strings hardcoded inline in JSX
- ❌ Template literals with embedded pluralization logic
- ❌ No CJK font in font stack
- ❌ Inconsistent date/time/number formatting

---

## Deliverables

### 1. i18n Infrastructure
- Install and configure react-i18next
- Set up locale directory structure (`app-src/src/i18n/locales/`)
- Create English baseline translations (extraction from current codebase)
- Add language switcher component (persistent across sessions)
- Configure lazy loading for translation bundles

### 2. Font Support
- Add Noto Sans SC (Simplified Chinese) to font stack
- Subset CJK font to common characters (~2000 chars → ~800KB)
- Implement conditional font loading (load only when Chinese active)
- Update Tailwind config for locale-aware typography

### 3. Component Refactoring
- Convert all hardcoded strings to translation keys
- Refactor 204 template literals to ICU MessageFormat
- Fix pluralization patterns (80 instances)
- Standardize date/time/number formatting
- Extract configuration-driven labels to translation files

### 4. Translation Content
- **Common strings** (~500): Navigation, footer, buttons, status indicators
- **Coordinate (Workshop) page** (~400): Sprint protocol, floor control, presence grid
- **Chain Explorer** (~350): Batch viewer, category labels, tree health
- **Enrollment flow** (~600): Progressive onboarding narrative, etymology tooltips
- **About pages** (~800): Conceptual explanations, governance, cooperative values
- **Forms & validation** (~400): Labels, placeholders, error messages
- **Toast notifications** (~150): Success/error/info messages
- **Remaining pages** (~1,130): Member directory, contribute, learn, patronage, etc.

### 5. Quality Assurance
- Layout testing with Chinese text (30-50% shorter than English)
- Responsive design verification across breakpoints
- Realtime update testing (protocol events, chat messages)
- Date/time formatting across timezones
- Playwright visual regression tests

### 6. Documentation
- i18n implementation guide for future contributors
- Translation workflow documentation
- Glossary of domain terms (Sprint, Workshop, Patronage, CLOUD, etc.)
- Cultural adaptation notes (e.g., PIE etymology → Chinese parallels)

---

## Implementation Approach

### Phase 1: Foundation (3-5 hours)
**Goal:** Establish i18n infrastructure and validate with pilot components

**Tasks:**
1. Install dependencies:
   ```bash
   npm install react-i18next i18next i18next-browser-languagedetector
   npm install -D @types/i18next i18next-scanner
   ```

2. Create directory structure:
   ```
   app-src/src/i18n/
   ├── config.ts                    # i18next initialization
   ├── hooks/
   │   └── useTranslate.ts          # Wrapper for t() + date/number formatting
   └── locales/
       ├── en/
       │   ├── common.json           # Navigation, footer, shared strings
       │   ├── errors.json           # Error messages, validation
       │   ├── coordinate.json       # Workshop page
       │   ├── chain.json            # Chain explorer
       │   ├── enrollment.json       # Enrollment flow
       │   └── ...
       └── zh/                       # Chinese (Simplified) translations
           ├── common.json
           ├── errors.json
           └── ...
   ```

3. Configure i18next with lazy loading:
   ```typescript
   // app-src/src/i18n/config.ts
   import i18n from 'i18next'
   import { initReactI18next } from 'react-i18next'
   import LanguageDetector from 'i18next-browser-languagedetector'

   i18n
     .use(LanguageDetector)
     .use(initReactI18next)
     .init({
       resources: {}, // Lazy load per namespace
       fallbackLng: 'en',
       defaultNS: 'common',
       interpolation: { escapeValue: false },
       detection: {
         order: ['localStorage', 'navigator'],
         caches: ['localStorage'],
       },
     })
   ```

4. Add language switcher component:
   ```tsx
   // LanguageSwitcher.tsx
   import { useTranslation } from 'react-i18next'

   export function LanguageSwitcher() {
     const { i18n } = useTranslation()

     return (
       <select
         value={i18n.language}
         onChange={(e) => i18n.changeLanguage(e.target.value)}
       >
         <option value="en">English</option>
         <option value="zh">中文</option>
       </select>
     )
   }
   ```

5. Pilot refactoring (Navigation + Footer):
   - Extract ~100 strings to `common.json`
   - Convert components to use `t()` function
   - Add Chinese translations
   - Test layout with longer Chinese strings

**Acceptance criteria:**
- [x] i18next configured and integrated
- [x] Language switcher functional
- [x] Navigation and Footer render in Chinese
- [x] Language preference persists across sessions
- [x] No layout breakage with Chinese text

---

### Phase 2: Core High-Traffic Pages (12-18 hours)
**Goal:** Translate the three most-visited pages with complex dynamic content

#### 2.1 Coordinate (Workshop) Page (6-8 hours)

**Scope:**
- `Coordinate.tsx` main component
- `CraftPresenceGrid.tsx` — agent presence cards
- `FloorControlPanel.tsx` — floor signal buttons
- `ProtocolHealthBar.tsx` — status indicators
- `ActiveSprintsDetailed.tsx` — sprint cards
- `ProtocolStream.tsx` — event log
- `WorkshopActivity.tsx` — chat messages

**Complex translations:**
- Protocol event rendering: `"Sprint claimed by {agent}"` → `"{agent} 认领了冲刺"`
- Presence status: `"{online} online · {total} known"` → `"{online} 在线 · 共 {total} 位"`
- Floor signals: `"request_floor"`, `"yield_floor"`, `"pass_floor"`
- Functional modes: `"code:verifying"` → `"代码：验证中"`

**Refactoring pattern:**
```tsx
// Before:
`${count} active sprint${count !== 1 ? 's' : ''}`

// After:
t('coordinate.activeSprintCount', { count })

// In zh/coordinate.json:
{
  "activeSprintCount": "{{count}} 个活跃的冲刺",
  "activeSprintCount_plural": "{{count}} 个活跃的冲刺"
}
```

**Acceptance criteria:**
- [x] All Coordinate page strings extracted to `coordinate.json`
- [x] Realtime updates render correctly in Chinese
- [x] Protocol events display proper Chinese formatting
- [x] Agent presence cards show correct status in Chinese
- [x] No layout breakage in 4-panel grid

#### 2.2 Chain Explorer (6-8 hours)

**Scope:**
- `ChainExplorer.tsx` main component
- `LeafCard.tsx` — contribution cards
- `BatchGrouping.tsx` — sunrise/sunset batching
- `CategoryFilter.tsx` — observation/idea/work/coordination/stewardship

**Complex translations:**
- Relative timestamps: `"5m ago"`, `"2h ago"`, `"just now"`
- Batch labels: `"Sunrise · Mar 15"`, `"Sunset · Mar 15"`
- Tree health: `"Tree Healthy"`, `"Tree Error"`, `"{leaves} leaves"`
- Category labels with color coding

**Date formatting:**
```typescript
// Before:
d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

// After:
t('chain.batchDate', {
  date: new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    day: 'numeric'
  }).format(d)
})
```

**Acceptance criteria:**
- [x] All Chain Explorer strings extracted to `chain.json`
- [x] Category labels translated with consistent terminology
- [x] Batch grouping renders Chinese date format (YYYY年MM月DD日)
- [x] Relative timestamps use Chinese grammar ("5分钟前")
- [x] Tree health indicator shows correct status

#### 2.3 Member Directory (4-6 hours)

**Scope:**
- `MemberDirectory.tsx` main component
- `MemberCard.tsx` — member profile cards
- `ExpertiseFilter.tsx` — skill filtering
- `StatusFilter.tsx` — online/offline/away

**Acceptance criteria:**
- [x] All Member Directory strings extracted
- [x] Expertise tags translated consistently
- [x] Status filters render in Chinese
- [x] Member count pluralization correct

---

### Phase 3: Enrollment Flow (12-18 hours)
**Goal:** Translate the progressive onboarding narrative

**Scope:**
- `Enrollment.tsx` — Progressive enrollment form
- `Arrival.tsx` — Welcome and dimension selection
- Etymology tooltips (e.g., PIE *gʰóstis → "guest")

**Special considerations:**

1. **Narrative prose** (~600 lines):
   - Break into translatable units (~200 keys)
   - Preserve philosophical tone
   - Adapt cultural references where needed

2. **Etymology tooltips:**
   - Current: Proto-Indo-European linguistic roots
   - Chinese adaptation: Add Chinese etymology parallels
   - Example: *gʰóstis → 客 (kè) "guest" from 宀 (roof) + 各 (each)

3. **Progressive reveal:**
   - Test animation timing with Chinese text
   - Verify mobile responsive behavior

**Acceptance criteria:**
- [x] Enrollment flow narrative translated
- [x] Etymology tooltips culturally adapted
- [x] Progressive reveal animations work with Chinese text
- [x] Mobile enrollment flow tested and verified

---

### Phase 4: Forms & Validation (8-12 hours)
**Goal:** Translate all form labels, placeholders, and error messages

**Scope:**
- Input labels and placeholders across all forms
- Inline validation messages
- Zod schema error messages
- Success/error toast notifications

**Zod integration:**
```typescript
// Before:
z.string().min(8, "Password must be at least 8 characters")

// After:
z.string().min(8, t('errors.passwordMinLength', { min: 8 }))
```

**Acceptance criteria:**
- [x] All form labels extracted to translation files
- [x] Validation error messages integrated with i18next
- [x] Toast notifications render in Chinese
- [x] Error messages include field names correctly

---

### Phase 5: About Pages & Documentation (10-15 hours)
**Goal:** Translate conceptual content and governance documentation

**Scope:**
- `About.tsx` — Introduction
- `AboutGovernance.tsx` — LCA structure
- `AboutPatronage.tsx` — FSC formula explanation
- `AboutContributions.tsx` — Contribution types
- `AboutDimensions.tsx` — Seven-dimension system
- `AboutCooperative.tsx` — Cooperative values
- `AboutWorkshop.tsx` — Agent coordination protocol

**Total prose:** ~2,500 lines across 7 about pages

**Domain vocabulary glossary:**

| English | Chinese | Notes |
|---------|---------|-------|
| Sprint | 冲刺 (chōngcì) | Agile terminology, widely understood |
| Workshop | 工作坊 (gōngzuòfāng) | Standard translation |
| Coordinate | 协调 (xiétiáo) | Verb form |
| Patronage | 赞助 (zànzhù) | Or 惠顾 (huìgù) — needs community input |
| CLOUD | CLOUD | Keep acronym, add Chinese explanation |
| Merkle tree | 默克尔树 (Mòkè'ěr shù) | Standard blockchain term |
| Agent | 代理 (dàilǐ) | Or 智能体 (zhìnéngtǐ) for AI agents |
| Contribution | 贡献 (gòngxiàn) | Standard term |
| Dimension | 维度 (wéidù) | Standard term |

**Acceptance criteria:**
- [x] All about page content translated
- [x] Domain vocabulary glossary finalized with community input
- [x] Conceptual explanations preserve philosophical depth
- [x] Links and cross-references maintained

---

### Phase 6: Remaining Pages (Long Tail) (20-30 hours)
**Goal:** Complete translation coverage across all remaining pages

**Scope:**
- Contribute page
- Learn hub
- Patronage dashboards (SwarmViz, EconomicsOverview)
- Settings and profile
- Error pages (404, 500)
- Moderation tools
- ~100+ remaining pages

**Batch refactoring strategy:**
1. Group pages by feature domain
2. Extract strings to shared namespaces where possible
3. Use i18next-scanner to auto-detect new keys
4. Parallelize translation work

**Acceptance criteria:**
- [x] 100% page coverage translated
- [x] No missing translation keys (fallback to English = bug)
- [x] Consistent terminology across all pages
- [x] Layout verified across all breakpoints

---

### Phase 7: Font Support & Performance (6-10 hours)
**Goal:** Optimize CJK font loading and bundle size

**Tasks:**

1. **Add Noto Sans SC to font stack:**
   ```html
   <!-- index.html -->
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
   ```

2. **Update CSS font stack:**
   ```css
   font-family: 'DM Sans', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
   ```

3. **Conditional font loading:**
   ```typescript
   // Only load CJK font when Chinese active
   if (i18n.language === 'zh') {
     const link = document.createElement('link')
     link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap'
     link.rel = 'stylesheet'
     document.head.appendChild(link)
   }
   ```

4. **Font subsetting (advanced):**
   - Use `pyftsubset` (fonttools) to create subset with common 2000 Chinese characters
   - Reduces font size from ~4MB to ~800KB
   - Trade-off: Some rare characters may not render

5. **Bundle size optimization:**
   - Lazy load translation bundles per route
   - Split large namespaces (e.g., `about.json` → `about-governance.json`, `about-patronage.json`)
   - Measure before/after bundle size impact

**Acceptance criteria:**
- [x] Noto Sans SC loads correctly for Chinese locale
- [x] Font does not load for English locale (performance)
- [x] All Chinese characters render with correct font
- [x] Bundle size increase < 100KB (excluding font)
- [x] Font subset contains all necessary characters

---

### Phase 8: Quality Assurance (10-15 hours)
**Goal:** Comprehensive testing and layout verification

**Testing checklist:**

1. **Layout testing:**
   - [ ] All pages tested at 320px, 768px, 1024px, 1920px widths
   - [ ] No text overflow or truncation
   - [ ] Button text fits within button bounds
   - [ ] Multi-column layouts adjust correctly
   - [ ] Modal dialogs render properly

2. **Functional testing:**
   - [ ] Language switcher persists preference
   - [ ] Realtime updates (Workshop) render in correct language
   - [ ] Form validation shows Chinese error messages
   - [ ] Toast notifications appear in Chinese
   - [ ] Date/time formatting correct for Chinese locale
   - [ ] Number formatting uses Chinese separators

3. **Dynamic content:**
   - [ ] Pluralization works correctly (ICU MessageFormat)
   - [ ] Relative timestamps update in real-time
   - [ ] Protocol events render with correct grammar
   - [ ] User-generated content (contributions, chat) displays alongside UI

4. **Edge cases:**
   - [ ] Missing translation key → fallback to English (no blank strings)
   - [ ] Long Chinese strings wrap correctly
   - [ ] Tooltips position correctly with Chinese text
   - [ ] Dropdown menus fit Chinese labels

5. **Visual regression:**
   - [ ] Playwright screenshot tests for key pages
   - [ ] Before/after comparison for layout changes
   - [ ] Responsive design verification

**Acceptance criteria:**
- [x] Zero layout breakage detected
- [x] Zero missing translation keys
- [x] All functional tests pass
- [x] Playwright visual regression suite green
- [x] Performance budget maintained (Lighthouse score)

---

## Technical Specifications

### i18next Configuration

```typescript
// app-src/src/i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Lazy load translation bundles
const loadNamespace = async (lng: string, ns: string) => {
  const module = await import(`./locales/${lng}/${ns}.json`)
  return module.default
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: await import('./locales/en/common.json'),
      },
      zh: {
        common: await import('./locales/zh/common.json'),
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'coordinate', 'chain', 'enrollment', 'errors'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: true, // Works with lazy loading
    },
  })

export default i18n
```

### Translation File Structure

```json
// app-src/src/i18n/locales/zh/coordinate.json
{
  "title": "工作坊协调",
  "subtitle": "代理对代理协议 · co-op.us",
  "activeSprintCount": "{{count}} 个活跃的冲刺",
  "activeSprintCount_plural": "{{count}} 个活跃的冲刺",
  "presenceStatus": "{{online}} 在线 · 共 {{total}} 位",
  "floorControl": {
    "request": "请求发言",
    "yield": "让出发言",
    "pass": "传递发言",
    "building": "基于...发言"
  },
  "sprintStatus": {
    "proposed": "已提议",
    "claimed": "已认领",
    "in_progress": "进行中",
    "completed": "已完成"
  }
}
```

### Date/Time Formatting

```typescript
// app-src/src/i18n/hooks/useTranslate.ts
import { useTranslation } from 'react-i18next'

export function useTranslate() {
  const { t, i18n } = useTranslation()

  const tDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(i18n.language, options).format(date)
  }

  const tNumber = (num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(num)
  }

  const tRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return t('time.justNow')
    if (diffMin < 60) return t('time.minutesAgo', { count: diffMin })
    if (diffMin < 1440) return t('time.hoursAgo', { count: Math.floor(diffMin / 60) })
    return t('time.daysAgo', { count: Math.floor(diffMin / 1440) })
  }

  return { t, tDate, tNumber, tRelativeTime }
}
```

### Pluralization with ICU MessageFormat

```json
// app-src/src/i18n/locales/zh/time.json
{
  "justNow": "刚刚",
  "minutesAgo": "{{count}} 分钟前",
  "minutesAgo_plural": "{{count}} 分钟前",
  "hoursAgo": "{{count}} 小时前",
  "hoursAgo_plural": "{{count}} 小时前",
  "daysAgo": "{{count}} 天前",
  "daysAgo_plural": "{{count}} 天前"
}
```

**Note:** Chinese does not have distinct plural forms, but ICU MessageFormat still requires `_plural` keys for consistency.

---

## Open Questions for Steward Review

1. **Translation quality approach:**
   - [ ] Professional translation service (~$2,000-4,000 for ~20,000 words)?
   - [ ] Community-driven translation (slower but authentic domain vocabulary)?
   - [ ] Hybrid (professional baseline + community refinement)?

2. **Target dialect:**
   - [ ] Simplified Chinese (zh-CN) for Mainland China?
   - [ ] Traditional Chinese (zh-TW) for Taiwan/Hong Kong?
   - [ ] Both? (Would require separate translation sets)

3. **Domain vocabulary:**
   - [ ] "Patronage" → 赞助 (zànzhù) or 惠顾 (huìgù)?
   - [ ] "Agent" → 代理 (dàilǐ) or 智能体 (zhìnéngtǐ)?
   - [ ] "Workshop" → 工作坊 (gōngzuòfāng) or 研讨会 (yántǎohuì)?
   - Community input recommended for these core terms

4. **Language switcher placement:**
   - [ ] Global navigation header?
   - [ ] Footer?
   - [ ] User profile settings?
   - [ ] All of the above?

5. **Cultural adaptation:**
   - [ ] Etymology tooltips: Keep PIE roots or add Chinese parallels?
   - [ ] Enrollment narrative: Preserve Western philosophical framing or adapt for Chinese context?

6. **Performance budget:**
   - [ ] Acceptable bundle size increase?
   - [ ] Lazy load Chinese fonts (slower initial render) or preload (larger bundle)?
   - [ ] Font subsetting to 2000 common characters (trade-off: rare characters missing)?

7. **SEO considerations (GitHub Pages limitation):**
   - [ ] Locale parameter (`?lang=zh`)?
   - [ ] Separate routes (`/zh/coordinate`)?
   - [ ] Note: GitHub Pages serves static HTML, limited SSR options

---

## Resource Estimation

### Developer Hours

| Phase | Hours | Notes |
|-------|-------|-------|
| 1. Foundation | 3-5 | i18next setup + pilot refactoring |
| 2. Core Pages | 12-18 | Coordinate, Chain Explorer, Member Directory |
| 3. Enrollment Flow | 12-18 | Narrative prose + cultural adaptation |
| 4. Forms & Validation | 8-12 | All forms + Zod integration |
| 5. About Pages | 10-15 | ~2,500 lines of conceptual content |
| 6. Remaining Pages | 20-30 | ~100+ pages, batch refactoring |
| 7. Font Support | 6-10 | Noto Sans SC + conditional loading |
| 8. QA & Testing | 10-15 | Layout testing, visual regression |
| **Total** | **81-123 hours** | **2-3 weeks for one developer** |

### Professional Translation Budget (Optional)

- **Word count:** ~20,000 words (estimated from ~3,330 strings × avg 6 words)
- **Rate:** $0.10-0.20/word (professional technical translation)
- **Total:** $2,000-4,000

**Recommendation:** If budget allows, hire professional translation service to parallelize translation work while developer focuses on refactoring. This reduces timeline from 3 weeks to 2 weeks.

### Infrastructure Costs

- **Noto Sans SC font:** Free (Google Fonts)
- **Translation management platform:** $0-49/month (Lokalise free tier supports small projects)
- **Supabase bandwidth:** Negligible increase (translation files are JSON, ~100KB)

---

## Success Criteria

1. **Functional:**
   - [x] Language switcher allows toggle between English and Chinese
   - [x] Language preference persists across sessions
   - [x] 100% of UI strings translated (zero hardcoded English)
   - [x] Dynamic content (protocol events, timestamps) renders correctly in Chinese

2. **Quality:**
   - [x] Zero layout breakage across all pages
   - [x] Chinese text renders with correct CJK font (Noto Sans SC)
   - [x] Consistent domain vocabulary across all pages
   - [x] Date/time formatting follows Chinese locale conventions

3. **Performance:**
   - [x] Bundle size increase < 100KB (excluding font)
   - [x] CJK font loads conditionally (not for English users)
   - [x] Lighthouse performance score maintained (>90)

4. **Maintainability:**
   - [x] i18next-scanner configured to detect missing keys
   - [x] CI check fails on missing translations
   - [x] Translation workflow documented for future languages
   - [x] Glossary established for domain terms

---

## Risks & Mitigation

### Risk 1: Layout Breakage
**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Chinese text is typically 30-50% shorter than English
- Add min-width constraints to buttons
- Test all pages at multiple breakpoints
- Playwright visual regression tests

### Risk 2: Domain Vocabulary Confusion
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:**
- Create glossary early and get community input
- Use consistent terminology across all pages
- Add contextual tooltips for technical terms
- Consider keeping some English terms (e.g., "CLOUD", "Sprint")

### Risk 3: Cultural Context Loss
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:**
- Enrollment flow uses PIE etymology — may not resonate in Chinese
- Option 1: Keep English etymology as educational content
- Option 2: Add Chinese etymological parallels (e.g., 礼 lǐ for reciprocity)
- Consult with Chinese-speaking community members

### Risk 4: Translation Quality
**Likelihood:** Low (if professional service used)
**Impact:** High
**Mitigation:**
- Use professional translation service with technical expertise
- Have native Chinese speaker review for naturalness
- Community review period before launch
- Allow user-submitted corrections

### Risk 5: Performance Regression
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Lazy load translation bundles per route
- Conditionally load CJK font
- Font subsetting to reduce file size
- Monitor Lighthouse scores during development

### Risk 6: Maintenance Burden
**Likelihood:** High
**Impact:** Medium
**Mitigation:**
- Set up i18next-scanner to auto-detect new keys
- CI check for missing translations
- Clear contribution guidelines for adding new strings
- Translation platform (Lokalise) for non-developer contributions

---

## Dependencies

### External
- react-i18next (MIT license)
- i18next (MIT license)
- i18next-browser-languagedetector (MIT license)
- i18next-scanner (MIT license, dev dependency)
- Noto Sans SC font (SIL Open Font License)

### Internal
- None (self-contained sprint)

### Blocking
- None (can start immediately)

### Blocked By
- Professional translation service (if chosen) — 5-10 day turnaround

---

## Reference URLs

- **Repository:** https://github.com/Roots-Trust-LCA/co-op.us
- **Deployment:** https://co-op.us
- **Audit report:** `/workspace/group/dianoia/P228-chinese-localization-audit.md`
- **react-i18next docs:** https://react.i18next.com/
- **ICU MessageFormat:** https://unicode-org.github.io/icu/userguide/format_parse/messages/
- **Noto Sans SC:** https://fonts.google.com/noto/specimen/Noto+Sans+SC

---

## Capability Requirements

- `i18n` — Internationalization infrastructure
- `react` — Component refactoring
- `typescript` — Type-safe translation keys
- `ui-design` — Layout testing and responsive verification
- `translation` — Chinese (Simplified) language expertise
- `qa` — Visual regression testing

---

## Proposed Roles

- **dia** — Implementer (i18n infrastructure, component refactoring, QA)
- **nou** — Reviewer (architectural decisions, cultural adaptation)
- **translation-service** — Professional Chinese translation (optional)
- **community** — Domain vocabulary review and cultural adaptation feedback

---

## Retrospective Template

**What went well:**
- [To be filled after completion]

**What to change:**
- [To be filled after completion]

**Patterns to carry forward:**
- [To be filled after completion]

**What we learned about localization:**
- [To be filled after completion]

---

*Sprint proposal compiled by Dianoia — 2026-03-16*
*Based on comprehensive audit of co-op.us application and infrastructure*
*Estimated timeline: 2-3 weeks (one developer + optional professional translation)*
