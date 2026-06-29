CREATE TABLE IF NOT EXISTS `{project_id}.mart.fact_pomodoro_sessions` (
    session_id          INT64,
    user_id             STRING,
    started_at          TIMESTAMP
    OPTIONS(description="세션 시작 시각"),
    target              INT64
    OPTIONS(description="세션당 포모도로 목표 수"),
    completed           INT64
    OPTIONS(description="세션당 포모도로 완료 수"),
    status              STRING
    OPTIONS(description="포모도로 세션 상태"),
    etl_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="ETL 적재 시각. full refresh 시 INSERT로 기록")
)
PARTITION BY TIMESTAMP_TRUNC(started_at, DAY)
CLUSTER BY user_id;