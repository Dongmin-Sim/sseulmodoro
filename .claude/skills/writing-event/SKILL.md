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
Then fill 정의·속성·트리거 in the body with Edit. `slug` and `title` are usually the event name (e.g. `app_visited`).

## Update
```bash
python3 .claude/scripts/spec.py set event <slug> status=archived
```
Keys: `title·status`.

## Rules
- Definition only — not the instrumentation code.
- Korean body; never touch the vault.
