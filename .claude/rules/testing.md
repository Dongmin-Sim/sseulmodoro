# 테스트 전략

- API Route 테스트: Vitest로 트랜잭션/정합성 검증 (UI 테스트는 생략)
- API Route 작성 시 반드시 `route.test.ts` 함께 작성 (같은 디렉토리에 배치)
- TypeScript 변경 후 `npm run build`로 type check
- Supabase 마이그레이션 후 `npm run db:reset`으로 동작 확인

## 테스트 작성 패턴

### AAA 구조

모든 테스트는 Arrange → Act → Assert 순서로 작성:

```typescript
it("should return 401 when user is not authenticated", async () => {
  // Arrange
  vi.mocked(getAuthUser).mockResolvedValue(null);
  const request = new NextRequest("http://localhost/api/sessions", { method: "POST" });

  // Act
  const response = await POST(request);

  // Assert
  expect(response.status).toBe(401);
});
```

### 테스트 네이밍

`it("should [동작] when [조건]")` 형식:
- `it("should return 401 when user is not authenticated")`
- `it("should return 400 when session_id is missing")`
- `it("should return 201 with session data when request is valid")`

### 단일 검증 원칙

하나의 `it` 블록에서 하나의 시나리오만 검증. 여러 독립 시나리오는 별도 `it`으로 분리.

## Mock 패턴

```typescript
import { vi } from "vitest";

const mockRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => Promise.resolve({ rpc: mockRpc }),
}));
vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: vi.fn(),
}));
```

## 필수 테스트 케이스

모든 API Route에 포함할 것:
- 미인증 요청 → 401
- 잘못된 입력 → 400 (입력 검증이 있는 경우)
- rpc 에러 → 500
- 성공 → 200/201 + 응답 타입 검증
