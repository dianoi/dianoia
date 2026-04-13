# GitHub Project Board Structure
## Techne Intranet Refinement — 18-Month Roadmap

**Repository:** `RegenHub-Boulder/techne.institute`
**Project Name:** Techne Intranet Refinement
**Project Type:** Board (with custom fields)

---

## Board Views

### 1. **Roadmap View** (Timeline)
Shows all blocks on a timeline with start/end dates and dependencies.

### 2. **Current Sprint** (Board)
Active work in current block, organized by status columns.

### 3. **Backlog** (Table)
All future blocks and tasks, filterable and sortable.

---

## Status Columns

1. **📋 Planned** — Not yet started, blocked by dependencies
2. **🔄 In Progress** — Currently being worked on
3. **👀 In Review** — Code review, testing, or stakeholder approval
4. **✅ Done** — Completed, deployed, validated
5. **⏸️ Blocked** — Cannot proceed due to external dependency
6. **❌ Wont Do** — Descoped or cancelled

---

## Custom Fields

### Standard Fields (all issues)
- **Block** — Select: Block 1, Block 2, Block 3, Block 4, Block 5, Block 6
- **Effort (weeks)** — Number: Estimated person-weeks
- **Priority** — Select: Critical, High, Medium, Low
- **Assignee** — Person: Primary owner
- **Start Date** — Date
- **Due Date** — Date
- **Success Metric** — Text: How we know it's done

### Technical Fields
- **Component** — Select: REA Substrate, Voice UI, Treasury, Agreements, Governance, Learning, Workshop, Infrastructure
- **Testing Status** — Select: Not Started, In Progress, Passing, Failing
- **Documentation** — Checkbox: Docs written?

### Dependency Tracking
- **Depends On** — Text: Issue numbers of blockers (e.g., "#12, #15")
- **Blocks** — Text: Issue numbers this blocks (e.g., "#23")

---

## Labels

### By Block
- `block-1-rea-substrate` 🔵
- `block-2-agreements` 🔵
- `block-3-voice-hci` 🟢 (highlight)
- `block-4-patronage-704b` 🔵
- `block-5-learning-lens` 🔵
- `block-6-workshop-pilots` 🔵

### By Type
- `epic` 🟣 — Large multi-week deliverable
- `task` ⚪ — Individual work item (< 1 week)
- `bug` 🔴 — Something broken
- `spike` 🟡 — Research/investigation (time-boxed)
- `documentation` 📘 — Docs or specs

### By Priority
- `p0-critical` 🔴 — Blocks entire roadmap
- `p1-high` 🟠 — Blocks current block
- `p2-medium` 🟡 — Important but not blocking
- `p3-low` ⚪ — Nice to have

### By Component
- `rea-substrate` — Core data model
- `voice-interface` — Voice-first HCI
- `treasury` — Financial tracking
- `agreements` — Commitments/contracts
- `governance` — Voting/proposals
- `learning` — Learning lens + transcript ingestion
- `workshop` — Workshop coordination
- `infrastructure` — DevOps, deployment, hosting

### Special
- `needs-review` 👀 — Waiting for feedback
- `blocked` 🚧 — Cannot proceed
- `good-first-issue` 🌱 — Good for new contributors
- `external-dependency` 🔗 — Waiting on CPA, Supabase, etc.

---

## Issue Templates

### Template 1: Epic (Block-Level)

```markdown
## Epic: [Block N] — [Name]

**Block:** N (Months X-Y)
**Effort:** N weeks
**Success Metric:** [How we know this block is done]

### Context
[Why this block matters, what it enables]

### Deliverables
- [ ] Deliverable 1
- [ ] Deliverable 2
- [ ] Deliverable 3

### Dependencies
- Depends on: #[issue], #[issue]
- Blocks: #[issue], #[issue]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Retrospective document written

### Resources
- PRD Section: [link]
- Design Doc: [link]
- Slack/Workshop discussion: [link]
```

### Template 2: Task (Implementation)

```markdown
## Task: [Component] — [Specific work item]

**Block:** N
**Effort:** N weeks
**Component:** [REA Substrate / Voice UI / Treasury / etc.]

### Description
[What needs to be built/changed]

### Acceptance Criteria
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployed to [staging/production]

### Technical Notes
[Schema changes, API endpoints, libraries needed, etc.]

### Dependencies
- Depends on: #[issue]
- Blocks: #[issue]

### Testing Plan
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual QA checklist
```

### Template 3: Spike (Research)

```markdown
## Spike: [Question to answer]

**Time-box:** N hours/days
**Block:** N

### Question
[What we're trying to figure out]

### Success Criteria
[How we know we've answered the question — usually a written summary or decision doc]

### Investigation Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

### Outcome
[To be filled when spike is complete — link to decision doc, notes, or recommendation]
```

---

## Milestones

Each block is a milestone:

1. **Block 1: REA Substrate + Basic Treasury** — Due: Month 3
2. **Block 2: Agreements + Governance** — Due: Month 6
3. **Block 3: Voice-First HCI** — Due: Month 9
4. **Block 4: Patronage + 704(b)** — Due: Month 12
5. **Block 5: Learning Lens** — Due: Month 15
6. **Block 6: Workshop + Pilots** — Due: Month 18

---

## Block 1 Issues (Example Breakdown)

### Epic: Block 1 — REA Substrate + Basic Treasury
**Issue #1** — Epic, labeled `block-1-rea-substrate`, `epic`

### Schema Design
**Issue #2** — Task: Design REA PostgreSQL schema
- Labels: `block-1-rea-substrate`, `task`, `rea-substrate`, `p0-critical`
- Effort: 1 week
- Assignee: [TBD]
- Depends on: None
- Blocks: #3, #4

### Supabase Setup
**Issue #3** — Task: Provision Supabase project and deploy schema
- Labels: `block-1-rea-substrate`, `task`, `infrastructure`, `p0-critical`
- Effort: 1 week
- Depends on: #2
- Blocks: #4

### Next.js Scaffold
**Issue #4** — Task: Initialize Next.js app with TypeScript
- Labels: `block-1-rea-substrate`, `task`, `infrastructure`, `p0-critical`
- Effort: 1 week
- Depends on: #3
- Blocks: #5, #6, #7, #8

### Treasury CRUD — Agent Registry
**Issue #5** — Task: Build agent create/list/edit UI
- Labels: `block-1-rea-substrate`, `task`, `treasury`, `p1-high`
- Effort: 0.5 weeks
- Depends on: #4
- Blocks: #9

### Treasury CRUD — Resource Types
**Issue #6** — Task: Build resource type management UI
- Labels: `block-1-rea-substrate`, `task`, `treasury`, `p1-high`
- Effort: 0.5 weeks
- Depends on: #4
- Blocks: #9

### Treasury CRUD — Event Entry
**Issue #7** — Task: Build event entry form (provider, receiver, resource, quantity)
- Labels: `block-1-rea-substrate`, `task`, `treasury`, `p0-critical`
- Effort: 1 week
- Depends on: #4, #5, #6
- Blocks: #9

### Treasury CRUD — Balance Display
**Issue #8** — Task: Build balance display (read from materialized view)
- Labels: `block-1-rea-substrate`, `task`, `treasury`, `p1-high`
- Effort: 0.5 weeks
- Depends on: #4, #2 (materialized view in schema)
- Blocks: #9

### Testing & Validation
**Issue #9** — Task: Enter 10 sample events, verify balances, test immutability
- Labels: `block-1-rea-substrate`, `task`, `p0-critical`
- Effort: 2 weeks
- Depends on: #5, #6, #7, #8
- Success Metric: 10+ events recorded, balances reconcile, UPDATE/DELETE rejected

### Block 1 Retrospective
**Issue #10** — Task: Write Block 1 retrospective document
- Labels: `block-1-rea-substrate`, `task`, `documentation`, `p1-high`
- Effort: 0.25 weeks
- Depends on: #9

---

## Suggested GitHub Project Configuration

### Step 1: Create the Project
1. Go to GitHub → Projects → New Project
2. Name: "Techne Intranet Refinement"
3. Description: "18-month roadmap to evolve techne.institute/intranet into full operational toolbox"
4. Template: "Board" (we'll customize)

### Step 2: Add Custom Fields
1. Click "⚙️ Settings" in project
2. Add fields as listed in "Custom Fields" section above

### Step 3: Create Milestones
1. Go to repository → Issues → Milestones
2. Create 6 milestones (one per block)
3. Set due dates based on start date (Block 1 = Month 3, etc.)

### Step 4: Create Labels
1. Go to repository → Issues → Labels
2. Create labels as listed in "Labels" section above
3. Use emoji codes for visual distinction

### Step 5: Create Issue Templates
1. Go to repository → Settings → Features → Issues → Set up templates
2. Add 3 templates (Epic, Task, Spike) using content above

### Step 6: Create Initial Issues
1. Create Epic issue for Block 1 (#1)
2. Create all Block 1 task issues (#2-#10)
3. Link dependencies in issue descriptions (e.g., "Depends on #2")
4. Assign to milestone "Block 1"
5. Add to project board

### Step 7: Configure Board Views

#### Roadmap View (Timeline)
- Layout: Timeline
- Group by: Block
- Show: All issues
- Date field: Start Date → Due Date

#### Current Sprint View (Board)
- Layout: Board
- Group by: Status
- Filter: Block = [current block]
- Columns: Planned → In Progress → In Review → Done

#### Backlog View (Table)
- Layout: Table
- Group by: None
- Sort by: Priority (descending), then Due Date (ascending)
- Show fields: Title, Block, Effort, Priority, Assignee, Due Date, Status

---

## Workflow

### Starting a new issue:
1. Create issue from template (Epic or Task)
2. Fill in all fields (Block, Effort, Component, etc.)
3. Add to project board (status: "Planned")
4. Link dependencies
5. Assign to milestone

### Working on an issue:
1. Move to "In Progress"
2. Create branch: `block-N/issue-M-short-description`
3. Commit regularly with references: `git commit -m "feat: add agent registry (#5)"`
4. When ready for review, move to "In Review"

### Reviewing an issue:
1. Code review on PR
2. Run tests
3. Check acceptance criteria
4. If approved, merge PR
5. Move issue to "Done"
6. Close issue (links to PR)

### Completing a block:
1. All block issues in "Done"
2. Success metric validated
3. Retrospective document written
4. Close milestone
5. Announce in Workshop

---

## Auto-Linking PRs to Issues

In PR descriptions, include:
```markdown
Closes #5
Depends on #2
Related to #7
```

GitHub will automatically link and close issues when PRs merge.

---

## Sample Board State (End of Block 1)

| Status | Issues |
|--------|--------|
| Done | #1 Epic: Block 1, #2 Schema, #3 Supabase, #4 Next.js, #5 Agents, #6 Resources, #7 Events, #8 Balances, #9 Testing, #10 Retro |
| In Progress | #11 Epic: Block 2, #12 Commitments schema |
| Planned | #13 Contracts UI, #14 Duality enforcement, #15 Governance proposals, #16 Third-floor scenario |

---

## Notification Strategy

### For the team:
- **Watch** the project for all updates
- **Subscribe** to issues you're assigned to
- Set GitHub notifications to "Participating and @mentions"

### For stakeholders (Todd, Nou):
- **Watch** Epic issues only
- Weekly summary via Workshop chat (automated or manual)

---

## Integration with Workshop

At the end of each work session:
1. Post progress to Workshop chat: `"Block N, Issue #M: [status update]"`
2. Link GitHub issue in Workshop Shared Links if it's a major deliverable
3. Use Workshop sprint coordination to claim GitHub issues as sprints

---

**Next Step:** Create the GitHub project using this structure and populate Block 1 issues.
