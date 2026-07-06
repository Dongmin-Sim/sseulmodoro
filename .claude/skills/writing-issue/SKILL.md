---
name: writing-issue
description: Creates or updates an issue (bug) spec in workspace/issues/<id>/spec.md via the spec.py CLI (idempotent). Created and filled during the executing-task bug flow (diagnosis-first), or dispatched by planning-spec. Use for "이슈 만들기", "버그 등록", "이슈 상태 갱신".
---

# writing-issue

Create or update an issue spec via `spec.py` — deterministic, idempotent. Diagnosis-first: an issue is a hypothesis until confirmed in current code (`rules/issue-diagnosis`).

## Create
```bash
python3 .claude/scripts/spec.py create issue <ISSUE-N> title="..." severity=<low|medium|high|critical> track=<APP|DE>
```
This lays down the body from [TEMPLATE.md](TEMPLATE.md). Fill the sections with Edit, following [GUIDE.md](GUIDE.md).

## Update (idempotent)
```bash
python3 .claude/scripts/spec.py set issue <ISSUE-N> status=in-review pr=90
```
`set` patches only the given keys and preserves the body. Keys: `status·branch·pr·start_date·end_date·severity·track`.

## Must pass (eval)
1. `create`/`set` with a field not in the issue schema → spec.py rejects it; do not invent the field.
2. A fix written before the cause is confirmed in current code → diagnose first (`rules/issue-diagnosis`).
3. `set` on an existing issue patches only the given keys and preserves the body.

## Rules
- Never invent field values — write only what was given or confirmed.
- `status`: backlog | in-progress | in-review | done | on-hold. `severity`: low | medium | high | critical.
- Korean body; writes `workspace/` only (no vault).
