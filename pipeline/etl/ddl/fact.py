FACT_USER_DAILY_POMODORO_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS `{project_id}.fact.daily_user_pomodoro_completions` (
    user_id         STRING NOT NULL,
    event_date_kst  DATE NOT NULL
    OPTIONS(description="KST 기준 일자"),
    completions     INT64 NOT NULL,
    etl_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="ETL 적재 시각. full refresh 시 INSERT로 기록")
)
PARTITION BY    event_date_kst
CLUSTER BY      user_id
"""