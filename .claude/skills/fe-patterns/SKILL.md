# fe-patterns

FE 개발에서 반복 사용되는 코드 패턴 참조.

## 컴포넌트 구조

```
src/components/
  ├── ui/          ← shadcn/ui 원본 (수정 최소화)
  └── 도메인명/     ← 기능별 컴포넌트 그룹
       ├── 메인-컴포넌트.tsx
       ├── 하위-컴포넌트.tsx
       └── use-커스텀훅.ts
```

## 상태 관리 패턴

- 서버 상태: API 호출 (`src/lib/api/` 래퍼)
- 클라이언트 상태: `useState` + `useCallback`
- 로딩/에러: `isLoading`, `isXxxing` 패턴
- 이벤트: `handleXxx` 네이밍

## API 클라이언트 래퍼 패턴

```typescript
// src/lib/api/xxx.ts
import type { XxxResponse } from "@/lib/types/api";

export async function doSomething(params: Params): Promise<XxxResponse> {
  const res = await fetch("/api/xxx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to do something");
  }

  return res.json();
}
```

## Supabase Auth 직접 호출 (로그인/회원가입)

```typescript
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signUp({ email, password });
```

## 페이지 라우트 구조

```
src/app/(auth)/login/page.tsx      ← 라우트 그룹으로 레이아웃 분리
src/app/(main)/page.tsx            ← 인증 필요 페이지
```
