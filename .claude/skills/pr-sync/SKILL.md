# pr-sync

PR 생성 후 노션 태스크/이슈 DB 동기화 절차.
기능 개발(태스크 DB)과 버그 수정(이슈 DB) 모두 동일 절차.

## 전제 조건

- 브랜치명 규칙 준수:
  - `feature/TASK-XXX-기능명` → 태스크 DB
  - `fix/ISSUE-XXX-버그명` → 이슈 DB

## 절차

### 1단계: 태스크/이슈 번호 파싱

```bash
git branch --show-current
# 예: feature/TASK-026-home-api → TASK-026
# 예: fix/ISSUE-003-null-guard → ISSUE-003
```

### 2단계: PR 본문 작성 후 생성

`gh pr create` 실행 전, PR 템플릿 섹션을 채운다:

- **Summary**: 변경 사항 bullet + 왜 필요한지
- **선행 PR**: 의존하는 PR (없으면 "없음")
- **관련 태스크**: TASK-XXX 또는 ISSUE-XXX + 노션 링크
- **후속 작업**: 이번에 포함 못 한 것, 알려진 한계 (없으면 섹션 생략)
- **Test plan**: 기본 항목 외 수동 확인 항목 추가

### 3단계: PR URL 추출

```bash
gh pr view --json url --jq '.url'
```

### 4단계: 노션 업데이트 (notion-routine agent에 위임)

**태스크 DB인 경우:**
> "TASK-XXX 노션 태스크 페이지 업데이트:
> - 상태 → '리뷰 중'
> - PR 링크 → [PR URL]"

**이슈 DB인 경우:**
> "ISSUE-XXX 노션 이슈 페이지 업데이트:
> - 상태 → '리뷰 중'
> - PR 링크 → [PR URL]"

### 5단계: 기획 vs 구현 delta 확인

PR에 포함된 실제 구현 내용(타입 정의, 엔드포인트, 응답 shape 등)과 노션 기획 내용을 비교한다.

```bash
git diff dev...HEAD -- src/lib/types/api.ts src/app/api/**/*.ts
```

비교 항목:
- 엔드포인트 경로/메서드 변경 여부
- 요청/응답 타입 필드명, 타입, 추가/삭제 여부
- 에러 케이스 추가/변경 여부
- 노션에 명시된 API 계약과 실제 구현의 차이

delta가 있으면 **notion-routine agent에 위임:**
> "TASK-XXX 노션 페이지의 API 계약 섹션을 실제 구현 기준으로 업데이트:
> [변경 항목 목록]"

delta가 없으면 생략.

### 6단계: 완료 보고

사용자에게 요약:
```
PR #N 생성 완료
노션 TASK-XXX(또는 ISSUE-XXX) → 리뷰 중 업데이트 완료
PR URL: https://github.com/...
기획 delta: [있음 → 업데이트한 항목 요약 / 없음]
```

## 에이전트 위임 원칙

- 노션 업데이트 → notion-routine (haiku)
- 메인 컨텍스트는 완료 보고만
