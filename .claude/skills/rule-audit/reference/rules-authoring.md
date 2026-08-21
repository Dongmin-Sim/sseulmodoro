# Rules-authoring guide (criteria + examples)

Rules in `.claude/rules/*.md` load into context **every session** (or when matching files open, if `paths:`-scoped). Because they are always-on, the bar is: earn the context, and be the right container. Six dimensions.

## 1. Container fit — rule vs skill
The single most important check. A **rule** is an always-apply guardrail ("never commit console.log", "API routes check auth first"). A **skill** is an on-demand procedure invoked for a task ("draft a PR", "plan a feature").

- Flag a rule that is really a procedure: numbered task steps, a draft→approve→create flow, "when doing X, do steps 1–5". → move to a skill; leave only the guardrail (the invariant) in the rule.
- Test: *"Does this need to be in context on every turn, or only when the user does a specific task?"* Only-when-task → skill.

Example (this repo): commit **conventions** (format `type(scope):`, imperative, no Claude footer) are an always-apply guardrail → stay in `rules/code-quality`. The commit/PR **procedure** (draft, humanize, `gh` create) is on-demand → `git-workflow` skill. Same topic, split by container.

## 2. Path-scoping
An unconditionally-loaded rule whose content only matters for certain files wastes context on every other turn. Recommend `paths:` frontmatter (glob) to scope it.

- `rules/testing.md` → `paths: ["**/*.test.ts"]` (only when touching tests)
- `rules/db-design.md` → `paths: ["supabase/migrations/**", "src/app/api/**"]`
- `rules/security.md` → `paths: ["src/app/api/**"]`

Keep global (no `paths:`) only if the rule genuinely applies to all work (e.g. `code-quality`, `workflow`).

> ⚠️ Version gate: `paths:` support is version-dependent (v2.1.198+ for symlink matching). Recommend it, but note it must be verified on the project's CC version before relying on it. Don't assert it works.

## 3. Single topic
One concern per file; descriptive filename that matches (`testing.md`, `db-design.md`). Flag a file mixing unrelated concerns or bloated past ~one screen — split it. A rule is a short guardrail sheet, not an essay.

## 4. No duplication
The same guidance restated in `CLAUDE.md`, another rule, or a skill drifts over time. Name the single source that should own it; the others point to it.

Example (this repo): commit + PR-title conventions belong in the always-loaded rule (`rules/code-quality`); a git skill (`git-workflow`) should reference them, not restate them — restating in both drifts.

## 5. Conciseness
Assume Claude is smart — add only what it lacks. No "what is a PR" explanations, no surveying options. Terse imperative bullets. Every always-loaded line is paid for on every turn.

- Bad: a paragraph explaining why race conditions happen before the rule.
- Good: "포인트 잔액 변경은 상대 UPDATE (`balance = balance + ?`) — race 방지."

## 6. Actionable & current
Declarative/imperative and enforceable, not aspirational prose. No time-sensitive or stale claims — a rule asserting repo state (schema applied, files exist) must match current code.

Example (this repo): a "현재 상태" section claiming "스키마 미적용/RLS 미작성" while `003_rls_policies.sql` exists is stale → delete or refresh. Prefer invariants over state snapshots.

## Verdict
Per dimension 통과/갭 with evidence, then one-line 통과 / 조건부 / 미달 + top 1–3 fixes. Korean report.
