#!/usr/bin/env bash
set -euo pipefail
# usage: ./setup-triggers.sh <dev|prod>
# Cloud Build 트리거 생성 (provision.sh와 분리 — CD)
#
# 선행(1회, 수동): GitHub <-> Cloud Build와 Repository 연결 (OAuth로 repo 접근 승인 필요)
#   console.cloud.google.com/cloud-build/triggers → Connect Repository

ENV="${1:?usage: setup-triggers.sh <dev|prod>}"
case "$ENV" in dev|prod) ;; *) echo "unknown env: $ENV"; exit 1 ;; esac

source "$(dirname "$0")/env.$ENV.sh"

SA_DEPLOYER="nsm-deployer"
TRIGGER_NAME="nsm-deploy-$ENV"

# env별 트리거 브랜치: dev 프로젝트→dev 브랜치, prod 프로젝트→main 브랜치
case "$ENV" in
  dev)  BRANCH='^dev$'  ;;
  prod) BRANCH='^main$' ;;
esac

# prod 가드
if [ "$ENV" = "prod" ]; then
  read -rp "Create PROD trigger ($PROJECT_ID, branch=$BRANCH). Type 'yes': " ok
  [ "$ok" = "yes" ] || { echo "aborted"; exit 1; }
fi

# 멱등: 있으면 skip, 없으면 create
if gcloud builds triggers describe "$TRIGGER_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "trigger $TRIGGER_NAME exists, skip"
else

  if ! gcloud builds triggers create github \
    --name="$TRIGGER_NAME" \
    --repo-owner="$REPO_OWNER" \
    --repo-name="$REPO_NAME" \
    --branch-pattern="$BRANCH" \
    --included-files='pipeline/**' \
    --build-config='pipeline/cloudbuild.yaml' \
    --service-account="projects/$PROJECT_ID/serviceAccounts/$SA_DEPLOYER@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" \
    --substitutions=_REPO="$REPOSITORY" >/dev/null; then
    echo "[!] 트리거 생성 실패 — GitHub repo 미연결 가능성:"
    echo "    https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID → Connect Repository 후 재실행"
    exit 1
  fi
  echo "trigger $TRIGGER_NAME created (branch=$BRANCH)"
fi
