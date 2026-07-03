---
name: writing-metric
description: Creates or updates a metric definition in workspace/metrics/<slug>.md via the spec.py CLI (idempotent). DE-side planning artifact referenced by features and tasks. Usually dispatched by planning-spec. Use for "지표 정의".
---

# writing-metric

Create or update a metric definition via `spec.py` — idempotent. One metric = one file.

## Create
```bash
python3 .claude/scripts/spec.py create metric <slug> title="..."
```
Then fill 정의·계산·원천 in the body with Edit.

## Update
```bash
python3 .claude/scripts/spec.py set metric <slug> status=archived
```
Keys: `title·status`.

## Rules
- Definition only — the DE planning artifact, not the pipeline implementation.
- Korean body; never touch the vault.
