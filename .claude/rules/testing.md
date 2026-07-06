---
paths:
  - "**/*.test.ts"
---

# 테스트 전략

- API Route 테스트: Vitest로 트랜잭션/정합성 검증 (UI 테스트는 생략)
- API Route 작성 시 반드시 `route.test.ts` 함께 작성 (같은 디렉토리에 배치)
- TypeScript 변경 후 `npm run build`로 type check
- Supabase 마이그레이션 후 `npm run db:reset`으로 동작 확인

## 작성 원칙

- **AAA**: 각 `it`은 Arrange → Act → Assert 순서.
- **네이밍**: `it("should [동작] when [조건]")` (예: `should return 401 when user is not authenticated`).
- **단일 검증**: 한 `it`에 한 시나리오. 독립 시나리오는 별도 `it`으로 분리.

## 필수 테스트 케이스

모든 API Route에 포함할 것:
- 미인증 요청 → 401
- 잘못된 입력 → 400 (입력 검증이 있는 경우)
- rpc 에러 → 500
- 성공 → 200/201 + 응답 타입 검증

> 구체 템플릿·Mock 패턴은 `api-route` 스킬 참조.
