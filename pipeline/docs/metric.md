# 파이프라인 지표

서비스 성장을 판단하는 **핵심 지표(NSM)와 보조지표**. 주(week) 단위 집계
- 키 컬럼 `date_kst`는 해당 주 월요일 날짜(KST).

- 최종 산출 테이블: `mart.agg_nsm_weekly`
- 변환 SQL: `etl/sql/marts/agg_nsm_weekly.sql`

## 핵심 지표 (NSM)

| 지표 | 컬럼 | 의미 | 산식 |
| --- | --- | --- | --- |
| 1인당 포모도로 완료 수 | `completions_per_user` | 활성 사용자 1인당 평균 완료 수. 서비스 핵심 가치(집중)를 대표하는 북극성 지표 | 총 완료 수 ÷ 활성 사용자 수 |

## 보조 지표

NSM의 움직임을 분해해 원인을 해석한다. **NSM = 참여 빈도 × 세션당 목표 × 완료율**.

| 지표 | 컬럼 | 의미 | 산식 |
| --- | --- | --- | --- |
| 참여 빈도 | `sessions_per_user` | 1인당 세션 수 — 얼마나 자주 참여하는지 | 총 세션 수 ÷ 활성 사용자 수 |
| 세션당 목표 | `target_per_session` | 한 번에 얼마나 목표하는지 | 총 목표 수 ÷ 총 세션 수 |
| 완료율 | `completion_rate` | 목표 대비 실제 완료 | 총 완료 수 ÷ 총 목표 수 |
| 활성 사용자 수 | `active_user_count` | 규모 (활성 기준 = 앱 접속) | 주별 접속 유저 distinct count |

## 구성 집계값

지표를 만드는 주별 원천 집계 (`mart.agg_pomodoro_weekly` · `mart.active_user_weekly`).

| 값 | 컬럼 | 정의 |
| --- | --- | --- |
| 총 완료 수 | `total_completions` | 주별 완료 포모도로 합 (`SUM(completed)`) |
| 총 목표 수 | `total_target` | 주별 목표 포모도로 합 (`SUM(target)`) |
| 총 세션 수 | `total_sessions` | 주별 세션 수 (`COUNT(session_id)`) |
| 활성 사용자 수 | `active_user_count` | 주별 접속 유저 distinct (`COUNT(DISTINCT user_id)`) |

