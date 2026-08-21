CREATE OR REPLACE TABLE `{project_id}.mart.agg_pomodoro_weekly` (
    date_kst                DATE
    OPTIONS(description="KST 기준 날짜"),
    total_sessions          INT64
    OPTIONS(description="포모도로 세션 총수"),
    total_completions       INT64
    OPTIONS(description="포모도로 완료 총수"),
    total_target            INT64
    OPTIONS(description="포모도로 목표 총수"),
    etl_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="ETL 적재 시각. full refresh 시 INSERT로 기록")
)
PARTITION BY date_kst;

