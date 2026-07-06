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
This lays down the body from [TEMPLATE.md](TEMPLATE.md). Fill the sections with Edit at skeleton depth, following [GUIDE.md](GUIDE.md) (WHAT not HOW; deep code-grounded detail is `specifying-task`).

## Update (idempotent)
```bash
python3 .claude/scripts/spec.py set task <TASK-N> status=in-review pr=83
```
`set` patches only the given frontmatter keys and preserves the body. Keys: `status·branch·pr·start_date·end_date·milestone·track` (`track`: APP | DE).

## Must pass (eval)
1. `create`/`set` with a field not in the task schema → spec.py rejects it; do not invent the field.
2. `set` on an existing task patches only the given keys and preserves the body (idempotent).
3. A create request carrying implementation detail → keep the body skeleton-level; defer detail to `specifying-task`.

## Rules
- Never invent field values — write only what was given or decided.
- `status`: backlog | in-progress | in-review | done | on-hold.
- No implementation detail here — that is `specifying-task`.
- After the write, confirm it: `python3 .claude/scripts/spec.py show task <TASK-N>`.
- Korean body; writes `workspace/` only.
