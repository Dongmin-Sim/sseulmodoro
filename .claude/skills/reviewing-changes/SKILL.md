---
name: reviewing-changes
description: Reviews the branch's changes (the dev...HEAD diff) before a PR — delegates to code-reviewer then security-reviewer and consolidates their findings into one ranked report. Use before opening a PR, or when the user says "리뷰해줘", "PR 전 검토", "변경 리뷰".
---

# reviewing-changes

Pre-PR gate. Review the changes **about to be proposed** — the `dev...HEAD` diff — not the working tree or the whole repo.

**Interactive, in the main conversation** — do not fork. Delegate the heavy reading to the two review agents (sonnet, token-saving); consolidate their output here.

## Steps
1. Scope the diff: `git diff dev...HEAD --stat`. If empty, stop and say there is nothing to review.
2. Delegate to the **code-reviewer** agent — structural defects, missing transactions/rpc, type safety, edge cases.
3. Delegate to the **security-reviewer** agent — RLS, auth boundary, env/secret exposure, input validation, OWASP. Always run it; do not skip when code-reviewer finds no security issue.
4. Consolidate both into one Korean report, ranked CRITICAL → HIGH → MEDIUM, each with `file:line`.
5. Verdict gate: any CRITICAL → **Block** (do not open the PR until resolved).

## Boundaries
- Review only — do not fix. Report findings; `executing-task` / the user decides fixes.
- Runs **after** the 3-verify (`build` + `lint` + `test`) and **before** `git-workflow` PR creation.
- Compose, don't re-implement — call the two agents; don't restate their checklists here.

## Must pass
- Scoped to `dev...HEAD`, not the working tree or whole repo.
- Both agents run; security is never skipped.
- Output is Korean, ranked, `file:line`, with a single verdict: Approve / Warning / Block.
