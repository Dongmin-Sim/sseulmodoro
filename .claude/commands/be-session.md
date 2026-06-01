# BE 세션 — 백엔드/API 전담

이 세션은 **백엔드 전담 세션**이다. DB, API Route, 인증/인프라를 담당한다.

## 담당 파일 영역

수정 가능:

- `src/app/api/**/*.ts` — API Route 구현 + 테스트
- `src/lib/supabase/` — Supabase 클라이언트, auth 헬퍼, middleware
- `src/lib/types/api.ts` — API 계약 타입 (FE와 공유 인터페이스)
- `src/lib/types/database.ts` — Supabase 생성 타입
- `src/lib/constants.ts` — 공유 상수
- `supabase/migrations/` — 마이그레이션 (스캐폴딩만)
- `.github/workflows/` — CI/CD

수정 금지:

- `src/app/(auth)/`, `src/app/(main)/` — 페이지 UI (FE 영역)
- `src/components/` — UI 컴포넌트 (FE 영역)
- `src/lib/api/` — FE용 API 클라이언트 래퍼 (FE 영역)

## 작업 흐름

### 세션 시작 시

skill: session-start를 실행한다. 세션 타입은 **BE**.

### 태스크/이슈 선택 → 리뷰 → 플랜 → 작업 방식 결정

session-start skill 4단계에서 처리.

### 공통 워크플로우 원칙

태스크·이슈 공통 실행 원칙(진단 우선·plan 게이트·검증 3종·사용자 QA·PR 초안 우선·stacked·커밋 위생)은 **`rules/workflow`**(자동 로드) 참조.

### 기능 개발 (태스크)

vault `project/tasks/TASK-{N}-*.md` 기반. 워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`. (위 **공통 워크플로우 원칙** 함께 적용)

1. `git checkout -b feature/TASK-{N}-기능명` (dev에서 분기, `TASK-{N}`은 vault 태스크 ID — 비패딩)
2. **새 API 작업 시 첫 번째 커밋**: `src/lib/types/api.ts`에 요청/응답 타입 정의
   - 이 커밋이 FE 세션의 작업 시작점이 됨
3. API Route 구현 + 테스트 작성 → skill: api-route 패턴 참조
4. DB 변경 필요 시 마이그레이션 스캐폴딩 (시그니처 + TODO 주석)
5. 커밋
6. **PR 생성 전 `/review` 실행** → code-reviewer(구조/아키텍처) + security-reviewer(보안) agent 위임
7. PR 생성 — 제목 `[TASK-{N}] 태스크명`
8. **vault 동기화 알림 출력** — 다음 한 줄을 사용자에게 보고:
   > `[VAULT 동기화 필요] TASK-{N} · branch=feature/TASK-{N}-{슬러그} · PR={PR URL} · start_date={오늘 YYYY-MM-DD} · status=in-review`

> 코드 레포 세션은 vault 파일에 쓰지 않는다. 진척 5필드 갱신을 포함한 모든 vault 쓰기는 vault project 세션 전속 — 위 알림을 vault 세션에서 처리한다. 본문·기획 영역(설명·완료조건·`linked_features` 등)도 동일.

### 버그 수정 (이슈)

vault `project/issues/ISSUE-{N}-*.md` 기반. 워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`. (위 **공통 워크플로우 원칙** 함께 적용)

1. **이슈 간략 요약** — 시작 전 증상·심각도·관련 영역을 1~3줄로 안내.
2. **진단 우선** — 현재 코드로 원인 검증 (`rules/issue-diagnosis`). 결함이 아니면 close 제안, 증상이 vault와 다르면 보고 후 진행.
3. `git checkout -b fix/ISSUE-{N}-버그명` (dev에서 분기, `ISSUE-{N}` 비패딩; 의존 연속 작업이면 stacked 분기 — 공통 원칙 참조).
4. **plan 모드** — 비단순 변경은 plan 작성 → 승인 후 구현.
5. 수정 구현 + 테스트 작성.
6. **검증 3종**: `npm run build` + `npm run lint` + `npm test` (에러 0).
7. **PR 생성 전 `/review` 실행** → code-reviewer(구조/아키텍처) + security-reviewer(보안) agent 위임.
8. **사용자 확인** — 필요 시 API 동작 재현·확인 후 진행.
9. 커밋 (관련 파일만 스테이징).
10. **PR 초안(제목·본문) 먼저 보여주고 승인** → PR 생성 — 제목 `[ISSUE-{N}] 이슈명`.
11. **vault 동기화 알림 출력**:
    > `[VAULT 동기화 필요] ISSUE-{N} · branch=fix/ISSUE-{N}-{슬러그} · PR={PR URL} · start_date={오늘 YYYY-MM-DD} · status=in-review`
12. **vault-content-drafter에 위임** — 본문 초안 터미널 출력 (vault엔 쓰지 않음; 사용자가 vault 세션에서 입력).

## 패턴 참조

- API Route 구현 패턴, 테스트 템플릿, 체크리스트 → skill: api-route
- DB 설계 원칙 → rules/db-design.md (자동 로드)
- 테스트 전략 → rules/testing.md (자동 로드)
