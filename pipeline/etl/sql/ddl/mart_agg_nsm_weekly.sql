CREATE TABLE IF NOT EXISTS `{project_id}.mart.agg_nsm_weekly` (
    week_kst                DATE
    OPTIONS(description="KST 기준 주"),
    completions_per_user    FLOAT64
    OPTIONS(description="NSM 활성 사용자별 평균 완료 포모도로 수"),
    sessions_per_user       FLOAT64
    OPTIONS(description="활성 사용자별 평균 포모도로 세션 수"),
    target_per_session      FLOAT64
    OPTIONS(description="세션당 평균 목표 수"),
    completion_rate         FLOAT64
    OPTIONS(description="목표 대비 완료율"),
    active_user_count       INT64
    OPTIONS(description="활성 사용자 수"),
    total_sessions          INT64
    OPTIONS(description="포모도로 세션 총수"),
    total_completions       INT64
    OPTIONS(description="포모도로 완료 총수"),
    total_target            INT64
    OPTIONS(description="포모도로 목표 총수"),
    etl_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="ETL 적재 시각. full refresh 시 INSERT로 기록")
)
PARTITION BY week_kst;

