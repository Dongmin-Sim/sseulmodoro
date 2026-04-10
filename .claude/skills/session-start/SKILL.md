# session-start

BE/FE 세션 시작 시 공통으로 실행하는 이전 작업 정리 + 태스크 선택 절차.
호출 시 세션 타입(BE/FE)을 명시해야 한다.

## 절차

### 1단계: 코드 동기화

```bash
git checkout dev && git pull origin dev
```

### 2단계: 이전 PR 추적

**notion-routine agent에 위임:**
> "태스크 DB와 이슈 DB에서 세션: [BE/FE], 상태: '리뷰 중' 또는 '진행 중'인 항목 조회. 태스크ID, 상태, PR 링크, 브랜치명만 반환."

결과가 있으면 **github-routine agent에 위임:**
> "다음 PR들의 머지 여부 확인: [PR 링크 목록]. gh pr view --json state,mergedAt로 확인."

- 머지 완료된 항목 → notion-routine agent에 위임: "상태 → '완료', 완료일자 오늘([날짜])로 업데이트"
- 머지 미완료 → 사용자에게 현황 보고 후 다음 태스크 진행

### 3단계: 태스크 선택

**notion-routine agent에 위임:**
> "태스크 DB에서 세션: [BE/FE], 상태: '백로그'인 항목 조회. 태스크ID, 태스크명, 우선순위, 예상소요, 선행태스크만 반환."

목록을 사용자에게 제시 → AskUserQuestion으로 작업할 태스크 선택.

선택된 태스크가 있으면 **notion-routine agent에 위임:**
> "TASK-XXX 페이지 fetch. 설명, 세부 내용, API 계약, 선행 태스크, 영향 범위 요약."

### 4단계: 태스크 리뷰 + 플랜 수립

노션에서 가져온 내용을 바탕으로 Claude가 먼저 요약 정리:

```
태스크: TASK-XXX 〈태스크명〉
설명: ...
엔드포인트: ...
선행 태스크: ...
영향 범위: ...

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

- 노션 조회/업데이트 → notion-routine (sonnet, 토큰 절약)
- GitHub PR 확인 → github-routine (sonnet, Bash only)
- 메인 컨텍스트는 사용자 소통과 판단에만 사용
