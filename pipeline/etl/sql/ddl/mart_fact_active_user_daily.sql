CREATE TABLE IF NOT EXISTS `{project_id}.mart.fact_active_user_daily` (
    user_id                     STRING
    OPTIONS(description="사용자 uuid"),
    activity_date_kst           DATE
    OPTIONS(description="접속 활성화 일자"),
    etl_at                      TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="ETL 적재 시각. full refresh 시 INSERT로 기록")
)
PARTITION BY activity_date_kst
CLUSTER BY user_id;
