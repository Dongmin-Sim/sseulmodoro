---
name: api-route
description: Code patterns and scaffold for a new Next.js API Route — route-handler skeleton, type-first commit order, Vitest test template. Use when implementing an API endpoint, or when the user says "API 만들자", "라우트 추가", "엔드포인트 구현".
---

# api-route

Code patterns and scaffold for a new API Route. Auth / rpc / error / logging **invariants are owned by the rules** — see `rules/security.md`, `rules/db-design.md`, `rules/code-quality.md`. Below are the patterns and templates that apply those rules to an API Route (not a restatement).

## File creation order

1. Add request/response types to `src/lib/types/api.ts` → **first commit** (the FE work's starting point)
2. Create `src/app/api/<path>/route.ts`
3. Create `src/app/api/<path>/route.test.ts`

## Route Handler template

```typescript
// src/app/api/xxx/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { XxxResponse, ApiError } from "@/lib/types/api";

export async function POST(request: Request) {
  // 1. Auth check
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Parse + validate input (POST/PUT/PATCH)
  const body = await request.json();
  // e.g. if (!body.sessionId) return NextResponse.json({ error: "..." }, { status: 400 });

  // 3. Supabase rpc (a multi-table change must go through rpc)
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("function_name", {
    p_user_id: user.id,
    // ... params
  });

  // 4. Error handling
  if (error || !data) {
    console.error("rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to ..." },
      { status: 500 }
    );
  }

  // 5. Response
  return NextResponse.json<XxxResponse>(data);
}
```

> **Note**: `getAuthUser()` returns `AuthUser | null`, and the supabase instance is obtained separately via `createServerClient()`.

## Test template

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

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("returns 500 on rpc error", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com" });
    mockRpc.mockResolvedValue({ data: null, error: { message: "db error" } });
    const res = await POST(makeRequest({ /* valid body */ }));
    expect(res.status).toBe(500);
  });

  it("returns 200 on success", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1", email: "a@b.com" });
    mockRpc.mockResolvedValue({ data: { /* expected data */ }, error: null });
    const res = await POST(makeRequest({ /* valid body */ }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ /* expected shape */ });
  });
});
```

## Checklist (API Route-specific — invariant basis is the rules above)

- [ ] Response type defined in `src/lib/types/api.ts` (first commit done)
- [ ] Rules honored: auth (`getAuthUser`), input validation, rpc, `console.error` → see `rules/security` · `db-design` · `code-quality`
- [ ] `route.test.ts` written (unauthenticated / error / success cases)
- [ ] `npm run build` — no type errors
