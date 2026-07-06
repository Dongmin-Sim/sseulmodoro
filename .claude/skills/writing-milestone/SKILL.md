---
name: writing-milestone
description: Creates or updates a milestone in workspace/milestones/<id>.md via the spec.py CLI (idempotent). Groups tasks under a feature. Usually dispatched by planning-spec. Use for "마일스톤 만들기", "마일스톤 상태 갱신", "마일스톤 재구성".
---

# writing-milestone

Create or update a milestone via `spec.py` — deterministic, idempotent.

## Create
```bash
python3 .claude/scripts/spec.py create milestone <M-S-N> title="..." feature="<parent feature title>"
```
`feature` is optional — omit it for a standalone milestone (common for DE/ops work). This lays down the body from [TEMPLATE.md](TEMPLATE.md). Fill the sections with Edit, following [GUIDE.md](GUIDE.md).

## Update
```bash
python3 .claude/scripts/spec.py set milestone <M-S-N> status=in-progress
```
Keys: `title·feature·status`. `status`: backlog | in-progress | candidate | done | on-hold | cancelled (`candidate` = 후보).

## Candidate (🔭 unnumbered)
For a milestone idea not yet started, don't squat a number — use a descriptive **slug** id (not `M-{T}-{N}`) with `status=candidate`. It surfaces in the board's 대기·후보. Promotion (slug → numbered) happens when it starts and is `planning-spec`'s job: the number = execution order, assigned when the milestone actually rolls.

## Must pass (eval)
1. If `feature` is given, it must match an existing feature title — otherwise omit it (a milestone may stand alone).
2. `set` on an existing milestone patches only the given keys and preserves the body.
3. A field not in the milestone schema → spec.py rejects it; do not invent it.

## Rules
- `feature` is optional; if set, point it at a real feature `title`. `status`: backlog | in-progress | candidate | done | on-hold | cancelled.
- After the write, confirm it: `python3 .claude/scripts/spec.py show milestone <M-S-N>`.
- Korean body; writes `workspace/` only.
