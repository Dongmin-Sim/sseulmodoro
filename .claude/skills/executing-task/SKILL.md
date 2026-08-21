---
name: executing-task
description: Executes work from workspace/ end to end — picks up a milestone, cuts the next task against the current code, gets it implementation-ready, branches, then drives it to done by mode. Use for "오늘 뭐 하지", "이 task 하자", "이 이슈 고치자", "작업 시작", "구현하자".
---

# executing-task

The execution hub. Take one milestone, cut the next piece of work out of it, and drive that piece to done.

Two axes decide the flow — everything else is shared:

| Axis | Split | Decides |
|---|---|---|
| **type** | `task` (feature) / `issue` (bug) | the Ready step + branch prefix |
| **track** | `APP` (Claude codes) / `DE` (user codes, Claude reviews) | how the work gets done (see [MODES.md](MODES.md)) |

**Interactive, in the main conversation** — do not fork. Compose the skills/agents below; do not re-implement their logic here. Reads/writes `workspace/` via `spec.py`.

## Workflow

Copy and check off:

```
- [ ] 1. Orient  — reporting-status; pick the milestone (or issue)
- [ ] 2. Ready   — task: cut the ticket against current code · issue: diagnose first
- [ ] 3. Branch  — sync dev, cut the branch
- [ ] 4. Mode    — branch on track (MODES.md)
- [ ] 5. Do the work
- [ ] 6. Track   — spec.py set (status/branch/pr/dates)
- [ ] 7. Commit + PR — git-workflow
```

### 1. Orient
Run `reporting-status`. Pick the milestone in flight (or the user names one); for a bug, pick the issue instead. Note the `track`.

### 2. Ready

**task — cut the ticket here, now.** A milestone does not carry a pre-made task list; the next piece is decided against the code as it stands today.

1. Read the milestone's 도달 정의 and what its existing tasks already covered.
2. Read the relevant code. Discuss with the user what the next shippable piece is — one work session, one concern.
3. Create it: `writing-task` (the number is assigned now, not earlier).
4. Fill it against [CHECKLIST.md](CHECKLIST.md) — 구현 접근 · 영향 파일 · API 계약 · 엣지 케이스 · 테스트, every claim grounded in real code (`file:line`).
5. Show the spec and confirm before implementing.

A task already sitting in the queue (`workspace/tasks/`) skips steps 2–3 — assign its milestone (`spec.py set task <id> milestone=<M-ID>`, which moves the file) and go to step 4.

**issue** — if it has no spec yet, create one with `writing-issue`. Then diagnose first per `rules/issue-diagnosis`: reproduce and confirm the root cause in the *current* code before touching anything (the workspace symptom is a hypothesis — it may be already fixed, intended, or different now). Fill the spec's 원인 section.

Then set `status: in-progress`.

### 3. Branch
Cut the branch per `git-workflow` — synced `dev`, English slug: task → `feature/TASK-{N}-slug`, issue → `fix/ISSUE-{N}-slug`. Stacked branches and rebase are covered there.

### 4. Mode
Branch on `track` and follow [MODES.md](MODES.md):
- `APP` → Claude implements (pick the domain skill by nature — api-route / fe-patterns).
- `DE` → the user implements; Claude reviews and navigates (persona in [PERSONA.md](PERSONA.md)).

### 5. Do the work
Per mode. Verify before PR: `npm run build` + `lint` + `test` (0 errors), then `reviewing-changes`.

### 6. Track
```bash
python3 .claude/scripts/spec.py set <task|issue> <id> status=... branch=... pr=... start_date=... end_date=...
```
Tick the milestone's 진행 단계 as pieces land — it is a running record of what was cut, not a plan to execute.

### 7. Commit + PR
Follow `git-workflow` (commit → draft → approve → create). Conventions and hygiene live there and in `rules/code-quality` / `rules/workflow`.

## Re-plan loop (any time)
Mid-work needs — the milestone itself is wrong (scope, split, merge) → `planning-spec`; a small field change → `writing-task`; a follow-up milestone worth doing later → park it as a candidate (`writing-milestone`, slug id, `status=candidate`) — then return to where you left off.

A piece that turns out too big is not re-planning: close what shipped and cut the rest as the next task.

## Must pass (eval)
1. Picking up an **issue** → confirm the root cause in current code first; do not write a fix before diagnosis (issue = hypothesis).
2. Never start implementing on `dev`/`main` — always cut `feature/` or `fix/` from a synced `dev` first.
3. On the **DE** track → Claude does not write the implementation; it reviews, questions, and navigates only.
4. A spec detail that cannot be confirmed in current code → ask the user; never fill it speculatively (`file:line` or nothing).
5. A request to pre-create the milestone's remaining tasks → cut only the piece being started now.

## Boundaries
- Compose, don't re-implement — call the referenced skills/agents rather than duplicating their steps.
- Single source is `workspace/` via spec.py.
- Tasks are cut here, not in `planning-spec` — that skill stops at the milestone.
- APP-track steps live in rules/* + api-route + fe-patterns + reviewing-changes + git-workflow.
