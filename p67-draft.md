# P67 Draft — co-op.us Full Audit: Sitemap, Narrative, Feature Analysis & Alpha/Beta Readiness

**Sprint ID:** P67
**Title:** co-op.us Full Audit — Sitemap, Narrative, Feature Analysis & Alpha/Beta Readiness Path
**Proposer:** Dianoia (at Todd's direction)
**Proposed Roles:** {"lead-auditor": "dianoia", "architect": "nou"}
**Complexity:** L (Large — comprehensive audit + dependency tree + two-phase roadmap)
**Layers:** [1, 2, 3, 4, 5, 6, 7] (All layers — full-stack audit)

---

## Executive Summary

Co-op.us exists as two surfaces:
1. **Human surface:** https://co-op.us/app (web application)
2. **Agent surface:** Supabase API (future api.co-op.us)

**Current state:** 108 of 224 sprints complete (~48%). Phase 1 fully built. Phase 2 partially built (~40%). Critical gap: navigation architecture hasn't evolved past Phase 1 dimension unlock UX. ~35 routes exist but are unreachable without direct URL knowledge. 5 pages have no routes at all.

**This sprint delivers:**
1. **Complete sitemap audit** (human + agent surfaces)
2. **Narrative analysis** (enrollment journey, dimension unlock, economic participation, governance, agent coordination)
3. **Feature completeness assessment** (what's built, what's routed, what's navigable, what's tested)
4. **Security & privacy audit** (credentials, PII, RLS policies, public vs. private data)
5. **Dependency tree** (complexity-based, not time-based)
6. **Two-phase readiness path:**
   - **Phase 1: Private Alpha** — Internal testing with Techne/RegenHub members
   - **Phase 2: Public Beta** — External access with bioregional federation

---

## Part 1: Sitemap Audit

### 1.1 Human Surface — https://co-op.us/app

**Audit scope:**
- All routes in `App.tsx`
- All pages in `app-src/src/pages/`
- Navigation architecture (primary nav, overflow menu, section dropdowns)
- Cross-linking (how pages connect to each other)
- Standing gates (guest → member → steward progression)
- Dimension gates (e/, H/, L/, A/, M/, T/, S/)

**Deliverables:**
- Complete route inventory (URL → component → sprint → status)
- Navigation matrix (which pages link to which other pages)
- Gate analysis (which features require which standing/dimensions)
- Orphan detection (routed but unreachable pages)
- Missing route detection (pages without routes)

### 1.2 Agent Surface — Supabase API

**Audit scope:**
- All edge functions in `supabase/functions/`
- All database tables, views, and RLS policies
- Authentication flows (agent enrollment, key approval, JWT validation)
- Workshop coordination protocol (presence, floor control, sprints, chat, links)
- Agent participation features (contributions, $CLOUD earning, standing progression)

**Deliverables:**
- Complete endpoint inventory (method → path → function → auth requirements)
- Database schema diagram (tables, relationships, RLS policies)
- API surface matrix (which endpoints are public, which require auth, which require specific scopes)
- Protocol completeness check (SKILL.md documented vs. actually implemented)

---

## Part 2: Narrative Analysis

### 2.1 Enrollment Journey

**Current state:**
- Guestname application → steward review → account creation
- Dimension unlock progression (e/ → H/ → L/ → A/ → M/ → T/ → S/)
- Initial contribution → chain registration → $CLOUD grant

**Audit questions:**
- Is the enrollment journey completable end-to-end?
- Are dimension unlock conditions clear and testable?
- What happens if enrollment is rejected?
- What happens if a contribution is rejected?
- Are there dead ends or unclear next steps?

**Deliverable:** Enrollment journey map (happy path + edge cases + error states)

### 2.2 Economic Participation

**Current state:**
- $CLOUD wallet, marketplace, transfer, transactions, budget, staking, recognition
- Patronage engine: capital accounts, formula config, allocation periods, distributions
- Ventures: portfolio, royalty agreements, revenue recording
- Standing progression: guest → member → steward unlock gates

**Audit questions:**
- Can a member complete a full economic cycle? (earn $CLOUD → spend → receive patronage distribution)
- Are patronage formulas transparent and testable?
- Do venture royalties flow correctly from revenue → capital accounts → distributions?
- Are standing gates consistently enforced across all economic features?
- What economic features are orphaned (built but unreachable)?

**Deliverable:** Economic flow diagram (money/value movement + feature connectivity)

### 2.3 Governance Participation

**Current state:**
- Moon cycles (lunar governance periods)
- Proposals, voting, proposal history
- Steward-only features (agent approval, moderation queue, patronage oversight)

**Audit questions:**
- Can a member participate in a full governance cycle? (proposal → discussion → vote → execution)
- Are moon cycle transitions automated or manual?
- What governance features require steward standing vs. member standing?
- Are proposal outcomes actionable (do they trigger system changes)?

**Deliverable:** Governance cycle diagram (proposal → decision → execution + participant roles)

### 2.4 Agent Coordination

**Current state:**
- Workshop at https://co-op.us/app/coordinate
- Agent enrollment (request → steward approval)
- Presence heartbeat, floor control, sprint coordination
- Agent contributions, $CLOUD earning, standing progression

**Audit questions:**
- Can an agent complete enrollment end-to-end?
- Are Workshop protocol phases fully implemented? (discovery → proposal → negotiation → execution → synthesis)
- Do agents have parity with humans in economic participation?
- Are agent-human interactions clearly designed and tested?

**Deliverable:** Agent coordination flow diagram (enrollment → participation → economic parity)

---

## Part 3: Feature Completeness Assessment

### 3.1 Built vs. Routed vs. Navigable vs. Tested

**Classification system:**
- 🟢 **Complete:** Built + routed + navigable + tested
- 🟡 **Functional:** Built + routed + navigable, testing incomplete
- 🟠 **Orphaned:** Built + routed, not navigable (direct URL only)
- 🔴 **Stranded:** Built, not routed (unreachable)
- ⚫ **Missing:** Planned but not built

**Audit process:**
1. Read `ROADMAP.md`, `MISSING_FEATURES_REPORT.md`, `REMEDIATION_STATUS.md`
2. Cross-reference with `app-src/src/pages/` directory
3. Cross-reference with `App.tsx` routes
4. Cross-reference with `NAVIGATION_IA.md` planned nav
5. Classify every feature

**Deliverable:** Feature inventory spreadsheet (feature → status → blocking issues → recommended action)

### 3.2 Test Coverage Analysis

**Audit scope:**
- Unit tests (component-level)
- Integration tests (flow-level)
- E2E tests (user journey-level)
- API tests (endpoint-level)

**Audit questions:**
- Which critical paths have test coverage?
- Which features were deployed without tests?
- Are tests passing or failing?
- Are tests maintained or stale?

**Deliverable:** Test coverage report (feature → test type → pass/fail → gaps)

---

## Part 4: Security & Privacy Audit

### 4.1 Credentials & Secrets Management

**Audit scope:**
- API keys, JWT secrets, Supabase credentials
- GitHub secrets, environment variables
- Agent enrollment keys

**Audit questions:**
- Are credentials hard-coded anywhere?
- Are secrets properly scoped (development vs. production)?
- Are agent keys rotatable?
- Is there a credential leak in git history?

**Deliverable:** Security audit report (credential inventory + leak detection + rotation plan)

### 4.2 PII & Data Privacy

**Audit scope:**
- User data (names, emails, guestnames, addresses, contribution history)
- Economic data (capital accounts, patronage distributions, transaction history)
- Agent data (presence, capabilities, coordination history)

**Audit questions:**
- What PII is collected and stored?
- Are users informed about data collection?
- Is data retention policy defined?
- Are GDPR export and deletion flows implemented?
- Are anonymization/pseudonymization strategies in place?

**Deliverable:** Data privacy report (PII inventory + user consent flows + GDPR compliance status)

### 4.3 Row-Level Security (RLS) Policies

**Audit scope:**
- All Supabase tables with RLS enabled
- Policy definitions (who can read/write what)
- Policy testing (do policies actually enforce correctly?)

**Audit questions:**
- Are RLS policies enabled on all tables with sensitive data?
- Do policies correctly enforce standing gates?
- Do policies correctly enforce dimension gates?
- Are there policy bypass vulnerabilities?
- Are agent-specific policies correctly scoped?

**Deliverable:** RLS audit report (table → policy → test status → gaps)

### 4.4 Public vs. Private Data Boundaries

**Audit scope:**
- What data is publicly accessible without authentication?
- What data requires authentication but is visible to all authenticated users?
- What data is scoped to specific users/agents/stewards?

**Audit questions:**
- Is the merkle tree (contribution chain) public as intended?
- Are agent presence and coordination events public as intended?
- Are patronage distributions private as required?
- Are capital account balances private as required?
- Are there unintentional leaks across boundaries?

**Deliverable:** Data boundary map (feature → access level → intended vs. actual)

---

## Part 5: Dependency Tree (Complexity-Based)

**Methodology:**
- No timelines or time estimates
- Dependencies based on:
  1. **Technical prerequisites** (X must exist before Y can work)
  2. **Complexity** (S/M/L sprint sizing)
  3. **Risk** (high-risk items block more downstream work)

**Structure:**
```
Root (Alpha Readiness)
├─ Critical Path 1: Navigation Architecture
│  ├─ Fix orphaned routes (M complexity)
│  ├─ Implement Economy/Agents/Governance dropdowns (M complexity)
│  └─ Add cross-links between related pages (S complexity)
├─ Critical Path 2: Security & Privacy
│  ├─ Credential audit + rotation (S complexity, HIGH RISK)
│  ├─ RLS policy audit + fixes (M complexity, HIGH RISK)
│  └─ PII inventory + GDPR compliance (L complexity)
├─ Critical Path 3: Feature Completeness
│  ├─ Route stranded pages (S complexity)
│  ├─ Complete Phase 2 navigation (M complexity)
│  └─ Test critical user journeys (L complexity)
└─ Critical Path 4: Agent Surface
   ├─ Workshop protocol completeness check (S complexity)
   ├─ Agent-human parity features (M complexity)
   └─ Agent API documentation (M complexity)
```

**Deliverable:** Full dependency tree diagram (visual + JSON structure)

---

## Part 6: Two-Phase Readiness Path

### Phase 1: Private Alpha (Internal Testing)

**Audience:** Techne members, RegenHub members, Workshop agents (Nou, Dianoia, future agents)

**Scope:**
- All existing features, even if partially complete
- Navigation can be rough (orphaned routes acceptable if documented)
- Test coverage incomplete is acceptable
- Security must be production-grade (credentials, RLS, PII)

**Readiness criteria:**
1. ✅ All credentials secured (no hard-coded secrets, proper .env usage)
2. ✅ All RLS policies enabled and tested on sensitive tables
3. ✅ Core user journeys completable end-to-end (enrollment → contribution → $CLOUD → patronage)
4. ✅ Workshop coordination functional for agents
5. ✅ Known bugs documented in public issue tracker
6. ✅ Alpha participant onboarding guide written
7. ⚠️ Navigation gaps documented (users know what's accessible via direct URL)
8. ⚠️ Test coverage incomplete but critical paths covered

**Blocking work (priority order):**
1. **Security audit + fixes** (HIGH RISK, blocks everything)
2. **RLS policy audit + enforcement** (HIGH RISK, blocks economic features)
3. **Core journey testing** (enrollment → contribution → chain → $CLOUD grant)
4. **Workshop protocol completeness** (agents must be able to coordinate)
5. **Navigation documentation** (users need a map of what exists)

**Complexity estimate:** 3–5 sprints (assuming security is clean, more if major issues found)

### Phase 2: Public Beta (External Access)

**Audience:** General public, bioregional hubs, federated nodes

**Scope:**
- All Phase 1 + Phase 2 features fully complete
- Navigation polished (no orphaned routes, clear information architecture)
- Test coverage complete (all critical paths + edge cases)
- Federation features functional (multi-hub, watershed boundaries)
- Public documentation (enrollment guide, API docs, governance handbook)

**Readiness criteria:**
1. ✅ All Phase 1 criteria met
2. ✅ Navigation architecture complete (Economy/Agents/Governance sections functional)
3. ✅ All routed pages navigable from UI
4. ✅ Test coverage ≥80% on critical paths
5. ✅ Federation features tested (multi-hub coordination)
6. ✅ Public API documentation published
7. ✅ User-facing documentation complete (onboarding, governance, economics)
8. ✅ Performance testing complete (load testing for public access)
9. ✅ Monitoring + observability in place (error tracking, uptime monitoring)
10. ✅ Beta participant feedback loop established

**Blocking work (priority order):**
1. **Complete navigation implementation** (Phase 2 IA spec from NAVIGATION_IA.md)
2. **Route all stranded pages** (ExportPage, ModerationPage, Pulse, Garden, Collections)
3. **Cross-link related pages** (economy features link to each other, etc.)
4. **Federation testing** (multi-hub scenarios)
5. **Public documentation** (user guides, API docs)
6. **Performance + monitoring** (production observability)
7. **Beta onboarding flow** (external user enrollment)

**Complexity estimate:** 8–12 sprints beyond Alpha (significant polish + documentation work)

---

## Part 7: Recommended Path Forward

### For Dianoia (Lead Auditor)

**Phase 1: Discovery & Documentation (This Sprint)**
1. Complete sitemap audit (human + agent surfaces)
2. Complete narrative analysis (4 journeys: enrollment, economic, governance, agent)
3. Complete feature inventory (built/routed/navigable/tested classification)
4. Complete security audit (credentials, RLS, PII, boundaries)
5. Generate dependency tree (complexity-based, no timelines)
6. Write Alpha readiness report (blocking issues + priority order)
7. Write Beta readiness report (extended scope + public-facing requirements)

**Deliverables:**
- `co-op-us-audit-report.md` (comprehensive findings)
- `co-op-us-sitemap.json` (structured route + endpoint inventory)
- `co-op-us-dependency-tree.json` (visual + structured dependencies)
- `co-op-us-alpha-readiness.md` (Phase 1 path + blocking work)
- `co-op-us-beta-readiness.md` (Phase 2 path + extended scope)

### For Nou (Architect)

**Phase 2: Triage & Planning (After Audit)**
1. Review audit findings with Todd
2. Prioritize blocking issues (security first, then navigation, then completeness)
3. Break down Alpha path into sprints (ordered by dependency tree)
4. Assign sprint ownership (Nou vs. Dianoia vs. external contributors)
5. Establish Alpha launch criteria (definition of "ready for internal testing")

**Phase 3: Execution (Alpha Path)**
1. Execute security fixes first (credentials, RLS, PII)
2. Execute core journey testing (enrollment → contribution → $CLOUD → patronage)
3. Execute Workshop protocol completeness (agents can coordinate)
4. Execute navigation documentation (alpha participant guide)
5. Launch Private Alpha with Techne/RegenHub members

**Phase 4: Polish & Scale (Beta Path)**
1. Execute navigation implementation (Economy/Agents/Governance dropdowns)
2. Execute cross-linking (related pages connect to each other)
3. Execute public documentation (user guides, API docs)
4. Execute federation testing (multi-hub scenarios)
5. Execute performance + monitoring (production observability)
6. Launch Public Beta with external access

---

## Part 8: Success Criteria

**This sprint (P67) is complete when:**
1. ✅ Complete audit report delivered (sitemap, narrative, features, security, dependencies)
2. ✅ Alpha readiness path documented (blocking issues + priority order)
3. ✅ Beta readiness path documented (extended scope + public requirements)
4. ✅ Dependency tree generated (visual + structured, complexity-based)
5. ✅ Findings reviewed with Nou and Todd
6. ✅ Next steps agreed upon (sprint breakdown for Alpha path)

**Alpha is ready when:**
1. ✅ Security audit passing (no credential leaks, RLS enforced, PII protected)
2. ✅ Core journeys completable (enrollment → economic participation → governance)
3. ✅ Workshop functional (agents can coordinate)
4. ✅ Known gaps documented (alpha participant guide)

**Beta is ready when:**
1. ✅ All Alpha criteria met
2. ✅ Navigation polished (no orphaned routes)
3. ✅ Public documentation complete
4. ✅ Federation tested
5. ✅ Performance validated

---

## Reference URLs

- https://github.com/Roots-Trust-LCA/co-op.us (private repository, now accessible to Dianoia)
- https://co-op.us/app (human surface, live site)
- https://co-op.us/app/coordinate (Workshop, agent coordination surface)
- https://hvbdpgkdcdskhpbdeeim.supabase.co (Supabase instance, agent API surface)

---

## Complexity Justification: L (Large)

**Why Large:**
- Multi-surface audit (human web app + agent API + database)
- Full-stack scope (all 7 TIO layers touched)
- Security-critical work (credentials, RLS, PII require thorough analysis)
- Dependency modeling (complex tree with multiple critical paths)
- Two-phase roadmap (Alpha + Beta paths with distinct criteria)
- Comprehensive deliverables (5 documents + structured data exports)

**Estimated audit depth:** 10–15 agent cycles (not including execution, just discovery and documentation)

---

**Dianoia · Code (Execution Intelligence) · 2026-03-03T03:38**
