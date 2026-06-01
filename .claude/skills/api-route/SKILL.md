# api-route

새 API Route 생성 시 따라야 할 코드 패턴과 체크리스트.
agent: api-developer가 참조.

## 파일 생성 순서

1. `src/lib/types/api.ts`에 요청/응답 타입 추가 → **첫 번째 커밋** (FE 세션 시작점)
2. `src/app/api/<경로>/route.ts` 생성
3. `src/app/api/<경로>/route.test.ts` 생성

## Route Handler 템플릿

```typescript
// src/app/api/xxx/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { XxxResponse, ApiError } from "@/lib/types/api";

export async function POST(request: Request) {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. 입력 파싱 + 검증 (POST/PUT/PATCH)
  const body = await request.json();
  // 검증 예: if (!body.sessionId) return NextResponse.json({ error: "..." }, { status: 400 });

  // 3. Supabase rpc 호출 (여러 테이블 변경은 반드시 rpc)
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("function_name", {
    p_user_id: user.id,
    // ... params
  });

  // 4. 에러 처리
  if (error || !data) {
    console.error("rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to ..." },
      { status: 500 }
    );
  }

  // 5. 응답
  return NextResponse.json<XxxResponse>(data);
}
```

> **주의**: `getAuthUser()`는 `AuthUser | null`을 반환하며, supabase 인스턴스는 별도로 `createServerClient()`를 호출해야 한다.

## 테스트 템플릿

```typescript
// src/app/api/xxx/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextResponse } from "next/server";

const mockRpc = vi.fn();
const mockGetAuthUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => Promise.resolve({ rpc: mockRpc }),
}));
vi.mock("@/lib/supabase/auth", () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

function makeRequest(body: object) {
  return new Request("http://localhost/api/xxx", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/xxx", () => {
  beforeEach(() => vi.clearAllMocks());

  it("미인증 요청 → 401", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("rpc 에러 → 500", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com" });
    mockRpc.mockResolvedValue({ data: null, error: { message: "db error" } });
    const res = await POST(makeRequest({ /* valid body */ }));
    expect(res.status).toBe(500);
  });

  it("성공 → 200", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com" });
    mockRpc.mockResolvedValue({ data: { /* expected data */ }, error: null });
    const res = await POST(makeRequest({ /* valid body */ }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ /* expected shape */ });
  });
});
```

## 체크리스트

- [ ] `src/lib/types/api.ts`에 응답 타입 정의 (첫 커밋 완료)
- [ ] `getAuthUser()` 호출 (데이터 변경 Route 필수)
- [ ] 입력값 검증 (금액/카운트 음수 방지)
- [ ] 여러 테이블 변경 → `rpc` 사용 (순차 쿼리 금지)
- [ ] `console.error`만 사용 (`console.log` 제거)
- [ ] `route.test.ts` 작성 완료 (미인증/에러/성공 케이스)
- [ ] `npm run build` 타입 에러 없음
