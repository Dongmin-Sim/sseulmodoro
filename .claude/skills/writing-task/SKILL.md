---
name: writing-task
description: Creates or updates a task spec via the spec.py CLI (idempotent) — the file lands in its milestone's folder, or the tasks/ queue when the milestone is unset. Skeleton depth only. Usually dispatched by planning-spec, but callable standalone for field updates (status, branch, pr). Use for "task 만들기", "task 상태 갱신", "PR 링크 추가".
---

# writing-task

Create or update a task spec via `spec.py` — deterministic, idempotent. **Mechanical documentation**: the decision of what to cut is already made. This writes the file; `executing-task` fills the code-grounded detail right after.

## Create
```bash
python3 .claude/scripts/spec.py create task <TASK-N> title="..." milestone=<M-S-N> track=<APP|DE>
```
This lays down the body from [TEMPLATE.md](TEMPLATE.md). Fill the sections with Edit, following [GUIDE.md](GUIDE.md) (WHAT not HOW). `milestone` decides where the file lands — omit it and the task waits in the `tasks/` queue.

## Update (idempotent)
```bash
python3 .claude/scripts/spec.py set task <TASK-N> status=in-review pr=83
```
`set` patches only the given frontmatter keys and preserves the body. Keys: `status·branch·pr·start_date·end_date·milestone·track` (`track`: APP | DE).

## Must pass (eval)
1. `create`/`set` with a field not in the task schema → spec.py rejects it; do not invent the field.
2. `set` on an existing task patches only the given keys and preserves the body (idempotent).
3. A create request carrying implementation detail → write the WHAT here; the code-grounded detail is filled by `executing-task` against its CHECKLIST.

## Rules
- Never invent field values — write only what was given or decided.
- `status`: backlog | in-progress | in-review | done | on-hold | cancelled.
- No implementation detail here — that is `executing-task` step 2.
- After the write, confirm it: `python3 .claude/scripts/spec.py show task <TASK-N>`.
- Korean body; writes `workspace/` only.
