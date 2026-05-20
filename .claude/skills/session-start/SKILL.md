# session-start

BE/FE 세션 시작 시 공통으로 실행하는 이전 작업 정리 + 태스크 선택 절차.
호출 시 세션 타입(BE/FE)을 명시해야 한다.

> 태스크 단일 출처는 vault `/Users/coding_min/home/oh-my-local-llm/project/tasks/`.
> 코드 레포는 태스크 파일을 **읽기만** 한다 — 상태·PR링크 갱신은 vault project 세션의 몫.

## 절차

### 1단계: 코드 동기화

```bash
git checkout dev && git pull origin dev
```

### 2단계: 이전 PR 현황 확인 (보고 전용)

직전 세션에서 띄운 PR이 머지됐는지 확인해 사용자에게 알린다. **상태 갱신은 하지 않는다** (vault project 세션이 반영).

**vault-task-reader agent에 위임:**
> "session이 [BE/FE]이고 status가 진행중인 태스크 중 pr_link가 있는 것의 task_id·branch·pr_link 반환."

결과가 있으면 **github-routine agent에 위임:**
> "다음 PR들의 머지 여부 확인: [PR 링크 목록]. gh pr view --json state,mergedAt로 확인."

- 머지 완료 / 미완료 현황을 사용자에게 보고만 한다.
- 머지된 태스크의 status·완료일자 갱신은 vault project 세션에서 처리되므로 여기서 건드리지 않는다.

### 3단계: 태스크 선택

**vault-task-reader agent에 위임:**
> "session이 [BE/FE]이고 status가 백로그인 태스크의 task_id·title·priority·estimate·선행 태스크 반환."

목록을 사용자에게 제시 → AskUserQuestion으로 작업할 태스크 선택.

선택된 태스크가 있으면 **vault-task-reader agent에 위임:**
> "TASK-{N} 파일 전체 읽어 설명, 세부 내용, 완료 조건, API 계약, 선행 태스크 요약."

### 4단계: 태스크 리뷰 + 플랜 수립

vault 태스크 파일에서 가져온 내용을 바탕으로 Claude가 먼저 요약 정리:

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

이후 AskUserQuestion으로 플랜에 필요한 입력 수집:
- 빠진 요구사항, 스코프 조정, 엣지 케이스, 외부 의존성 등
- 사용자 답변을 받아 플랜에 반영

마지막으로 AskUserQuestion으로 작업 방식 결정:
- **"plan 모드"** — `/plan`을 입력하면 plan 모드로 전환됨. 복잡한 태스크 권장 (rpc 트랜잭션, 다중 테이블, 상태 머신, 신규 아키텍처 등). Claude가 구현 계획 파일 작성 → 사용자 승인 후 진행.
- **"바로 작업"** — 단순한 태스크 (순수 읽기 API, 타입 수정, UI 수정 등). 바로 구현 시작.

## 에이전트 위임 원칙

- vault 태스크 조회 → vault-task-reader (haiku, 읽기 전용, 토큰 절약)
- GitHub PR 확인 → github-routine (sonnet, Bash only)
- 메인 컨텍스트는 사용자 소통과 판단에만 사용
