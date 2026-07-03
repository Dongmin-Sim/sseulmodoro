---
name: specifying-task
description: Refines an existing task spec into an implementation-ready state by grounding it in the actual code — fills 구현 접근, 영향 파일, API 계약, 엣지 케이스. Just-in-time, right before implementing. Use when the user says "이 task 상세화", "구현 준비", or picks a task up to work on.
---

# specifying-task

Take a skeleton task and make it implementation-ready, grounded in the current code. This is agile refinement — do it just before implementing a task, not upfront for all tasks.

## Steps

Copy and check off:

```
- [ ] 1. Read the task — workspace/tasks/<id>/spec.md
- [ ] 2. Read the relevant code (types, routes/components, migrations); ground every detail in what exists
- [ ] 3. Fill the spec against the checklist — 구현 접근 · 영향 파일 · API 계약 · 엣지 케이스 · 테스트
- [ ] 4. If starting now: spec.py set task <id> status=in-progress
- [ ] 5. Show the refined spec; confirm with the user before implementing
```

Spec sections and their format: [CHECKLIST.md](CHECKLIST.md). Set status via `python3 .claude/scripts/spec.py set task <id> status=in-progress`.

## Rules
- Every claim references real code (`file:line`) — never speculate about files that don't exist.
- Depth here; breadth (decomposition) is `planning-spec`.
- Do not change scope — if the task feels wrong-sized, flag it for `planning-spec`, don't silently re-plan.
- Korean body; never touch the vault.
