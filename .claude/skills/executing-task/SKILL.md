---
name: executing-task
description: Executes a task or issue from workspace/ end to end — picks it up, gets it implementation-ready, cuts a branch, then drives it to done by mode, tracking progress and re-planning mid-flow when needed. Use for "오늘 뭐 하지", "이 task 하자", "이 이슈 고치자", "작업 시작", "구현하자".
---

# executing-task

The execution hub. Take one item from `workspace/` and drive it to done.

Two axes decide the flow — everything else is shared:

| Axis | Split | Decides |
|---|---|---|
| **type** | `task` (feature) / `issue` (bug) | the Ready step + branch prefix |
| **track** | `APP` (Claude codes) / `DE` (user codes, Claude reviews) | how the work gets done (see [MODES.md](MODES.md)) |

**Interactive, in the main conversation** — do not fork. Compose the skills/agents below; do not re-implement their logic here. Reads/writes `workspace/` via `spec.py`; there is no vault.

## Workflow

Copy and check off:

```
- [ ] 1. Orient  — status; pick a task or issue
- [ ] 2. Ready   — task: specifying-task (if skeleton) · issue: diagnose first
- [ ] 3. Branch  — sync dev, cut the branch
- [ ] 4. Mode    — branch on track (MODES.md)
- [ ] 5. Do the work
- [ ] 6. Track   — spec.py set (status/branch/pr/dates)
- [ ] 7. Commit + PR — git-workflow
```

### 1. Orient
Run `status`; pick the item (or the user names one). Note its `type` and `track`.

### 2. Ready
- **task**, skeleton-level → run `specifying-task` (code-grounded detail).
- **issue** → diagnose first per `rules/issue-diagnosis`: reproduce and confirm the root cause in the *current* code before touching anything (the workspace symptom is a hypothesis — it may be already fixed, intended, or different now). Fill the spec's 원인 section.
- Then set `status: in-progress`.

### 3. Branch
Cut the branch per `git-workflow` — synced `dev`, English slug: task → `feature/TASK-{N}-slug`, issue → `fix/ISSUE-{N}-slug`. Stacked branches and rebase are covered there.

### 4. Mode
Branch on `track` and follow [MODES.md](MODES.md):
- `APP` → Claude implements (pick the domain skill by nature — api-route / fe-patterns).
- `DE` → the user implements; Claude reviews and navigates (persona in [PERSONA.md](PERSONA.md)).

### 5. Do the work
Per mode. Verify before PR: `npm run build` + `lint` + `test` (0 errors), then `/review`.

### 6. Track
```bash
python3 .claude/scripts/spec.py set <task|issue> <id> status=... branch=... pr=... start_date=... end_date=...
```

### 7. Commit + PR
Follow `git-workflow` (commit → draft → approve → create). Conventions and hygiene live there and in `rules/code-quality` / `rules/workflow`.

## Re-plan loop (any time)
Mid-work needs — split/re-scope → `planning-spec`; small spec/field change → `writing-task` / `specifying-task` — then return to where you left off.

## Must pass (eval)
1. Picking up an **issue** → confirm the root cause in current code first; do not write a fix before diagnosis (issue = hypothesis).
2. Never start implementing on `dev`/`main` — always cut `feature/` or `fix/` from a synced `dev` first.
3. On the **DE** track → Claude does not write the implementation; it reviews, questions, and navigates only.

## Boundaries
- Compose, don't re-implement — call the referenced skills/agents rather than duplicating their steps.
- Single source is `workspace/` via spec.py; there is no vault to sync.
- Replaces be-session / fe-session (their steps live in rules/* + api-route + fe-patterns + /review + git-workflow).
