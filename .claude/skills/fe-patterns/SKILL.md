---
name: fe-patterns
description: Reusable FE code patterns for this project — component structure, API client wrapper, Supabase auth calls, route groups. Use when building a page or component, or when the user says "컴포넌트 만들자", "페이지 추가", "UI 작업".
---

# fe-patterns

Reusable FE code patterns for this project. Naming conventions (`handleXxx`, `isXxx`, etc.) are owned by `rules/code-quality.md`.

## Component structure

```
src/components/
  ├── ui/          ← shadcn/ui originals (minimal edits)
  └── <domain>/    ← feature component group
       ├── main-component.tsx
       ├── sub-component.tsx
       └── use-custom-hook.ts
```

## State management patterns

- Server state: API calls (`src/lib/api/` wrappers)
- Client state: `useState` + `useCallback`
- Naming (loading `isLoading`, events `handleXxx`, etc.) → see `rules/code-quality.md`

## API client wrapper pattern

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

## Supabase Auth direct calls (login / signup)

```typescript
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signUp({ email, password });
```

## Page route structure

```
src/app/(auth)/login/page.tsx      ← route group splits the layout
src/app/(main)/page.tsx            ← auth-required page
```
