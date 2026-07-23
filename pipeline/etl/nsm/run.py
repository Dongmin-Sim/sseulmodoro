import os

from config import SQL_DIR
from utils.logger import get_logger, timed
from utils.gcp import get_bigquery_client, create_dataset, create_table_from_ddl_file
from ddl.raw import RAW_POMODORO_SESSIONS_TABLE_SCHEMA, RAW_ACTIVITY_LOG_TABLE_SCHEMA
from schema.sources import load_source_config, LoadMode

from .extract import extract_table
from .load import load_to_raw
from .transform import transform

logger = get_logger(__name__)


def prepare_schema(bq_client):
    create_dataset(bq_client, 'raw')
    create_dataset(bq_client, 'meta')
    create_table_from_ddl_file(bq_client, 'watermark_store', 'meta_watermark_store.sql')

    create_dataset(bq_client, 'stage')
    create_table_from_ddl_file(bq_client, 'activity_log_app_visited', 'stage_activity_log_app_visited.sql')

    create_dataset(bq_client, 'mart')
    create_table_from_ddl_file(bq_client, 'fact_pomodoro_sessions', 'mart_fact_pomodoro_sessions.sql')
    create_table_from_ddl_file(bq_client, 'active_user_daily', 'mart_active_user_daily.sql')
    create_table_from_ddl_file(bq_client, 'active_user_weekly', 'mart_active_user_weekly.sql')
    create_table_from_ddl_file(bq_client, 'agg_pomodoro_weekly', 'mart_agg_pomodoro_weekly.sql')
    create_table_from_ddl_file(bq_client, 'agg_nsm_weekly', 'mart_agg_nsm_weekly.sql')


def run_nsm() -> None:
    database_url = os.getenv("DATABASE_URL")
    bq_project = os.getenv("BQ_PROJECT")
    bq_client = get_bigquery_client(bq_project)
    project_id = bq_client.project

    source = load_source_config("app")

    with timed(logger, "run", "run"):
        prepare_schema(bq_client)

        extracted_df = [
            extract_table(database_url, src_tbl)
            for src_tbl in source.tables
        ]

        bigquery_raw_schemas = [RAW_ACTIVITY_LOG_TABLE_SCHEMA, RAW_POMODORO_SESSIONS_TABLE_SCHEMA]
        for src_tbl_name, bq_schema, df in zip(source.table_names, bigquery_raw_schemas, extracted_df):
            load_to_raw(bq_client, src_tbl_name, df, bq_schema, LoadMode.FULL) # TODO: mode는 소스 테이블 설정에 맞게 변경 필요

        # TODO: 실행 순서가 리스트 순서에 암묵 의존 — 문자열 기반이라 순서 실수에 취약. 의존성 명시화 필요
        tables = [
            (SQL_DIR / "stages/activity_log_app_visited.sql", f'{project_id}.stage.activity_log_app_visited'),

            (SQL_DIR / "marts/fact_pomodoro_sessions.sql", f'{project_id}.mart.fact_pomodoro_sessions'),
            (SQL_DIR / "marts/active_user_daily.sql", f'{project_id}.mart.active_user_daily'),
            (SQL_DIR / "marts/active_user_weekly.sql", f'{project_id}.mart.active_user_weekly'),

            (SQL_DIR / "marts/agg_pomodoro_weekly.sql", f'{project_id}.mart.agg_pomodoro_weekly'),
            (SQL_DIR / "marts/agg_nsm_weekly.sql", f'{project_id}.mart.agg_nsm_weekly'),
        ]
        transform(bq_client, tables)

