# P188 Accessibility Remaining Work

## Progress
**COMPLETED:**
- ✅ Fixed modal close button in Channels.tsx (line 275)
- ✅ WCAG AA color contrast fixes in P190
  
**REMAINING:**  14 critical aria-label violations + focus indicator audit

---

## Critical Violations to Fix (Priority Order)

### 1. Modal Close Buttons (HIGH)
**File:** `/workspace/group/co-op-us-repo/app-src/src/pages/ChannelView.tsx`  
**Line:** 316  
```tsx
// BEFORE:
<button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>

// AFTER:
<button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white" aria-label="Close thread creation dialog"><X className="w-5 h-5" /></button>
```

**File:** `/workspace/group/co-op-us-repo/app-src/src/components/ResolveThreadDialog.tsx`  
**Line:** 38  
```tsx
// BEFORE:
<button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>

// AFTER:
<button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close resolve thread dialog"><X className="w-5 h-5" /></button>
```

---

### 2. Navigation Icon Links (HIGH)
**File:** `/workspace/group/co-op-us-repo/app-src/src/pages/ChannelView.tsx`  
**Line:** 227  
```tsx
// BEFORE:
<Link to="/channels" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>

// AFTER:
<Link to="/channels" className="text-gray-400 hover:text-white" aria-label="Back to channels"><ArrowLeft className="w-5 h-5" /></Link>
```

**File:** `/workspace/group/co-op-us-repo/app-src/src/App.tsx`  
**Line:** 376-383 (Desktop More dropdown)  
```tsx
// BEFORE:
<button onClick={() => setDesktopMoreOpen(o => !o)} className={...}>
  <MoreHorizontal className="w-4 h-4" />
</button>

// AFTER:
<button 
  onClick={() => setDesktopMoreOpen(o => !o)} 
  className={...}
  aria-label="More options"
  aria-expanded={desktopMoreOpen}
  aria-haspopup="true"
>
  <MoreHorizontal className="w-4 h-4" />
</button>
```

---

### 3. Action Buttons (MEDIUM)
**File:** `/workspace/group/co-op-us-repo/app-src/src/pages/ApiKeysPage.tsx`  
**Line:** 259-264  
```tsx
// BEFORE:
<button onClick={() => revokeKey(key.key_prefix)} className="text-gray-400 hover:text-red-400 transition-colors ml-4" title="Revoke key">
  <Trash2 className="w-4 h-4" />
</button>

// AFTER:
<button 
  onClick={() => revokeKey(key.key_prefix)} 
  className="text-gray-400 hover:text-red-400 transition-colors ml-4" 
  title="Revoke key"
  aria-label={`Revoke API key ${key.name || 'Unnamed Key'}`}
>
  <Trash2 className="w-4 h-4" />
</button>
```

**File:** `/workspace/group/co-op-us-repo/app-src/src/pages/Coordinate.tsx`  
**Line:** 350-362 (Copy SKILL hash)  
```tsx
// BEFORE:
<button onClick={() => { navigator.clipboard.writeText(consensusHash) }} title={...} style={{...}}>
  <FileText size={10} style={{ color: '#888' }} />
  {consensusHash.slice(0, 8)}…
</button>

// AFTER:
<button 
  onClick={() => { navigator.clipboard.writeText(consensusHash) }} 
  title={...} 
  style={{...}}
  aria-label={`Copy consensus SKILL hash ${consensusHash.slice(0, 8)}`}
>
  <FileText size={10} style={{ color: '#888' }} />
  {consensusHash.slice(0, 8)}…
</button>
```

---

### 4. Peer Signal Buttons with Hidden Text (MEDIUM)
**File:** `/workspace/group/co-op-us-repo/app-src/src/pages/LeafDetail.tsx`  
**Lines:** 380-398  
```tsx
// BEFORE:
<button
  key={key}
  onClick={() => !isOwn && handleToggleSignal(key)}
  disabled={busy || isOwn}
  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all border"
  style={{...}}
  title={given ? verb : label}
>
  <Icon className="w-3.5 h-3.5" style={{...}} />
  {count > 0 && <span>{count}</span>}
  <span className="hidden sm:inline">{given ? verb : label}</span>
</button>

// AFTER:
<button
  key={key}
  onClick={() => !isOwn && handleToggleSignal(key)}
  disabled={busy || isOwn}
  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all border"
  style={{...}}
  title={given ? verb : label}
  aria-label={`${given ? verb : `Give ${label} signal`}${count > 0 ? ` (${count} total)` : ''}`}
>
  <Icon className="w-3.5 h-3.5" style={{...}} />
  {count > 0 && <span aria-hidden="true">{count}</span>}
  <span className="hidden sm:inline" aria-hidden="true">{given ? verb : label}</span>
</button>
```

---

## Focus Indicator Audit

### Current Issue
Many components use `focus:outline-none` without visible replacement, violating WCAG 2.4.7.

### Recommended Global Fix
Add to `index.css`:

```css
/* P188: Global focus indicators for keyboard navigation (WCAG 2.4.7) */
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid var(--co-primary);
  outline-offset: 2px;
}

/* Exception: elements with explicit focus:ring styles */
.focus\:ring-2:focus-visible,
.focus-visible\:ring-2:focus-visible {
  outline: none; /* Let Tailwind ring handle it */
}
```

### Component-Specific Focus Styles
For components with `outline-none`, add:
```tsx
className="... focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4956a]"
```

---

## Systematic Audit Pattern

Search for icon-only buttons:
```bash
grep -r "className.*<[A-Z][a-zA-Z]*.*className=\"w-" app-src/src/
```

For each result, verify:
1. Has `aria-label` or `aria-labelledby`
2. Has visible text (not `hidden` on mobile)
3. Has proper focus indicator

---

## Estimated Remaining Work
- **14 critical aria-label fixes:** ~30 minutes
- **Focus indicator global fix:** ~15 minutes
- **Component-specific focus styles:** ~45 minutes
- **Verification testing:** ~30 minutes

**Total:** ~2 hours for complete WCAG 4.1.2 + 2.4.7 compliance

---

## References
- WCAG 4.1.2 (Name, Role, Value): https://www.w3.org/WAI/WCAG21/Understanding/name-role-value
- WCAG 2.4.7 (Focus Visible): https://www.w3.org/WAI/WCAG21/Understanding/focus-visible
