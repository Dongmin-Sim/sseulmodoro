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

### 기능 개발 (태스크)

vault `project/tasks/TASK-{N}-*.md` 기반. 워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`.

1. `git checkout -b feature/TASK-{N}-기능명` (dev에서 분기, `TASK-{N}`은 vault 태스크 ID — 비패딩)
2. `src/lib/types/api.ts`에서 BE가 정의한 타입 확인
3. API 클라이언트 래퍼 작성 (`src/lib/api/`) — skill: fe-patterns 참조
4. 페이지/컴포넌트 구현 — skill: fe-patterns 참조
5. BE API가 아직 없으면 타입 기반으로 UI 먼저 구현 (연동은 BE 머지 후)
6. 커밋
7. `/design-review` 실행 — 비주얼 QA ← `npm run dev` 실행 중이어야 함
8. 발견된 디자인 이슈 수정 후 커밋
9. **PR 생성 전 `/review` 실행** → code-reviewer(구조) + security-reviewer(보안) agent 위임
10. PR 생성 — 제목 `[TASK-{N}] 태스크명`
11. **vault-progress-writer에 위임** — 진척 5필드 갱신:
    > "TASK-{N}: branch=feature/TASK-{N}-{슬러그}, pr_link={PR URL}, start_date={오늘 YYYY-MM-DD}, status=in-review 로 갱신"

> 태스크 진척 5필드(`status`·`branch`·`pr_link`·`start_date`·`end_date`)는 코드 레포 세션이 vault-progress-writer로 자동 갱신한다. 본문·기획 영역(설명·완료조건·`linked_features` 등)은 vault project 세션 전속.

### 버그 수정 (이슈)

vault `project/issues/ISSUE-{N}-*.md` 기반. 워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`.

1. `git checkout -b fix/ISSUE-{N}-버그명` (dev에서 분기, `ISSUE-{N}`은 vault 이슈 ID — 비패딩)
2. 이슈 재현 확인 → 원인 분석
3. 수정 구현
4. 커밋
5. `/design-review` 실행 → 디자인 이슈 수정 후 커밋 ← `npm run dev` 실행 중이어야 함
6. **PR 생성 전 `/review` 실행** → code-reviewer + security-reviewer agent 위임
7. PR 생성 — 제목 `[ISSUE-{N}] 이슈명`
8. **vault-progress-writer에 위임** — 진척 5필드 갱신:
   > "ISSUE-{N}: branch=fix/ISSUE-{N}-{슬러그}, pr_link={PR URL}, start_date={오늘 YYYY-MM-DD}, status=in-review 로 갱신"
9. **vault-content-drafter에 위임** — 본문 초안 생성:
   > "ISSUE-{N}, PR #{N}의 본문 초안 생성 → 터미널 출력"
   > 초안은 vault에 쓰이지 않음. 사용자가 검토 후 vault project 세션에서 직접 입력.

## 디자인 시스템

**`DESIGN.md`가 디자인 소스 오브 트루스.** 색상, 타이포, 간격, 컴포넌트 패턴은 DESIGN.md를 따른다.

- shadcn/ui 컴포넌트 우선 사용 (Button, Card, Dialog, Input, Label, Badge 등)
- Tailwind CSS + `cn()` 유틸리티 (`src/lib/utils.ts`)
- 컴포넌트/패턴 코드 참조 → skill: fe-patterns
