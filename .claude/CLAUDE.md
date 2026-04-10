# sseulmodoro

## 프로젝트 개요

집중(포모도로)하면 캐릭터가 자라고, 그 시간에 나의 기록이 쌓인다.
포모도로 타이머 + 캐릭터 수집 + 데이터 파이프라인을 결합한 서비스.

## 기술 스택

- 프론트엔드: Next.js (App Router), TypeScript, Tailwind CSS
- 서비스 DB: Supabase (PostgreSQL + Auth)
- 호스팅: Vercel

## 폴더 구조

```
/
├── src/
│   └── app/                    # Next.js App Router
│       ├── layout.tsx
│       ├── page.tsx
│       └── globals.css
├── supabase/
│   └── migrations/             # DB 마이그레이션
├── pipeline/                   # 0.2.0에서 하위 구조 추가
├── .github/workflows/          # GitHub Actions
├── .claude/
│   ├── CLAUDE.md
│   ├── agents/                 # 역할별 서브에이전트
│   ├── skills/                 # 워크플로우 절차
│   ├── commands/               # 세션 진입점
│   └── rules/                  # 항상 적용되는 원칙
└── package.json
```

## Commands

- `npm run dev` — 로컬 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 실행
- `npm test` — Vitest 테스트 실행
- `npm run db:reset` — 로컬 DB 초기화 + 타입 재생성
- `npm run gen:types` — Supabase 타입 재생성
- `npx supabase db push` — 리모트 마이그레이션 적용

## 개발 워크플로우

세션별 워크플로우: `/be-session`, `/fe-session` 참조.

### 브랜치 전략 (3단계)

```
main        ← 프로덕션. Vercel Production 배포. dev에서 PR로만 머지.
dev         ← 통합 확인. Vercel Preview 배포. feature/fix/harness에서 PR로만 머지.
feature/*   ← 기능 개발. dev에서 분기 → 완료 후 dev에 PR.
fix/*       ← 버그 수정. dev에서 분기 → 완료 후 dev에 PR.
harness/*   ← Claude 하네스 변경. dev에서 분기 → 완료 후 dev에 PR.
```

- 기능 개발: `feature/TASK-001-기능명`
- 버그 수정: `fix/ISSUE-001-버그명`
- 하네스 변경: `harness/설명` (`.claude/` 하위 파일 — agents, skills, rules, commands, settings)
- main/dev 직접 커밋 금지. PR로만 머지.

### 배포 흐름

```
feature/* → PR → dev 머지 → Vercel Preview (통합 확인)
                               ↓ 확인 완료
                   dev → PR → main 머지 → Vercel Production
```

### 역할 분담

- **Claude Code 담당**: 프론트엔드 UI, API Route, 보일러플레이트, 테스트
- **사용자 담당**: PostgreSQL 함수, ETL 스크립트, dbt 모델 설계
  - Claude Code는 스캐폴딩(시그니처 + TODO 주석)만 생성

### 병렬 세션 운영

BE/FE 세션을 분리하여 병렬 개발한다. 각 세션은 독립된 Claude Code 인스턴스에서 운영.

- **BE 세션** (`/be-session`): API Route, Supabase, 인증, 인프라
- **FE 세션** (`/fe-session`): 페이지 UI, 컴포넌트, 사용자 인터랙션

세션 분리 규칙:

- 노션 태스크 DB의 `세션` 속성으로 BE/FE 구분
- `src/lib/types/api.ts`가 공유 인터페이스 (API 계약)
  - BE가 타입 먼저 정의 → 커밋 → FE가 pull 후 사용
- 파일 영역 겹침 금지 — 각 세션 지침 참조
- 물리적 분리: `git worktree`로 디렉토리 분리 (충돌 방지)

## 토큰 절약 규칙

개발에 직접 관여하지 않는 루틴 작업은 sonnet subagent에 위임하여 메인 컨텍스트 비대화를 방지한다.

| sonnet subagent 위임 | opus 메인 직접 수행 |
|---|---|
| 노션 조회/업데이트 (notion-routine) | 아키텍처 설계 (plan 모드) |
| GitHub PR 확인 (github-routine) | 코드 리뷰 (/review) |
| 세션 시작/종료 루틴 | 디버깅/에러 분석 |
| API Route 구현 (api-developer) | 사용자 대화/판단 |

## UI 전략

FE 디자인 시스템: `DESIGN.md` + `/fe-session` 참조. 디자인 검토: `/design-review` (`npm run dev` 필요).

## 세부 규칙 참조

아래 규칙은 `.claude/rules/`에서 자동 로드된다:

- **DB 설계 원칙** → `rules/db-design.md` (rpc 필수, append-only, balance 상대 UPDATE)
- **테스트 전략** → `rules/testing.md` (Vitest, route.test.ts 필수)
- **코드 품질** → `rules/code-quality.md` (console.log 금지, 커밋 컨벤션, any 금지)
- **보안** → `rules/security.md` (환경변수, 인증 경계, RLS, 입력 검증)

## 공식 문서 참조

- **Next.js 16**: https://nextjs.org/docs
- **Supabase Auth (Next.js + SSR)**: https://supabase.com/docs/guides/auth/server-side/nextjs
- **React 19**: https://react.dev/reference/react

| 패키지 | 버전 |
|--------|------|
| next | 16.2.1 |
| react | 19.2.4 |
| @supabase/ssr | ^0.10.0 |
| @supabase/supabase-js | ^2.101.1 |

## 환경변수

`.env.local.example` 참조
