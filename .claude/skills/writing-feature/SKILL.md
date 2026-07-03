---
name: writing-feature
description: Creates or updates a feature spec in workspace/features/<slug>.md via the spec.py CLI (idempotent). A feature is the top of the hierarchy; milestones reference it by title. Usually dispatched by planning-spec. Use for feature create or scope change.
---

# writing-feature

Create or update a feature spec via `spec.py` — deterministic, idempotent.

## Create
```bash
python3 .claude/scripts/spec.py create feature <slug> title="..."
```
Then fill 목적 and 범위 in the body with Edit.

## Update
```bash
python3 .claude/scripts/spec.py set feature <slug> status=archived
```
Keys: `title·status`.

## Rules
- Feature = WHAT / why, not HOW. Milestones and tasks live in their own files.
- Milestones reference this feature by its `title` — keep the title stable, or update the referencing milestones if it changes.
- Korean body; never touch the vault.
