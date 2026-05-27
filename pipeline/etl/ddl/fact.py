FACT_DATASETS_DDL = """
CREATE SCHEMA IF NOT EXISTS `{project_id}.fact`
"""

FACT_USER_DAILY_POMODORO_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS `{project_id}.fact.daily_user_pomodoro_completions` (
    user_id         STRING NOT NULL,
    event_date_kst  DATE NOT NULL
    OPTIONS(description="KST 기준 일자"),
    completions     INT64 NOT NULL,
    etl_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="최신 ETL 갱신 시각. MERGE WHEN MATCHED 시에도 갱신")
)
PARTITION BY    event_date_kst
CLUSTER BY      user_id
OPTIONS(
    require_partition_filter=true
)
"""