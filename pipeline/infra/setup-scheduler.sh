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
SCHEDULE_NAME="nsm-weekly"
CRON='0 4 * * 0'
TIMEZONE='Asia/Seoul'

# dev(WITH_SCHEDULER=false)면 스킵 — scheduler는 prod만
if [ "${WITH_SCHEDULER:-false}" != "true" ]; then
  echo "[$ENV] WITH_SCHEDULER != true, skip scheduler"
  exit 0
fi

# prod 가드
if [ "$ENV" = "prod" ]; then
  read -rp "Create PROD scheduler ($PROJECT_ID, '$CRON'). Type 'yes': " ok
  [ "$ok" = "yes" ] || { echo "aborted"; exit 1; }
fi

URI="https://workflowexecutions.googleapis.com/v1/projects/$PROJECT_ID/locations/$LOCATION/workflows/$WORKFLOW_NAME/executions"

if ! gcloud workflows describe "$WORKFLOW_NAME" --location="$LOCATION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "[!] Cloud Workflow '$WORKFLOW_NAME' ($LOCATION) 없음. cloudbuild로 먼저 배포 후 재실행"
  exit 1
fi

upsert_scheduler() {
  local action=create
  if gcloud scheduler jobs describe "$SCHEDULE_NAME" --location="$LOCATION" --project="$PROJECT_ID" >/dev/null 2>&1; then
    action=update
  fi

  gcloud scheduler jobs "$action" http "$SCHEDULE_NAME" \
    --location="$LOCATION" \
    --schedule="$CRON" \
    --time-zone="$TIMEZONE" \
    --uri="$URI" \
    --http-method=POST \
    --oauth-service-account-email="$SA_SCHEDULER@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" >/dev/null

  echo "scheduler $SCHEDULE_NAME ${action}d ($CRON $TIMEZONE → $WORKFLOW_NAME)"
}

upsert_scheduler
