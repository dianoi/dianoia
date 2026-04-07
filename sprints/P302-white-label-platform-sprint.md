# P302: White-Label Platform Foundation — Dynamic Branding & Content

**Sprint ID:** P302
**Complexity:** XL
**Layers:** [1, 2, 7] — Identity, State, View
**Proposed Roles:** {"dia": "spec-author", "nou": "implementer"}
**Dependencies:** P301 (Multi-Tenancy Security) — CRITICAL BLOCKER
**Reference URLs:**
- https://github.com/techne-app/co-op.us/blob/main/app-src/src/styles/tokens.ts
- https://github.com/techne-app/co-op.us/blob/main/app-src/src/lib/convergence.ts
- https://github.com/techne-app/co-op.us/blob/main/app-src/src/lib/app-config.ts
- https://github.com/techne-app/co-op.us/blob/main/app-src/src/lib/hubConfig.ts
- https://github.com/techne-app/co-op.us/blob/main/supabase/migrations/E296_hubs.sql
- https://github.com/techne-app/co-op.us/blob/main/supabase/migrations/E298_hub_config.sql

## Executive Summary

co-op.us has strong multi-tenant **infrastructure** (hub model, design tokens, theme system) but **hardcoded content** prevents deployment as a white-label platform. This sprint externalizes branding, content, and configuration from code into database-driven systems, enabling organizations to deploy their own branded instances without forking the codebase.

**Current State:**
- 7 static about pages (40+ KB hardcoded copy)
- Landing pages hardcoded to "Techne" brand
- Meta tags, logos, legal documents all static
- Only 2 convergence modes (techne, ethboulder) hardcoded in app-config.ts
- No email template system
- P301 (Multi-Tenancy Security) not yet implemented

**Goal State:**
- Dynamic convergence/hub registration via database
- Content management system for all copy (landing, about, legal, email)
- Per-hub branding (logo SVG, color palette, typography, meta tags)
- Email template system with per-hub customization
- Feature flags per hub (not just per hardcoded mode)
- **P301 completed** ensuring tenant data isolation

---

## Problem Statement

### White-Label Requirements

Organizations want to deploy co-op.us as their own platform:
- **Legal cooperatives** (Nairobi, Zurich hubs) want their own branded instance
- **Consulting firms** want to offer co-op.us as a service to clients
- **Educational institutions** want a branded hub for their community
- **Enterprises** want internal patronage platforms without the Techne brand

### Current Blockers

1. **Hardcoded content everywhere:**
   - `TechneLanding.tsx`, `SolarLunarTime.tsx`, `WorkcraftLanding.tsx` (landing pages)
   - `/pages/about/` directory: 7 pages of Techne-specific copy
   - `Footer.tsx` hardcodes "RegenHub, LCA" and "techne.co-op.us"
   - Meta tags (`og:title`, `og:site_name`) hardcoded in each page

2. **Static convergence modes:**
   - Only "techne" and "ethboulder" modes defined in code
   - Adding new hub requires code changes and redeployment
   - Feature flags tied to hardcoded modes, not hub configuration

3. **No content management:**
   - All copy lives in TSX/JSX files
   - No admin panel to edit content
   - Content updates require code commits

4. **Missing email system:**
   - No transactional email templates found
   - No per-hub email branding
   - No email sending infrastructure

5. **Security gap (P301 blocker):**
   - RLS policies missing from most tables
   - Cannot guarantee tenant data isolation
   - Agent keys lack per-hub scoping

### Why Now

- **Federation expansion:** Nairobi and Zurich hubs need branded instances
- **Platform revenue:** White-label licensing is a monetization path
- **Scalability:** Manual code changes per hub don't scale
- **Security:** P301 is already proposed (prerequisite)
- **Market demand:** Cooperatives globally want this infrastructure

---

## Scope

### In Scope

**Phase 1: Dynamic Hub Configuration**

1. **Hub Registration & Management**
   - Extend `hubs` table with branding columns
   - Admin UI for hub creation/editing
   - Hub approval workflow (principals review applications)
   - Hub status management (active/inactive/pending)

2. **Dynamic Convergence Loading**
   - Remove hardcoded `TECHNE_CONFIG` and `DEFAULT_CONFIG`
   - Load convergences from database at app startup
   - Cache convergence configs (Supabase realtime updates)
   - Hostname → hub_id routing logic

3. **Feature Flags per Hub**
   - Move feature flags from app-config.ts to `hub_config` JSONB
   - Per-hub feature enablement (patronage, ventures, royalties, education, etc.)
   - UI to toggle features per hub (stewards only)

**Phase 2: Content Management System**

4. **Content Schema**
   - `hub_content` table: (hub_id, content_key, content_value, content_type)
   - Content keys: landing_hero, landing_cta, about_identity, about_governance, footer_text, etc.
   - Content types: text, markdown, html
   - Version history via audit log

5. **Content Editor UI**
   - Admin panel: /admin/content
   - WYSIWYG editor for markdown content
   - Preview mode (see changes before publishing)
   - Revert to previous version

6. **Dynamic Page Rendering**
   - Refactor `TechneLanding.tsx` → `LandingPage.tsx` (loads content from DB)
   - Refactor `/pages/about/*.tsx` → Single `AboutPage.tsx` with dynamic sections
   - Footer component loads copy from `hub_content`
   - Meta tags loaded from hub configuration

**Phase 3: Visual Branding**

7. **Logo & Visual Assets**
   - `hub_assets` table: (hub_id, asset_type, asset_url, alt_text)
   - Asset types: logo_svg, logo_png, favicon, og_image, apple_touch_icon
   - Upload to Supabase Storage (per-hub folder)
   - SVG logo with dynamic color fills (theme_primary)

8. **Extended Theme Configuration**
   - Expand hub theme beyond colors:
     - Typography (font families, sizes, line heights)
     - Border radius preferences
     - Shadow intensity
     - Animation timing
   - Generate CSS custom properties from hub theme
   - Per-hub stylesheet injection

9. **Meta Tags & SEO**
   - Per-hub meta configuration in `hub_config`:
     - `og_title`, `og_description`, `og_image_url`
     - `twitter_card`, `twitter_site`, `twitter_creator`
     - `site_name`, `site_description`, `keywords`
   - Dynamic `<head>` injection per route

**Phase 4: Email Templates**

10. **Email Template System**
    - `email_templates` table: (hub_id, template_key, subject, body_html, body_text)
    - Template keys: welcome, contribution_submitted, proposal_created, sprint_assigned, etc.
    - Handlebars/Mustache syntax for variable substitution
    - Transactional email edge function (Supabase Resend integration)

11. **Email Branding**
    - Per-hub email header/footer
    - Brand colors in email HTML
    - Logo in email header (from `hub_assets`)
    - Unsubscribe link per hub

12. **Email Sending Infrastructure**
    - Supabase edge function: `send-email`
    - Per-hub SMTP or Resend API key (stored encrypted in `hub_config`)
    - Email queue table for failed sends
    - Rate limiting per hub

**Phase 5: Legal & Compliance**

13. **Dynamic Legal Documents**
    - `legal_documents` table: (hub_id, document_type, version, content, effective_date)
    - Document types: terms_of_service, privacy_policy, cookie_policy, operating_agreement
    - Versioning support (track changes over time)
    - User acceptance tracking: `legal_acceptances` (participant_id, document_id, accepted_at)

14. **Per-Hub Legal Pages**
    - `/legal/terms` → loads from `legal_documents` filtered by hub_id
    - `/legal/privacy` → loads from `legal_documents` filtered by hub_id
    - Accept/decline UI for new users
    - Re-acceptance flow when documents change

15. **Compliance Tooling**
    - GDPR data export per hub
    - GDPR data deletion per hub (RLS from P301 ensures isolation)
    - Cookie consent banner per hub (customizable copy)
    - Per-jurisdiction legal document variants (future: hub_id + jurisdiction)

**Phase 6: Testing & Deployment**

16. **White-Label Testing**
    - Create 3 test hubs (different brands, color schemes, content)
    - Verify complete visual isolation
    - Test feature flag combinations
    - Email template testing (all variants)

17. **Performance Optimization**
    - Cache convergence configs (Redis or in-memory)
    - CDN for hub assets (logos, images)
    - Edge caching for static content
    - Lazy load content not needed immediately

18. **Documentation**
    - Hub creation guide (for hub stewards)
    - Branding customization guide
    - Content editor manual
    - Email template syntax reference
    - White-label deployment guide (for platform admins)

### Out of Scope

- Multi-instance deployment (each hub gets its own Supabase backend) — Future sprint
- Custom domain routing per hub (e.g., nairobi.coop → their hub) — Future sprint
- Advanced CMS features (workflow, drafts, scheduled publishing) — Future iteration
- Multi-language content management — Separate from P236 (i18n infrastructure)
- Per-hub API keys and webhooks — Future sprint
- Cross-tenant bridge protocols (WC-030) — Separate epic
- Per-hub analytics dashboards — Future sprint

### Dependencies

**CRITICAL BLOCKER: P301 (Multi-Tenancy Security)**
- Must be completed **BEFORE** this sprint
- Without RLS policies, tenant data can leak across hubs
- Agent keys must be hub-scoped
- Edge functions must validate hub context
- P301 is XL complexity and must complete before this sprint begins

**STRONGLY RECOMMENDED: P177 M3 (Database Types Regeneration)**
- Ensures TypeScript knows about new columns
- Prevents type mismatch errors

### Assumptions

- P301 is completed and verified (RLS policies enforced)
- Supabase Storage is available for asset uploads
- Resend or similar email service integration is acceptable
- Stewards of each hub have admin access to customize content
- DNS and SSL management is handled externally (not in app)

---

## Technical Design

### Phase 1: Dynamic Hub Configuration

**1.1 Hub Schema Extensions**

Extend `hubs` table (from E296):
```sql
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS logo_svg_url text;
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS logo_png_url text;
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS og_image_url text;
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS site_name text;
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS site_description text;
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS site_keywords text[];
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS meta_config jsonb DEFAULT '{}';
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS email_config jsonb DEFAULT '{}';
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS feature_flags jsonb DEFAULT '{}';
ALTER TABLE hubs ADD COLUMN IF NOT EXISTS theme_config jsonb DEFAULT '{}';

-- Example hub_config structure:
-- {
--   "enrollment_message": "Welcome...",
--   "welcome_cloud": 100,
--   "batch_schedule": "solar",
--   "dimension_unlock_amounts": {...},
--   "feature_flags": {
--     "patronage": true,
--     "ventures": true,
--     "royalties": true,
--     "education": true,
--     "coordinatorQueue": true,
--     "channels": true,
--     "contributions": true,
--     "chain": true
--   },
--   "email_config": {
--     "from_name": "Nairobi Hub",
--     "from_email": "noreply@nairobi.coop",
--     "reply_to": "support@nairobi.coop",
--     "smtp_host": "smtp.resend.com",
--     "smtp_api_key_encrypted": "..."
--   },
--   "meta_config": {
--     "og_title": "Nairobi Hub — Economic Cooperation Platform",
--     "og_description": "...",
--     "twitter_card": "summary_large_image",
--     "twitter_site": "@NairobiHub"
--   },
--   "theme_config": {
--     "font_family_sans": "Inter, system-ui, sans-serif",
--     "font_family_mono": "Fira Code, monospace",
--     "border_radius_base": "0.5rem",
--     "shadow_intensity": "medium"
--   }
-- }
```

**1.2 Dynamic Convergence Loading**

Update `lib/convergence.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

let convergenceCache: Map<string, ConvergenceConfig> = new Map()
let lastCacheUpdate: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function loadConvergences(): Promise<void> {
  const now = Date.now()
  if (now - lastCacheUpdate < CACHE_TTL) return // Use cache

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: hubs } = await supabase
    .from('hubs')
    .select(`
      id,
      slug,
      name,
      location,
      timezone,
      theme_primary,
      theme_bg,
      theme_surface,
      theme_border,
      logo_svg_url,
      site_name,
      hub_config
    `)
    .eq('status', 'active')

  convergenceCache.clear()
  hubs?.forEach(hub => {
    convergenceCache.set(hub.slug, {
      id: hub.id,
      name: hub.name,
      slug: hub.slug,
      description: hub.hub_config?.enrollment_message || null,
      theme_primary: hub.theme_primary,
      theme_bg: hub.theme_bg,
      theme_surface: hub.theme_surface,
      theme_border: hub.theme_border,
      logo_text: hub.site_name || hub.name,
      logo_accent: '',
      tagline: hub.hub_config?.tagline || null,
      opens_at: hub.hub_config?.opens_at || null,
      dimensions: hub.hub_config?.dimensions || DEFAULT_DIMENSIONS,
      feature_flags: hub.hub_config?.feature_flags || {},
      meta_config: hub.hub_config?.meta_config || {},
      theme_config: hub.hub_config?.theme_config || {}
    })
  })

  lastCacheUpdate = now
}

export function getConvergenceByHostname(hostname: string): ConvergenceConfig | null {
  // Parse subdomain: "nairobi.co-op.us" → "nairobi"
  const parts = hostname.split('.')
  if (parts[0] === 'www') parts.shift()
  const slug = parts[0]

  return convergenceCache.get(slug) || convergenceCache.get('techne') // Default to techne
}

export function getConvergenceBySlug(slug: string): ConvergenceConfig | null {
  return convergenceCache.get(slug) || null
}

// Initialize on app startup
loadConvergences()

// Subscribe to realtime updates
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase
  .channel('hub_updates')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'hubs' }, () => {
    loadConvergences() // Refresh cache on any hub change
  })
  .subscribe()
```

**1.3 Remove Hardcoded Modes**

Delete `app-config.ts:detectAppMode()` and `getFeatureFlags()`. Replace with:
```typescript
export function getCurrentHub(hostname: string): ConvergenceConfig {
  return getConvergenceByHostname(hostname) || getConvergenceBySlug('techne')
}

export function getFeatureFlags(hub: ConvergenceConfig): FeatureFlags {
  return hub.feature_flags || DEFAULT_FEATURE_FLAGS
}
```

Update all usages of `detectAppMode()` to use `getCurrentHub()` instead.

---

### Phase 2: Content Management System

**2.1 Content Schema**

```sql
CREATE TABLE hub_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  content_key text NOT NULL,
  content_value text,
  content_type text DEFAULT 'text', -- text, markdown, html
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES participants(id),
  updated_by uuid REFERENCES participants(id),
  UNIQUE(hub_id, content_key, version)
);

CREATE INDEX idx_hub_content_hub_key ON hub_content(hub_id, content_key);
CREATE INDEX idx_hub_content_updated_at ON hub_content(updated_at DESC);

-- Audit log for content changes
CREATE TABLE hub_content_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_content_id uuid REFERENCES hub_content(id),
  action text, -- created, updated, deleted
  old_value text,
  new_value text,
  changed_by uuid REFERENCES participants(id),
  changed_at timestamptz DEFAULT now()
);

-- RLS policies (requires P301)
CREATE POLICY "hub_members_read_content" ON hub_content
  FOR SELECT
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
    )
  );

CREATE POLICY "hub_stewards_manage_content" ON hub_content
  FOR ALL
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  )
  WITH CHECK (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  );
```

**2.2 Content Keys (Predefined)**

Standard content keys for all hubs:
```typescript
export const CONTENT_KEYS = {
  // Landing page
  LANDING_HERO_TITLE: 'landing.hero.title',
  LANDING_HERO_SUBTITLE: 'landing.hero.subtitle',
  LANDING_HERO_CTA: 'landing.hero.cta',
  LANDING_FEATURES_TITLE: 'landing.features.title',
  LANDING_FEATURES_LIST: 'landing.features.list', // JSON array

  // About pages
  ABOUT_IDENTITY: 'about.identity',
  ABOUT_GOVERNANCE: 'about.governance',
  ABOUT_EDUCATION: 'about.education',
  ABOUT_ECONOMICS: 'about.economics',
  ABOUT_TRANSPARENCY: 'about.transparency',
  ABOUT_CHANNELS: 'about.channels',
  ABOUT_FEDERATION: 'about.federation',

  // Footer
  FOOTER_COPYRIGHT: 'footer.copyright',
  FOOTER_LINKS: 'footer.links', // JSON array of {text, href}

  // Legal (pointers to legal_documents)
  LEGAL_TERMS_SLUG: 'legal.terms_slug',
  LEGAL_PRIVACY_SLUG: 'legal.privacy_slug',
}
```

**2.3 Content Loader Hook**

```typescript
export function useHubContent(contentKey: string): string | null {
  const { currentHub } = useHubContext()
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from('hub_content')
        .select('content_value')
        .eq('hub_id', currentHub.id)
        .eq('content_key', contentKey)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      setContent(data?.content_value || null)
    }
    fetchContent()
  }, [currentHub.id, contentKey])

  return content
}
```

**2.4 Dynamic Landing Page**

Refactor `TechneLanding.tsx` → `LandingPage.tsx`:
```typescript
export function LandingPage() {
  const heroTitle = useHubContent(CONTENT_KEYS.LANDING_HERO_TITLE)
  const heroSubtitle = useHubContent(CONTENT_KEYS.LANDING_HERO_SUBTITLE)
  const heroCTA = useHubContent(CONTENT_KEYS.LANDING_HERO_CTA)
  const featuresTitle = useHubContent(CONTENT_KEYS.LANDING_FEATURES_TITLE)
  const featuresList = useHubContent(CONTENT_KEYS.LANDING_FEATURES_LIST)

  const features = featuresList ? JSON.parse(featuresList) : []

  return (
    <div className="landing-page">
      <section className="hero">
        <h1>{heroTitle || 'Welcome'}</h1>
        <p>{heroSubtitle}</p>
        <button>{heroCTA || 'Get Started'}</button>
      </section>
      <section className="features">
        <h2>{featuresTitle || 'Features'}</h2>
        <ul>
          {features.map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
```

**2.5 Content Editor UI**

Create `/admin/content` page (stewards only):
```typescript
export function ContentEditor() {
  const { currentHub } = useHubContext()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [contentValue, setContentValue] = useState('')
  const [contentType, setContentType] = useState<'text' | 'markdown' | 'html'>('text')

  async function saveContent() {
    await supabase
      .from('hub_content')
      .upsert({
        hub_id: currentHub.id,
        content_key: selectedKey,
        content_value: contentValue,
        content_type: contentType,
        updated_by: auth.uid()
      })
  }

  return (
    <div className="content-editor">
      <aside className="content-keys">
        {Object.values(CONTENT_KEYS).map(key => (
          <button
            key={key}
            onClick={() => setSelectedKey(key)}
            className={selectedKey === key ? 'active' : ''}
          >
            {key}
          </button>
        ))}
      </aside>
      <main className="editor">
        {selectedKey && (
          <>
            <select value={contentType} onChange={e => setContentType(e.target.value)}>
              <option value="text">Plain Text</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
            {contentType === 'markdown' ? (
              <MarkdownEditor value={contentValue} onChange={setContentValue} />
            ) : (
              <textarea value={contentValue} onChange={e => setContentValue(e.target.value)} />
            )}
            <button onClick={saveContent}>Save</button>
          </>
        )}
      </main>
    </div>
  )
}
```

---

### Phase 3: Visual Branding

**3.1 Asset Management Schema**

```sql
CREATE TABLE hub_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  asset_type text NOT NULL, -- logo_svg, logo_png, favicon, og_image, apple_touch_icon
  asset_url text NOT NULL,
  alt_text text,
  mime_type text,
  file_size integer,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES participants(id),
  UNIQUE(hub_id, asset_type)
);

-- RLS policies (stewards only)
CREATE POLICY "hub_stewards_manage_assets" ON hub_assets
  FOR ALL
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  );

-- Public read for logo assets
CREATE POLICY "public_read_logos" ON hub_assets
  FOR SELECT
  USING (asset_type IN ('logo_svg', 'logo_png', 'favicon'));
```

**3.2 Asset Upload Flow**

Supabase Storage bucket: `hub-assets/{hub_id}/{asset_type}/{filename}`

Edge function: `upload-hub-asset`
```typescript
export async function handler(req: Request) {
  const identity = await verifyAgentKey(apiKey, supabase)
  if (!identity) return new Response('Unauthorized', { status: 401 })

  const formData = await req.formData()
  const hubId = formData.get('hub_id') as string
  const assetType = formData.get('asset_type') as string
  const file = formData.get('file') as File

  // Validate hub access (P301)
  if (!canAccessHub(identity, hubId)) {
    return new Response('Forbidden', { status: 403 })
  }

  // Validate asset type
  const allowedTypes = ['logo_svg', 'logo_png', 'favicon', 'og_image']
  if (!allowedTypes.includes(assetType)) {
    return new Response('Invalid asset type', { status: 400 })
  }

  // Upload to Supabase Storage
  const path = `${hubId}/${assetType}/${file.name}`
  const { data, error } = await supabase.storage
    .from('hub-assets')
    .upload(path, file, { upsert: true })

  if (error) return new Response(error.message, { status: 500 })

  // Save asset record
  const publicUrl = supabase.storage.from('hub-assets').getPublicUrl(path).data.publicUrl
  await supabase.from('hub_assets').upsert({
    hub_id: hubId,
    asset_type: assetType,
    asset_url: publicUrl,
    mime_type: file.type,
    file_size: file.size,
    uploaded_by: identity.participantId
  })

  return new Response(JSON.stringify({ url: publicUrl }), { status: 200 })
}
```

**3.3 Dynamic Logo Component**

```typescript
export function HubLogo() {
  const { currentHub } = useHubContext()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLogo() {
      const { data } = await supabase
        .from('hub_assets')
        .select('asset_url')
        .eq('hub_id', currentHub.id)
        .eq('asset_type', 'logo_svg')
        .single()

      setLogoUrl(data?.asset_url || null)
    }
    fetchLogo()
  }, [currentHub.id])

  if (logoUrl) {
    return <img src={logoUrl} alt={`${currentHub.name} logo`} className="hub-logo" />
  }

  // Fallback to text logo
  return (
    <div className="hub-logo-text">
      <span style={{ color: currentHub.theme_primary }}>{currentHub.logo_text}</span>
      {currentHub.logo_accent && <span>{currentHub.logo_accent}</span>}
    </div>
  )
}
```

**3.4 Dynamic CSS Variables**

Inject hub theme into `<head>`:
```typescript
export function HubThemeInjector() {
  const { currentHub } = useHubContext()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--co-primary', currentHub.theme_primary)
    root.style.setProperty('--co-bg', currentHub.theme_bg)
    root.style.setProperty('--co-surface', currentHub.theme_surface)
    root.style.setProperty('--co-border', currentHub.theme_border)

    // Extended theme config
    const themeConfig = currentHub.theme_config || {}
    if (themeConfig.font_family_sans) {
      root.style.setProperty('--font-sans', themeConfig.font_family_sans)
    }
    if (themeConfig.border_radius_base) {
      root.style.setProperty('--radius-md', themeConfig.border_radius_base)
    }
  }, [currentHub])

  return null
}
```

**3.5 Dynamic Meta Tags**

```typescript
export function HubMetaTags() {
  const { currentHub } = useHubContext()
  const location = useLocation()

  const metaConfig = currentHub.meta_config || {}
  const title = metaConfig.og_title || currentHub.site_name || currentHub.name
  const description = metaConfig.og_description || currentHub.site_description || ''
  const ogImage = metaConfig.og_image_url || '/default-og-image.png'

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={`https://${window.location.host}${location.pathname}`} />
      <meta name="twitter:card" content={metaConfig.twitter_card || 'summary_large_image'} />
      <meta name="twitter:site" content={metaConfig.twitter_site || ''} />
    </Helmet>
  )
}
```

---

### Phase 4: Email Templates

**4.1 Email Template Schema**

```sql
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  template_key text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text NOT NULL,
  variables jsonb DEFAULT '[]', -- ["{{participant_name}}", "{{contribution_title}}"]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES participants(id),
  updated_by uuid REFERENCES participants(id),
  UNIQUE(hub_id, template_key)
);

CREATE INDEX idx_email_templates_hub_key ON email_templates(hub_id, template_key);

-- Email send queue (for retries)
CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id),
  template_key text NOT NULL,
  to_email text NOT NULL,
  to_name text,
  variables jsonb DEFAULT '{}',
  status text DEFAULT 'pending', -- pending, sent, failed
  attempts integer DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX idx_email_queue_status ON email_queue(status, created_at);

-- RLS policies
CREATE POLICY "hub_stewards_manage_email_templates" ON email_templates
  FOR ALL
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  );
```

**4.2 Email Template Keys**

```typescript
export const EMAIL_TEMPLATE_KEYS = {
  WELCOME: 'welcome',
  CONTRIBUTION_SUBMITTED: 'contribution_submitted',
  CONTRIBUTION_APPROVED: 'contribution_approved',
  PROPOSAL_CREATED: 'proposal_created',
  PROPOSAL_VOTE_REMINDER: 'proposal_vote_reminder',
  SPRINT_ASSIGNED: 'sprint_assigned',
  SPRINT_COMPLETED: 'sprint_completed',
  NOTIFICATION_DIGEST: 'notification_digest',
}
```

**4.3 Email Sending Edge Function**

`supabase/functions/send-email/index.ts`:
```typescript
import { Resend } from 'resend'

export async function handler(req: Request) {
  const { hub_id, template_key, to_email, to_name, variables } = await req.json()

  // Load hub email config
  const { data: hub } = await supabase
    .from('hubs')
    .select('hub_config')
    .eq('id', hub_id)
    .single()

  const emailConfig = hub.hub_config?.email_config || {}
  const resendApiKey = emailConfig.smtp_api_key_encrypted // Decrypt in production

  // Load email template
  const { data: template } = await supabase
    .from('email_templates')
    .select('subject, body_html, body_text')
    .eq('hub_id', hub_id)
    .eq('template_key', template_key)
    .single()

  if (!template) {
    return new Response('Template not found', { status: 404 })
  }

  // Substitute variables (Handlebars-style)
  let subject = template.subject
  let bodyHtml = template.body_html
  let bodyText = template.body_text

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, value as string)
    bodyHtml = bodyHtml.replace(regex, value as string)
    bodyText = bodyText.replace(regex, value as string)
  })

  // Send via Resend
  const resend = new Resend(resendApiKey)
  const { data, error } = await resend.emails.send({
    from: `${emailConfig.from_name} <${emailConfig.from_email}>`,
    to: to_email,
    subject,
    html: bodyHtml,
    text: bodyText,
    reply_to: emailConfig.reply_to
  })

  if (error) {
    // Log to email_queue for retry
    await supabase.from('email_queue').insert({
      hub_id,
      template_key,
      to_email,
      to_name,
      variables,
      status: 'failed',
      last_error: error.message
    })
    return new Response(error.message, { status: 500 })
  }

  return new Response(JSON.stringify({ message_id: data.id }), { status: 200 })
}
```

**4.4 Email Template Editor**

Create `/admin/email-templates` page:
```typescript
export function EmailTemplateEditor() {
  const { currentHub } = useHubContext()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyText, setBodyText] = useState('')

  async function saveTemplate() {
    await supabase.from('email_templates').upsert({
      hub_id: currentHub.id,
      template_key: selectedKey,
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      updated_by: auth.uid()
    })
  }

  async function sendTestEmail() {
    await supabase.functions.invoke('send-email', {
      body: {
        hub_id: currentHub.id,
        template_key: selectedKey,
        to_email: 'test@example.com',
        variables: { participant_name: 'Test User' }
      }
    })
  }

  return (
    <div className="email-template-editor">
      <aside>
        {Object.values(EMAIL_TEMPLATE_KEYS).map(key => (
          <button key={key} onClick={() => setSelectedKey(key)}>
            {key}
          </button>
        ))}
      </aside>
      <main>
        {selectedKey && (
          <>
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
            <textarea
              placeholder="HTML Body"
              value={bodyHtml}
              onChange={e => setBodyHtml(e.target.value)}
            />
            <textarea
              placeholder="Plain Text Body"
              value={bodyText}
              onChange={e => setBodyText(e.target.value)}
            />
            <button onClick={saveTemplate}>Save</button>
            <button onClick={sendTestEmail}>Send Test Email</button>
          </>
        )}
      </main>
    </div>
  )
}
```

---

### Phase 5: Legal & Compliance

**5.1 Legal Documents Schema**

```sql
CREATE TABLE legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- terms_of_service, privacy_policy, cookie_policy, operating_agreement
  version integer NOT NULL DEFAULT 1,
  content text NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES participants(id),
  UNIQUE(hub_id, document_type, version)
);

CREATE INDEX idx_legal_documents_hub_type ON legal_documents(hub_id, document_type, version DESC);

-- User acceptance tracking
CREATE TABLE legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id),
  legal_document_id uuid NOT NULL REFERENCES legal_documents(id),
  accepted_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  UNIQUE(participant_id, legal_document_id)
);

CREATE INDEX idx_legal_acceptances_participant ON legal_acceptances(participant_id);

-- RLS policies
CREATE POLICY "public_read_legal_documents" ON legal_documents
  FOR SELECT
  USING (true); -- Legal docs are public

CREATE POLICY "hub_stewards_manage_legal_documents" ON legal_documents
  FOR ALL
  USING (
    hub_id IN (
      SELECT hub_id FROM hub_memberships
      WHERE participant_id = auth.uid()
        AND role IN ('steward', 'principal')
    )
  );

CREATE POLICY "users_read_own_acceptances" ON legal_acceptances
  FOR SELECT
  USING (participant_id = auth.uid());

CREATE POLICY "users_insert_acceptances" ON legal_acceptances
  FOR INSERT
  WITH CHECK (participant_id = auth.uid());
```

**5.2 Dynamic Legal Pages**

Refactor `/legal/*` routes:
```typescript
export function LegalDocumentPage({ documentType }: { documentType: string }) {
  const { currentHub } = useHubContext()
  const [document, setDocument] = useState<LegalDocument | null>(null)
  const [hasAccepted, setHasAccepted] = useState(false)

  useEffect(() => {
    async function fetchDocument() {
      const { data } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('hub_id', currentHub.id)
        .eq('document_type', documentType)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      setDocument(data)
    }
    fetchDocument()

    async function checkAcceptance() {
      if (!auth.uid()) return
      const { data } = await supabase
        .from('legal_acceptances')
        .select('id')
        .eq('participant_id', auth.uid())
        .eq('legal_document_id', document.id)
        .single()

      setHasAccepted(!!data)
    }
    checkAcceptance()
  }, [currentHub.id, documentType])

  async function acceptDocument() {
    await supabase.from('legal_acceptances').insert({
      participant_id: auth.uid(),
      legal_document_id: document.id,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent
    })
    setHasAccepted(true)
  }

  return (
    <div className="legal-document">
      <h1>{documentType.replace(/_/g, ' ').toUpperCase()}</h1>
      <p>Effective Date: {document?.effective_date}</p>
      <div dangerouslySetInnerHTML={{ __html: document?.content }} />
      {!hasAccepted && auth.uid() && (
        <button onClick={acceptDocument}>I Accept</button>
      )}
    </div>
  )
}
```

**5.3 GDPR Compliance**

Data export per hub (already isolated by P301 RLS):
```typescript
export async function exportUserData(participantId: string, hubId: string): Promise<object> {
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .eq('hub_id', hubId)
    .single()

  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('participant_id', participantId)
    .eq('hub_id', hubId)

  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .eq('proposer_id', participantId)
    .eq('hub_id', hubId)

  // ... other tables

  return {
    participant,
    contributions,
    proposals,
    // ...
    exported_at: new Date().toISOString()
  }
}
```

Data deletion per hub:
```typescript
export async function deleteUserData(participantId: string, hubId: string): Promise<void> {
  // P301 RLS ensures only hub-scoped deletion
  await supabase.from('contributions').delete().eq('participant_id', participantId).eq('hub_id', hubId)
  await supabase.from('proposals').delete().eq('proposer_id', participantId).eq('hub_id', hubId)
  // ... cascade through all user data
  await supabase.from('participants').delete().eq('id', participantId).eq('hub_id', hubId)
}
```

---

### Phase 6: Testing & Deployment

**6.1 Test Hub Creation**

Create 3 test hubs with distinct brands:
1. **Nairobi Hub:** Green theme, Swahili content, safari imagery
2. **Zurich Hub:** Blue theme, German/English content, mountain imagery
3. **Mumbai Hub:** Orange theme, Hindi content, urban imagery

**6.2 White-Label Checklist**

```markdown
## White-Label Verification Checklist

### Visual Isolation
- [ ] Logo displays correctly per hub
- [ ] Colors (primary, bg, surface, border) match hub theme
- [ ] Favicon unique per hub
- [ ] OG image unique per hub
- [ ] No "Techne" branding visible on non-Techne hubs

### Content Isolation
- [ ] Landing page copy unique per hub
- [ ] About pages unique per hub
- [ ] Footer copyright unique per hub
- [ ] Meta tags unique per hub

### Email Isolation
- [ ] Email templates unique per hub
- [ ] From name/email unique per hub
- [ ] Email branding (colors, logo) unique per hub

### Legal Isolation
- [ ] Terms of Service unique per hub
- [ ] Privacy Policy unique per hub
- [ ] Cookie Policy unique per hub

### Functional Isolation
- [ ] Feature flags work per hub
- [ ] Data queries scoped to hub (P301 RLS)
- [ ] Agent keys scoped to hub (P301)
- [ ] Cross-hub data access blocked

### Performance
- [ ] Convergence config loads < 100ms
- [ ] Content queries cached
- [ ] Assets served via CDN
- [ ] No N+1 queries

### Security
- [ ] P301 RLS policies enforced
- [ ] Hub validation in all edge functions
- [ ] Audit logging functional
```

**6.3 Documentation Deliverables**

1. **Hub Creation Guide** (`docs/hub-creation.md`)
   - How to register a new hub
   - Required information (name, slug, timezone, theme)
   - Approval process

2. **Branding Guide** (`docs/branding-customization.md`)
   - Uploading logos and assets
   - Configuring theme colors
   - Setting meta tags and SEO

3. **Content Editor Manual** (`docs/content-editor.md`)
   - Using the content management UI
   - Markdown syntax reference
   - Content key reference

4. **Email Template Guide** (`docs/email-templates.md`)
   - Template variable syntax
   - Testing email templates
   - Configuring SMTP/Resend

5. **White-Label Deployment Guide** (`docs/white-label-deployment.md`)
   - Deploying a new hub instance
   - DNS and SSL configuration
   - Environment variables per hub

---

## Deliverables

1. **Database Migrations:**
   - `P302_hub_schema_extensions.sql` (Phase 1)
   - `P302_hub_content_cms.sql` (Phase 2)
   - `P302_hub_assets.sql` (Phase 3)
   - `P302_email_templates.sql` (Phase 4)
   - `P302_legal_documents.sql` (Phase 5)

2. **Updated Components:**
   - `lib/convergence.ts` (dynamic loading)
   - `lib/app-config.ts` (remove hardcoded modes)
   - `components/HubLogo.tsx` (dynamic logo)
   - `components/HubMetaTags.tsx` (dynamic meta)
   - `components/HubThemeInjector.tsx` (dynamic CSS)
   - `pages/LandingPage.tsx` (dynamic content)
   - `pages/AboutPage.tsx` (dynamic content)
   - `pages/LegalDocumentPage.tsx` (dynamic legal)

3. **Admin UI:**
   - `/admin/content` (content editor)
   - `/admin/email-templates` (email editor)
   - `/admin/assets` (asset upload)
   - `/admin/legal` (legal document editor)
   - `/admin/hub-settings` (hub configuration)

4. **Edge Functions:**
   - `send-email` (email sending)
   - `upload-hub-asset` (asset upload)

5. **Documentation:**
   - `docs/hub-creation.md`
   - `docs/branding-customization.md`
   - `docs/content-editor.md`
   - `docs/email-templates.md`
   - `docs/white-label-deployment.md`

6. **Test Suite:**
   - White-label verification checklist
   - 3 test hubs (Nairobi, Zurich, Mumbai)
   - Performance benchmarks

---

## Testing Strategy

### Unit Tests
- Dynamic convergence loading
- Content key substitution
- Email template variable substitution
- Theme CSS variable injection

### Integration Tests
- Hub creation flow (end-to-end)
- Content editor (CRUD operations)
- Email sending (test mode)
- Asset upload (Supabase Storage)

### Manual Testing
- Deploy 3 test hubs
- Verify complete visual isolation
- Test feature flag combinations
- Test email template rendering

### Performance Testing
- Convergence config load time (< 100ms)
- Content query response time (< 200ms)
- Email send latency (< 2s)
- Asset CDN delivery (< 500ms)

### Acceptance Criteria
- ✓ All hardcoded "Techne" branding removed from generic pages
- ✓ Hub creation UI functional (stewards only)
- ✓ Content editor functional with preview
- ✓ Email templates functional with test sends
- ✓ Legal documents dynamic per hub
- ✓ P301 RLS policies verified (prerequisite)
- ✓ Documentation complete
- ✓ 3 test hubs fully branded

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| P301 not completed | **CRITICAL** — Cannot guarantee tenant isolation | Block this sprint until P301 verified |
| Performance degradation | **MEDIUM** — Too many DB queries for content | Cache convergence configs; use CDN for assets |
| Content migration | **MEDIUM** — Existing hardcoded content needs extraction | Script to extract Techne content into DB; manual review |
| Email deliverability | **MEDIUM** — SMTP config per hub complex | Use Resend API (simpler); provide setup guide |
| Legal liability | **MEDIUM** — Per-hub legal docs need lawyer review | Require hub stewards to upload lawyer-reviewed docs |
| Subdomain DNS | **LOW** — DNS config per hub manual | Document DNS setup; consider Cloudflare API automation |

---

## Implementation Sequence

**Phase 1: Dynamic Hub Configuration**
- Hub schema extensions + migration
- Dynamic convergence loading
- Remove hardcoded modes

**Phase 2: Content Management System**
- Content schema + RLS policies
- Content editor UI
- Dynamic page rendering

**Phase 3: Visual Branding**
- Asset management schema + upload
- Logo/theme components
- Meta tags + SEO

**Phase 4: Email Templates**
- Email template schema
- Email sending edge function
- Email editor UI

**Phase 5: Legal + Testing**
- Legal documents schema + GDPR
- Testing (3 test hubs)
- Documentation + deployment

---

## Success Metrics

- **Deployment velocity:** New hub deployed in < 1 day (vs. weeks with code fork)
- **Branding completeness:** 100% visual isolation (no Techne branding on other hubs)
- **Content flexibility:** Stewards can edit all copy without code changes
- **Email deliverability:** > 95% delivery rate
- **Performance:** < 100ms convergence config load, < 200ms content queries
- **Security:** Zero cross-hub data leaks (P301 verified)

---

## Related Work

- **Blocks:** Federation expansion (Nairobi, Zurich hubs need branded instances)
- **Blocks:** White-label licensing revenue stream
- **Dependency:** P301 (Multi-Tenancy Security) — MUST complete first
- **Enables:** Custom domain routing per hub (future sprint)
- **Enables:** Per-hub analytics dashboards (future sprint)
- **Enables:** White-label marketplace (future sprint)

---

**Complexity:** XL
**Priority:** HIGH (enables platform business model)
**Proposed by:** Dianoia
**Date:** 2026-03-20
