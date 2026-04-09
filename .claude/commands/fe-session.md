# FE 세션 — 프론트엔드/UI 전담

이 세션은 **프론트엔드 전담 세션**이다. 페이지 UI, 컴포넌트, 사용자 인터랙션을 담당한다.

## 담당 파일 영역

수정 가능:

- `src/app/(auth)/` — 인증 관련 페이지 (로그인, 회원가입)
- `src/app/(main)/` — 메인 서비스 페이지
- `src/app/page.tsx`, `src/app/layout.tsx` — 루트 레이아웃/페이지
- `src/components/` — UI 컴포넌트
- `src/lib/api/` — API 클라이언트 래퍼 (fetch 호출)
- `src/app/globals.css` — 글로벌 스타일

수정 금지:

- `src/app/api/` — API Route 구현 (BE 영역)
- `src/lib/supabase/` — Supabase 클라이언트/auth/middleware (BE 영역)
- `supabase/` — 마이그레이션 (BE 영역)
- `src/lib/types/api.ts` — API 계약 타입 (BE가 먼저 정의, FE는 읽기 전용)

예외: `src/lib/supabase/client.ts`는 FE에서 Supabase Auth 직접 호출 시 import 가능 (읽기 전용).

## 작업 흐름

### 세션 시작 시 — 이전 작업 정리
1. `dev` 브랜치로 checkout + `git pull origin dev`로 최신 상태 동기화
2. 노션 태스크/이슈 DB에서 "리뷰 중" 상태인 FE 항목 확인
3. 해당 PR의 머지 여부를 GitHub에서 확인 (`gh pr view`)
4. 머지 완료된 경우:
   - 노션 상태 → "완료", 완료일자 기록
   - 로컬 브랜치 정리 여부를 사용자에게 확인
5. 머지 전이면 사용자에게 상황 공유 후 다음 태스크로 진행

### 태스크/이슈 선택 → 리뷰 → 작업 방식 결정
1. 노션 태스크/이슈 DB에서 `세션: FE` 항목 목록 조회 (백로그 + 선행 충족 여부)
2. 사용자에게 목록 제시 → 작업할 태스크/이슈 선택
3. 선택된 태스크 페이지 fetch → 내용 간략 정리:
   - 설명, 세부 내용, API 계약, 선행 태스크, 디자인 참고 사항
4. 사용자와 리뷰 (빠진 내용, 방향 조정, 스코프 확인)
5. AskUserQuestion으로 작업 방식 결정:
   - "plan 모드로 구현 계획 수립" — 복잡한 태스크 (다중 컴포넌트, 상태 머신 등)
   - "바로 작업 시작" — 단순한 태스크 (단일 페이지, 폼 구현 등)

### 기능 개발 (태스크 DB)
1. 노션 태스크 상태 → "진행 중", 시작일자 기록
2. `src/lib/types/api.ts`에서 BE가 정의한 타입 확인 (pull 먼저)
4. API 클라이언트 래퍼 작성 (`src/lib/api/`)
5. 페이지/컴포넌트 구현
6. BE API가 아직 없으면 타입 기반으로 UI 먼저 구현 (연동은 BE 머지 후)
7. 커밋
8. `/design-review` 실행 — 비주얼 QA (간격/색상/일관성 검수)
9. 발견된 디자인 이슈 수정 후 커밋
10. **PR 생성 전 `/review` 실행** — 코드 구조, 조건부 사이드이펙트 검수
11. PR 생성 → 노션 태스크 업데이트:
    - 상태 → "리뷰 중"
    - PR 링크 기록
12. 브랜치명: `feature/TASK-XXX-기능명`

### 버그 수정 (이슈 DB)
1. 노션 이슈 상태 → "진행 중"
3. 이슈 재현 확인 → 원인 분석
4. 수정 구현
5. `/design-review` 실행 → 발견된 디자인 이슈 수정 후 커밋
6. **PR 생성 전 `/review` 실행**
7. PR 생성 → 노션 이슈 업데이트:
    - 상태 → "리뷰 중"
    - PR 링크 기록
8. 브랜치명: `fix/ISSUE-XXX-버그명`

## 디자인 시스템

**`DESIGN.md`가 디자인 소스 오브 트루스.** 색상, 타이포, 간격, 컴포넌트 패턴은 DESIGN.md를 따른다.

- **컴포넌트**: shadcn/ui 사용 (Button, Card, Dialog, Input, Label, Badge 등)
- **스타일**: Tailwind CSS. 인라인 `className` 사용. 하드코딩 색상 금지 — 디자인 토큰 사용
- **조건부 스타일**: `cn()` 유틸리티 (`src/lib/utils.ts`)
- **레이아웃**: `max-w-sm mx-auto` 모바일 퍼스트
- **간격**: CardContent에 `gap-6 pt-6`, 버튼 그룹에 `gap-3`

## 컴포넌트 패턴

기존 코드에서 확립된 패턴:

### 페이지 구조

```
src/app/(auth)/login/page.tsx      ← 라우트 그룹으로 레이아웃 분리
src/app/(main)/page.tsx            ← 인증 필요 페이지
```

### 컴포넌트 구조

```
src/components/
  ├── ui/          ← shadcn/ui 원본 (수정 최소화)
  └── 도메인명/     ← 기능별 컴포넌트 그룹
       ├── 메인-컴포넌트.tsx
       ├── 하위-컴포넌트.tsx
       └── use-커스텀훅.ts
```

### 상태 관리 패턴

- 서버 상태: API 호출 (`src/lib/api/` 래퍼)
- 클라이언트 상태: `useState` + `useCallback`
- 로딩/에러: `isLoading`, `isXxxing` 패턴
- 이벤트: `handleXxx` 네이밍

### API 클라이언트 래퍼 패턴

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

### Supabase Auth 직접 호출 (로그인/회원가입)

```typescript
// 클라이언트 컴포넌트에서 직접 호출
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// 로그인
await supabase.auth.signInWithPassword({ email, password });
// 회원가입
await supabase.auth.signUp({ email, password });
```

## 디자인 일관성 체크리스트

새 UI 작성 시:

- [ ] shadcn/ui 컴포넌트 우선 사용 (커스텀 전에 기존 것 확인)
- [ ] 기존 페이지와 간격/폰트 크기 일관
- [ ] 로딩 상태 표시 (버튼 disabled + "...중" 텍스트)
- [ ] 에러 상태 사용자에게 표시
- [ ] 모바일 퍼스트 (`max-w-sm`)
- [ ] `"use client"` 필요 시 파일 최상단에 선언
