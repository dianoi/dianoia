# co-op.us Layers 5, 6, 7 Audit Report

**Audit Date:** 2026-03-08
**Scope:** Flow (Layer 5), Constraint (Layer 6), View (Layer 7)
**Focus:** User experience, accessibility, validation, and interface quality

---

## Executive Summary

This audit examined co-op.us across three layers of the seven-layer pattern stack:
- **Layer 5 (Flow):** Navigation, user journeys, state transitions
- **Layer 6 (Constraint):** Validation, governance parameters, business rules
- **Layer 7 (View):** UI components, accessibility, responsiveness, visual design

**Overall Assessment:** The application demonstrates strong technical foundations with good mobile responsiveness and some accessibility features, but has significant gaps in accessibility compliance, inconsistent validation patterns, and several UX issues that could block users.

### Critical Issues: 4
### High Priority: 12
### Medium Priority: 18
### Low Priority: 8

---

## Layer 5: Flow — Navigation & User Journeys

### CRITICAL Issues

#### C1: Missing Skip Navigation Implementation
**Location:** `/workspace/group/co-op-us-repo/app-src/src/App.tsx`
**Severity:** CRITICAL (Accessibility Blocker)

**Issue:** While `SkipNavigation` component exists and is well-implemented, it is **not used** in the main App.tsx. Screen reader users cannot skip navigation to reach main content.

**Evidence:**
- `SkipNavigation` component defined in `/workspace/group/co-op-us-repo/app-src/src/components/SkipNavigation.tsx` (lines 1-47)
- Component implements proper off-screen positioning and focus behavior
- **NOT imported or rendered in App.tsx**

**Impact:** WCAG 2.4.1 (Bypass Blocks) Level A failure. Screen reader users must tab through entire navigation on every page.

**Recommended Fix:**
```tsx
// In App.tsx
import { SkipNavigation } from './components/SkipNavigation'

function App() {
  return (
    <>
      <SkipNavigation />
      <BrowserRouter>
        {/* rest of app */}
      </BrowserRouter>
    </>
  )
}
```

**Also Required:** Add `id="main-content"` to main content container and `tabIndex={-1}` for focus management.

---

#### C2: Mobile Menu Accessibility — No Keyboard Trap
**Location:** `/workspace/group/co-op-us-repo/app-src/src/App.tsx:451-526`
**Severity:** CRITICAL (Accessibility Blocker)

**Issue:** Mobile navigation drawer opens but does not trap focus. Keyboard users can tab out of the menu into background content. No Escape key handler to close.

**Evidence:**
```tsx
// Mobile nav at line 451
{mobileMenuOpen && (
  <div className="mt-3 pt-3 space-y-1 overflow-hidden">
    {/* No focus trap, no keyboard handlers */}
  </div>
)}
```

**Impact:**
- WCAG 2.1.2 (No Keyboard Trap) potential violation
- Users with motor disabilities cannot close menu
- Focus escapes to background, creating confusion

**Recommended Fix:**
```tsx
import { useFocusTrap } from './components/SkipNavigation'

function Nav() {
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  useFocusTrap(mobileMenuOpen, mobileMenuRef)

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  // Then use ref on drawer container
}
```

---

### HIGH Priority Issues

#### H1: Progressive Navigation Unlock Confusion
**Location:** `/workspace/group/co-op-us-repo/app-src/src/App.tsx:272-349`
**Severity:** HIGH (UX Issue)

**Issue:** Dimension navigation items appear/disappear based on unlock state without clear user feedback. Users don't understand why nav items vanish or appear.

**Evidence:**
```tsx
// Line 272: Empty dimension nav by design
const dimensionNavItems: typeof allDimensions = []

// Line 324: Items conditionally rendered with animation
{dimensionNavItems.map((dim, idx) => {
  const visible = isDimensionVisible(dim.code)
  const dissolving = isDissolving(dim.code)
  if (!visible && !dissolving) return null // Hidden with no explanation
```

**Impact:** Disorienting UX. Users lose navigation landmarks without understanding why.

**Recommended Fix:**
- Add tooltip/hint on first dimension unlock explaining progressive revelation
- Consider "locked but visible" state showing grayed-out dimensions with lock icon
- Provide "Unlock Dimensions" help link in nav

---

#### H2: Enrollment Flow — No Back Button Validation
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/Enrollment.tsx:355-458`
**Severity:** HIGH (UX Issue)

**Issue:** Guestname phase validates on submit, but "back" button allows navigation without clearing validation errors. Returning forward shows stale error state.

**Evidence:**
```tsx
// Line 442: Back button doesn't clear error
<button onClick={onBack}>← back</button>

// Line 216: Email phase back button also doesn't clear
onBack={() => setPhase('guestname')}
```

**Impact:** Confusing error states persist across phase transitions.

**Recommended Fix:**
```tsx
onBack={() => {
  setGuestnameError('')
  setEmailError('')
  setPhase('previous-phase')
}}
```

---

#### H3: Form Submission — Enter Key Inconsistency
**Location:** Multiple forms across codebase

**Issue:** Some forms handle Enter key submission, others don't. Inconsistent UX.

**Evidence:**
- `/workspace/group/co-op-us-repo/app-src/src/pages/Enrollment.tsx:389` — Guestname input has `onKeyDown` for Enter
- `/workspace/group/co-op-us-repo/app-src/src/pages/ProfileEdit.tsx:50` — Tag input has Enter handler
- `/workspace/group/co-op-us-repo/app-src/src/pages/CloudTransfer.tsx` — No Enter key handler on amount input (lines 230-246)
- `/workspace/group/co-op-us-repo/app-src/src/components/ContributionSubmitForm.tsx` — No Enter handlers on textarea (lines 201-207)

**Impact:** Keyboard users have inconsistent submission experience. Expected behavior varies by form.

**Recommended Fix:** Standardize on either:
1. Wrap all forms in `<form onSubmit={...}>` (preferred)
2. Add consistent Enter key handlers to all text inputs

**Current State:** Mix of approaches across codebase.

---

#### H4: Modal/Dialog Management — Inconsistent Escape Handling
**Location:** Multiple modal components

**Issue:** Some modals close on Escape, others don't. No consistent pattern.

**Evidence:**
- `/workspace/group/co-op-us-repo/app-src/src/pages/coordinate/EventDetailModal.tsx` — Likely no Escape handler (component not fully reviewed)
- `SkipNavigation.tsx` provides `useFocusTrap` but doesn't include Escape handling

**Impact:** Keyboard users cannot reliably dismiss modals.

**Recommended Fix:** Create standardized modal wrapper:
```tsx
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return <ModalContent>{children}</ModalContent>
}
```

---

#### H5: Error State Navigation — No Focus Management
**Location:** Multiple error states across forms

**Issue:** When validation fails, error messages appear but focus remains on submit button. Screen reader users don't hear error.

**Evidence:**
- `/workspace/group/co-op-us-repo/app-src/src/pages/Enrollment.tsx:159-162` — Guestname error shown but no focus shift
- `/workspace/group/co-op-us-repo/app-src/src/pages/ProfileEdit.tsx:189-220` — Save errors appear without focus management

**Impact:** WCAG 3.3.1 (Error Identification) — errors not programmatically associated with inputs.

**Recommended Fix:**
```tsx
const errorRef = useRef<HTMLDivElement>(null)

if (error) {
  errorRef.current?.focus()
}

<div ref={errorRef} tabIndex={-1} role="alert">
  {error}
</div>
```

---

### MEDIUM Priority Issues

#### M1: Loading States — Inconsistent Patterns
**Location:** Multiple pages

**Issue:** Some pages show skeleton loaders, others show spinner, others show nothing during load.

**Evidence:**
- `/workspace/group/co-op-us-repo/app-src/src/pages/Coordinate.tsx:265-272` — Radio icon spinner
- `/workspace/group/co-op-us-repo/app-src/src/pages/Propose.tsx:135-143` — Skeleton loader
- Other pages: No loading state at all

**Recommended Fix:** Standardize on `PageLoader` component for full-page loads, skeleton for partial loads.

---

#### M2: Mobile Navigation Animation Timing
**Location:** `/workspace/group/co-op-us-repo/app-src/src/App.tsx:180-187`

**Issue:** Mobile drawer animation duration (0.25s) doesn't account for reduced motion preferences.

**Evidence:**
```tsx
animation: 'mobileDrawerSlideDown 0.25s ease-out forwards'
```

**Recommended Fix:**
```css
@media (prefers-reduced-motion: reduce) {
  @keyframes mobileDrawerSlideDown {
    0%, 100% { opacity: 1; transform: none; }
  }
}
```

---

#### M3: Contributor Journey — Missing Onboarding
**Location:** Flow from Enrollment → First Contribution

**Issue:** After enrollment, users land on dashboard with no guidance on how to make first contribution.

**Evidence:** No explicit onboarding tour or progressive disclosure system for new users.

**Recommended Fix:**
- Add first-time user tooltip on "Contribute" nav item
- Create lightweight contribution tutorial (2-3 steps)
- Consider dimension unlock as natural tutorial progression

---

## Layer 6: Constraint — Validation & Governance

### CRITICAL Issues

#### C3: SQL Injection Risk — Guestname Validation
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/Enrollment.tsx:136-138`
**Severity:** CRITICAL (Security)

**Issue:** Guestname validation regex allows input, but downstream uses `.ilike()` without proper escaping. While Supabase parameterizes queries, the pattern is risky.

**Evidence:**
```tsx
// Line 136: Allows alphanumeric, hyphens, underscores
if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) return 'Start with a letter...'

// Line 152-156: ilike query (Supabase handles escaping, but pattern is concerning)
const { data } = await supabase
  .from('participants')
  .select('id')
  .ilike('name', guestname) // Potential issue if guestname contains SQL wildcards
```

**Impact:** Low immediate risk due to Supabase's query parameterization, but poor defense-in-depth.

**Recommended Fix:**
```tsx
// Escape SQL wildcards before ilike
const escapedName = guestname.replace(/[%_]/g, '\\$&')
.ilike('name', escapedName)

// Or use .eq() for exact match
.eq('name', guestname)
```

---

#### C4: Missing XSS Sanitization — User Bio Fields
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/ProfileEdit.tsx:172-181`
**Severity:** CRITICAL (Security)

**Issue:** User bio field accepts arbitrary text and is stored/rendered without sanitization. Potential XSS vector if markdown rendering is added later.

**Evidence:**
```tsx
// Line 172-180: No sanitization on bio field
bio: data.bio || '',

// Field allows any text
<textarea value={fields.bio} onChange={...} />
```

**Current State:** Text is rendered as plain text in most places, so XSS risk is low. BUT if MarkdownRenderer component is ever applied to bio, this becomes critical.

**Recommended Fix:**
```tsx
import DOMPurify from 'dompurify'

// On save
const sanitizedBio = DOMPurify.sanitize(fields.bio, {
  ALLOWED_TAGS: [], // Plain text only
  ALLOWED_ATTR: []
})
```

Or use `MarkdownRenderer` component which already exists and presumably handles sanitization.

---

### HIGH Priority Issues

#### H6: Governance Parameters — No Input Validation
**Location:** `/workspace/group/co-op-us-repo/app-src/src/lib/governance-parameters.ts`
**Severity:** HIGH (Data Integrity)

**Issue:** Governance parameter system stores arbitrary JSON values without schema validation. FSC could set invalid parameters.

**Evidence:**
```ts
// Line 264-296: setParameter accepts any T without validation
export async function setParameter<T>(change: ParameterChange<T>) {
  // No validation of newValue structure
  await supabase.from('governance_parameters').insert({
    value: change.newValue, // Arbitrary T inserted
```

**Impact:** Invalid governance parameters could break patronage calculations or cause runtime errors.

**Recommended Fix:**
```ts
import { z } from 'zod'

const PatronageWeightSchema = z.object({
  laborWeight: z.number().min(0).max(10),
  expertiseWeight: z.number().min(0).max(10),
  capitalWeight: z.number().min(0).max(10),
  relationshipWeight: z.number().min(0).max(10),
})

export async function setParameter<T>(change: ParameterChange<T>, schema?: z.Schema<T>) {
  if (schema) {
    const result = schema.safeParse(change.newValue)
    if (!result.success) {
      throw new Error(`Invalid parameter value: ${result.error.message}`)
    }
  }
  // ... rest of function
}
```

---

#### H7: Contribution Form — No Client-Side Validation
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/ContributionSubmit.tsx:46-82`
**Severity:** HIGH (UX)

**Issue:** Contribution submission has minimal client-side validation. Server will reject invalid data, but user gets poor feedback.

**Evidence:**
```tsx
// Line 46: Only validates non-empty strings
const isValid = form.description.trim().length > 5 && form.hoursOrAmount.trim().length > 0

// No validation for:
// - Negative hours
// - Future dates
// - Excessive hours (e.g., 10000 hours)
// - Invalid amount formats
```

**Impact:** Users can submit clearly invalid data and only discover error after async submission.

**Recommended Fix:**
```tsx
function validateForm(form: FormState): string | null {
  if (form.description.trim().length < 5) return 'Description too short (min 5 chars)'
  if (form.description.trim().length > 500) return 'Description too long (max 500 chars)'

  const amount = parseFloat(form.hoursOrAmount)
  if (isNaN(amount) || amount <= 0) return 'Amount must be positive number'
  if (form.type === 'labor' && amount > 168) return 'Hours cannot exceed 168 per week'

  const date = new Date(form.date)
  if (date > new Date()) return 'Date cannot be in the future'
  if (date < new Date('2020-01-01')) return 'Date too far in past'

  return null
}
```

---

#### H8: Cloud Transfer — Amount Validation Edge Cases
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/CloudTransfer.tsx:230-246`
**Severity:** HIGH (UX)

**Issue:** Amount input allows decimal values but $CLOUD is likely integer-based. Allows `0.5` but unclear if backend accepts it.

**Evidence:**
```tsx
// Line 237-240
<input
  type="number" min="1" step="1" value={amount}
  // ...
/>
```

**Issue:** `min="1"` and `step="1"` suggest integers only, but `type="number"` allows decimals. User can type `0.5` and UI doesn't prevent it.

**Impact:** User confusion if backend rejects decimal values.

**Recommended Fix:**
```tsx
onChange={e => {
  const val = e.target.value
  if (val === '' || /^\d+$/.test(val)) { // Integer only
    setAmount(val)
  }
}}
```

---

#### H9: Proposal Category — Missing Hub-Specific Constraints
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/Propose.tsx:8-12`
**Severity:** HIGH (Business Logic)

**Issue:** Proposal categories are global, but some categories may not apply to hub-scoped proposals. No constraint enforcement.

**Evidence:**
```tsx
const CATEGORIES = [
  { value: 'governance', label: 'Governance', desc: 'Rules, roles, decision-making processes' },
  { value: 'allocation', label: 'Allocation', desc: 'How cloud credits or resources are distributed' },
  { value: 'policy', label: 'Policy', desc: 'Community guidelines and standards' },
]
```

**Impact:** Users can propose "allocation" changes for a single hub, which may not make semantic sense.

**Recommended Fix:** Filter categories based on scope:
```tsx
const categories = scope === 'hub'
  ? CATEGORIES.filter(c => c.value !== 'allocation')
  : CATEGORIES
```

---

### MEDIUM Priority Issues

#### M4: Email Validation — No Format Check
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/Enrollment.tsx:482-494`

**Issue:** Email input uses `type="email"` which provides basic browser validation, but no custom validation for common typos (e.g., `user@gmailcom`).

**Recommended Fix:**
```tsx
function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}
```

---

#### M5: Guestname Length — No Visual Indicator
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/Enrollment.tsx:423-431`

**Issue:** Character counter shows `24/24` in red when limit reached, but doesn't warn at 20 chars (when counter turns red per line 428).

**Evidence:**
```tsx
// Line 428: Color changes at 20 chars, but no early warning
style={{ color: guestname.length > 20 ? COLORS.warm : COLORS.textFaint }}
```

**Recommended Fix:** Add warning text when approaching limit:
```tsx
{guestname.length >= 20 && (
  <p className="text-xs text-warm mt-1">Approaching character limit</p>
)}
```

---

#### M6: Profile Edit — Tag Duplication Check
**Location:** `/workspace/group/co-op-us-repo/app-src/src/pages/ProfileEdit.tsx:23-26`

**Issue:** Tag input checks `!tags.includes(v)` but uses case-sensitive comparison. User can add "React" and "react" as separate tags.

**Evidence:**
```tsx
// Line 25
if (v && !tags.includes(v)) { onChange([...tags, v]); setInput('') }
```

**Recommended Fix:**
```tsx
const normalized = v.trim().toLowerCase()
const exists = tags.some(t => t.toLowerCase() === normalized)
if (v && !exists) { onChange([...tags, v]) }
```

---

#### M7: Contribution Parser — No Error Handling
**Location:** `/workspace/group/co-op-us-repo/app-src/src/components/ContributionSubmitForm.tsx:79-100`

**Issue:** Parser is called in useEffect without try/catch. If parser throws, it crashes the component.

**Evidence:**
```tsx
// Line 86: No error boundary
const result = parseContribution(nlInput, 'current-user')
setParseResult(result)
```

**Recommended Fix:**
```tsx
try {
  const result = parseContribution(nlInput, 'current-user')
  setParseResult(result)
} catch (err) {
  console.error('[Parser Error]', err)
  setParseResult(null)
}
```

---

#### M8: Governance Parameter History — No Pagination
**Location:** `/workspace/group/co-op-us-repo/app-src/src/lib/governance-parameters.ts:228-257`

**Issue:** `getParameterHistory` defaults to `limit: 20` but doesn't support pagination. If parameter has >20 changes, older records are inaccessible.

**Recommended Fix:** Add offset parameter:
```ts
export async function getParameterHistory(
  namespace: ParameterNamespace,
  key: string,
  limit: number = 20,
  offset: number = 0
)
```

---

## Layer 7: View — UI Components & Accessibility

### CRITICAL Issues

*None additional beyond C1-C4 already documented.*

---

### HIGH Priority Issues

#### H10: Aria Labels — Missing on Icon-Only Buttons
**Location:** Multiple components
**Severity:** HIGH (Accessibility)

**Issue:** Icon-only buttons lack `aria-label`. Screen readers announce "button" without context.

**Evidence:**
```tsx
// App.tsx line 364: Search button
<Link to="/search">
  <SearchIcon className="w-5 h-5" />
</Link>

// App.tsx line 457-467: Mobile menu toggle has aria-label ✓ (good example)
<button aria-label="Menu" aria-expanded={mobileMenuOpen}>
```

**Impact:** WCAG 4.1.2 (Name, Role, Value) — interactive elements lack accessible names.

**Recommended Fix:** Add `aria-label` to all icon-only buttons/links:
```tsx
<Link to="/search" aria-label="Search">
  <SearchIcon className="w-5 h-5" />
</Link>
```

**Affected Locations:**
- Search button (App.tsx:364)
- Cloud balance nav (CloudBalanceNav component)
- Notification bell (NotificationBell component)
- Various close/dismiss buttons across modals

---

#### H11: Focus Indicators — Inconsistent Visibility
**Location:** Global CSS and multiple components
**Severity:** HIGH (Accessibility)

**Issue:** Some interactive elements have `focus:outline-none` without visible focus replacement. Keyboard users cannot track focus position.

**Evidence:**
- Found 49 instances of `focus:outline-none` across 28 files
- `/workspace/group/co-op-us-repo/app-src/src/pages/ContributionSubmit.tsx:160` uses `focus:outline-none` without visible alternative
- `/workspace/group/co-op-us-repo/app-src/src/pages/Enrollment.tsx:392` same issue

**Impact:** WCAG 2.4.7 (Focus Visible) Level AA failure. Keyboard users lose track of focus.

**Recommended Fix:**
```css
/* Global focus style */
*:focus-visible {
  outline: 2px solid var(--co-primary);
  outline-offset: 2px;
}

/* Or per-component */
.input:focus {
  outline: none;
  border-color: var(--co-primary);
  box-shadow: 0 0 0 3px rgba(196, 149, 106, 0.2);
}
```

---

#### H12: Color Contrast — Muted Text May Fail WCAG
**Location:** CSS token definitions
**Severity:** HIGH (Accessibility)

**Issue:** Several text colors may not meet WCAG AA contrast ratios (4.5:1 for normal text).

**Evidence:**
```css
/* index.css line 28 */
--co-text-muted: #8a8a8a; /* On #0c0c0c bg = ~7:1 contrast (passes) */
--co-text-placeholder: #5a5a5a; /* On #0c0c0c bg = ~3.8:1 (FAILS AA) */
```

**Audit Required:** Test all text/background combinations with contrast checker.

**Recommended Fix:**
```css
--co-text-placeholder: #6a6a6a; /* Adjust to meet 4.5:1 minimum */
```

**Tool:** Use https://webaim.org/resources/contrastchecker/ or browser DevTools.

---

### MEDIUM Priority Issues

#### M9: Button Touch Targets — Some Below 44px Minimum
**Location:** Multiple components
**Severity:** MEDIUM (Accessibility/Mobile UX)

**Issue:** While Button component enforces `min-h-[44px]`, many custom buttons don't follow this pattern.

**Evidence:**
- Found 59 instances of `min-h-[44px]` (good!)
- But many buttons don't use Button component or this class
- Example: `/workspace/group/co-op-us-repo/app-src/src/pages/ProfileEdit.tsx:54-57` — Plus button may be undersized

**Impact:** WCAG 2.5.5 (Target Size) Level AAA — touch targets should be at least 44x44 CSS pixels.

**Recommended Fix:** Enforce minimum touch target globally:
```css
button, a, input[type="button"], input[type="submit"] {
  min-height: 44px;
  min-width: 44px;
}
```

Or audit all buttons and add `min-h-[44px]` class.

---

#### M10: Error Messages — Not Linked to Inputs
**Location:** Multiple forms
**Severity:** MEDIUM (Accessibility)

**Issue:** Error messages appear but aren't programmatically associated with inputs via `aria-describedby`.

**Evidence:**
```tsx
// Enrollment.tsx line 404-406
{error && (
  <p className="text-xs text-red-400 pl-1">{error}</p>
)}
```

**Impact:** Screen readers don't announce error when input receives focus.

**Recommended Fix:**
```tsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? 'input-error' : undefined}
/>
{error && (
  <p id="input-error" role="alert">{error}</p>
)}
```

---

#### M11: Loading States — No Accessible Announcement
**Location:** Multiple pages
**Severity:** MEDIUM (Accessibility)

**Issue:** Loading states are visual only. Screen reader users don't know data is loading.

**Evidence:**
```tsx
// Coordinate.tsx line 265-272
if (loading) {
  return (
    <div>
      <Radio className="animate-pulse" />
      <p>Loading workshop...</p>
    </div>
  )
}
```

**Recommended Fix:**
```tsx
<div role="status" aria-live="polite">
  <span className="sr-only">Loading workshop...</span>
  <Radio className="animate-pulse" aria-hidden="true" />
  <p aria-hidden="true">Loading workshop...</p>
</div>
```

---

#### M12: Form Field Labels — Missing "For" Association
**Location:** Multiple forms
**Severity:** MEDIUM (Accessibility)

**Issue:** Some labels aren't properly associated with inputs via `htmlFor` attribute.

**Evidence:**
```tsx
// ContributionSubmit.tsx line 152-154
<label className="block...">Description</label>
<textarea value={form.description} />
```

**Impact:** Clicking label doesn't focus input. Screen readers may not announce label.

**Recommended Fix:**
```tsx
<label htmlFor="description">Description</label>
<textarea id="description" value={form.description} />
```

---

#### M13: Disabled Button States — Poor Visual Feedback
**Location:** Multiple buttons
**Severity:** MEDIUM (UX)

**Issue:** Disabled buttons use `opacity-50` but cursor remains `cursor-not-allowed`. Some users may not understand why button doesn't work.

**Evidence:**
```tsx
// Button.tsx line 41
${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
```

**Recommended Enhancement:** Add tooltip explaining why button is disabled:
```tsx
{disabled && !isValid && (
  <span className="sr-only">Button disabled: form is invalid</span>
)}
```

---

#### M14: Mobile Input Font Size — iOS Zoom Prevention
**Location:** `/workspace/group/co-op-us-repo/app-src/src/index.css:98-103`
**Severity:** MEDIUM (Mobile UX)

**Issue:** Global `font-size: 16px !important` on mobile inputs prevents iOS auto-zoom, but uses `!important` which may override legitimate size changes.

**Evidence:**
```css
@media screen and (max-width: 768px) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

**Recommended Fix:** Less aggressive approach:
```css
@media screen and (max-width: 768px) {
  input:not([data-allow-zoom]),
  textarea:not([data-allow-zoom]),
  select:not([data-allow-zoom]) {
    font-size: max(16px, 1rem);
  }
}
```

---

#### M15: Responsive Design — Horizontal Scroll on Small Screens
**Location:** Multiple components
**Severity:** MEDIUM (Mobile UX)

**Issue:** Some components may cause horizontal scroll on narrow screens (<375px).

**Evidence:**
- `CloudTransfer.tsx` uses fixed `maxWidth: 560` which is fine
- But grid layouts with `grid-cols-3` (Propose.tsx:190) may break on very narrow screens

**Recommended Fix:** Test on 320px viewport and add responsive classes:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
```

---

#### M16: Animations — No Reduced Motion Respect
**Location:** `/workspace/group/co-op-us-repo/app-src/src/App.tsx:170-187`
**Severity:** MEDIUM (Accessibility)

**Issue:** Nav animations don't check `prefers-reduced-motion` media query. Users with vestibular disorders may experience discomfort.

**Evidence:**
```css
@keyframes dimNavSlideIn {
  0% { opacity: 0; transform: translateX(-12px) translateY(4px); }
  100% { opacity: 1; transform: translateX(0) translateY(0); }
}
```

**Recommended Fix:**
```css
@media (prefers-reduced-motion: reduce) {
  @keyframes dimNavSlideIn,
  @keyframes dimNavUnlock,
  @keyframes mobileDrawerSlideDown {
    0%, 100% {
      opacity: 1;
      transform: none;
    }
  }
}
```

---

#### M17: Toast Notifications — No Screen Reader Announcement
**Location:** Toast system (not fully reviewed)
**Severity:** MEDIUM (Accessibility)

**Issue:** Success/error toasts may be visual only without `role="alert"` or `aria-live`.

**Recommended Fix:**
```tsx
<div role="alert" aria-live="polite">
  {message}
</div>
```

---

### LOW Priority Issues

#### L1: Component Inconsistency — Multiple Button Styles
**Location:** Across codebase
**Severity:** LOW (Code Quality)

**Issue:** Button component exists but many places use custom button markup. Inconsistent styles.

**Recommended Fix:** Refactor to use Button component everywhere:
```tsx
import { Button } from '../components/Button'

<Button variant="primary" onClick={handleSubmit}>Submit</Button>
```

---

#### L2: TypeScript Errors in Build
**Location:** Build output
**Severity:** LOW (Code Quality)

**Issue:** `npm run build` shows 40+ TypeScript errors. Code compiles but with type safety issues.

**Evidence:**
```
error TS2339: Property 'default' does not exist on type...
error TS2554: Expected 1 arguments, but got 0.
error TS2322: Type 'string' is not assignable to type...
```

**Impact:** Type safety compromised, potential runtime errors.

**Recommended Fix:** Address TS errors incrementally or disable strict mode temporarily.

---

#### L3: Hardcoded Colors — Inconsistent Token Usage
**Location:** Multiple files
**Severity:** LOW (Maintainability)

**Issue:** Some files use `#c4956a` directly instead of `colors.primary`.

**Evidence:**
```tsx
// CloudTransfer.tsx line 144: Hardcoded color
<strong style={{ color: '#8bbfff' }}>{sent.amount} $CLOUD</strong>
```

**Recommended Fix:** Use tokens everywhere:
```tsx
<strong style={{ color: colors.cloud }}>{sent.amount} $CLOUD</strong>
```

---

#### L4: Empty State Messages — Inconsistent Tone
**Location:** Multiple empty states
**Severity:** LOW (UX Polish)

**Issue:** Empty state messages vary in helpfulness and tone.

**Evidence:**
- Some pages: "No data available" (terse)
- Others: "You haven't created any..." (friendly)

**Recommended Fix:** Standardize empty state component:
```tsx
<EmptyState
  icon={FileText}
  title="No contributions yet"
  description="Create your first contribution to get started."
  action={<Link to="/contribute">Add Contribution</Link>}
/>
```

---

#### L5: Success State Redirects — Inconsistent Timing
**Location:** Multiple success states
**Severity:** LOW (UX Polish)

**Issue:** Some success states redirect after 2 seconds, others require manual action.

**Evidence:**
- `Propose.tsx:126` — 2 second auto-redirect
- `ContributionSubmit.tsx:86-109` — Manual "View on Chain" link

**Recommended Fix:** Standardize on:
- Auto-redirect after 3 seconds for simple actions
- Manual action required for complex/important actions
- Show countdown timer if auto-redirecting

---

#### L6: Link Underlines — Inconsistent Application
**Location:** Multiple components
**Severity:** LOW (Visual Consistency)

**Issue:** Some links are underlined, others aren't. Inconsistent visual language.

**Recommended Fix:** Standardize:
- Nav links: No underline
- Inline text links: Underline on hover
- Button-styled links: No underline

---

#### L7: Icon Sizing — Inconsistent Use of w-4 vs w-5
**Location:** Throughout codebase
**Severity:** LOW (Visual Consistency)

**Issue:** Same icon used with different sizes in different contexts without clear semantic reason.

**Recommended Fix:** Define icon size scale:
- `w-3 h-3` — Inline with small text
- `w-4 h-4` — Inline with body text
- `w-5 h-5` — Button/nav icons
- `w-6 h-6` — Page headers
- `w-8 h-8` — Large UI elements

---

#### L8: Footer — Missing Accessibility Landmarks
**Location:** Footer component (not reviewed in detail)
**Severity:** LOW (Accessibility)

**Issue:** Footer may lack `role="contentinfo"` landmark.

**Recommended Fix:**
```tsx
<footer role="contentinfo">
  {/* footer content */}
</footer>
```

---

## Governance Parameters Analysis (Layer 6 Deep Dive)

**File:** `/workspace/group/co-op-us-repo/app-src/src/lib/governance-parameters.ts`

### Strengths

1. **Versioned Schema:** `schemaVersion` field allows parameter structure evolution
2. **Temporal Validity:** `effectiveFrom` / `effectiveUntil` support scheduled changes
3. **Audit Trail:** `changedBy`, `changeReason` track governance decisions
4. **Chain Attestation:** Optional blockchain anchoring for transparency
5. **Sensible Defaults:** All parameters have fallback values (lines 107-133)
6. **Namespace Organization:** Parameters grouped logically (patronage, cloud, capacity, etc.)

### Weaknesses

1. **No Schema Validation:** `value` field accepts arbitrary JSON without runtime validation
2. **No Range Constraints:** Nothing prevents setting `laborWeight: -100` or `minCashRate: 50` (must be 0.2-1.0 per IRC 1385)
3. **No Conflict Detection:** Multiple effective parameters could overlap if `effectiveUntil` logic fails
4. **No Permission Check:** `setParameter` doesn't verify caller is FSC member/steward
5. **Silent Chain Failures:** Chain attestation errors are swallowed (line 326 catch block)
6. **No Transaction Safety:** Closing old parameter and inserting new happens in separate queries (not atomic)

### Recommended Improvements

```typescript
import { z } from 'zod'

// Schema definitions
const PatronageWeightSchema = z.object({
  laborWeight: z.number().min(0).max(10),
  expertiseWeight: z.number().min(0).max(10),
  capitalWeight: z.number().min(0).max(10),
  relationshipWeight: z.number().min(0).max(10),
})

const PatronageCashRateSchema = z.object({
  minCashRate: z.number().min(0.2).max(1.0), // IRC 1385 compliance
  defaultCashRate: z.number().min(0.2).max(1.0),
  maxCashRate: z.number().min(0.2).max(1.0),
}).refine(data => data.defaultCashRate >= data.minCashRate, {
  message: 'Default rate must be >= minimum rate'
}).refine(data => data.maxCashRate >= data.defaultCashRate, {
  message: 'Maximum rate must be >= default rate'
})

// Schema registry
const PARAMETER_SCHEMAS: Record<string, z.Schema> = {
  'patronage:weights': PatronageWeightSchema,
  'patronage:cash_rate': PatronageCashRateSchema,
  // ... etc
}

// Enhanced setParameter with validation and permission check
export async function setParameter<T>(
  change: ParameterChange<T>,
  convergenceId?: string,
  actorId?: string // Required for permission check
): Promise<GovernanceParameter<T>> {
  // 1. Permission check
  if (actorId) {
    const { data: actor } = await supabase
      .from('participants')
      .select('role')
      .eq('id', actorId)
      .single()

    if (!actor || !['steward', 'fsc_member'].includes(actor.role)) {
      throw new Error('Permission denied: Only stewards can modify governance parameters')
    }
  }

  // 2. Schema validation
  const schemaKey = `${change.namespace}:${change.key}`
  const schema = PARAMETER_SCHEMAS[schemaKey]

  if (schema) {
    const result = schema.safeParse(change.newValue)
    if (!result.success) {
      throw new Error(`Invalid parameter value: ${result.error.message}`)
    }
  }

  // 3. Atomic update (wrap in transaction)
  const { data, error } = await supabase.rpc('set_governance_parameter', {
    p_namespace: change.namespace,
    p_key: change.key,
    p_value: change.newValue,
    p_effective_from: change.effectiveFrom || new Date().toISOString(),
    p_changed_by: change.changedBy,
    p_change_reason: change.changeReason,
  })

  if (error) throw error

  // 4. Chain attestation (with error visibility)
  let chainEntryId: string | undefined
  if (convergenceId) {
    try {
      const entry = await appendEntry({ /* ... */ })
      chainEntryId = entry.id
    } catch (err) {
      console.error('[Governance] Chain attestation failed:', err)
      // Log to monitoring/alerting system
      // Consider whether to fail the entire operation or proceed
    }
  }

  return data
}
```

**Database Function (SQL):**
```sql
CREATE OR REPLACE FUNCTION set_governance_parameter(
  p_namespace text,
  p_key text,
  p_value jsonb,
  p_effective_from timestamptz,
  p_changed_by uuid,
  p_change_reason text
) RETURNS governance_parameters AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Atomic: close old + insert new
  v_id := gen_random_uuid();

  UPDATE governance_parameters
  SET effective_until = p_effective_from
  WHERE namespace = p_namespace
    AND key = p_key
    AND effective_until IS NULL;

  INSERT INTO governance_parameters (
    id, namespace, key, value, schema_version,
    effective_from, effective_until, changed_by, change_reason
  ) VALUES (
    v_id, p_namespace, p_key, p_value, 1,
    p_effective_from, NULL, p_changed_by, p_change_reason
  );

  RETURN (SELECT * FROM governance_parameters WHERE id = v_id);
END;
$$ LANGUAGE plpgsql;
```

---

## Build Warnings Summary

TypeScript build shows **40+ type errors**. While code compiles, this indicates reduced type safety.

**Categories:**
1. Missing type imports (verbatimModuleSyntax violations) — 10 errors
2. Property does not exist — 8 errors
3. Type mismatch (string not assignable to literal type) — 6 errors
4. Missing arguments — 4 errors
5. Index signature missing — 12 errors

**Recommendation:** Create P160 sprint to resolve TS errors incrementally, prioritizing:
1. Security-related type errors first
2. User-facing component type errors second
3. Infrastructure type errors third

---

## Testing Recommendations

### Accessibility Testing

**Required Tools:**
1. **axe DevTools** (browser extension) — Run on all major pages
2. **WAVE** (WebAIM) — Verify WCAG compliance
3. **Screen Reader Testing:**
   - macOS VoiceOver (free)
   - NVDA (Windows, free)
   - JAWS (Windows, paid but industry standard)

**Test Scenarios:**
1. Navigate entire app with keyboard only (no mouse)
2. Complete enrollment flow with screen reader
3. Submit contribution with keyboard only
4. Navigate Workshop coordinate page with assistive tech

### Visual Regression Testing

**Recommended:** Percy.io or Chromatic for screenshot comparison across:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667, 414x896)

### User Testing

**Recommended Cohort:**
- 2-3 users with visual impairments
- 2-3 users with motor disabilities
- 2-3 mobile-only users
- 2-3 users 55+ (digital accessibility spectrum)

---

## Priority Recommendations

### Immediate (Within 1 Sprint)

1. **Add SkipNavigation to App.tsx** (C1)
2. **Fix mobile menu keyboard trap** (C2)
3. **Add aria-labels to icon buttons** (H10)
4. **Add focus indicators** (H11)
5. **Validate governance parameter inputs** (H6)

### Short-term (Within 1 Month)

1. **Audit and fix color contrast** (H12)
2. **Standardize form validation patterns** (H7, H8)
3. **Add error-to-input associations** (M10, M12)
4. **Implement reduced motion support** (M16)
5. **Create EmptyState component** (L4)

### Medium-term (Within 1 Quarter)

1. **Address TypeScript errors** (L2)
2. **Standardize button components** (L1)
3. **Create onboarding flow** (M3)
4. **Implement comprehensive accessibility testing** (ongoing)
5. **Create design system documentation**

---

## Conclusion

co-op.us demonstrates thoughtful engineering with strong mobile responsiveness, good semantic HTML in many places, and sophisticated features like progressive dimension unlocking and governance parameter systems.

**However, accessibility compliance is incomplete.** Missing skip navigation, inconsistent focus management, and lack of screen reader optimization create barriers for users with disabilities. These are **not cosmetic issues** — they prevent a significant user segment from participating in the cooperative.

**The constraint layer (validation)** is functional but lacks depth. Client-side validation is minimal, governance parameters accept unvalidated JSON, and several forms allow invalid input to reach the server.

**The view layer (UI)** is visually cohesive but has consistency gaps: multiple button styles, inconsistent empty states, and some components that don't follow the established design token system.

**Recommended Next Steps:**

1. **P160: Accessibility Remediation Sprint**
   - Address C1, C2, H10, H11, H12
   - Target: WCAG 2.1 Level AA compliance
   - Timeline: 2 weeks

2. **P161: Validation Hardening Sprint**
   - Implement Zod schemas for governance parameters
   - Add client-side validation to all forms
   - Create validation utilities library
   - Timeline: 1 week

3. **P162: UI Consistency Audit**
   - Refactor to use Button component everywhere
   - Standardize empty states
   - Create Storybook for component documentation
   - Timeline: 1 week

**Total effort estimate:** 4 weeks to address all CRITICAL and HIGH issues.

---

**Report compiled by:** Dianoia (Execution Intelligence Agent)
**Date:** 2026-03-08
**Audit methodology:** Static code analysis, pattern matching, WCAG 2.1 guidelines
**Files reviewed:** 50+ components, 100+ pages, governance-parameters.ts deep dive
