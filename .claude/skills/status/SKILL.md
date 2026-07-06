---
name: status
description: "Reports current work status — aggregates task/issue/milestone frontmatter under workspace/ into the board.md cache and reconciles it against git branches and gh PRs to surface what is in progress, what to pick up next, and any drift. Use at session start, or when the user asks for status in Korean such as '지금 상태', '어디까지 했지', '상태 보여줘', '이어서 뭐 하지'."
context: fork
agent: status-runner
---

# status

Aggregate and reconcile the work state under `workspace/`, then show "current state + what to pick up next".

**Read-only**: never edit spec files. Report mismatches only; the user fixes them.

**User-facing output is Korean**: render the report in Korean via the template. Everything else here is Claude-facing.

## Run checklist

Copy and check off as you go:

```
- [ ] 1. Refresh the board cache (build_board.py)
- [ ] 2. Reconcile against git/gh → detect drift
- [ ] 3. Render the summary with the status-report template
```

### 1. Refresh the board cache

Rebuild `workspace/board.md`. Spec frontmatter is the source of truth; the board is a derived cache.

```bash
python3 .claude/skills/status/scripts/build_board.py
```

It skips when fresh (by mtime); pass `--force` to rebuild. Then read `workspace/board.md`.

### 2. Reconcile against git/gh (drift)

Check the board against the real repo. This skill runs forked (a subagent), so run `gh` directly rather than delegating to another agent:

```bash
gh pr list --state all --json number,state,mergedAt,headRefName
git branch --format='%(refname:short)'
```

**Strict matching**: a PR belongs to a task only if its head branch *exactly equals* the task's `branch`. Never attach a PR by number or title similarity. Route every mismatch to drift — do not show a guessed PR inline:

- task `branch`/`pr` set but the PR is already merged → drift ("PR 머지됨, 파일은 아직 {status}")
- spec has no branch/pr yet a `feature/<id>` branch or PR exists → drift ("spec는 backlog인데 branch/PR 존재")
- `feature/*` / `fix/*` branch with no matching spec at all → drift (orphan)

Report mismatches only — do not edit spec files.

### 3. Render the summary

Render in Korean via [templates/status-report.md](templates/status-report.md). Goal: let the user grasp the whole project shape and progress at a glance. Sections: 최근 작업 / 진행 중인 작업 / 대기·후보 / 미해결 이슈 / 확인할 것(drift) / 다음 액션.

- **최근 작업**: 1–3 lines synthesized from recent commits (`git log --oneline -5`) and just-changed in-review/in-progress tasks.
- **Hierarchy**: render feature → milestone → task as a 3-level tree (`└`/`├`) so structure is obvious. Group milestones strictly under their board `feature` value — do not infer. Applies to both 진행 중인 작업 and 대기·후보. Wrap the tree in a code fence if terminal indentation collapses.
- **진행 중인 작업**: milestones whose status is in-progress. If none, "진행 중인 작업 없음".
- **대기·후보**: not-started (backlog) features/tasks and candidate milestones — mark candidates "(후보)".
- **Copy the milestone `display` line verbatim**: the board's `display` column is the ready milestone tree line (id · title · bar · done/total). Use it as-is — never re-assemble or recount `done/total`. Group by the `feature` column; place by `status`.
- **Render every section**: if a section has nothing, print `없음` — never drop the section.
- **다음 액션**: 1–3 context-relevant next skills, one line each (e.g. backlog present → `planning-spec`; open issues → `executing-task`; always `status`).

## Must pass (eval)

1. task is in-review but its PR is merged → flag under drift as "needs update" (do not edit the file)
2. a feature branch with no spec → surface "branch exists, no spec"
3. nothing blocked → propose the next candidate(s)

## Notes

- Frontmatter fields: `status·branch·pr·start_date·end_date·milestone·track` (`track`: APP | DE)
- Under git worktrees the canonical `workspace/` lives in the primary repo (gitignored, not shared). Run from there, or pass `--workspace`.
