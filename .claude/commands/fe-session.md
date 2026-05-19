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

1. `git checkout -b feature/TASK-{N}-기능명` (dev에서 분기, `TASK-{N}`은 vault 태스크 ID — 비패딩)
2. `src/lib/types/api.ts`에서 BE가 정의한 타입 확인
3. API 클라이언트 래퍼 작성 (`src/lib/api/`) — skill: fe-patterns 참조
4. 페이지/컴포넌트 구현 — skill: fe-patterns 참조
5. BE API가 아직 없으면 타입 기반으로 UI 먼저 구현 (연동은 BE 머지 후)
6. 커밋
7. `/design-review` 실행 — 비주얼 QA ← `npm run dev` 실행 중이어야 함
8. 발견된 디자인 이슈 수정 후 커밋
9. **PR 생성 전 `/review` 실행** → code-reviewer(구조) + security-reviewer(보안) agent 위임
10. PR 생성

> PR 생성 후 vault 태스크 파일의 상태·PR 링크 갱신은 vault project 세션이 git/PR을 보고 반영한다. 코드 레포 세션은 태스크 파일을 갱신하지 않는다.

### 버그 수정 (이슈 DB)

> ⚠️ **이슈/버그 모델 미확정.** vault에는 별도 이슈 DB가 없어 `ISSUE-XXX` 개념의 대응이 정해지지 않았다. vault improvement `2026-05-19-코드레포-이슈버그-모델-vault대응` 처리 후 이 섹션을 확정한다. 그때까지 버그 상태 추적은 사용자와 직접 합의해 진행한다.

워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`.

1. `git checkout -b fix/ISSUE-XXX-버그명` (dev에서 분기)
2. 이슈 재현 확인 → 원인 분석
3. 수정 구현
4. 커밋
5. `/design-review` 실행 → 디자인 이슈 수정 후 커밋 ← `npm run dev` 실행 중이어야 함
6. **PR 생성 전 `/review` 실행** → code-reviewer + security-reviewer agent 위임
7. PR 생성

## 디자인 시스템

**`DESIGN.md`가 디자인 소스 오브 트루스.** 색상, 타이포, 간격, 컴포넌트 패턴은 DESIGN.md를 따른다.

- shadcn/ui 컴포넌트 우선 사용 (Button, Card, Dialog, Input, Label, Badge 등)
- Tailwind CSS + `cn()` 유틸리티 (`src/lib/utils.ts`)
- 컴포넌트/패턴 코드 참조 → skill: fe-patterns
