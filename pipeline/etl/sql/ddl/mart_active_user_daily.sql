CREATE OR REPLACE TABLE `{project_id}.mart.active_user_daily` (
    date_kst                DATE
    OPTIONS(description="KST 기준 날짜"),
    active_user_count       INT64
    OPTIONS(description="활성 사용자 수"),
    etl_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="ETL 적재 시각. full refresh 시 INSERT로 기록")
)
PARTITION BY date_kst;
