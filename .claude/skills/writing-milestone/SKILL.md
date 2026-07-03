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

## Update
```bash
python3 .claude/scripts/spec.py set milestone <M-S-N> status=in-progress
```
Keys: `title·feature·status`. `status`: backlog | in-progress | candidate | done | on-hold (`candidate` = 후보).

## Rules
- `feature` must match an existing feature's `title`. If none exists, the caller (planning-spec) creates the feature first.
- Korean body; never touch the vault.
