# writing-task — section guide

Reference when filling the sections of `TEMPLATE.md`.

Principle: declarative, WHAT-focused. Don't write HOW (implementation, files, call structure) — the doer decides that at pickup, and it must read clearly to someone outside this conversation.

- **설명** — one line: what this task does. The why / big picture lives in the linked feature.
- **범위** — 포함 states WHAT only. 범위 밖 (out of scope): omit if none, else only the genuine decision points (the cheapest guardrail).
- **완료 조건** — verifiable checkboxes expressed as outcomes. No specific functions/files/call styles (that is HOW).
- **작업 결과** — filled after the PR merges; home of the design decisions (HOW) alongside the PR body — PR summary + link + updated completion checks.
- **참고** — related feature·milestone·decision·predecessor task. Use workspace relative paths / IDs (not Obsidian wikilinks).

Deep detail (implementation approach, affected files, API contract, edge cases) belongs in `specifying-task`.
