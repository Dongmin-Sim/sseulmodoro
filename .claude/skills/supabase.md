# Supabase 작업 가이드

## CLI 명령어 (프로젝트 루트에서 실행)

```bash
npx supabase login                              # CLI 인증
npx supabase init                               # supabase/config.toml 생성
npx supabase link --project-ref <ref_id>        # 원격 프로젝트 연결
npx supabase db push                            # migrations/ SQL을 원격 DB에 적용
npx supabase db reset                           # 원격 DB 초기화 후 전체 마이그레이션 재실행
npx supabase migration new <설명>               # 새 마이그레이션 파일 생성 (타임스탬프 자동)
```

## 마이그레이션 규칙

- 파일 위치: `supabase/migrations/`
- 파일명: `supabase migration new`로 생성 (타임스탬프 자동 부여)
- 항상 앞으로만 진행. 롤백 마이그레이션 작성 금지.
- 스키마 변경은 반드시 마이그레이션 파일로. Dashboard에서 직접 수정 금지.

## 키 체계

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (sb_pub_...) — 브라우저 노출됨. Auth + RLS 경유 접근용.
- `SUPABASE_SECRET_KEY` (sb_secret_...) — 서버 전용. RLS 무시. API Route에서만 사용.
- `NEXT_PUBLIC_` 접두사 = 브라우저에 포함됨. Secret key에 절대 붙이지 않을 것.

## 데이터 접근 패턴

- 단순 조회: 브라우저 → Supabase 직접 (Publishable key + RLS 정책 필요)
- 트랜잭션/복잡한 로직: 브라우저 → API Route → Supabase (Secret key, RLS 무시)
- Auth (로그인/회원가입): 브라우저 → Supabase 직접 (Publishable key 필수)

## 로컬 개발 환경

### 시작

```bash
npx supabase start             # Docker로 로컬 DB 시작 (최초 1회, 이후 유지)
npx supabase status            # 로컬 URL, 키 확인
npx supabase db reset          # 로컬 DB 초기화 + 마이그레이션 재실행
```

- `supabase start` 후 Docker 컨테이너가 백그라운드 유지. 매번 재시작 불필요.
- `supabase stop`으로 명시적으로 종료하기 전까지 살아있음.

### 로컬 vs 원격 명령어 구분

| 명령어 | 대상 | 용도 |
|--------|------|------|
| `npx supabase start` | 로컬 | Docker로 로컬 DB 시작 |
| `npx supabase db reset` | 로컬 | 로컬 DB 초기화 후 마이그레이션 재실행 |
| `npx supabase db push` | 원격 | 마이그레이션을 클라우드 DB에 적용 |

### 환경 분기

코드에서는 `process.env`로 동일하게 접근. 환경변수 값만 다름.

| 환경 | URL | 키 확인 방법 |
|------|-----|-------------|
| 로컬 (`npm run dev`) | `http://localhost:54321` | `npx supabase status` |
| 배포 (Vercel) | `https://xxx.supabase.co` | Supabase Dashboard |

- `.env.local` → 로컬 개발용 (로컬 DB URL + 로컬 키)
- Vercel 환경변수 → 배포용 (클라우드 DB URL + 클라우드 키)

## 현재 상태

- Supabase 프로젝트: 생성 완료, CLI 연결 완료
- 스키마: 미적용 (DB 설계 확정 후 `npx supabase db push`)
- RLS: Automatic RLS 켜져 있음. 정책은 미작성.
- 초기 스키마 파일: `supabase/migrations/001_initial_schema.sql` (초안, 수정 예정)
