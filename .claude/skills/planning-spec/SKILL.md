---
name: planning-spec
description: Orchestrates planning — brainstorms a goal, decomposes it into feature → milestone, then dispatches to the writing-* skills to document each. Stops at the milestone; tasks are cut at pickup by executing-task. Handles new plans and restructuring existing ones. Use when the user wants to plan or reshape work, e.g. "기획하자", "새 기능", "이거 어떻게 쪼갤까", "마일스톤 바꾸자".
---

# planning-spec

Interactive orchestrator for planning. Brainstorm → decompose (feature → milestone) → dispatch to writing-* to document. Covers new plans and restructuring.

**Stops at the milestone.** Tasks are not created here — `executing-task` cuts each one against the code at the moment it is picked up.

**Interactive, in the main conversation** — discuss with the user; do not fork. The writing-* skills do the mechanical documentation.

**Korean with the user** — all discussion and confirmation prompts are Korean.

## Workflow

Copy and check off:

```
- [ ] 1. Orient — read the board
- [ ] 2. Intake — clarify the goal (brainstorm)
- [ ] 3. Locate — new vs change; where in the hierarchy
- [ ] 4. Decompose / restructure
- [ ] 5. Confirm the plan with the user
- [ ] 6. Dispatch to writing-* (document)
- [ ] 7. Verify — reporting-status
```

### 1. Orient
Read `workspace/board.md` (rebuild via `.claude/skills/reporting-status/scripts/build_board.py` if stale) to know existing features/milestones/tasks. Never plan blind.

### 2. Intake
Clarify the goal: purpose (why), rough scope, which track(s) (APP/DE). Brainstorm — discuss trade-offs, don't just transcribe. See [DECOMPOSITION.md](DECOMPOSITION.md) for the hierarchy definitions and heuristics.

### 3. Locate in the hierarchy
Decide the entry level and new-vs-change:
- new feature → milestones under it
- new milestone under an existing feature
- changed scope on an existing milestone
- issue (bug) → its own spec (`writing-issue`); DE metric/event definition → `writing-metric` / `writing-event`
- restructuring (rename, re-scope, split/merge milestone, move task)

### 4. Decompose / restructure
Break the goal into feature → milestone, or work out the restructure. Discuss ordering, dependencies, track. See [EXAMPLE.md](EXAMPLE.md) for a worked decomposition.

A milestone's 도달 정의 is what gets settled here — what must be true for it to be done. Its 진행 단계 stays empty; pieces are added as they are cut.

**A feature above the milestone is optional** — a milestone may stand alone (esp. DE/ops). If a required parent is missing, offer to create it first.

**Promote a 🔭 candidate**: a candidate milestone (slug id, `status: candidate`) holds no number until it starts. Promote = next `M-{track}-{N}` (that track's max + 1) → `mkdir milestones/<M-id>/` and move the slug file in as `<M-id>.md` → set `status` (candidate → in-progress/backlog) → detail it. Its tasks land in that folder as they are cut. Number = execution order; only started milestones hold numbers.

### 5. Confirm
Show the proposed hierarchy (mark new vs changed) and get approval before writing anything.

### 6. Dispatch to writing-* (document)
For each approved artifact, invoke the matching skill (create if new, update if exists — they are idempotent):

| artifact | skill |
| --- | --- |
| feature | `writing-feature` |
| milestone | `writing-milestone` |
| issue (bug) | `writing-issue` |
| metric / event (DE) | `writing-metric` / `writing-event` |

Structural changes (split/merge/move) = several writing-* calls together.

### 7. Verify
Run `reporting-status` and show the user the updated board.

## Must pass (eval)
1. A request to lay out a milestone's tasks up front → create the milestone only; tasks are cut at pickup by `executing-task`.
2. A trivial field update (status→done, add pr, etc.) → skip this orchestrator; direct the user to `writing-task`.
3. Restructuring that moves a task between milestones → `spec.py set task <id> milestone=<M-ID>`, which relocates the file; don't drop or duplicate it.

## Boundaries
- Substantive planning/restructuring → here. Trivial field updates (status→done, add pr) → call `writing-task` directly, skip this orchestrator.
- Milestone depth only; cutting and detailing tasks → `executing-task`.
- Reads `workspace/` specs; writing is delegated to writing-* (no vault).
