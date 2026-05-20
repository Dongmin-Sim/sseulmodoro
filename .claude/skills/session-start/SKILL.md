# session-start

BE/FE 세션 시작 시 공통으로 실행하는 이전 작업 정리 + 작업(태스크·이슈) 선택 절차.
호출 시 세션 타입(BE/FE)을 명시해야 한다.

> 작업 단일 출처는 vault 두 디렉토리:
>   - 기능: `/Users/coding_min/home/oh-my-local-llm/project/tasks/TASK-{N}-*.md`
>   - 버그: `/Users/coding_min/home/oh-my-local-llm/project/issues/ISSUE-{N}-*.md`
>
> 코드 레포는 두 디렉토리를 **읽기**(vault-reader) + **진척 5필드 갱신**(vault-progress-writer)만 가능. 본문·기획은 vault project 세션 전속.

## 절차

### 1단계: 코드 동기화

```bash
git checkout dev && git pull origin dev
```

### 2단계: 이전 PR 현황 확인 + 자동 갱신

직전 세션에서 띄운 PR의 상태를 확인해 머지된 것은 진척을 자동 반영한다.

**vault-reader agent에 위임:**
> "session이 [BE/FE]이고 status가 in-review인 태스크·이슈 중 pr_link가 있는 것의 id(task_id/issue_id)·branch·pr_link 반환."

결과가 있으면 **github-routine agent에 위임:**
> "다음 PR들의 머지 여부와 머지일을 확인: [PR 링크 목록]. gh pr view --json state,mergedAt,closedAt 로 확인."

PR 상태별 처리:

- **MERGED**: vault-progress-writer에 위임 — `status=done, end_date={머지일 YYYY-MM-DD}` 로 갱신
- **CLOSED (머지 X)**: AskUserQuestion으로 사용자에게 선택받음:
  - `in-progress` 유지 (다시 작업)
  - `on-hold` (보류)
  - `done` (다른 PR이 대신 처리)
  - 폐기 (vault 세션에서 처리 — agent 위임 생략)

  → 사용자 선택 후 vault-progress-writer 위임 (폐기 선택은 위임하지 않음)
- **OPEN**: 그대로 둠 (아직 `in-review`)

갱신 결과를 사용자에게 한 줄로 보고.

### 3단계: 작업 선택 (태스크 + 이슈)

**vault-reader agent에 위임:**
> "session이 [BE/FE]이고 status가 backlog인 태스크와 이슈를 함께 반환. task_id 또는 issue_id, title, priority(태스크)/severity(이슈), estimate, 선행."

목록을 사용자에게 제시 → AskUserQuestion으로 작업할 항목 선택.

선택된 게 **TASK**이면 **vault-reader agent에 위임:**
> "TASK-{N} 파일 전체 읽어 설명, 세부 내용, 완료 조건, API 계약, 선행 태스크 요약."

선택된 게 **ISSUE**이면 **vault-reader agent에 위임:**
> "ISSUE-{N} 파일 전체 읽어 증상, 재현 방법, 원인, severity, root_cause 요약."

이후 be-session/fe-session의 "기능 개발" 또는 "버그 수정" 흐름 진입.

### 4단계: 작업 리뷰 + 플랜 수립

vault 파일에서 가져온 내용을 바탕으로 Claude가 먼저 요약 정리:

**TASK 케이스:**
```
태스크: TASK-{N} 〈태스크명〉
설명: ...
엔드포인트: ...
선행 태스크: ...
완료 조건: ...

구현 접근:
- [Claude가 파악한 구현 방향 요약]
- [예상 파일 변경 목록]
- [불확실하거나 사용자 확인이 필요한 사항]
```

**ISSUE 케이스:**
```
이슈: ISSUE-{N} 〈이슈명〉
증상: ...
재현 방법: ...
원인: ...
severity: ...

수정 접근:
- [원인 기반 수정 방향 요약]
- [예상 파일 변경 목록]
- [재현·검증 절차]
```

이후 AskUserQuestion으로 플랜에 필요한 입력 수집:
- 빠진 요구사항, 스코프 조정, 엣지 케이스, 외부 의존성 등
- 사용자 답변을 받아 플랜에 반영

마지막으로 AskUserQuestion으로 작업 방식 결정:
- **"plan 모드"** — `/plan`을 입력하면 plan 모드로 전환됨. 복잡한 작업 권장 (rpc 트랜잭션, 다중 테이블, 상태 머신, 신규 아키텍처 등). Claude가 구현 계획 파일 작성 → 사용자 승인 후 진행.
- **"바로 작업"** — 단순한 작업 (순수 읽기 API, 타입 수정, UI 수정 등). 바로 구현 시작.

## 에이전트 위임 원칙

- vault 태스크·이슈 조회 → **vault-reader** (haiku, 읽기 전용)
- vault 진척 5필드 갱신 → **vault-progress-writer** (haiku, frontmatter Edit 한정)
- ISSUE 본문 초안 생성 → **vault-content-drafter** (sonnet, vault 쓰기 없음)
- GitHub PR 확인 → **github-routine** (haiku, Bash only)
- 메인 컨텍스트는 사용자 소통과 판단에만 사용
