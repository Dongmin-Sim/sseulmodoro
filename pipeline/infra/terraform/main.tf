terraform {
  required_version = ">= 1.5"
  backend "gcs" {}
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 7.0"
    }
  }
}

locals {
  service_identities = [
    "workflows.googleapis.com",
    "cloudbuild.googleapis.com",
  ]

  service_accounts_info = {
    job       = { account_id = "pipeline-runner", display_name = "Pipeline Job Runner (BigQuery)" }
    scheduler = { account_id = "pipeline-scheduler", display_name = "Pipeline Scheduler Invoker" }
    workflow  = { account_id = "pipeline-orchestrator", display_name = "Pipeline Workflow Orchestrator" }
    deployer  = { account_id = "pipeline-deployer", display_name = "Pipeline Deployer (CI/CD)" }
  }

  project_roles = {
    job       = ["roles/bigquery.jobUser", "roles/bigquery.dataEditor"]
    scheduler = ["roles/workflows.invoker"]
    workflow  = ["roles/run.jobsExecutorWithOverrides", "roles/run.viewer", "roles/logging.logWriter"]
    deployer  = ["roles/run.developer", "roles/artifactregistry.writer", "roles/logging.logWriter"]
  }

  schedules = {
    daily  = { cron = "0 4 * * 0,2,3,4,5,6", tables = ["activity_log"] }
    monday = { cron = "0 4 * * 1", tables = ["activity_log", "pomodoro_sessions"] }
  }
}

provider "google" {
  region = var.region
}

provider "google-beta" {
  region = var.region
}

resource "google_project_service_identity" "agents" {
  provider = google-beta
  for_each = toset(local.service_identities)

  depends_on = [google_project_service.services]

  project = google_project.project.project_id
  service = each.value
}

resource "google_project" "project" {
  name            = var.project_name
  project_id      = var.project_id
  org_id          = var.organization_id
  billing_account = var.billing_account
  deletion_policy = "PREVENT"
}

resource "google_project_service" "services" {
  for_each           = toset(var.services)
  project            = google_project.project.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "tfstate" {
  project                     = google_project.project.project_id
  name                        = "${var.project_id}-tfstate"
  location                    = var.region
  force_destroy               = false
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_artifact_registry_repository" "repo" {
  depends_on    = [google_project_service.services["artifactregistry.googleapis.com"]]
  project       = google_project.project.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = "pipeline docker image repository"
  format        = "DOCKER"
}

resource "google_service_account" "sa" {
  for_each = local.service_accounts_info

  project      = google_project.project.project_id
  account_id   = each.value.account_id
  display_name = each.value.display_name
}

resource "google_project_iam_member" "job" {
  for_each = toset(local.project_roles.job)

  project = google_project.project.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sa["job"].email}"
}

resource "google_project_iam_member" "scheduler" {
  for_each = toset(local.project_roles.scheduler)

  project = google_project.project.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sa["scheduler"].email}"
}

resource "google_project_iam_member" "workflow" {
  for_each = toset(local.project_roles.workflow)

  project = google_project.project.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sa["workflow"].email}"
}

resource "google_project_iam_member" "deployer" {
  for_each = toset(local.project_roles.deployer)

  project = google_project.project.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.sa["deployer"].email}"
}

resource "google_service_account_iam_member" "deployer_act_as" {
  for_each = toset(["job", "workflow", "scheduler"])

  service_account_id = google_service_account.sa[each.value].name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.sa["deployer"].email}"
}

resource "google_secret_manager_secret" "database_url" {
  depends_on = [google_project_service.services["secretmanager.googleapis.com"]]
  project    = google_project.project.project_id
  secret_id  = "DATABASE_URL"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_iam_member" "job_accessor" {
  project   = google_project.project.project_id
  secret_id = google_secret_manager_secret.database_url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.sa["job"].email}"
}

resource "google_secret_manager_secret" "github_pat" {
  depends_on = [google_project_service.services["secretmanager.googleapis.com"]]
  project    = google_project.project.project_id
  secret_id  = "GITHUB_PAT"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_iam_member" "build_accessor" {
  depends_on = [google_project_service_identity.agents["cloudbuild.googleapis.com"]]

  project   = google_project.project.project_id
  secret_id = google_secret_manager_secret.github_pat.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:service-${google_project.project.number}@gcp-sa-cloudbuild.iam.gserviceaccount.com"
}

resource "google_cloudbuildv2_connection" "github" {
  depends_on = [
    google_project_service.services["cloudbuild.googleapis.com"],
    google_secret_manager_secret_iam_member.build_accessor,
  ]

  location = var.region
  project  = google_project.project.project_id
  name     = "github-repo-connection"

  github_config {
    app_installation_id = var.github_app_installation_id
    authorizer_credential {
      oauth_token_secret_version = "${google_secret_manager_secret.github_pat.id}/versions/latest"
    }
  }
}

resource "google_cloudbuildv2_repository" "sseulmodoro" {
  location          = var.region
  project           = google_project.project.project_id
  name              = var.git_repository_name
  parent_connection = google_cloudbuildv2_connection.github.name
  remote_uri        = var.git_repository_remote_uri
}

resource "google_cloudbuild_trigger" "repo-deploy-trigger" {
  location = var.region
  project  = google_project.project.project_id
  name     = "pipeline-deploy-${var.env}"

  repository_event_config {
    repository = google_cloudbuildv2_repository.sseulmodoro.id
    push {
      branch = var.trigger_branch
    }
  }

  filename        = "pipeline/cloudbuild.yaml"
  included_files  = ["pipeline/**"]
  service_account = google_service_account.sa["deployer"].id

  substitutions = {
    _REPO     = var.repository_id
    _SA_JOB   = google_service_account.sa["job"].email
    _REGION   = var.region
    _JOB_NAME = var.job_name
  }
}

data "google_monitoring_notification_channel" "slack" {
  count = var.enable_alerts ? 1 : 0

  project      = google_project.project.project_id
  display_name = var.slack_display_name
}

resource "google_monitoring_alert_policy" "pipeline_fail" {
  count = var.enable_alerts ? 1 : 0

  project      = google_project.project.project_id
  display_name = "pipeline_fail"
  combiner     = "OR"
  enabled      = true
  severity     = "CRITICAL"

  documentation {
    content   = "${var.job_name} 파이프라인 실패 감지"
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "${var.job_name} status=fail"

    condition_matched_log {
      filter = "resource.type=\"cloud_run_job\" resource.labels.job_name=\"${var.job_name}\" jsonPayload.status=\"fail\""
    }
  }

  alert_strategy {
    auto_close = "3600s"

    notification_rate_limit {
      period = "300s"
    }
  }

  notification_channels = [data.google_monitoring_notification_channel.slack[0].name]
}

resource "google_monitoring_alert_policy" "pipeline_empty_mart" {
  count = var.enable_alerts ? 1 : 0

  project      = google_project.project.project_id
  display_name = "pipeline_empty_mart"
  combiner     = "OR"
  enabled      = true
  severity     = "WARNING"

  documentation {
    content   = "${var.job_name} 파이프라인 성공했으나 최종 Mart(agg_nsm_weekly)가 0행인 경우"
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "agg_nsm_weekly rows=0"

    condition_matched_log {
      filter = "resource.type=\"cloud_run_job\" resource.labels.job_name=\"${var.job_name}\" jsonPayload.event=\"transform_end\" jsonPayload.status=\"success\" jsonPayload.target=\"${google_project.project.project_id}.mart.agg_nsm_weekly\" jsonPayload.rows=0"
    }
  }

  alert_strategy {
    auto_close = "3600s"

    notification_rate_limit {
      period = "300s"
    }
  }

  notification_channels = [data.google_monitoring_notification_channel.slack[0].name]
}

resource "google_workflows_workflow" "pipeline_workflow" {
  depends_on = [google_project_service_identity.agents["workflows.googleapis.com"]]

  project             = google_project.project.project_id
  region              = var.region
  name                = var.workflow_name
  service_account     = google_service_account.sa["workflow"].id
  source_contents     = file("${path.module}/../workflow.yaml")
  deletion_protection = false

  user_env_vars = {
    job_name     = var.job_name
    job_location = var.region
  }
}

resource "google_cloud_scheduler_job" "pipeline_scheduler" {
  depends_on = [google_project_service.services["cloudscheduler.googleapis.com"]]

  for_each = { for name, s in local.schedules : name => s if var.enable_scheduler }

  project   = google_project.project.project_id
  region    = var.region
  name      = "${var.workflow_name}-${each.key}"
  schedule  = each.value.cron
  time_zone = "Asia/Seoul"

  http_target {
    uri         = "https://workflowexecutions.googleapis.com/v1/projects/${google_project.project.project_id}/locations/${var.region}/workflows/${google_workflows_workflow.pipeline_workflow.name}/executions"
    http_method = "POST"
    headers     = { "Content-Type" = "application/json" }

    body = base64encode(jsonencode({
      argument = jsonencode({ tables = each.value.tables })
    }))

    oauth_token {
      service_account_email = google_service_account.sa["scheduler"].email
    }
  }
}
