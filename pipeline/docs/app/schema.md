# 앱 소스 스키마 (파이프라인 사용 범위)

파이프라인이 소스로 읽는 앱 테이블 (Supabase PostgreSQL). 모든 시각 컬럼은 `TIMESTAMPTZ`(UTC).

### activity_log — 서비스 이벤트 로그 (append-only)

활성 유저 원천. `event_type = app_visited`를 활성 판정에 사용.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | SERIAL (PK) | |
| `user_id` | UUID (FK) | → profiles |
| `event_category` | VARCHAR(20) | 이벤트 대분류 (예: `app`) |
| `event_type` | VARCHAR(30) | 이벤트 종류 (예: `app_visited`) |
| `metadata` | JSONB | 부가 정보 |
| `created_at` | TIMESTAMPTZ | 발생 시각 |

### pomodoro_sessions — 포모도로 세션(사이클)

- 포모도로 세션은 `(포모도로 + 짧은 휴식) * N + 긴 휴식` 를 묶는 단위를 의미

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | SERIAL (PK) | |
| `user_id` | UUID (FK) | → profiles |
| `character_instance_id` | INTEGER (FK) | → character_instances |
| `target_count` | INTEGER | 목표 포모도로 수 |
| `completed_count` | INTEGER | 완료 수 |
| `focus_minutes` | INTEGER | 집중 분 |
| `short_break_minutes` | INTEGER | 짧은 휴식 분 |
| `long_break_minutes` | INTEGER | 긴 휴식 분 |
| `status` | VARCHAR(20) | 상태 (`in_progress` 등) |
| `started_at` | TIMESTAMPTZ | 시작 |
| `ended_at` | TIMESTAMPTZ | 종료 |
| `created_at` | TIMESTAMPTZ | 생성 시각 |
