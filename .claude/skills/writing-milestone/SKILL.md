---
name: writing-milestone
description: Creates or updates a milestone in workspace/milestones/<id>.md via the spec.py CLI (idempotent). Groups tasks under a feature. Usually dispatched by planning-spec. Use for milestone create, rename, re-scope, or status change.
---

# writing-milestone

Create or update a milestone via `spec.py` — deterministic, idempotent.

## Create
```bash
python3 .claude/scripts/spec.py create milestone <M-S-N> title="..." feature="<parent feature title>"
```
This lays down the body from [TEMPLATE.md](TEMPLATE.md). Fill the sections with Edit, following [GUIDE.md](GUIDE.md).

## Update
```bash
python3 .claude/scripts/spec.py set milestone <M-S-N> status=in-progress
```
Keys: `title·feature·status`. `status`: backlog | in-progress | candidate | done | on-hold (`candidate` = 후보).

## Must pass (eval)
1. `create` with `feature` not matching an existing feature title → the caller (planning-spec) creates the feature first.
2. `set` on an existing milestone patches only the given keys and preserves the body.
3. A field not in the milestone schema → spec.py rejects it; do not invent it.

## Rules
- `feature` must match an existing feature's `title`. If none exists, the caller (planning-spec) creates the feature first.
- Korean body; never touch the vault.
