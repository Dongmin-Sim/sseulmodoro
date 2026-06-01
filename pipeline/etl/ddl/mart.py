MART_WEEKLY_NSM_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS `{project_id}.mart.weekly_nsm` (
    week_kst            DATE NOT NULL
    OPTIONS(description="KST 기준 ISO 주 시작일 (월요일)"),
    nsm                 FLOAT64 NOT NULL,
    total_completions   INT64 NOT NULL,
    active_user_count   INT64 NOT NULL,
    etl_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="ETL 적재 시각. full refresh 시 INSERT로 기록")
)
"""