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

### 세션 시작 시 — 이전 작업 정리
1. `dev` 브랜치로 checkout + `git pull origin dev`로 최신 상태 동기화
2. 노션 태스크/이슈 DB에서 "리뷰 중" 상태인 BE 항목 확인
3. 해당 PR의 머지 여부를 GitHub에서 확인 (`gh pr view`)
4. 머지 완료된 경우:
   - 노션 상태 → "완료", 완료일자 기록
   - 로컬 브랜치 정리 여부를 사용자에게 확인
5. 머지 전이면 사용자에게 상황 공유 후 다음 태스크로 진행

### 태스크/이슈 선택 → 리뷰 → 작업 방식 결정
1. 노션 태스크/이슈 DB에서 `세션: BE` 항목 목록 조회 (백로그 + 선행 충족 여부)
2. 사용자에게 목록 제시 → 작업할 태스크/이슈 선택
3. 선택된 태스크 페이지 fetch → 내용 간략 정리:
   - 설명, 세부 내용, API 계약, 선행 태스크, 영향 범위
4. 사용자와 리뷰 (빠진 내용, 방향 조정, 스코프 확인)
5. AskUserQuestion으로 작업 방식 결정:
   - "plan 모드로 구현 계획 수립" — 복잡한 태스크 (rpc 트랜잭션, 다중 테이블 등)
   - "바로 작업 시작" — 단순한 태스크 (순수 읽기 API 등)

### 기능 개발 (태스크 DB)
1. 노션 태스크 상태 → "진행 중", 시작일자 기록
2. **새 API 작업 시 첫 번째 커밋**: `src/lib/types/api.ts`에 요청/응답 타입 정의
   - 이 커밋이 FE 세션의 작업 시작점이 됨
4. API Route 구현 + 테스트 작성
5. DB 변경 필요 시 마이그레이션 스캐폴딩 (시그니처 + TODO 주석)
6. 커밋
7. **PR 생성 전 `/review` 실행** — SQL safety, trust boundary, 구조적 이슈 검수
8. PR 생성 → 노션 태스크 업데이트:
   - 상태 → "리뷰 중"
   - PR 링크 기록
9. 브랜치명: `feature/TASK-XXX-기능명`

### 버그 수정 (이슈 DB)
1. 노션 이슈 상태 → "진행 중"
3. 이슈 재현 확인 → 원인 분석
4. 수정 구현 + 테스트 작성
5. 커밋
6. **PR 생성 전 `/review` 실행**
7. PR 생성 → 노션 이슈 업데이트:
   - 상태 → "리뷰 중"
   - PR 링크 기록
8. 브랜치명: `fix/ISSUE-XXX-버그명`

## API 계약 패턴

기존 패턴을 따른다:

```typescript
// src/lib/types/api.ts
/** HTTP_METHOD /api/경로 성공 응답 */
export interface XxxResponse {
  // 필드 정의
}

/** API 공통 에러 응답 */
export interface ApiError {
  error: string;
}
```

## API Route 패턴

```typescript
// src/app/api/xxx/route.ts
import { getAuthUser } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // rpc 호출 — 여러 테이블 변경은 반드시 rpc 사용
  const { data, error } = await supabase.rpc("function_name", { params });
  // ...
}
```

## DB 규칙 (CLAUDE.md에서 확대)

- activity_log는 append-only. UPDATE/DELETE 금지
- 포인트 잔액: `balance = balance + N` (상대적 UPDATE)
- point_transaction에 running_balance 항상 기록
- 여러 테이블 변경 → 반드시 PostgreSQL 함수(rpc)로 트랜잭션 처리
- PostgreSQL 함수/ETL 직접 구현 금지 — 스캐폴딩(시그니처 + TODO)만 생성

## 테스트 규칙

- API Route 작성 시 반드시 `*.test.ts` 함께 작성
- Vitest로 트랜잭션/정합성 검증
- TypeScript 변경 후 `npm run build`로 type check
