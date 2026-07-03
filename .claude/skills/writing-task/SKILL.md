---
name: writing-task
description: Creates or updates a task spec in workspace/tasks/<id>/spec.md via the spec.py CLI (idempotent). Skeleton depth only. Usually dispatched by planning-spec, but callable standalone for field updates (status, branch, pr). Use for "task 만들기", "task 상태 갱신", "PR 링크 추가".
---

# writing-task

Create or update a task spec via `spec.py` — deterministic, idempotent. **Mechanical documentation**: the planning decision is already made. Keep it skeleton-level; deep code-grounded detail is `specifying-task`.

## Create
```bash
python3 .claude/scripts/spec.py create task <TASK-N> title="..." milestone=<M-S-N> track=<APP|DE>
```
Then fill 설명 and 완료 조건 in the body with Edit (skeleton depth only — one-line purpose + rough conditions).

## Update (idempotent)
```bash
python3 .claude/scripts/spec.py set task <TASK-N> status=in-review pr=83
```
`set` patches only the given frontmatter keys and preserves the body. Keys: `status·branch·pr·start_date·end_date·milestone·track` (`track`: APP | DE).

## Rules
- Never invent field values — write only what was given or decided.
- `status`: backlog | in-progress | in-review | done | on-hold.
- No implementation detail here — that is `specifying-task`.
- Korean body; never touch the vault.
