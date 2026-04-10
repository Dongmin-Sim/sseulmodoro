# pr-sync

PR 생성 후 노션 태스크/이슈 DB 동기화 절차.
기능 개발(태스크 DB)과 버그 수정(이슈 DB) 모두 동일 절차.

## 전제 조건

- PR이 이미 생성된 상태
- 브랜치명 규칙 준수:
  - `feature/TASK-XXX-기능명` → 태스크 DB
  - `fix/ISSUE-XXX-버그명` → 이슈 DB

## 절차

### 1단계: PR URL 추출

```bash
gh pr view --json url --jq '.url'
```

### 2단계: 태스크/이슈 번호 파싱

```bash
git branch --show-current
# 예: feature/TASK-026-home-api → TASK-026
# 예: fix/ISSUE-003-null-guard → ISSUE-003
```

### 3단계: 노션 업데이트 (notion-routine agent에 위임)

**태스크 DB인 경우:**
> "TASK-XXX 노션 태스크 페이지 업데이트:
> - 상태 → '리뷰 중'
> - PR 링크 → [PR URL]"

**이슈 DB인 경우:**
> "ISSUE-XXX 노션 이슈 페이지 업데이트:
> - 상태 → '리뷰 중'
> - PR 링크 → [PR URL]"

### 4단계: 완료 보고

사용자에게 요약:
```
PR #N 생성 완료
노션 TASK-XXX(또는 ISSUE-XXX) → 리뷰 중 업데이트 완료
PR URL: https://github.com/...
```

## 에이전트 위임 원칙

- 노션 업데이트 → notion-routine (sonnet)
- 메인 컨텍스트는 완료 보고만
