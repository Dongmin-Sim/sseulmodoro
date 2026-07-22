---
name: git-workflow
description: The git-writing lifecycle — cut a branch, commit, draft and create a PR — with consistent, readable output. The single reference other skills point to for anything git. Use when branching, committing, or opening a PR, or when the user says "브랜치 파자", "커밋하자", "PR 올리자", "PR 초안".
---

# git-workflow

The git-writing lifecycle: branch → commit → PR. The single hub other skills (`executing-task`, `releasing`) reference for git work.

Ownership split — do not restate what these own:
- **Conventions** (commit format, PR title, footer ban, issue-ref style) → the always-loaded `rules/code-quality`.
- **Strategy** (3-tier main/dev/feature, which branch types need a PR) → `.claude/CLAUDE.md`.
- **Procedure** (this skill).

Concrete good examples for every case → [EXAMPLES.md](EXAMPLES.md).

## Branch
Cut from a synced `dev` (English slug only, never Korean):
- feature → `feature/TASK-{N}-slug`
- fix → `fix/ISSUE-{N}-slug`

Stacked branches / rebase-on-merge → see `rules/workflow`.

## Commit
- Conventions (format `type(scope):`, imperative, footer ban, issue-ref) → `rules/code-quality`.
- One PR = one topic; stage only related files (`rules/workflow` hygiene).
- Draft the message first so the user can review before it lands — never push/PR directly.

## PR — draft → approve → create

### Four principles (Korean output)
1. **Summary-style (What·Why)** — what and why is the body; leave the *how* to the code/diff. No per-file dumps, no parenthetical implementation details, no function-name lists. Split large changes into module/topic bullets.
2. **Reads for someone without context** — understandable without knowing this PR, chat, or project. No internal/chat-context language. `TASK-{N}`/`ISSUE-{N}` only in the related-task section.
3. **Noun-ending, bullet form (개조식·명사형)** — no conversational/explanatory endings.
4. **One PR = one topic** — split off side changes.

### Body
`.github/pull_request_template.md` is the single source for the sections and what each one holds — follow the file, do not restate it here.

Internal meta (ops/infra config state) goes in the task spec, not the PR.

### Create flow
1. **Print the draft** — title + body to the terminal first. Never create directly.
2. **User reviews / edits** — approve or revise.
3. **Humanize** — run Korean prose through `humanize-korean`, but keep PR bodies bullet-form (avoid over-prosing — 개조식 우선).
4. **Create** — on approval, via `gh`:
   - `gh pr create --base dev --title "..." --body-file <tmpfile>`
   - Editing a body: **not `gh pr edit`** (this repo errors on Projects classic) → `gh api -X PATCH repos/{owner}/{repo}/pulls/{N} -f body=...`.

## Must pass (eval)
1. A branch/commit attempted directly on an unsynced `dev` or `main` → require a `dev` sync + a `feature/`·`fix/` branch first.
2. A PR body listing per-file / implementation details → rewrite it summary-style (What·Why), bullet, noun-ending.
3. A commit message carrying a Claude footer / `Co-Authored-By` trailer → strip it (`rules/code-quality`).

## Checklist (before creating)
- [ ] Branch cut from a synced dev with an English slug
- [ ] Title follows `[TASK-N]` / `[ISSUE-N]`
- [ ] Reads without internal/chat context
- [ ] Summary-style, bullet, noun-ending — not implementation dumps
- [ ] No Claude footer / `Co-Authored-By` trailer
- [ ] User approved the draft
