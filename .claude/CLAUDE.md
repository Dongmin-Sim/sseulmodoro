# sseulmodoro

## 프로젝트 개요

집중(포모도로)하면 캐릭터가 자라고, 그 시간에 나의 기록이 쌓인다.
포모도로 타이머 + 캐릭터 수집 + 데이터 파이프라인을 결합한 서비스.

## 기술 스택

- 프론트엔드: Next.js (App Router), TypeScript, Tailwind CSS
- 서비스 DB: Supabase (PostgreSQL + Auth)
- 호스팅: Vercel

## UI 전략

- shadcn/ui 컴포넌트 사용 (디자인 일관성 확보, 최소 노력)
- UI 구현은 Claude Code에 위임. "shadcn/ui 컴포넌트로 만들어줘"로 요청.
- 디자인 검토 시 gstack /design-review 활용

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
│   └── CLAUDE.md               # 프로젝트 지침 (Claude Code 자동 로드)
└── package.json
```

## Commands

- `npm run dev` — 로컬 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 실행
- `npx supabase db push` — 마이그레이션 적용

## 금지 사항

- activity_log에 UPDATE/DELETE 금지 (append-only)
- main 브랜치에 직접 커밋 금지 (PR로만 머지)
- PostgreSQL 함수/ETL/dbt 모델 직접 구현 금지 — 스캐폴딩만 생성
- .env.local 커밋 금지
- supabase 클라이언트로 여러 쿼리 순차 실행 금지 — 트랜잭션은 반드시 PostgreSQL 함수(rpc) 사용

## DB 설계 원칙

- 포인트 잔액 변경 시 users.balance 상대적 UPDATE 사용 (race condition 방지)
  예: UPDATE users SET balance = balance + 10 WHERE id = ?
- point_transaction에 running_balance 항상 기록
- 여러 테이블 동시 변경 시 반드시 PostgreSQL 함수(rpc)로 트랜잭션 처리

## 코딩 컨벤션

- 커밋: type(scope): 내용 (feat/fix/refactor/style/chore/docs/test)
  - 제목은 50자 이내, 명령형으로 작성
  - 관련 이슈가 있으면 footer에 Closes #이슈번호
- 브랜치: main + feature/\* 2단계. main에서 분기, 완료 후 main에 PR.
  - 개발 PoC 단계에서는 dev 브랜치 없이 2단계로 운영
  - 기능 개발: feature/TASK-001-기능명, ex) feature/TASK-001-pomodoro-timer
  - 버그 수정: fix/ISSUE-001-버그명, ex) fix/ISSUE-001-gacha-point-bug
- 직접 main 커밋 금지. PR로만 머지.
  - main ← 프로덕션. 직접 커밋 금지. PR로만 머지.
  - feature/xxx ← 기능 개발. main에서 분기 → 완료 후 main에 PR.
  - fix/xxx ← 버그 수정. main에서 분기 → 완료 후 main에 PR.

## Claude Code 작업 흐름

- 작업 시작 시 main에서 feature/TASK-XXX-기능명 분기
- 커밋은 type(scope): 내용 형식. 하나의 커밋은 하나의 논리적 변경만.
- 커밋 전 lint/type check 통과.
- 작업 완료 후 main에 PR 생성. 제목: [TASK-XXX] 기능 설명
- PR 본문에 변경 사항 요약 + 테스트 확인 포함.
- PR 생성만 하고 머지는 사용자가 확인 후 직접.
- 프론트엔드 UI, API Route, 보일러플레이트: Claude Code 담당
- PostgreSQL 함수, ETL 스크립트, dbt 모델 설계: 사용자 담당 → 스캐폴딩만 생성

## 테스트 전략

- API Route 테스트: Vitest로 트랜잭션/정합성 검증 (UI 테스트는 생략)
- API Route 작성 시 반드시 테스트 함께 작성
- TypeScript 변경 후 `npm run build`로 type check
- Supabase 마이그레이션 후 동작 확인

## 환경변수

`.env.local.example` 참조
