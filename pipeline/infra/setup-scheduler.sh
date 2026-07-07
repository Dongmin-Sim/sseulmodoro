#!/usr/bin/env bash
set -euo pipefail
# usage: ./setup-scheduler.sh <dev|prod>
# Cloud Scheduler cron 생성 (인프라 — cloudbuild 밖, 1회성)
#
# 선행(1회, 수동): Cloud Run job이 이미 배포돼 있어야 함 (scheduler가 job의 :run URL 참조).

ENV="${1:?usage: setup-scheduler.sh <dev|prod>}"
case "$ENV" in dev|prod) ;; *) echo "unknown env: $ENV"; exit 1 ;; esac

source "$(dirname "$0")/env.$ENV.sh"

SA_SCHEDULER="nsm-scheduler"
JOB_NAME="nsm-job"             # cloudbuild.yaml의 _JOB_NAME과 일치해야 함
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

URI="https://run.googleapis.com/v2/projects/$PROJECT_ID/locations/$LOCATION/jobs/$JOB_NAME:run"

if ! gcloud run jobs describe "$JOB_NAME" --region="$LOCATION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "[!] Cloud Run job '$JOB_NAME' ($LOCATION) 없음. cloudbuild로 먼저 배포 후 재실행"
  exit 1
fi

# 멱등: 있으면 skip, 없으면 create
if gcloud scheduler jobs describe "$SCHEDULE_NAME" --location="$LOCATION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "scheduler $SCHEDULE_NAME exists, skip"
else
  gcloud scheduler jobs create http "$SCHEDULE_NAME" \
    --location="$LOCATION" \
    --schedule="$CRON" \
    --time-zone="$TIMEZONE" \
    --uri="$URI" \
    --http-method=POST \
    --oauth-service-account-email="$SA_SCHEDULER@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" >/dev/null
  echo "scheduler $SCHEDULE_NAME created ($CRON $TIMEZONE → $JOB_NAME)"
fi
