# 파이프라인 알림 정책

Cloud Monitoring **로그 기반 알림 정책**. 

- 정의: `infra/terraform/main.tf` (`google_monitoring_alert_policy`)
- 로그 스키마: `docs/logging-schema.md`

## 정책

| 정책 | 트리거 (로그 필드 조건) | 잡는 것 | severity |
| --- | --- | --- | --- |
| `pipeline_fail` | `status=fail` | 파이프라인 실패 (어느 단계든 죽음) | CRITICAL |
| `pipeline_empty_mart` | `event=transform_end` · `status=success` · `target=…mart.agg_nsm_weekly` · `rows=0` | 성공했으나 최종 지표가 0행 | WARNING |

## 공통 전략

| 항목 | 값 | 의미 |
| --- | --- | --- |
| `notificationRateLimit` | `300s` | 5분에 1회 — 알림 폭주 방지 |
| `autoClose` | `3600s` | 조건 해소 후 1시간 뒤 자동 종료 |
| 채널 | Slack `#notify` | 알림 대상 |
