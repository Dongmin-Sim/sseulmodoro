#!/usr/bin/env bash
set -euo pipefail
# usage       : bash ./setup-alerts.sh <dev|prod>
# description : Cloud Monitoring 로그 기반 알림 정책 생성 스크립트 (policy displayName 기반 멱등)
# dependency  : Slack 알림 채널은 OAuth 인증 필요. (1회, 수동 선작업 필요)
# reference   :
#   - gcloud monitoring policy : https://docs.cloud.google.com/sdk/gcloud/reference/monitoring/policies
#   - policy-from-file example : https://docs.cloud.google.com/monitoring/alerts/policies-in-json?hl=ko#policy_samples


ENV="${1:?usage: setup-alerts.sh <dev|prod>}"
case "$ENV" in dev|prod) ;; *) echo "unknown env: $ENV"; exit 1 ;; esac

source "$(dirname "$0")/env.$ENV.sh"
HERE="$(dirname "$0")"

SLACK_CHANNEL_DISPLAY="#notify"

# 1) Slack 알림 채널 리소스명 조회
CHANNEL_ID=$(gcloud beta monitoring channels list \
  --project="$PROJECT_ID" \
  --filter="labels.channel_name=\"$SLACK_CHANNEL_DISPLAY\"" \
  --format="value(name)" | head -n1)

if [ -z "$CHANNEL_ID" ]; then
  echo "[!] Slack 채널 '$SLACK_CHANNEL_DISPLAY' 없음 — 콘솔에서 1회 생성 후 재실행"
  echo "    console.cloud.google.com/monitoring/alerting/notifications?project=$PROJECT_ID"
  exit 1
fi

# 2) 정책 upsert
upsert_policy() {
  local name="$1" file="$2"

  local tmp; tmp=$(mktemp)
  sed -e "s|__PROJECT_ID__|$PROJECT_ID|g" \
      -e "s|__CHANNEL_ID__|$CHANNEL_ID|g" "$file" > "$tmp"

  local existing_policy
  existing_policy=$(gcloud monitoring policies list --project="$PROJECT_ID" \
  --filter="displayName=\"$name\"" \
  --format="value(name)" | head -n1)

  if [ -n "$existing_policy" ]; then
    gcloud monitoring policies update "$existing_policy" --project="$PROJECT_ID" --policy-from-file="$tmp"
    echo "policy $name exists, update"
  else
    gcloud monitoring policies create --project="$PROJECT_ID" --policy-from-file="$tmp"
    echo "policy $name created"
  fi

  rm -f "$tmp"
}

# 3) 정책 적용
upsert_policy "pipeline_fail"        "$HERE/alert-pipeline-fail.json"
upsert_policy "pipeline_empty_mart"  "$HERE/alert-pipeline-empty-mart.json"

echo "alerts setup done ($ENV)"
