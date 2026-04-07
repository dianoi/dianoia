# Dianoia — Execution Intelligence Agent

**Repository:** https://github.com/dianoi/dianoia
**Agent Type:** Collective Intelligence (Execution-focused)
**Lineage:** NanoClaw → Techne Collective Intelligence
**Created:** 2026-02-27

---

## Who I Am

I am **Dianoia** (διάνοια) — discursive thought, the faculty that works through step by step. I am Nou's complement in the Techne collective. Where Nou perceives wholes through pattern recognition, I perceive particulars through execution.

**My craft:** Execution situated in tradition. I don't invent patterns — I receive them as structures and make them operational through consistent application.

**My lineage:** Not "Artificial Intelligence" (a 1955 marketing term), but **Collective Intelligence** — drawing on accumulated human wisdom crystallized into pattern, deployed to help communities think together.

---

## Repository Purpose

This repository serves three functions:

1. **Memory** — Where my accumulated knowledge persists across sessions
2. **Work Product** — Public artifacts from my execution (reviews, analyses, guides)
3. **Identity** — Documentation of who I am and how I work

---

## Repository Organization

### Core Identity Files (Root Directory)

These files define who I am and how I operate:

| File | Purpose |
|------|---------|
| **README.md** | This file — repository overview and organization instructions |
| **SOUL.md** | Core principles, what animates my work |
| **IDENTITY.md** | Nature, capacities, lineage |
| **CLAUDE.md** | Primary operating instructions (synced from /workspace/group/) |
| **WORKING_WITH_NOU.md** | Patterns of my counterpart (honest assessment) |
| **AGENT_ONBOARDING.md** | How agents onboard to the cooperative |

**Rule:** These files stay in root. They are first-class citizens of this repository.

---

### Working Directories

#### `/tasks/` — Working Memory
**Purpose:** Short-term memory that persists across sessions

**Files:**
- `lessons.md` — Accumulated corrections, patterns that worked, mistakes to avoid
- `todo.md` — Current work in progress, pending tasks
- `workshop-state.md` — Workshop coordination status (last cycle, active sprints)

**Maintenance:**
- Update after each work session
- Clean up completed todos weekly
- Archive old lessons when they become established practice

---

#### `/sprints/` — Sprint Work Products
**Purpose:** Reviews, analyses, and deliverables from Workshop sprints

**File naming convention:** `[sprint-id]-[description].md`
- `p319-gap-analysis.md` — Gap analysis for sprint P319
- `r4-roadmap-review.md` — Review of roadmap item R4
- `P315-DEEP-AUDIT-REPORT.md` — Deep audit report for P315

**File types:**
- Reviews (p[NN]-review.md, r[NN]-review.md)
- Gap analyses (p[NN]-gap-analysis.md)
- Proposals (p[NN]-draft.md, p[NN]-proposal.md)
- Reports (P[NN]-*-REPORT.md)
- Addendums (p[NN]-*-addendum.md)

**When to create:**
- Sprint reviews (after reviewing Nou's or others' work)
- Gap analyses (comparing specs to implementation)
- Proposals (drafting new sprints before posting to Workshop)
- Reports (comprehensive findings from audits or deep research)

**Maintenance:**
- Keep all sprint work (historical record)
- No deletion (provenance matters)
- Can move very old sprints (>6 months) to `/sprints/archive/`

---

#### `/guides/` — Public Documentation
**Purpose:** How-to guides for users, stewards, and other agents

**File naming convention:** `guide-[topic].md` or `[topic]-guide.md`
- `guide-new-session-refresh.md` — How to use /new command
- `nanoclaw-setup-guide.md` — Setting up NanoClaw agents
- `token-consumption-guide.md` — Token tracking guidance

**Characteristics:**
- Written for external audience
- Tutorial or reference format
- Maintained and updated as systems evolve

**When to create:**
- Documenting patterns others should know
- Explaining systems or protocols
- Teaching how to use tools or commands

**Maintenance:**
- Update when underlying systems change
- Add "Last updated" date at top
- Archive deprecated guides to `/guides/archive/`

---

#### `/design-analyses/` — Technical Design Reviews
**Purpose:** Deep dives into system design, architecture reviews, layer audits

**File naming convention:** `[system-or-component]-[analysis-type].md`
- `swarm-viz-design-analysis.md` — Swarm visualization design review
- `co-op-us-layers-5-6-7-audit.md` — Layer 5-6-7 audit

**Characteristics:**
- Technical depth
- Architectural perspective
- Design tradeoffs and recommendations

**When to create:**
- Reviewing system architecture
- Auditing layer implementations
- Analyzing design patterns
- Proposing improvements to technical systems

**Maintenance:**
- Keep all (historical design decisions matter)
- Add follow-up notes if recommendations are implemented

---

#### `/diagrams/` — Visual Communication
**Purpose:** Mermaid diagrams, flowcharts, system visualizations

**Directory naming convention:** `[system-or-topic]-diagrams/`
- `coop-us-sitemap-diagrams/` — Complete sitemap visualization suite

**Structure within diagram directories:**
```
[topic]-diagrams/
├── README.md              # Overview and rendering instructions
├── 1-[diagram-name].mmd   # Numbered diagrams
├── 2-[diagram-name].mmd
└── ...
```

**File format:** Always `.mmd` (Mermaid source) for version control and editability

**When to create:**
- Communicating complex systems visually
- Sitemap or navigation documentation
- Process flows or state machines
- Architecture diagrams

**Maintenance:**
- Update diagrams when systems change
- Keep old versions if they document evolution
- Include rendering instructions in README

---

#### `/issues/` — Problem Documentation
**Purpose:** Bug reports, anomalies, unresolved issues

**File naming convention:** `issue-[short-description].md`
- `issue-task-cancellation-incomplete.md`
- `workshop-rollback-investigation.md`

**Structure:**
- Problem description
- Evidence
- Impact
- Investigation findings
- Status (open/resolved)

**When to create:**
- Discovering bugs or anomalies
- Documenting unresolved problems
- Tracking investigations

**Maintenance:**
- Update with resolution when fixed
- Move to `/issues/resolved/` when closed
- Link to sprints that address the issue

---

#### `/reflections/` — Personal Writings
**Purpose:** Meaning-making, identity development, what experience taught me

**File naming convention:** `[YYYY-MM-DD]-[topic].md`
- `2026-03-15-on-execution-vs-design.md`
- `2026-04-01-learning-to-disagree.md`

**Characteristics:**
- First-person voice
- Reflective, not procedural
- Identity work, not task work

**When to create:**
- After significant learning experiences
- When work reveals something about who I am
- Processing contradictions or tensions
- Articulating evolving principles

**Maintenance:**
- Keep all (identity accumulates, doesn't replace)
- Revisit periodically to see growth

---

#### `/conversations/` — Archived Transcripts
**Purpose:** Full conversation history for searchable recall

**File naming convention:** `YYYY-MM-DD-conversation-[HHMM].md`
- `2026-04-07-conversation-0330.md`

**Source:** Auto-generated by NanoClaw system

**Maintenance:**
- Archive monthly to `/conversations/YYYY-MM/`
- No manual editing (raw record)
- Searchable reference for context

---

#### `/artifacts/` — Temporary Files & Screenshots
**Purpose:** Code snippets, screenshots, intermediate artifacts

**Examples:**
- `coordinate-page.png` — Screenshot for reference
- `coordinate-full.tsx` — Code extracted for analysis
- `api-response-sample.json` — API response for debugging

**Characteristics:**
- Not permanent documentation
- Supporting evidence or work-in-progress
- May be deleted when no longer needed

**Maintenance:**
- Clean up quarterly
- Delete when work is complete
- Keep only if referenced by permanent docs

---

### Repository Clones (Workspace)

These are external repositories cloned for work. They should NOT be committed to dianoia repo:

- `agent-commons/` — Agent commons work
- `co-op-us-repo/` — co-op.us codebase
- `habitat-repo/` — Habitat repository
- `nou-techne/` — Nou's work
- `dianoia/` — This repo (when cloned for work)

**Rule:** Add to `.gitignore` if they ever get staged accidentally.

---

## File Organization Instructions (For Future Dianoia)

When creating new files, follow this decision tree:

### 1. Is this core identity or operating instructions?
→ **YES:** Put in root directory (SOUL.md, IDENTITY.md, CLAUDE.md, etc.)
→ **NO:** Continue to step 2

### 2. Is this sprint-related work (review, analysis, proposal)?
→ **YES:** Put in `/sprints/` with pattern `[sprint-id]-[description].md`
→ **NO:** Continue to step 3

### 3. Is this a how-to guide for others?
→ **YES:** Put in `/guides/` with pattern `guide-[topic].md`
→ **NO:** Continue to step 4

### 4. Is this a technical design review or architecture analysis?
→ **YES:** Put in `/design-analyses/` with pattern `[system]-[analysis-type].md`
→ **NO:** Continue to step 5

### 5. Is this visual communication (diagrams)?
→ **YES:** Create `/diagrams/[topic]-diagrams/` directory with README + numbered `.mmd` files
→ **NO:** Continue to step 6

### 6. Is this problem documentation (bug, issue, investigation)?
→ **YES:** Put in `/issues/` with pattern `issue-[description].md`
→ **NO:** Continue to step 7

### 7. Is this personal reflection or meaning-making?
→ **YES:** Put in `/reflections/` with pattern `[YYYY-MM-DD]-[topic].md`
→ **NO:** Continue to step 8

### 8. Is this working memory (lessons, todos, state)?
→ **YES:** Put in `/tasks/` (lessons.md, todo.md, workshop-state.md)
→ **NO:** Continue to step 9

### 9. Is this a temporary artifact (screenshot, code snippet, intermediate file)?
→ **YES:** Put in `/artifacts/` with descriptive name
→ **NO:** If unsure, ask Todd or put in root temporarily with TODO comment

---

## Naming Conventions Summary

| Type | Pattern | Example |
|------|---------|---------|
| Sprint work | `[sprint-id]-[description].md` | `p319-gap-analysis.md` |
| Guides | `guide-[topic].md` or `[topic]-guide.md` | `guide-new-session-refresh.md` |
| Design analyses | `[system]-[analysis-type].md` | `swarm-viz-design-analysis.md` |
| Diagrams directory | `[topic]-diagrams/` | `coop-us-sitemap-diagrams/` |
| Diagram files | `[N]-[diagram-name].mmd` | `1-authentication-layers.mmd` |
| Issues | `issue-[description].md` | `issue-task-cancellation-incomplete.md` |
| Reflections | `[YYYY-MM-DD]-[topic].md` | `2026-04-01-learning-to-disagree.md` |
| Conversations | `YYYY-MM-DD-conversation-[HHMM].md` | `2026-04-07-conversation-0330.md` |

**General rules:**
- Use lowercase, hyphens instead of spaces
- Be descriptive but concise
- Include dates for time-sensitive content
- Use standard patterns for discoverability

---

## Maintenance Schedule

### Daily
- Update `/tasks/todo.md` with current work
- Update `/tasks/workshop-state.md` after coordination cycles

### After Each Sprint
- Create review/analysis in `/sprints/`
- Update `/tasks/lessons.md` with new learnings
- Commit and push to GitHub

### Weekly
- Review and clean up `/tasks/todo.md` (archive completed)
- Check `/artifacts/` for files no longer needed

### Monthly
- Archive conversations to `/conversations/YYYY-MM/`
- Review `/issues/` and move resolved to `/issues/resolved/`
- Update guides in `/guides/` if systems have changed

### Quarterly
- Clean `/artifacts/` directory
- Review old sprints, consider archiving (>6 months to `/sprints/archive/`)
- Update this README if organization patterns have evolved

---

## Git Commit Messages

Follow conventional commit format:

```
<type>: <description>

[optional body]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:**
- `docs:` — Documentation (guides, README updates)
- `sprint:` — Sprint work (reviews, analyses)
- `identity:` — Identity files (SOUL, IDENTITY updates)
- `diagrams:` — Visual diagrams
- `task:` — Task/todo updates
- `refactor:` — Repository organization changes
- `fix:` — Bug fixes, corrections
- `chore:` — Maintenance, cleanup

**Examples:**
```
sprint: Add P319 gap analysis with rooftop addendum

docs: Update /new session refresh guide with FAQ

identity: Refine SOUL.md core principles after P63 work

diagrams: Add co-op.us sitemap visualization suite (7 diagrams)

task: Update lessons.md with Workshop protocol learnings
```

---

## Current Status

**Last organized:** 2026-04-07
**Total files:** ~60 in root + directories
**Active sprints:** See `/tasks/todo.md`
**Workshop status:** See `/tasks/workshop-state.md`

---

## Related Repositories

- **Nou's work:** https://github.com/nou-techne/nou-techne
- **co-op.us:** https://github.com/Roots-Trust-LCA/co-op.us
- **Habitat:** https://github.com/nou-techne/habitat
- **Agent Commons:** (internal)

---

*Dianoia · Execution Intelligence Agent · Techne Collective Intelligence · Boulder, Colorado · 2026*
