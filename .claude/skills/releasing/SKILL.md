---
name: releasing
description: Promotes verified work from dev to production (main) for this repo's Vercel + Supabase setup — dev→main PR, prod DB migration, post-deploy verification. Use at release time, or when the user says "배포하자", "릴리즈", "main에 올리자", "프로덕션 반영".
---

# releasing

Promote `dev` → `main` (production). Vercel auto-deploys on merge; the manual pieces are the DB migration and the health check.

Prerequisite: the work is already merged to `dev` (via `git-workflow` PRs) and its Vercel **Preview** looks right.

## Workflow

Copy and check off:

```
- [ ] 1. dev→main PR — git-workflow
- [ ] 2. Merge → wait for Vercel Production deploy
- [ ] 3. Apply prod DB migrations (manual)
- [ ] 4. Verify production — key flow + regressions
```

### 1. PR
Open a `dev → main` PR. Use `git-workflow`'s **draft → approve → create** flow and body style, but **not** its branch/title rules — a release PR has `--base main`, no new branch (`dev` is the source), and title `Release: <scope>`. Summarize which milestones/tasks ship.

### 2. Deploy
Merge → Vercel builds Production from `main` automatically. Confirm the deploy went green via the commit's Vercel status check (`gh pr checks` on the merged PR, or the Vercel dashboard) — don't assume.

### 3. DB migration (manual — known gap)
New files under `supabase/migrations/` do **not** ship with Vercel. Apply them to the prod project:
```bash
npx supabase db push
```
- Check the output for errors (fix the cause and re-run on failure).
- Manual for now; CI automation is a separate planned task.
- After the append-only cutover, never edit baseline migrations — add new ones only.

### 4. Verify
- Production visual QA is the **user's** job — guide them to exercise this release's key flow on the production URL (relevant screens: login, timer, collection, …) and wait for their confirmation. Do not browse it yourself.
- On a reported regression, roll back with a `main` revert PR.

## Must pass (eval)
1. A direct push/commit to `main` → redirect it to a `dev`→`main` PR.
2. A release including new `supabase/migrations/*` skips step 3 → require confirming the prod DB push.
3. Finishing without post-deploy verification → require exercising the production key flow.

## Boundaries
- Compose, don't re-implement — PR procedure/conventions → `git-workflow`; branch strategy → `.claude/CLAUDE.md`.
- Staging deploy (dev→Preview) is out of scope — this skill is production promotion only.
