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

### 세션 시작 시

skill: session-start를 실행한다. 세션 타입은 **FE**.

### 태스크/이슈 선택 → 리뷰 → 플랜 → 작업 방식 결정

session-start skill 4단계에서 처리.

### 기능 개발 (태스크 DB)

워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`.

1. `git checkout -b feature/TASK-XXX-기능명` (dev에서 분기)
2. notion-routine agent에 위임: "TASK-XXX 상태 → '진행 중', 시작일자 오늘"
3. `src/lib/types/api.ts`에서 BE가 정의한 타입 확인
4. API 클라이언트 래퍼 작성 (`src/lib/api/`) — skill: fe-patterns 참조
5. 페이지/컴포넌트 구현 — skill: fe-patterns 참조
6. BE API가 아직 없으면 타입 기반으로 UI 먼저 구현 (연동은 BE 머지 후)
7. 커밋
8. `/design-review` 실행 — 비주얼 QA ← `npm run dev` 실행 중이어야 함
9. 발견된 디자인 이슈 수정 후 커밋
10. **PR 생성 전 `/review` 실행** → code-reviewer(구조) + security-reviewer(보안) agent 위임
11. PR 생성
12. skill: pr-sync 실행 → 노션 동기화

### 버그 수정 (이슈 DB)

워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`.

1. `git checkout -b fix/ISSUE-XXX-버그명` (dev에서 분기)
2. notion-routine agent에 위임: "ISSUE-XXX 상태 → '진행 중'"
3. 이슈 재현 확인 → 원인 분석
4. 수정 구현
5. 커밋
6. `/design-review` 실행 → 디자인 이슈 수정 후 커밋 ← `npm run dev` 실행 중이어야 함
7. **PR 생성 전 `/review` 실행** → code-reviewer + security-reviewer agent 위임
8. PR 생성
9. skill: pr-sync 실행 → 노션 동기화

## 디자인 시스템

**`DESIGN.md`가 디자인 소스 오브 트루스.** 색상, 타이포, 간격, 컴포넌트 패턴은 DESIGN.md를 따른다.

- shadcn/ui 컴포넌트 우선 사용 (Button, Card, Dialog, Input, Label, Badge 등)
- Tailwind CSS + `cn()` 유틸리티 (`src/lib/utils.ts`)
- 컴포넌트/패턴 코드 참조 → skill: fe-patterns
