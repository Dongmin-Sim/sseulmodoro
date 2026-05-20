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

### 기능 개발 (태스크 DB)

워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`.

1. `git checkout -b feature/TASK-{N}-기능명` (dev에서 분기, `TASK-{N}`은 vault 태스크 ID — 비패딩)
2. **새 API 작업 시 첫 번째 커밋**: `src/lib/types/api.ts`에 요청/응답 타입 정의
   - 이 커밋이 FE 세션의 작업 시작점이 됨
3. API Route 구현 + 테스트 작성 → skill: api-route 패턴 참조
4. DB 변경 필요 시 마이그레이션 스캐폴딩 (시그니처 + TODO 주석)
5. 커밋
6. **PR 생성 전 `/review` 실행** → code-reviewer(구조/아키텍처) + security-reviewer(보안) agent 위임
7. PR 생성

> PR 생성 후 vault 태스크 파일의 상태·PR 링크 갱신은 vault project 세션이 git/PR을 보고 반영한다. 코드 레포 세션은 태스크 파일을 갱신하지 않는다.

### 버그 수정 (이슈 DB)

> ⚠️ **이슈/버그 모델 미확정.** vault에는 별도 이슈 DB가 없어 `ISSUE-XXX` 개념의 대응이 정해지지 않았다. vault improvement `2026-05-19-코드레포-이슈버그-모델-vault대응` 처리 후 이 섹션을 확정한다. 그때까지 버그 상태 추적은 사용자와 직접 합의해 진행한다.

워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`.

1. `git checkout -b fix/ISSUE-XXX-버그명` (dev에서 분기)
2. 이슈 재현 확인 → 원인 분석
3. 수정 구현 + 테스트 작성
4. 커밋
5. **PR 생성 전 `/review` 실행** → code-reviewer(구조/아키텍처) + security-reviewer(보안) agent 위임
6. PR 생성

## 패턴 참조

- API Route 구현 패턴, 테스트 템플릿, 체크리스트 → skill: api-route
- DB 설계 원칙 → rules/db-design.md (자동 로드)
- 테스트 전략 → rules/testing.md (자동 로드)
