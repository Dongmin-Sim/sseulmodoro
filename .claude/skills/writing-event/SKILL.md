---
name: writing-event
description: Creates or updates an event definition in workspace/events/<slug>.md via the spec.py CLI (idempotent). DE-side planning artifact for tracked events. Usually dispatched by planning-spec. Use for "이벤트 정의".
---

# writing-event

Create or update an event definition via `spec.py` — idempotent. One event = one file.

## Create
```bash
python3 .claude/scripts/spec.py create event <slug> title="<event_name>"
```
This lays down the body from [TEMPLATE.md](TEMPLATE.md). Fill the sections with Edit, following [GUIDE.md](GUIDE.md). `slug` and `title` are usually the event name (e.g. `app_visited`).

## Update
```bash
python3 .claude/scripts/spec.py set event <slug> status=archived
```
Keys: `title·status`.

## Must pass (eval)
1. `create`/`set` with a field not in the event schema → spec.py rejects it; do not invent the field.
2. `set` on an existing event patches only the given keys and preserves the body.
3. Instrumentation code written into the spec → keep it definition-only.

## Rules
- Definition only — not the instrumentation code.
- Korean body; never touch the vault.
