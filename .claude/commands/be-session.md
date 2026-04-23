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

1. `git checkout -b feature/TASK-XXX-기능명` (dev에서 분기)
2. notion-routine agent에 위임: "TASK-XXX 상태 → '진행 중', 시작일자 오늘"
3. **새 API 작업 시 첫 번째 커밋**: `src/lib/types/api.ts`에 요청/응답 타입 정의
   - 이 커밋이 FE 세션의 작업 시작점이 됨
4. API Route 구현 + 테스트 작성 → skill: api-route 패턴 참조
5. DB 변경 필요 시 마이그레이션 스캐폴딩 (시그니처 + TODO 주석)
6. 커밋
7. **PR 생성 전 `/review` 실행** → code-reviewer(구조/아키텍처) + security-reviewer(보안) agent 위임
8. PR 생성
9. skill: pr-sync 실행 → 노션 동기화

### 버그 수정 (이슈 DB)

워크플로우 시작 시 TaskCreate로 아래 단계를 등록한다. 각 단계 시작 전 `in_progress`, 완료 직후 `completed`.

1. `git checkout -b fix/ISSUE-XXX-버그명` (dev에서 분기)
2. notion-routine agent에 위임: "ISSUE-XXX 상태 → '진행 중'"
3. 이슈 재현 확인 → 원인 분석
4. 수정 구현 + 테스트 작성
5. 커밋
6. **PR 생성 전 `/review` 실행** → code-reviewer(구조/아키텍처) + security-reviewer(보안) agent 위임
7. PR 생성
8. skill: pr-sync 실행 → 노션 동기화

## 패턴 참조

- API Route 구현 패턴, 테스트 템플릿, 체크리스트 → skill: api-route
- DB 설계 원칙 → rules/db-design.md (자동 로드)
- 테스트 전략 → rules/testing.md (자동 로드)
