---
name: review-py
description: Teaching-first Python review that reports findings as conventional comments (issue/suggestion/question/nit/praise) anchored to file/function/line — the user writes the fixes. Three lenses backed by reference checklists — code(anti-patterns), refactor(design patterns), test(pytest practices). Use during DE implementation when the user asks for a Python review, e.g. "/review-py 코드", "리뷰해줘"(while working on Python), "리팩토링 포인트", "테스트 리뷰". Distinct from reviewing-changes, which is the pre-PR merge gate.
---

# review-py — Python learning review

Reviews work-in-progress code in the voice of a senior reviewer leaving PR comments. **The user writes the fixes** — this skill reports and stops.

All output to the user is written in Korean. Skill terms (comment types, lens names) stay in English.

## Invocation

```
/review-py code            ← default when no lens given
/review-py refactor
/review-py test
/review-py all             ← all three lenses (pre-closure sweep)
/review-py code etl/nsm/load.py   ← explicit target
```

Korean lens aliases map directly: 코드→code, 리팩토링→refactor, 테스트→test, 전체→all.

When no target is given, review the files from `git diff dev...HEAD --name-only -- '*.py'`. If the diff is empty, ask the user for a target.

## Process

1. Read the checklist for the lens:
   - code → `../python-anti-patterns/SKILL.md`
   - refactor → `../python-design-patterns/SKILL.md` (read `../python-design-patterns/references/details.md` when a judgment call is unclear)
   - test → `../python-testing/SKILL.md`
   - all → all three
2. Read the target files and collect findings against the checklist.
3. Flag Pythonic conventions (idioms, type hints, import style, trailing commas, …) even when the checklist does not cover them — always with a one-line reason why the convention exists.
4. Report in the format below and stop. Do not modify code.

## Output format

Conventional comments, most severe first:

| Type | Meaning |
|---|---|
| `issue` | Defect or consistency risk — must be fixed |
| `suggestion` | Alternative approach or improvement |
| `question` | Intent check; a question that leads the user to find the answer |
| `nit` | Minor points (batched into one comment) |
| `praise` | A pattern done well — named explicitly |

Every comment is anchored: `type: file · function · line N`. Then the reason (why it is a problem) → the expected direction (never the answer code).

```
issue: etl/nsm/load.py · load_backfill · line 108
  count와 delete의 WHERE 조건이 복제입니다. 한쪽만 수정되면 건수 대조
  가드가 조용히 어긋납니다. 두 쿼리가 조건을 한 곳에서 가져오게 해주세요.

question: etl/nsm/run.py · run_backfill · line 91
  건수 대조에서 빈 구간(넣을 행 0)은 어떤 동작이 의도인가요?

praise: run_backfill이 run_nsm을 건드리지 않는 별도 경로로 선 것 —
  실행 경로 격리가 spec의 결정 그대로 실현됐습니다.
```

## Rules

- **Fixes belong to the user.** Edit only items explicitly delegated, e.g. "사소한 건 처리해줘".
- At most one `question` per finding, and it never contains the answer — no question flooding.
- `nit`s are batched into a single comment, not listed individually.
- At least one `praise` — name the pattern that was done well to reinforce it.
- Findings outside the current lens are not dropped — close the report with `다른 관점: <lens> 후보 N건 (one-line summary)`.
- Tone: a senior engineer commenting on a PR — suggestive, reason first, clear and concise.
- Test naming in this repo: Korean descriptive form `test_<대상>_<동작>한다`.

## Must pass (eval)

1. `/review-py code` → every finding carries a `type: file · function · line N` anchor, and not a single line of code is modified.
2. A `question` comment contains no answer and no fix code — the question only.
3. A code defect found during `/review-py refactor` → not mixed into the body; handed off via the closing `다른 관점:` line.
4. Three or more `nit`s → batched into one comment, not listed individually.
5. No finding is fixed by Claude until the user explicitly delegates it (e.g. "사소한 건 처리해줘").

## Distinction from reviewing-changes

- `reviewing-changes` — pre-PR merge verdict. Delegates to subagents (code/security-reviewer).
- `review-py` — learning review during implementation. This session reviews directly; the user fixes.
