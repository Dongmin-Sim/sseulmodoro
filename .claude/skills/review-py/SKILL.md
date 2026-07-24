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
issue: etl/nsm/load.py · load_incremental · line 62
  이 로직은 null 값을 처리하지 않습니다. null 값을 처리하는 로직을 추가해 주세요.

suggestion: etl/nsm/run.py · run_nsm · line 44
  이 함수는 더 작은 함수로 분리할 수 있을 것 같아요. 이렇게 하면 더 이해하기 쉬울 거예요.

question: etl/nsm/extract.py · extract_incremental · line 40
  이 부분에서 왜 이 접근 방식을 사용했는지 설명해 주실 수 있나요?

nit: etl/nsm/load.py · preprocessing · line 12
  여기에 공백이 하나 더 필요해요.

praise: 이 부분의 코드는 매우 깔끔하고 이해하기 쉽네요! 좋은 작업입니다.
```

Several `nit`s in one comment — grouped by kind, one line per location:

```
nit: 스타일 5건 묶음

타입 힌트 누락
  run.py:74        · run_backfill · target_table
  transform.py:26  · transform · bq_client

콜론 뒤 공백
  extract.py:62    · start:str, end:str
  sources.py:49    · type:str

줄 끝 공백
  load.py:53
```

## Rules

- **Fixes belong to the user.** Edit only items explicitly delegated, e.g. "사소한 건 처리해줘".
- At most one `question` per finding, and it never contains the answer — no question flooding.
- `nit`s are batched into a single comment — but never as one dense paragraph. Group them by kind, one line per location, so the reader can scan and fix them one at a time.
- At least one `praise` — name the pattern that was done well to reinforce it.
- Findings outside the current lens are not dropped — close the report with a `다른 관점` section. Group by lens, one line per candidate, never a single running sentence:

  ```
  다른 관점

  리팩토링 후보 4건
    run.py:44,75         부트스트랩 5줄이 run_nsm/run_backfill에 복제
    load.py:85,104       삭제→append 실행부 복제

  테스트 후보 2건
    run.py:74            run_backfill 미커버
    load.py:96           load_backfill의 APPEND 모드/삭제 선행 검증 부재
  ```
- Tone: a senior engineer commenting on a PR — suggestive, reason first, clear and concise.
- Test naming in this repo: Korean descriptive form `test_<대상>_<동작>한다`.

## Must pass (eval)

1. `/review-py code` → every finding carries a `type: file · function · line N` anchor, and not a single line of code is modified.
2. A `question` comment contains no answer and no fix code — the question only.
3. A code defect found during `/review-py refactor` → not mixed into the body; handed off via the closing `다른 관점:` line.
4. Three or more `nit`s → one comment, grouped by kind with one line per location — not a running paragraph.
5. No finding is fixed by Claude until the user explicitly delegates it (e.g. "사소한 건 처리해줘").

## Distinction from reviewing-changes

- `reviewing-changes` — pre-PR merge verdict. Delegates to subagents (code/security-reviewer).
- `review-py` — learning review during implementation. This session reviews directly; the user fixes.
