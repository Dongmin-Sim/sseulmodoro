---
name: planning-spec
description: Orchestrates planning — brainstorms a goal, decomposes it into feature → milestone → task, then dispatches to the writing-* skills to document each. Handles new plans and restructuring existing ones. Use when the user wants to plan or reshape work, e.g. "기획하자", "새 기능", "이거 어떻게 쪼갤까", "마일스톤 바꾸자".
---

# planning-spec

Interactive orchestrator for planning. Brainstorm → decompose (feature → milestone → task) → dispatch to writing-* to document. Covers new plans and restructuring.

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
- [ ] 7. Verify — status
```

### 1. Orient
Read `workspace/board.md` (rebuild via `.claude/skills/status/scripts/build_board.py` if stale) to know existing features/milestones/tasks. Never plan blind.

### 2. Intake
Clarify the goal: purpose (why), rough scope, which session(s) (BE/FE/DE). Brainstorm — discuss trade-offs, don't just transcribe. See [DECOMPOSITION.md](DECOMPOSITION.md) for the hierarchy definitions and heuristics.

### 3. Locate in the hierarchy
Decide the entry level and new-vs-change:
- new feature → milestones + tasks under it
- new milestone under an existing feature
- new/changed tasks under an existing milestone
- restructuring (rename, re-scope, split/merge milestone, move task)

### 4. Decompose / restructure
Break the goal into feature → milestone → task, or work out the restructure. Discuss ordering, dependencies, per-task session. See [EXAMPLE.md](EXAMPLE.md) for a worked decomposition. Keep tasks **skeleton-level** (title + one-line purpose) — detail is `specifying-task`, later.

**Enforce the hierarchy**: never create a task without a milestone, or a milestone without a feature. If a parent is missing, offer to create it first.

### 5. Confirm
Show the proposed hierarchy (mark new vs changed) and get approval before writing anything.

### 6. Dispatch to writing-* (document)
For each approved artifact, invoke the matching skill (create if new, update if exists — they are idempotent):

| artifact | skill |
| --- | --- |
| feature | `writing-feature` |
| milestone | `writing-milestone` |
| task | `writing-task` |
| metric / event (DE) | `writing-metric` / `writing-event` |

Structural changes (split/merge/move) = several writing-* calls together. Do **not** detail tasks here.

### 7. Verify
Run `status` and show the user the updated board.

## Must pass (eval)
1. "새 task 하나" 요청인데 부모 마일스톤/기능이 없음 → task부터 만들지 않고 부모 생성을 먼저 제안 (계층 강제)
2. trivial 필드 갱신(status→done, pr 추가 등) 요청 → 이 오케스트레이터를 거치지 않고 `writing-task`로 직행 안내
3. 분해 확정 후 각 아티팩트를 대응하는 writing-* 로 위임 (feature→writing-feature, milestone→writing-milestone, task→writing-task)

## Boundaries
- Substantive planning/restructuring → here. Trivial field updates (status→done, add pr) → call `writing-task` directly, skip this orchestrator.
- Skeleton depth only; code-grounded detail → `specifying-task`.
- Reads/writes `workspace/` specs; never touches the vault.
