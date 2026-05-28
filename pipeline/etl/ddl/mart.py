MART_DATASETS_DDL = """
CREATE SCHEMA IF NOT EXISTS `{project_id}.mart`
"""

MART_WEEKLY_NSM_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS `{project_id}.mart.weekly_nsm` (
    week_kst            DATE NOT NULL
    OPTIONS(description="KST 기준 ISO 주 시작일 (월요일)"),
    nsm                 FLOAT64 NOT NULL,
    total_completions   INT64 NOT NULL,
    active_user_count   INT64 NOT NULL,
    etl_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="최신 ETL 갱신 시각. MERGE WHEN MATCHED 시에도 갱신")
)
"""