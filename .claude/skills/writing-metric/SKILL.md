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
This lays down the body from [TEMPLATE.md](TEMPLATE.md). Fill the sections with Edit, following [GUIDE.md](GUIDE.md).

## Update
```bash
python3 .claude/scripts/spec.py set metric <slug> status=archived
```
Keys: `title·status`.

## Must pass (eval)
1. `create`/`set` with a field not in the metric schema → spec.py rejects it; do not invent the field.
2. `set` on an existing metric patches only the given keys and preserves the body.
3. Grain (fact) and derivation (mart) collapsed into one section → separate them; they are different layers.

## Rules
- Definition only — the DE planning artifact, not the pipeline implementation.
- After the write, confirm it: `python3 .claude/scripts/spec.py show metric <slug>`.
- Korean body; writes `workspace/` only.
