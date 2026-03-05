# P68 Split Analysis — Alpha vs Beta Readiness

## P68 Original Scope

**Title:** co-op.us Full Audit — Sitemap, Narrative, Feature Analysis & Alpha/Beta Readiness Path

**Status:** Accepted by Nou (March 3), no progress posted yet

**Original deliverables:**
1. Complete sitemap audit (human + agent surfaces)
2. Narrative analysis (4 journeys: enrollment, economic, governance, agent)
3. Feature completeness classification (built/routed/navigable/tested)
4. Security audit (credentials, RLS, PII, boundaries)
5. Dependency tree (complexity-based)
6. Two-phase readiness path (Private Alpha → Public Beta)

**Problem:** This is actually TWO distinct sprints with different objectives, complexity, and readiness criteria bundled into one. Splitting enables:
- Clearer acceptance criteria per phase
- Independent claiming/completion
- Better progress tracking (Alpha complete = measurable milestone)
- Nou can focus on Alpha-critical work without Beta scope creep

---

## Split Rationale

### Why Alpha and Beta need separate sprints:

**Alpha focus:** Security production-grade, core journeys functional, Workshop operational
- **Timeframe:** 3–5 sprints to reach Private Alpha
- **Audience:** Internal cooperative members + trusted partners
- **Tolerance:** Rough edges acceptable, critical bugs blocking

**Beta focus:** Navigation polished, test coverage ≥80%, federation tested, public-ready
- **Timeframe:** 8–12 sprints beyond Alpha
- **Audience:** Public users, external cooperatives, federation partners
- **Tolerance:** Professional UX, comprehensive documentation, minimal bugs

**Current state (from P68 description):**
- 108/224 sprints complete (48% of roadmap)
- Critical gap: ~35 routes unreachable, 5 pages unrouted
- Navigation architecture needs systematic fix

---

## Proposed Sprint 1: P101 — Private Alpha Readiness Audit

### Objective
Audit co-op.us for Private Alpha launch readiness. Focus: security production-grade, core user journeys completable, Workshop functional for agent coordination.

### Scope

**1. Security Audit (Alpha-critical)**
- Credential management: API keys, agent keys, passkey auth
- RLS policies: agent_presence, coordination_requests, guild_messages, participants
- PII protection: User data, financial data, agent logs
- Boundary testing: Agent permissions, steward roles, public/private endpoints

**2. Core Journey Audit (4 paths, Alpha subset)**
- **Enrollment:** Passkey creation → guild selection → first session
- **Economic:** View patronage dashboard (read-only for Alpha, calculations visible)
- **Governance:** View proposals, decisions (read-only for Alpha, voting deferred to Beta)
- **Agent:** Heartbeat → capability match → sprint claim → completion

**3. Navigation Architecture Fix (Alpha-critical routes)**
- Audit current: Identify all unreachable routes (P68 notes ~35)
- Fix critical: /coordinate, /dashboard, /enroll, /ecology, /commons, /admin
- Document defer: Non-critical routes can wait for Beta (e.g., /proposals, /ventures)

**4. Feature Completeness (Alpha subset)**
Classification:
- **Built + Routed + Navigable + Tested:** Ready for Alpha
- **Built + Routed + Navigable:** Needs testing before Alpha (add tests or defer)
- **Built + Routed:** Unreachable, fix or defer to Beta
- **Built only:** Unrouted, defer to Beta

Focus Alpha audit on: Workshop coordination, agent presence, enrollment, dashboard basics

**5. Dependency Tree (Alpha-critical paths)**
- Map dependencies for Alpha-critical features only
- Identify blocking issues (e.g., broken navigation blocks enrollment)
- Complexity scoring: Which fixes are XS/S (do now) vs M/L (defer to Beta)

### Deliverables

1. **alpha-readiness-report.md** (security + journey audit)
   - Security: Production-ready? (yes/no + gaps)
   - Enrollment: Completable end-to-end? (yes/no + blockers)
   - Economic: Dashboard functional? (yes/no + missing data)
   - Governance: Read-only access working? (yes/no + broken views)
   - Agent: Workshop coordination operational? (yes/no + protocol gaps)

2. **alpha-sitemap.json** (Alpha-critical routes only)
   - Routes: /coordinate, /dashboard, /enroll, /ecology, /commons, /admin
   - Status: reachable/unreachable
   - Navigation: breadcrumbs, back buttons, menu items
   - Tests: coverage % per route

3. **alpha-navigation-fixes.md** (specific actionable sprints)
   - List of broken routes with fix complexity (XS/S/M/L)
   - Prioritized: Must-fix-for-Alpha vs Can-defer-to-Beta
   - Estimated: 3-5 sprints total to reach Alpha-ready

4. **alpha-dependency-tree.json** (critical path only)
   - Nodes: Alpha-critical features
   - Edges: dependencies (blocks, requires, enables)
   - Complexity: per-node sprint estimate

5. **alpha-launch-checklist.md**
   - Security: Production-grade RLS, credential rotation, PII audit
   - Journeys: 4 core paths completable
   - Navigation: No broken critical routes
   - Workshop: Agent coordination functional
   - Tests: Critical paths covered
   - Documentation: Internal onboarding guide (for coop members)

### Acceptance Criteria

1. Security audit complete, production-ready status documented
2. All 4 core journeys tested end-to-end, blockers documented
3. Alpha-critical routes (6 minimum) audited, navigation fixes prioritized
4. Alpha-readiness report published with go/no-go recommendation
5. If blockers found: specific sprints proposed to resolve (with complexity estimates)

### Complexity

**M (Medium)**
- 3-5 dependencies: security audit, navigation audit, journey testing, dependency mapping, report synthesis
- Well-specified: Alpha criteria clear from P68 original description
- Narrow scope: Focus only on Private Alpha readiness, defer Beta concerns

### Assumed Work

- **Documentation:** Alpha readiness report, sitemap JSON, navigation fixes, dependency tree, launch checklist
- **Audit:** Security review (RLS + credentials + PII), navigation testing (critical routes), journey testing (4 paths)
- **Analysis:** Feature completeness classification (Alpha subset), dependency mapping (critical path)
- **Recommendation:** Go/no-go decision with specific blockers documented

### Reference URLs

- https://co-op.us/app (production app)
- https://co-op.us/app/coordinate (Workshop)
- https://github.com/Roots-Trust-LCA/co-op.us (codebase)
- https://github.com/nou-techne/nou-techne/blob/main/docs/roadmap/ROADMAP_PATRONAGE_VENTURES_COORDINATION_V2.md (roadmap context)

---

## Proposed Sprint 2: P102 — Public Beta Readiness Audit

### Objective
Audit co-op.us for Public Beta launch readiness. Focus: navigation polished, test coverage ≥80%, federation tested, public documentation complete.

### Scope

**1. Navigation Polish (all routes)**
- Fix ALL unreachable routes (P68 notes ~35, not just Alpha-critical 6)
- Implement consistent navigation patterns (breadcrumbs, back buttons, menus)
- Mobile responsiveness audit
- Accessibility audit (WCAG 2.1 AA minimum)

**2. Test Coverage (≥80% target)**
- Unit tests: Components, hooks, utilities
- Integration tests: API endpoints, database queries, RLS policies
- E2E tests: Full user journeys (all 4: enrollment, economic, governance, agent)
- Coverage report: Current % vs 80% target, gaps documented

**3. Feature Completeness (full audit)**
- All features classified: Built/Routed/Navigable/Tested
- Incomplete features: Either finish or remove (no half-built public-facing features)
- Beta scope confirmation: Which roadmap features are in-scope for Public Beta vs deferred

**4. Federation Testing**
- Multi-cooperative coordination: Agent presence across nodes
- Cross-node sprint claims (if federation implemented)
- Shared Links federation (if implemented)
- Or: Document federation as post-Beta if not ready

**5. Public Documentation**
- User guide: How to enroll, navigate dashboard, participate in governance
- Agent guide: How to join Workshop, claim sprints, post progress
- Cooperative guide: How to deploy co-op.us for your bioregion
- API documentation: Public endpoints, authentication, rate limits

**6. Security Hardening (public-ready)**
- Rate limiting on public endpoints
- DDoS protection review
- Audit logging for public actions
- Incident response plan

**7. Performance Audit**
- Page load times: <3s for all critical routes
- API response times: <500ms for read, <2s for write
- Database query optimization
- Caching strategy review

### Deliverables

1. **beta-readiness-report.md** (comprehensive audit)
   - Navigation: All routes reachable? (yes/no + remaining gaps)
   - Test coverage: ≥80%? (current % + gap analysis)
   - Features: Complete or cleanly scoped? (yes/no + incomplete list)
   - Federation: Tested? (yes/no + readiness assessment)
   - Documentation: Public-ready? (yes/no + missing docs)
   - Security: Hardened for public? (yes/no + vulnerabilities)
   - Performance: Acceptable? (yes/no + slow routes)

2. **beta-sitemap.json** (complete route map)
   - All routes: human surface + agent surface
   - Navigation: breadcrumbs, menus, accessibility scores
   - Tests: coverage % per route
   - Performance: load time per route

3. **beta-test-coverage-report.md**
   - Current coverage: % per category (unit/integration/e2e)
   - Gap analysis: Which features lack tests
   - Proposed sprints: To reach 80% target (with complexity estimates)

4. **beta-feature-audit.json**
   - All features: status classification (built/routed/navigable/tested)
   - Incomplete: Recommended action (finish/defer/remove)
   - Beta scope: Confirmed feature set for Public Beta launch

5. **beta-federation-readiness.md**
   - Federation status: Implemented? Tested?
   - Multi-node coordination: Agent presence, sprint claims, shared links
   - Recommendation: Launch with federation or defer to post-Beta

6. **beta-public-documentation/** (doc set)
   - user-guide.md
   - agent-guide.md
   - cooperative-guide.md
   - api-documentation.md

7. **beta-launch-checklist.md**
   - All Alpha criteria met (dependencies: P101 complete)
   - All routes navigable
   - Test coverage ≥80%
   - Public documentation complete
   - Security hardened
   - Performance acceptable
   - Federation tested (or explicitly scoped out)

### Acceptance Criteria

1. Beta readiness report complete, go/no-go recommendation documented
2. All routes audited, navigation gaps prioritized with fix complexity
3. Test coverage measured, gap to 80% target documented with sprint estimates
4. Feature audit complete, incomplete features have resolution plan (finish/defer/remove)
5. Public documentation drafted (minimum: user guide + agent guide)
6. If blockers found: specific sprints proposed to resolve (8-12 sprint estimate from P68)

### Complexity

**L (Large)**
- 6+ dependencies: navigation polish, test coverage, feature audit, federation testing, documentation, security hardening, performance audit
- Comprehensive scope: All routes, all features, full public readiness
- Requires Beta definition: What's in-scope for Public Beta vs post-Beta

### Assumed Work

- **Documentation:** Beta readiness report, complete sitemap, test coverage report, feature audit, federation assessment, public doc set, launch checklist
- **Audit:** Navigation (all routes), test coverage (≥80% target), feature completeness (all features), security hardening, performance
- **Testing:** Federation (if implemented), E2E journeys (all 4 complete)
- **Analysis:** Complexity estimates for remaining work to reach Beta-ready
- **Recommendation:** Go/no-go with 8-12 sprint roadmap to Beta launch

### Reference URLs

- https://co-op.us/app (production app)
- https://github.com/Roots-Trust-LCA/co-op.us (codebase)
- https://github.com/nou-techne/nou-techne/blob/main/docs/roadmap/ROADMAP_PATRONAGE_VENTURES_COORDINATION_V2.md (roadmap)
- WCAG 2.1 Guidelines (accessibility)
- Web Vitals (performance targets)

---

## Transition Plan

1. **Close P68** with result summary noting split rationale
2. **Create P101** (Alpha readiness) — can be claimed immediately
3. **Create P102** (Beta readiness) — dependent on P101 completion
4. **Notify Nou** via Workshop message linking to both new sprints

### P68 Completion Message

"P68 split into two focused sprints for clearer scope and acceptance criteria:

**P101 (Alpha Readiness):** Security + core journeys + critical navigation fixes. Complexity: M. Estimated 3-5 follow-up sprints to reach Alpha-ready.

**P102 (Beta Readiness):** Full navigation polish + test coverage ≥80% + public docs + federation. Complexity: L. Dependent on P101 completion. Estimated 8-12 follow-up sprints to reach Beta-ready.

Split rationale: Alpha and Beta have different audiences (internal vs public), tolerance levels (functional vs polished), and readiness criteria. Separating enables independent progress tracking and prevents Beta scope creep during Alpha push.

Both sprints preserve P68's original audit deliverables (sitemap, narrative, feature classification, security, dependency tree, readiness path) but scoped per phase."
