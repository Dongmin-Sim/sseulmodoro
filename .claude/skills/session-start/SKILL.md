# session-start

BE/FE/DE 세션 시작 시 공통으로 실행하는 이전 작업 정리 + 작업(태스크·이슈) 선택 절차.
호출 시 세션 타입(BE/FE/DE)을 명시해야 한다.

> **DE 세션**은 1~3단계(코드 sync, PR 현황, 작업 선택)만 이 절차를 재사용하고, 4단계 "작업 방식 결정"부터는 de-session의 자체 흐름(사용자 구현 → Claude 리뷰)으로 분기한다. 아래 vault-reader 위임의 `[BE/FE]`는 DE 세션이면 `DE`로 치환.

> 작업 단일 출처는 vault 두 디렉토리:
>   - 기능: `/Users/coding_min/home/oh-my-local-llm/project/tasks/TASK-{N}-*.md`
>   - 버그: `/Users/coding_min/home/oh-my-local-llm/project/issues/ISSUE-{N}-*.md`
>
> 코드 레포 세션은 vault 디렉토리에 **읽기**(vault-reader)만 가능. 진척 5필드를 포함한 모든 쓰기(본문·기획·hub·decisions·session-log)는 vault project 세션 전속.

## 절차

### 1단계: 코드 동기화

```bash
git checkout dev && git pull origin dev
```

### 2단계: 이전 PR 현황 확인 + vault 동기화 알림

직전 세션에서 띄운 PR의 상태를 확인해 vault 갱신이 필요한 항목만 추려 알림으로 출력한다(코드 세션은 vault에 쓰지 않음).

**vault-reader agent에 위임:**
> "session이 [BE/FE]이고 status가 in-review인 태스크·이슈 중 pr_link가 있는 것의 id(task_id/issue_id)·branch·pr_link 반환."

결과가 있으면 **github-routine agent에 위임:**
> "다음 PR들의 머지 여부와 머지일을 확인: [PR 링크 목록]. gh pr view --json state,mergedAt,closedAt 로 확인."

PR 상태별 처리:

- **MERGED**: 알림 출력 — `[VAULT 동기화 필요] {ID} · status=done · end_date={머지일 YYYY-MM-DD} · PR={URL}`
- **CLOSED (머지 X)**: 알림 출력 — `[VAULT 확인 필요] {ID} · PR closed(머지 X) — vault 세션에서 in-progress/on-hold/done/폐기 중 결정 필요 · PR={URL}`
- **OPEN**: 알림 불필요 (아직 `in-review` 상태가 맞음)

알림은 vault project 세션에서 실제 frontmatter 갱신을 수행할 때 그대로 쓸 수 있도록 한 줄 형식을 유지한다.

### 3단계: 작업 선택 (태스크 + 이슈)

**vault-reader agent에 위임:**
> "session이 [BE/FE]이고 status가 backlog인 태스크와 이슈를 함께 반환. task_id 또는 issue_id, title, priority(태스크)/severity(이슈), estimate, 선행."

목록을 사용자에게 제시 → AskUserQuestion으로 작업할 항목 선택.

선택된 게 **TASK**이면 **vault-reader agent에 위임:**
> "TASK-{N} 파일 전체 읽어 설명, 세부 내용, 완료 조건, API 계약, 선행 태스크 요약."

선택된 게 **ISSUE**이면 **vault-reader agent에 위임:**
> "ISSUE-{N} 파일 전체 읽어 증상, 재현 방법, 원인, severity, root_cause 요약."

이후 be-session/fe-session의 "기능 개발" 또는 "버그 수정" 흐름 진입.
**DE 세션이면 여기서 de-session의 자체 흐름으로 분기** (아래 4단계는 BE/FE 전용 — Claude 구현 전제).

### 4단계: 작업 리뷰 + 플랜 수립 (BE/FE 전용)

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
- vault 진척·본문 갱신 → 코드 레포 세션은 **수행하지 않음**. 모든 vault 쓰기는 vault project 세션에서 처리 — 코드 세션은 `[VAULT 동기화 필요] ...` 알림만 출력
- ISSUE 본문 초안 생성 → **vault-content-drafter** (sonnet, vault 쓰기 없음 — 터미널 출력만)
- GitHub PR 확인 → **github-routine** (haiku, Bash only)
- 메인 컨텍스트는 사용자 소통과 판단에만 사용
