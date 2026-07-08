#!/usr/bin/env bash
set -euo pipefail
# usage: ./provision.sh <dev|prod>
# per-env values live in env.<ENV>.sh; shared logic in the functions below

ENV="${1:?usage: provision.sh <dev|prod>}"
case "$ENV" in dev|prod) ;; *) echo "unknown env: $ENV"; exit 1 ;; esac

source "$(dirname "$0")/env.$ENV.sh"

SA_JOB="nsm-runner"          # SA that runs the job (reads/writes BigQuery)
SA_SCHEDULER="nsm-scheduler"     # SA the scheduler uses to invoke the job
SA_DEPLOYER="nsm-deployer"

step() { printf '\n=== %s ===\n' "$1"; }

# prod guard: avoid touching the live prod env by accident
if [ "$ENV" = "prod" ]; then
  read -rp "Provisioning PROD($PROJECT_ID). Type 'yes' to continue: " ok
  [ "$ok" = "yes" ] || { echo "aborted"; exit 1; }
fi

# create-type: skip if describe succeeds (exists), else create
create_project() {
  if gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
    echo "project $PROJECT_ID exists, skip"
  else
    gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME" >/dev/null
    echo "project $PROJECT_ID created"
  fi
}

# enable/binding-type: idempotent, just run
enable_services() {
  gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    cloudscheduler.googleapis.com \
    secretmanager.googleapis.com \
    run.googleapis.com \
    --project="$PROJECT_ID" >/dev/null
  echo "services enabled"
}

create_artifact_repo() {
  if gcloud artifacts repositories describe "$REPOSITORY" --location="$LOCATION" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "artifact repository $REPOSITORY exists, skip"
  else
    gcloud artifacts repositories create "$REPOSITORY" \
      --repository-format=docker \
      --location="$LOCATION" \
      --description="Pipeline images" \
      --project="$PROJECT_ID" >/dev/null
    echo "artifact repository $REPOSITORY created"
  fi
}

create_service_accounts() {
  if gcloud iam service-accounts describe "$SA_JOB@$PROJECT_ID.iam.gserviceaccount.com" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "service account $SA_JOB exists, skip"
  else
    gcloud iam service-accounts create "$SA_JOB" \
      --display-name="NSM Job Runner (BigQuery)" \
      --project="$PROJECT_ID" >/dev/null
    echo "service account $SA_JOB created"
  fi

  if gcloud iam service-accounts describe "$SA_SCHEDULER@$PROJECT_ID.iam.gserviceaccount.com" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "service account $SA_SCHEDULER exists, skip"
  else
    gcloud iam service-accounts create "$SA_SCHEDULER" \
      --display-name="NSM Scheduler Invoker" \
      --project="$PROJECT_ID" >/dev/null
    echo "service account $SA_SCHEDULER created"
  fi

  if gcloud iam service-accounts describe "$SA_DEPLOYER@$PROJECT_ID.iam.gserviceaccount.com" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "service account $SA_DEPLOYER exists, skip"
  else
    gcloud iam service-accounts create "$SA_DEPLOYER" \
      --display-name="NSM Deployer (CI/CD)" \
      --project="$PROJECT_ID" >/dev/null
    echo "service account $SA_DEPLOYER created"
  fi
}

bind_iam() {
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_JOB@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/bigquery.jobUser" >/dev/null
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_JOB@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/bigquery.dataEditor" >/dev/null
  echo "bound bigquery.jobUser / bigquery.dataEditor to $SA_JOB"

  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_SCHEDULER@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.invoker" >/dev/null
  echo "bound run.invoker to $SA_SCHEDULER"

  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_DEPLOYER@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.developer" >/dev/null
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_DEPLOYER@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer" >/dev/null
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_DEPLOYER@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/logging.logWriter" >/dev/null
  gcloud iam service-accounts add-iam-policy-binding "$SA_JOB@$PROJECT_ID.iam.gserviceaccount.com" \
  --member="serviceAccount:$SA_DEPLOYER@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" --project="$PROJECT_ID" >/dev/null
  echo "bound run.developer / artifactregistry.writer / logging.logWriter / iam.serviceAccountUser to $SA_DEPLOYER"
}

# check existence only (never read the value) — stop if missing
require_secret() {
  if ! gcloud secrets describe DATABASE_URL --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "secret DATABASE_URL not found. create it first (value via file/stdin):" >&2
    echo "  gcloud secrets create DATABASE_URL --data-file=<file> --project=$PROJECT_ID" >&2
    exit 1
  fi
  gcloud secrets add-iam-policy-binding DATABASE_URL \
    --member="serviceAccount:$SA_JOB@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" >/dev/null
  echo "granted secretAccessor on DATABASE_URL to $SA_JOB"
}

main() {
  echo "▶ provisioning [$ENV] project=$PROJECT_ID"

  step "1/7 project"
  create_project

  step "2/7 billing"
  gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT" >/dev/null
  echo "billing linked"

  step "3/7 services"
  enable_services

  step "4/7 artifact registry"
  create_artifact_repo

  step "5/7 service accounts"
  create_service_accounts

  step "6/7 iam bindings"
  bind_iam

  step "7/7 secret access"
  require_secret

  echo ""
  echo "✔ [$ENV] provisioning complete"
}
main
