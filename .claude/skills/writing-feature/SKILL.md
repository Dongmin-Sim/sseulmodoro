---
name: writing-feature
description: Creates or updates a feature spec in workspace/features/<slug>.md via the spec.py CLI (idempotent). A feature is the top of the hierarchy; milestones reference it by title. Usually dispatched by planning-spec. Use for "기능 정의", "기능 스펙 만들기", "스코프 변경".
---

# writing-feature

Create or update a feature spec via `spec.py` — deterministic, idempotent.

## Create
```bash
python3 .claude/scripts/spec.py create feature <slug> title="..."
```
This lays down the body from [TEMPLATE.md](TEMPLATE.md). Fill the sections with Edit, following [GUIDE.md](GUIDE.md).

## Update
```bash
python3 .claude/scripts/spec.py set feature <slug> status=archived
```
Keys: `title·status`.

## Must pass (eval)
1. `create`/`set` with a field not in the feature schema → spec.py rejects it; do not invent the field.
2. `set` on an existing feature patches only the given keys and preserves the body.
3. Content dropped to HOW (implementation detail) → keep it WHAT / why; HOW belongs to tasks.

## Rules
- Feature = WHAT / why, not HOW. Milestones and tasks live in their own files.
- Milestones reference this feature by its `title` — keep the title stable, or update the referencing milestones if it changes.
- Korean body; writes `workspace/` only.
