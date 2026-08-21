variable "billing_account" {
  type        = string
  description = "결제 계정"
}

variable "project_id" {
  type        = string
  description = "프로젝트 ID"
}

variable "project_name" {
  type        = string
  description = "프로젝트 name"
}

variable "organization_id" {
  type        = string
  description = "조직 ID"
}

variable "services" {
  type        = list(string)
  description = "gcp 서비스"
  default = [
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
    "run.googleapis.com",
    "workflows.googleapis.com",
    "workflowexecutions.googleapis.com",
    "monitoring.googleapis.com",
  ]
}

variable "region" {
  type        = string
  description = "region"
}

variable "repository_id" {
  type        = string
  description = "docker image repository ID"
}

variable "env" {
  type        = string
  description = "환경 이름 (dev | prod)"
}

variable "trigger_branch" {
  type        = string
  description = "빌드 트리거가 감시할 브랜치 패턴"
}

variable "enable_scheduler" {
  type        = bool
  description = "정기 실행 크론 생성 여부"
}

variable "enable_alerts" {
  type        = bool
  description = "Slack 알림 정책 생성 여부 (채널이 프로젝트에 등록돼 있어야 한다)"
}

variable "github_app_installation_id" {
  type        = string
  description = "GitHub Cloud Build App 설치 ID"
}

variable "git_repository_name" {
  type        = string
  description = "Cloud Build v2 repository 리소스 이름"
}

variable "git_repository_remote_uri" {
  type        = string
  description = "GitHub clone HTTPS URI"
}

variable "workflow_name" {
  type        = string
  description = "Cloud Workflow 이름"
}

variable "job_name" {
  type        = string
  description = "Cloud Run job 이름 (알림 필터 대상)"
}

variable "slack_display_name" {
  type        = string
  description = "Slack 알림 채널 이름"
}
