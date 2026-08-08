#!/usr/bin/env bash
set -euo pipefail
# usage: ./setup-scheduler.sh <dev|prod>
# Cloud Scheduler cron 생성 (인프라 — cloudbuild 밖, 1회성)
#
# 선행(1회, 수동): Cloud Workflow와 관련 SA-IAM이 이미 배포돼 있어야 함

ENV="${1:?usage: setup-scheduler.sh <dev|prod>}"
case "$ENV" in dev|prod) ;; *) echo "unknown env: $ENV"; exit 1 ;; esac

source "$(dirname "$0")/env.$ENV.sh"

SA_SCHEDULER="nsm-scheduler"
WORKFLOW_NAME="nsm-workflow" # cloudbuild.yaml의 _WORKFLOW_NAME과 일치해야 함
TIMEZONE='Asia/Seoul'
AT='0 4'

# 잡 이름 | cron 요일(0=일) | 대상 테이블
SCHEDULES=(
  'nsm-daily|0,2,3,4,5,6|["activity_log"]'
  'nsm-monday|1|["activity_log","pomodoro_sessions"]'
)


assert_weekday_coverage() {
  local row dow days=()
  for row in "${SCHEDULES[@]}"; do
    IFS='|' read -r _ dow _ <<<"$row"
    IFS=',' read -ra parts <<<"$dow"
    days+=("${parts[@]}")
  done

  local got
  got=$(printf '%s\n' "${days[@]}" | sort -n | tr '\n' ' ')
  if [ "$got" != "0 1 2 3 4 5 6 " ]; then
    echo "[!] 요일 커버리지 오류 — 0~6이 한 번씩이어야 함 (현재: $got)"
    exit 1
  fi
}

build_message_body() {
  python3 -c '
import json, sys
tables = json.loads(sys.argv[1])
print(json.dumps({"argument": json.dumps({"tables": tables})}))
' "$1"
}

upsert_scheduler() {
  local name="$1" dow="$2" tables="$3"
  local cron="$AT * * $dow"
  local body action=create

  body=$(build_message_body "$tables")

  if gcloud scheduler jobs describe "$name" --location="$LOCATION" --project="$PROJECT_ID" >/dev/null 2>&1; then
    action=update
  fi

  gcloud scheduler jobs "$action" http "$name" \
    --location="$LOCATION" \
    --schedule="$cron" \
    --time-zone="$TIMEZONE" \
    --uri="$URI" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="$body" \
    --oauth-service-account-email="$SA_SCHEDULER@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" >/dev/null

  echo "scheduler $name ${action}d ($cron $TIMEZONE → $WORKFLOW_NAME, tables=$tables)"
}

assert_weekday_coverage

# dev(WITH_SCHEDULER=false)면 스킵 — scheduler는 prod만
if [ "${WITH_SCHEDULER:-false}" != "true" ]; then
  echo "[$ENV] WITH_SCHEDULER != true, skip scheduler"
  exit 0
fi

# prod
if [ "$ENV" = "prod" ] && [ -t 0 ]; then
  read -rp "Create PROD schedulers ($PROJECT_ID, ${#SCHEDULES[@]} jobs). Type 'yes': " ok
  [ "$ok" = "yes" ] || { echo "aborted"; exit 1; }
fi

URI="https://workflowexecutions.googleapis.com/v1/projects/$PROJECT_ID/locations/$LOCATION/workflows/$WORKFLOW_NAME/executions"

if ! gcloud workflows describe "$WORKFLOW_NAME" --location="$LOCATION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "[!] Cloud Workflow '$WORKFLOW_NAME' ($LOCATION) 없음. cloudbuild로 먼저 배포 후 재실행"
  exit 1
fi

for row in "${SCHEDULES[@]}"; do
  IFS='|' read -r name dow tables <<<"$row"
  upsert_scheduler "$name" "$dow" "$tables"
done
