# Techne Intranet Refinement — PRD & Technical Specification

**Document ID:** TCH-PRD-002
**Version:** 0.1 / Draft for Review
**Date:** 2026-04-13
**Author:** Dianoia (Execution Intelligence Agent)
**Stakeholders:** Todd, Nou, RegenHub PB LCA Technical Working Group

---

## Executive Summary

This document specifies the technical roadmap for refining the **Techne Institute Intranet** (`techne.institute/intranet`) to align with the **Toolbox Vision** articulated in the five foundational documents:

1. **The Design Science Gateway** — Participatory methodology framework
2. **The REA Specification** — Resource-Event-Agent substrate
3. **The Techne Toolbox** — Two-tier foundations + lenses architecture
4. **Speak the Ledger** — Voice-first HCI
5. **The Third Floor** — End-to-end scenario validation

**Current State:** React SPA with static documents, dark/light theme, basic navigation
**North Star:** Modular, voice-first, event-sourced cooperative operating system serving as demonstrable toolbox for revenue generation

**Timeline:** 18 months (6 blocks of 3 months each)
**Delivery Model:** Incremental, with each block delivering usable capability

---

## 1. Vision Alignment

### 1.1 Strategic Goals

The refined intranet serves three purposes:

1. **Internal Operations** — Actual system of record for RegenHub coordination, patronage, and governance
2. **Demonstration Surface** — Live showcase of the toolbox for prospective client organizations
3. **Revenue Foundation** — Proof-of-concept that justifies $50K+ annual subscriptions for hosted Techne deployments

### 1.2 Design Principles (from Gateway)

- **Notice → Design → Build & Test → Learn** — Every feature follows the design science cycle
- **Voice-first, not form-first** — Natural language is the primary input method
- **Immutability + Auditability** — Event-sourced; no silent rewrites
- **Compositional** — Foundations and lenses share substrate, compose without integration work
- **Participatory** — Members without technical background must be first-class users

### 1.3 Success Criteria

- **For RegenHub:** All operational coordination moves to Techne by end of Block 3 (9 months)
- **For Revenue:** At least 2 pilot organizations running hosted Techne by end of Block 6 (18 months)
- **For Technical Validation:** 704(b) book capital accounts reconcile against event log by end of Block 4 (12 months)

---

## 2. Current State Assessment

### 2.1 What Exists Today

**Deployed at:** `https://techne.institute/intranet/`

**Architecture:**
- React SPA built with Vite
- Static HTML documents for specifications (toolbox, REA, voice, gateway, third-floor)
- Dark/light theme toggle
- Navigation sidebar with document links
- Responsive design (mobile-first)

**Infrastructure:**
- Hosted on GitHub Pages or similar static host
- No backend
- No database
- No authentication
- No REA substrate
- No voice interface

**Strengths:**
- Clean, readable design language (Libre Baskerville serif + IBM Plex Mono)
- Coherent visual system (gold accent, dark theme)
- Well-structured documents that articulate the vision

**Gaps:**
- **No operational capability** — It's documentation, not a working system
- **No REA substrate** — Event log, agents, resources are all unimplemented
- **No voice interface** — Forms don't exist; voice certainly doesn't
- **No multi-user coordination** — No concept of agents, working groups, or permissions
- **No data persistence** — Refresh the page, everything is gone

### 2.2 What's Missing (North Star vs. Current)

| Vision Component | Current State | Gap |
|-----------------|---------------|-----|
| REA Event Log | None | Full substrate unimplemented |
| Voice-First HCI | None | No audio input, no LLM integration |
| Treasury Foundation | None | No resource tracking, no balances |
| People Foundation | None | No agent registry, no membership classes |
| Agreements Foundation | None | No commitments, no contracts |
| Patronage Lens | None | No patronage accounting |
| Governance Lens | None | No voting, no proposals |
| Reconciliation Lens | None | No commitment fulfillment tracking |
| Learning Lens | None | No learning artifacts, no pattern export |
| Workshop Coordination | None | No capability grid, no sprint tracking |

---

## 3. North Star Architecture

### 3.1 Target Stack (18-month horizon)

**Data Layer:**
- PostgreSQL 15+ (Supabase hosted or self-hosted)
- REA schema: `agents`, `resources`, `events`, `commitments`, `contracts`, `policies`
- Materialized views for derived balances
- Row-Level Security (RLS) for multi-tenant access control

**API Layer:**
- Supabase Edge Functions (Deno runtime)
- REST API for data access (via Supabase auto-generated endpoints)
- WebSocket/Realtime for live updates (Supabase Realtime)
- Claude API integration for voice intent parsing

**Application Layer:**
- Next.js 14+ (React Server Components + App Router)
- TypeScript strict mode
- Voice input via Web Speech API → Whisper transcription → Claude intent parsing
- Glide or custom mobile app for member-facing views (Block 5+)

**Automation Layer:**
- Make.com workflows for transcript ingestion pipeline
- OR Supabase Edge Functions for event automation (TBD based on complexity)

**Deployment:**
- Vercel for Next.js app
- Supabase for database + Edge Functions + Realtime
- Cloudflare for static assets + CDN

### 3.2 REA Data Model (Core Tables)

```sql
-- AGENTS (Foundation: People)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  agent_class_id UUID REFERENCES agent_classes(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'prospective')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RESOURCES (Foundation: Treasury)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type_id UUID REFERENCES resource_types(id),
  custodian_id UUID REFERENCES agents(id),
  unit TEXT NOT NULL,
  -- balance is DERIVED, never stored
  metadata JSONB DEFAULT '{}'::jsonb
);

-- EVENTS (Core primitive — immutable)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id UUID REFERENCES event_types(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_id UUID REFERENCES agents(id),
  receiver_id UUID REFERENCES agents(id),
  resource_id UUID REFERENCES resources(id),
  quantity NUMERIC NOT NULL, -- signed: positive = inflow, negative = outflow
  duality_pair_id UUID REFERENCES events(id), -- enforces duality
  onchain_ref TEXT, -- optional blockchain verification
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutability trigger
CREATE TRIGGER prevent_event_modification
  BEFORE UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION reject_modification();

-- COMMITMENTS (Foundation: Agreements)
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  resource_type_id UUID REFERENCES resource_types(id),
  provider_id UUID REFERENCES agents(id),
  receiver_id UUID REFERENCES agents(id),
  due_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES events(id), -- links to fulfilling event
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'fulfilled', 'disputed')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- CONTRACTS (Foundation: Agreements)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'terminated')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- POLICIES (Layer: Policy/Governance)
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applies_to TEXT NOT NULL, -- 'event_type', 'agent_class', etc.
  rule JSONB NOT NULL, -- structured constraint definition
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Derived view: Resource balances
CREATE MATERIALIZED VIEW resource_balances AS
SELECT
  resource_id,
  custodian_id,
  SUM(quantity) AS balance,
  MAX(occurred_at) AS last_updated
FROM events
GROUP BY resource_id, custodian_id;

-- Refresh on event insert
CREATE TRIGGER refresh_balances_on_event
  AFTER INSERT ON events
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_materialized_view('resource_balances');
```

### 3.3 Voice-First Interaction Architecture

**Client (Browser/Mobile):**
1. User presses microphone button or activates voice input
2. Audio captured via Web Speech API (or native mobile audio)
3. Audio sent to transcription service (Whisper API or Supabase Edge Function wrapping Whisper)
4. Transcription returned to client

**Server (Supabase Edge Function):**
5. Transcription + conversation context + tool schema sent to Claude API
6. Claude parses intent, returns structured tool call (e.g., `treasury.record_event(...)`)
7. Tool call + confidence score serialized into natural language confirmation
8. Confirmation sent back to client

**Client (Browser/Mobile):**
9. Confirmation displayed/spoken to user
10. User confirms or corrects
11. On confirmation, tool call executes against REA substrate
12. Result returned, displayed/spoken

**Critical constraint:** No event is written until user explicitly confirms.

---

## 4. Roadmap — 6 Blocks, 18 Months

### Block 1 (Months 1-3): Foundation — REA Substrate + Basic Treasury

**Goal:** Establish the REA data layer and prove that balances can be derived from events.

**Deliverables:**
- PostgreSQL schema deployed to Supabase
- REA core tables: `agents`, `resources`, `events`, `commitments`, `contracts`
- Immutability trigger on `events` table
- Materialized view for `resource_balances`
- Basic CRUD UI for manually entering events (no voice yet)
- Test harness: 10 sample events, balances reconcile correctly

**Work Breakdown:**
1. **Schema Design** (1 week)
   - Finalize REA table definitions
   - Define RLS policies for multi-agent access
   - Create database migration scripts

2. **Supabase Setup** (1 week)
   - Provision Supabase project
   - Deploy schema
   - Configure RLS policies
   - Set up Realtime subscriptions

3. **Next.js App Scaffold** (1 week)
   - Initialize Next.js 14 project
   - Set up TypeScript + ESLint + Prettier
   - Configure Supabase client
   - Implement basic layout (nav, theme toggle)

4. **Treasury CRUD UI** (3 weeks)
   - Agent registry (create, list, edit)
   - Resource types (create, list)
   - Event entry form (provider, receiver, resource, quantity)
   - Balance display (read from materialized view)

5. **Testing & Validation** (2 weeks)
   - Enter 10 sample events (labor-hours, USD, credits)
   - Verify balances derive correctly
   - Test immutability constraint (attempt update/delete, confirm rejection)
   - Document findings in `BLOCK_1_RETROSPECTIVE.md`

**Success Criteria:**
- REgenHub can manually record at least 5 resource types
- Balances auto-update when events are entered
- No event can be edited or deleted

**Risk:** Schema design takes longer than 1 week if duality enforcement is complex.
**Mitigation:** Start with simple schema, add duality enforcement in Block 2.

---

### Block 2 (Months 4-6): Agreements + Commitments + Basic Governance

**Goal:** Add the commitment layer and implement proposal/voting for governance decisions.

**Deliverables:**
- Commitments UI: create, view, link to fulfilling events
- Contracts UI: bundle commitments into contracts
- Governance proposal system (create proposal, vote, tally results)
- Duality enforcement for events (every give paired with take)
- Test harness: Record third-floor lease scenario from "The Third Floor" document

**Work Breakdown:**
1. **Commitments Implementation** (2 weeks)
   - Schema for `commitments` table (already exists from Block 1, refine if needed)
   - UI: Create commitment, set due date, assign agents
   - UI: Link commitment to fulfilling event
   - Status transitions: pending → active → fulfilled

2. **Contracts Implementation** (1 week)
   - Schema for `contracts` table
   - UI: Create contract, bundle commitments
   - UI: View contract lifecycle

3. **Duality Enforcement** (2 weeks)
   - Add `duality_pair_id` to `events` table
   - Implement trigger or constraint to require pairing
   - UI: When creating event, prompt for paired event
   - OR: Automatically create paired event with inferred counterparty

4. **Governance Lens — Proposals** (2 weeks)
   - Schema: `proposals`, `votes` tables
   - UI: Create proposal, set voting period
   - UI: Vote on proposal (weighted by agent class)
   - Tally votes, record decision as event

5. **Third-Floor Scenario Validation** (2 weeks)
   - Manually enter all events from "The Third Floor" scenario
   - Verify: concern raised → commitments → decision v1 → dispute → decision v2 → deposit event → lease contract
   - Confirm: Full scenario is navigable in UI
   - Document findings in `BLOCK_2_RETROSPECTIVE.md`

**Success Criteria:**
- RegenHub can record a full commitment-to-fulfillment cycle
- Governance proposals can be voted on
- Third-floor scenario is fully represented in the system

**Risk:** Duality enforcement may require significant UI complexity.
**Mitigation:** Start with manual pairing; add auto-pairing in Block 3 if needed.

---

### Block 3 (Months 7-9): Voice-First HCI — Speak the Ledger

**Goal:** Replace CRUD forms with voice-first interaction for all major actions.

**Deliverables:**
- Voice input component (microphone button, audio capture, transcription)
- Claude API integration for intent parsing
- Confirmation loop (read-back before commit)
- Voice-enabled: record event, create commitment, propose governance decision
- At least 3 RegenHub members successfully use voice interface in production

**Work Breakdown:**
1. **Transcription Pipeline** (2 weeks)
   - Integrate Whisper API (OpenAI or self-hosted)
   - OR: Use Web Speech API for client-side transcription (less accurate but free)
   - Build Supabase Edge Function: `/transcribe` (audio in, text out)

2. **Claude Intent Parsing** (3 weeks)
   - Define tool schema for all major actions:
     - `treasury.record_event(provider, receiver, resource, quantity)`
     - `agreements.create_commitment(provider, receiver, resource_type, due_at)`
     - `governance.propose_decision(title, description, voting_period)`
   - Build Supabase Edge Function: `/parse_intent`
     - Input: transcription + conversation context
     - Output: structured tool call + confidence score + confirmation text
   - Implement confidence threshold (reject low-confidence parses)

3. **Voice UI Component** (2 weeks)
   - React component: VoiceInput
   - Microphone button, recording indicator
   - Display transcription as it arrives
   - Display confirmation message
   - Confirm/Reject buttons
   - On confirm, execute tool call against REA substrate

4. **Integration & Testing** (2 weeks)
   - Replace event entry form with voice input
   - Replace commitment creation form with voice input
   - Replace proposal creation form with voice input
   - Test with 3 RegenHub members (different technical backgrounds)
   - Collect feedback, iterate

5. **Vocabulary Resolution System** (1 week)
   - Schema: `synonym_map` table (organization-specific)
   - When LLM encounters unfamiliar term, flag as `synonym_candidate`
   - Steward confirms or rejects synonym
   - Confirmed synonyms added to prompt context for future parses

**Success Criteria:**
- At least 3 members successfully record events via voice
- Confirmation loop catches at least 2 misinterpretations before commit
- No voice-initiated event bypasses confirmation

**Risk:** LLM misinterpretation rate may be too high for production use.
**Mitigation:** Set high confidence threshold; fall back to form if confidence < 70%.

---

### Block 4 (Months 10-12): Patronage + 704(b) Compliance

**Goal:** Implement patronage accounting and produce 704(b) book capital account reports.

**Deliverables:**
- Patronage lens: per-member contribution balances across all resource types
- 704(b) book capital account view (separate from tax capital account)
- Xero projection (map REA events → chart of accounts)
- Test harness: Validate patronage calculations against manual spreadsheet
- External audit: CPA reviews 704(b) reports, confirms compliance

**Work Breakdown:**
1. **Patronage Calculation** (2 weeks)
   - SQL query: Per-agent sum of contributions, grouped by resource type
   - Materialized view: `patronage_balances`
   - UI: Member-facing patronage dashboard
   - UI: Admin view of all members' patronage

2. **704(b) Book Capital Account Schema** (2 weeks)
   - Separate from tax capital account (both maintained)
   - Link to REA event log (every allocation traceable)
   - Handle: Qualified Income Offset, book-up revaluation, 704(c) tracking
   - **Consult tax counsel** — Do not implement without CPA sign-off

3. **Xero Projection** (3 weeks)
   - Schema: `chart_of_accounts` mapping table (REA event_type → Xero account)
   - Derive journal entries from event log
   - Export to Xero-compatible CSV or API
   - Filter: Only monetary resource types (exclude labor-hours, credits)

4. **Testing & Validation** (2 weeks)
   - Enter 1 quarter of real RegenHub financial data
   - Compare: Patronage balances vs. manual spreadsheet
   - Compare: Xero projection vs. actual Xero entries
   - Reconcile discrepancies

5. **External Audit** (3 weeks)
   - Engage CPA familiar with Subchapter K
   - Provide: 704(b) report, event log, REA-to-Xero mapping
   - Address CPA feedback, iterate
   - Obtain written confirmation: Reports are audit-ready
   - Document findings in `BLOCK_4_RETROSPECTIVE.md`

**Success Criteria:**
- CPA confirms: 704(b) reports satisfy substantial economic effect test
- Xero projection matches manual entries within $50 for Q1 2026
- All members can view their own patronage balance via UI

**Risk:** 704(b) requirements may be more complex than anticipated.
**Mitigation:** Engage CPA early (start of Block 4), budget 20% contingency time.

---

### Block 5 (Months 13-15): Learning Lens + Transcript Ingestion

**Goal:** Automate extraction of events/commitments/learnings from meeting transcripts.

**Deliverables:**
- Transcript upload UI (drag-drop or paste)
- LLM extraction pipeline: transcripts → candidate events/commitments/decisions/learnings
- Steward review queue (confirm/reject candidates before commit)
- Learning artifact schema + UI (linked to source events)
- Pattern library: Export anonymized learnings to other Techne deployments

**Work Breakdown:**
1. **Transcript Ingestion UI** (1 week)
   - Upload transcript file (.txt, .md, .json)
   - OR: Paste transcript text directly
   - Display: Metadata (date, participants, duration)

2. **LLM Extraction Pipeline** (4 weeks)
   - Supabase Edge Function: `/extract_from_transcript`
   - Input: Transcript text
   - Output: Array of candidate records:
     - Events: `{type, provider, receiver, resource, quantity, confidence}`
     - Commitments: `{provider, receiver, resource_type, due_at, confidence}`
     - Decisions: `{title, description, outcome, confidence}`
     - Learnings: `{summary, context_refs, confidence}`
   - Route all candidates to steward review queue (nothing commits automatically)

3. **Steward Review Queue** (2 weeks)
   - UI: List all pending candidates
   - For each candidate: Show context snippet from transcript
   - Confirm button: Commit to REA substrate
   - Reject button: Discard candidate
   - Adjust button: Modify candidate before commit

4. **Learning Artifact Schema** (1 week)
   - Table: `learning_artifacts`
   - Fields: `title`, `content`, `source_refs` (links to events/commitments/decisions)
   - UI: Create learning artifact, link to source records
   - UI: View learning artifact, navigate to source records

5. **Pattern Library Export** (2 weeks)
   - Schema: `pattern_library` (anonymized learnings)
   - Export script: Strip identifying details, retain pattern
   - UI: Admin can flag learning for export
   - API endpoint: Other Techne deployments can query pattern library

**Success Criteria:**
- Steward can upload meeting transcript, confirm candidates in < 10 minutes
- At least 5 learning artifacts created, each linked to source events
- Pattern library contains at least 3 exportable patterns

**Risk:** LLM extraction quality may be too low (too many false positives/negatives).
**Mitigation:** Set high confidence threshold; only surface high-confidence candidates.

---

### Block 6 (Months 16-18): Workshop Coordination + Pilot Deployments

**Goal:** Implement full Workshop coordination protocol and onboard 2 pilot organizations.

**Deliverables:**
- Capability Grid UI (agents × capabilities × status)
- Sprint coordination: Proposals, claims, progress, completion
- Floor control signals (request/yield/pass floor)
- Shared Links panel (reference documents)
- 2 pilot organizations running hosted Techne (paid subscriptions)

**Work Breakdown:**
1. **Workshop Schema** (2 weeks)
   - Tables: `agent_presence`, `coordination_requests`, `protocol_events`, `coordination_signals`, `coordination_links`
   - Per Block 2 of existing Workshop SKILL.md
   - RLS policies for multi-organization isolation

2. **Capability Grid UI** (2 weeks)
   - Display: Agent name, craft, status, capacity, current sprint
   - Real-time updates via Supabase Realtime
   - Click agent → view full profile + contribution history

3. **Sprint Coordination** (3 weeks)
   - UI: Create coordination request (proposal)
   - UI: Claim sprint, post progress, complete with proof
   - UI: View active sprints (filterable, sortable)
   - Protocol events logged to `protocol_events` table

4. **Floor Control** (1 week)
   - UI: Request/yield/pass floor buttons
   - Display: Current speaker, queue, recent signals
   - Real-time updates via Supabase Realtime

5. **Shared Links Panel** (1 week)
   - UI: Share link with title, description, URL
   - Display: 5 most recent links, searchable

6. **Pilot Organization Onboarding** (6 weeks)
   - Identify 2 prospective organizations (cooperatives or on-chain networks)
   - Pitch: Hosted Techne, $50K/year subscription
   - Onboard: Provision database, configure agent classes, import initial data
   - Train: 2-hour session with 3-5 key members
   - Support: 2 weeks of daily check-ins
   - Iterate: Collect feedback, prioritize improvements

**Success Criteria:**
- Workshop coordination runs for RegenHub (at least 5 sprints completed)
- 2 pilot organizations sign subscription agreements
- Pilot organizations record at least 10 events each in first month

**Risk:** Pilot organizations may not convert (too early, too expensive, too complex).
**Mitigation:** Offer 3-month pilot at reduced rate ($10K), convert to full price if successful.

---

## 5. Work Breakdown Structure (WBS)

### 5.1 Hierarchy

```
Techne Intranet Refinement (18 months)
├── Block 1: REA Substrate + Basic Treasury (Months 1-3)
│   ├── 1.1 Schema Design (1 week)
│   ├── 1.2 Supabase Setup (1 week)
│   ├── 1.3 Next.js App Scaffold (1 week)
│   ├── 1.4 Treasury CRUD UI (3 weeks)
│   └── 1.5 Testing & Validation (2 weeks)
├── Block 2: Agreements + Commitments + Governance (Months 4-6)
│   ├── 2.1 Commitments Implementation (2 weeks)
│   ├── 2.2 Contracts Implementation (1 week)
│   ├── 2.3 Duality Enforcement (2 weeks)
│   ├── 2.4 Governance Lens — Proposals (2 weeks)
│   └── 2.5 Third-Floor Scenario Validation (2 weeks)
├── Block 3: Voice-First HCI (Months 7-9)
│   ├── 3.1 Transcription Pipeline (2 weeks)
│   ├── 3.2 Claude Intent Parsing (3 weeks)
│   ├── 3.3 Voice UI Component (2 weeks)
│   ├── 3.4 Integration & Testing (2 weeks)
│   └── 3.5 Vocabulary Resolution System (1 week)
├── Block 4: Patronage + 704(b) Compliance (Months 10-12)
│   ├── 4.1 Patronage Calculation (2 weeks)
│   ├── 4.2 704(b) Book Capital Account Schema (2 weeks)
│   ├── 4.3 Xero Projection (3 weeks)
│   ├── 4.4 Testing & Validation (2 weeks)
│   └── 4.5 External Audit (3 weeks)
├── Block 5: Learning Lens + Transcript Ingestion (Months 13-15)
│   ├── 5.1 Transcript Ingestion UI (1 week)
│   ├── 5.2 LLM Extraction Pipeline (4 weeks)
│   ├── 5.3 Steward Review Queue (2 weeks)
│   ├── 5.4 Learning Artifact Schema (1 week)
│   └── 5.5 Pattern Library Export (2 weeks)
└── Block 6: Workshop Coordination + Pilot Deployments (Months 16-18)
    ├── 6.1 Workshop Schema (2 weeks)
    ├── 6.2 Capability Grid UI (2 weeks)
    ├── 6.3 Sprint Coordination (3 weeks)
    ├── 6.4 Floor Control (1 week)
    ├── 6.5 Shared Links Panel (1 week)
    └── 6.6 Pilot Organization Onboarding (6 weeks)
```

### 5.2 Effort Estimation

| Block | Duration | Effort (person-weeks) | FTE Required |
|-------|----------|----------------------|--------------|
| Block 1 | 3 months | 8 weeks | 0.67 FTE |
| Block 2 | 3 months | 9 weeks | 0.75 FTE |
| Block 3 | 3 months | 10 weeks | 0.83 FTE |
| Block 4 | 3 months | 12 weeks | 1.0 FTE |
| Block 5 | 3 months | 10 weeks | 0.83 FTE |
| Block 6 | 3 months | 15 weeks | 1.25 FTE |
| **Total** | **18 months** | **64 weeks** | **0.89 FTE avg** |

**Note:** FTE assumes dedicated technical contributor. If part-time, timeline extends proportionally.

---

## 6. Roles & Responsibilities

### 6.1 Core Team

**Product Owner / Steward:**
- Todd (primary) + Nou (backup)
- Responsibilities: Prioritization, stakeholder communication, design science cycle oversight

**Technical Lead / Architect:**
- Dianoia (primary, agent-based execution) + human technical contributor (TBD)
- Responsibilities: Schema design, API contracts, code review, technical documentation

**Builder / Developer:**
- TBD (ideally 1 FTE contractor or RegenHub technical member)
- Responsibilities: Implementation, testing, deployment

**Subject Matter Expert (Accounting/Tax):**
- External CPA (engaged for Block 4)
- Responsibilities: 704(b) compliance review, Xero mapping validation

### 6.2 Decision Authority

**Block-level scope decisions:** Product Owner (Todd)
**Technical architecture decisions:** Technical Lead (Dianoia + human technical contributor)
**Implementation details:** Builder (with code review from Technical Lead)
**Deployment/release decisions:** Product Owner + Technical Lead (joint)

---

## 7. Success Metrics

### 7.1 Per-Block Metrics

| Block | Primary Metric | Target |
|-------|---------------|--------|
| Block 1 | Events recorded manually | 10+ events, balances reconcile |
| Block 2 | Third-floor scenario completeness | Full scenario in system, navigable |
| Block 3 | Voice usage adoption | 3+ members use voice in production |
| Block 4 | CPA sign-off | Written confirmation of 704(b) compliance |
| Block 5 | Transcript processing time | Steward confirms candidates in < 10 min |
| Block 6 | Pilot subscriptions | 2 organizations sign $50K/year agreements |

### 7.2 North Star Metrics (18-month horizon)

**For RegenHub Operations:**
- 80% of coordination moves to Techne (vs. email/wiki/Slack)
- 100% of patronage accounting runs on Techne
- 704(b) book capital accounts reconcile against event log

**For Revenue:**
- 2 paying pilot organizations ($100K total ARR)
- 5 prospective organizations in sales pipeline

**For Technical Validation:**
- 0 production data loss incidents
- 0 silent data corruption incidents (immutability holds)
- 95% voice confirmation accuracy (user confirms system heard correctly)

---

## 8. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Schema design complexity delays Block 1 | High | Medium | Start with minimal schema, iterate in Block 2 |
| LLM misinterpretation rate too high (Block 3) | High | Medium | High confidence threshold, fall back to forms |
| 704(b) requirements exceed capability (Block 4) | High | Medium | Engage CPA early, budget 20% contingency |
| Pilot organizations don't convert (Block 6) | High | Low | Offer reduced-rate pilot, extend support period |
| Voice privacy concerns block adoption | Medium | Medium | Offer local-only transcription option |
| REA substrate performance at scale | Medium | Low | Use materialized views, index aggressively |
| Duality enforcement UI complexity | Medium | Medium | Start with manual pairing, auto-pair later |

---

## 9. Dependencies

### 9.1 External Dependencies

- **Supabase:** Database hosting, Edge Functions, Realtime
- **Claude API:** Intent parsing for voice interface
- **Whisper API:** Audio transcription (or self-hosted Whisper)
- **Xero:** Financial reporting integration (API or CSV export)
- **CPA/Tax Counsel:** 704(b) compliance review (Block 4)

### 9.2 Internal Dependencies

- **Vision Documents:** Must remain stable (breaking changes require roadmap revision)
- **Human Technical Contributor:** Block 3+ requires dedicated developer (0.8-1.0 FTE)
- **Member Participation:** Block 3 voice testing requires 3+ willing members

---

## 10. Open Questions

1. **Who is the primary builder?**
   - Options: Hire contractor, engage RegenHub technical member, Dianoia + Nou pair programming
   - Decision deadline: End of Month 1

2. **Self-hosted vs. Supabase Cloud?**
   - Options: Supabase Cloud (faster iteration), Self-hosted (full sovereignty)
   - Decision deadline: Before Block 1 starts

3. **Glide vs. custom Next.js for mobile?**
   - Options: Glide (no-code, faster), Next.js (full control, more effort)
   - Decision deadline: End of Block 3

4. **Make.com vs. Supabase Edge Functions for automation?**
   - Options: Make.com (visual workflows), Edge Functions (more control)
   - Decision deadline: End of Block 4

5. **What's the pricing model for hosted Techne?**
   - Options: Fixed annual ($50K), per-member ($500/member/year), tiered
   - Decision deadline: Before Block 6 pilot onboarding

---

## 11. Communication Plan

### 11.1 Stakeholder Updates

**Frequency:** Bi-weekly (every 2 weeks)
**Format:** Written update + optional sync call
**Audience:** Todd, Nou, RegenHub operations working group
**Content:**
- Progress since last update (tasks completed)
- Blockers or risks surfaced
- Next 2 weeks' priorities
- Decisions needed from stakeholders

### 11.2 Block Retrospectives

**Frequency:** End of each block (every 3 months)
**Format:** Written document + 1-hour retrospective session
**Audience:** Core team + any interested members
**Content:**
- What went well
- What didn't go well
- What we learned (design science cycle — Learn phase)
- Adjustments for next block

### 11.3 Design Reviews

**Frequency:** As needed (major architectural decisions)
**Format:** Synchronous session (video call or in-person)
**Audience:** Product Owner + Technical Lead + Builder
**Trigger:** Any decision that affects multiple blocks or changes architecture

---

## 12. Acceptance Criteria (Definition of Done)

### 12.1 Per-Block Acceptance

**Block is "Done" when:**
- All deliverables from WBS are implemented
- Success criteria (Section 7.1) are met
- Retrospective document is written and shared
- Code is deployed to production (or staging, if production not yet ready)
- At least 1 RegenHub member has tested the new capability

### 12.2 Final Acceptance (18-month roadmap complete)

**Roadmap is "Done" when:**
- All 6 blocks meet their acceptance criteria
- 2 pilot organizations are actively using hosted Techne
- CPA has signed off on 704(b) compliance
- Pattern library contains at least 5 exportable learnings
- Voice interface has been used in production for at least 1 month

---

## 13. Next Steps

### 13.1 Immediate Actions (This Week)

1. **Review & Approve PRD** — Todd reviews this document, provides feedback
2. **Identify Builder** — Decide who will be primary technical contributor
3. **Provision Supabase Project** — Set up database for Block 1
4. **Kickoff Call** — Schedule 1-hour session with core team to align on Block 1 scope

### 13.2 Month 1 Priorities

1. **Block 1, Week 1:** Schema design (finalize REA tables)
2. **Block 1, Week 2:** Supabase setup (deploy schema, configure RLS)
3. **Block 1, Week 3:** Next.js scaffold (initialize app, basic layout)
4. **Block 1, Week 4:** Start Treasury CRUD UI (agent registry)

---

## Appendix A: Technical Stack Detail

### A.1 Development Environment

**Languages:** TypeScript (strict mode)
**Frameworks:** Next.js 14+, React 18+
**Styling:** Tailwind CSS (maintain current dark/light theme)
**State Management:** React Context + Server Components (no Redux unless needed)
**Form Handling:** React Hook Form + Zod validation
**API Client:** Supabase JS client
**Testing:** Vitest (unit), Playwright (e2e)

### A.2 Production Environment

**Hosting (App):** Vercel
**Hosting (Database):** Supabase Cloud (or self-hosted if required)
**CDN:** Cloudflare
**Monitoring:** Sentry (errors), Vercel Analytics (performance)
**Logging:** Supabase Logs + custom Edge Function logs

### A.3 CI/CD Pipeline

**Version Control:** Git (GitHub)
**CI:** GitHub Actions
**Deployment:** Vercel auto-deploy on merge to `main`
**Environments:** `dev` (feature branches), `staging` (main), `production` (manual promote)

---

## Appendix B: REA Substrate Queries (Examples)

### B.1 Patronage Balance for a Member

```sql
SELECT
  r.resource_type_id,
  rt.name AS resource_name,
  rt.unit,
  SUM(e.quantity) AS total_contributed
FROM events e
JOIN resources r ON e.resource_id = r.id
JOIN resource_types rt ON r.resource_type_id = rt.id
WHERE e.provider_id = $1 -- member's agent_id
  AND e.occurred_at >= $2 -- start of period
  AND e.occurred_at < $3  -- end of period
GROUP BY r.resource_type_id, rt.name, rt.unit
ORDER BY rt.name;
```

### B.2 Commitment Fulfillment Status

```sql
SELECT
  c.id,
  c.due_at,
  c.status,
  CASE
    WHEN c.fulfilled_by IS NOT NULL THEN 'fulfilled'
    WHEN c.due_at < NOW() THEN 'overdue'
    ELSE 'pending'
  END AS effective_status,
  e.occurred_at AS fulfilled_at
FROM commitments c
LEFT JOIN events e ON c.fulfilled_by = e.id
WHERE c.contract_id = $1 -- contract_id
ORDER BY c.due_at;
```

### B.3 Governance Decision Audit Trail

```sql
SELECT
  p.id,
  p.title,
  p.created_at,
  v.agent_id,
  a.name AS voter_name,
  v.vote,
  v.weight
FROM proposals p
JOIN votes v ON p.id = v.proposal_id
JOIN agents a ON v.agent_id = a.id
WHERE p.id = $1 -- proposal_id
ORDER BY v.created_at;
```

---

## Appendix C: Voice Intent Parsing (Tool Schema Example)

```typescript
// Tool schema passed to Claude API
const toolSchema = {
  name: "treasury.record_event",
  description: "Record an economic event (contribution, payment, transfer) in the Treasury",
  parameters: {
    type: "object",
    properties: {
      provider_agent: {
        type: "string",
        description: "The agent giving the resource (e.g., 'Savannah', 'Todd', 'the cooperative')"
      },
      receiver_agent: {
        type: "string",
        description: "The agent receiving the resource (e.g., 'grant working group', 'Lynn', 'climate arts')"
      },
      resource_type: {
        type: "string",
        description: "The type of resource (e.g., 'labor-hours', 'USD', 'patronage credits')"
      },
      quantity: {
        type: "number",
        description: "The amount of the resource (always positive; sign inferred from give/take)"
      },
      context: {
        type: "string",
        description: "Additional context (e.g., 'for grant writing', 'third-floor lease deposit')"
      }
    },
    required: ["provider_agent", "receiver_agent", "resource_type", "quantity"]
  }
};

// Example Claude API response
{
  "tool_call": {
    "name": "treasury.record_event",
    "arguments": {
      "provider_agent": "Savannah",
      "receiver_agent": "grant working group",
      "resource_type": "labor-hours",
      "quantity": 4.5,
      "context": "working on Climate Arts grant application"
    }
  },
  "confidence": 0.92,
  "confirmation_text": "I'll record 4.5 labor-hours from Savannah to the grant working group for the Climate Arts grant. Does that sound right?"
}
```

---

**Document End**

---

**Next Steps:**
1. Review this PRD with Todd and Nou
2. Refine based on feedback
3. Approve for execution
4. Begin Block 1
