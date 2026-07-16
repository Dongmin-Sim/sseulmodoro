# 파이프라인 로깅 스키마

파이프라인이 남기는 로그의 **필드·이벤트 스키마**. 
각 단계를 `timed` 컨텍스트 매니저로 감싸 상태·소요시간·처리 건수를 필드로 남김.

- **배포 환경**: 커스텀 JSON 포맷 (`CloudLoggingFormatter`) - Cloud Logging에서 필드로 필터·집계
- **로컬 환경**: 커스텀 콘솔 포맷 (`CustomConsoleFormatter`)
- 관련 코드: `etl/utils/logger.py` · 알림 정책: `infra/setup-alerts.sh`

## 공통 필드 (모든 로그 레코드)

| 필드 | 타입 | 의미                                 |
| --- | --- |------------------------------------|
| `asctime` | timestamp | 로그 시각                              |
| `severity` | string | 로그 레벨 (`INFO` · `ERROR` · `DEBUG`) |
| `message` | string | 로그 메시지 (예: `load-load end`)        |
| `module` | string | 로거 이름(모듈 경로)                       |
| `err_msg` | string | 예외 트레이스백 - **예외 발생 시에만**           |

## 계측 필드 (`timed` 이벤트에 추가)

| 필드 | 타입 | 의미 | 남는 시점 |
| --- | --- | --- | --- |
| `stage` | string | 단계 (`run` · `extract` · `load` · `transform`) | start · end · error |
| `event` | string | 이벤트 이름 (`<stage>_start` / `_end` / `_error`) | start · end · error |
| `status` | string | `success` / `fail` | end · error |
| `duration_ms` | number | 소요 시간 (ms) | end · error |
| `rows` | number | 처리 행 수 | end (extract · load · transform) |
| `target` | string | 대상 테이블 | extract · load · transform |

## 이벤트 카탈로그

각 단계는 **시작 → 끝(성공) / 에러(실패)** 3가지 이벤트를 남긴다.

| 단계 (`stage`) | 이벤트 (`event`) | 발생 시점 | 주요 필드 |
| --- | --- | --- | --- |
| `run` | `run_start` · `run_end` · `run_error` | 파이프라인 전체 실행 | `status` · `duration_ms` |
| `extract` | `extract_start` · `extract_end` · `extract_error` | 소스 테이블 추출 (Supabase) | `target` · `rows` · `status` · `duration_ms` |
| `load` | `load_start` · `load_end` · `load_error` | BigQuery raw 적재 | `target` · `rows` · `status` · `duration_ms` |
| `transform` | `transform_start` · `transform_end` · `transform_error` | 웨어하우스 SQL 변환 (stage·mart) | `target` · `rows` · `status` · `duration_ms` |

## 알림 연동 (필드 → 알림)

아래 알림 정책이 트리거되는 필드 조건을 읽어 이상 여부 **판정** 후 알림 채널로 알림을 보낸다.

| 알림 | 트리거 (필드 조건) | 정책 파일 |
| --- | --- | --- |
| 파이프라인 실패 | `status = fail` | `infra/alert-pipeline-fail.json` |
| 적재 0건 | `rows = 0` | `infra/alert-pipeline-empty-mart.json` |

## 로그 예시(JSON)

적재 단계 성공:

```json
{
  "asctime": "2026-07-14 03:00:12,345",
  "severity": "INFO",
  "message": "load-load end",
  "module": "nsm.load",
  "stage": "load",
  "event": "load_end",
  "status": "success",
  "duration_ms": 812.4,
  "rows": 15234,
  "target": "activity_log"
}
```

추출 단계 실패:

```json
{
  "asctime": "2026-07-14 03:00:03,001",
  "severity": "ERROR",
  "message": "extract failed",
  "module": "nsm.extract",
  "stage": "extract",
  "event": "extract_error",
  "status": "fail",
  "duration_ms": 152.7,
  "target": "pomodoro_sessions",
  "err_msg": "Traceback (most recent call last): ..."
}
```
