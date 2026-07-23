import os

from google.cloud import bigquery

from config import SQL_DIR
from watermark import read_watermark, update_watermark
from utils.logger import get_logger, timed
from utils.gcp import get_bigquery_client, create_dataset, create_table_from_ddl_file
from ddl.raw import RAW_SCHEMAS
from schema.sources import load_source_config

from .extract import extract_full, extract_incremental
from .load import load_full, load_incremental, preprocessing
from .transform import transform

logger = get_logger(__name__)


def prepare_schema(bq_client: bigquery.Client) -> None:
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

def require_database_url(database_url: str | None) -> str:
    if database_url is None:
        logger.error(
            "DATABASE_URL not set",
            extra={"stage": "extract", "event": "extract_error", "status": "fail"},
        )
        raise RuntimeError("DATABASE_URL not set")

    return database_url

def run_nsm() -> None:
    database_url = require_database_url(os.getenv("DATABASE_URL"))
    bq_project = os.getenv("BQ_PROJECT")
    bq_client = get_bigquery_client(bq_project)

    source = load_source_config("app")

    with timed(logger, "run", "run"):
        prepare_schema(bq_client)

        for src_tbl in source.tables:
            bq_schema = RAW_SCHEMAS[src_tbl.name]

            if src_tbl.is_incremental:
                since = read_watermark(bq_client, src_tbl.name) or 0
                df = extract_incremental(database_url, src_tbl, since)
                if df.empty: continue

                preproc_df = preprocessing(df, src_tbl.name)
                load_incremental(bq_client, src_tbl, bq_schema, preproc_df, since)

                new_since = int(preproc_df[src_tbl.required_incremental_key].max())
                update_watermark(bq_client, src_tbl.name, new_since)
            else:
                df = extract_full(database_url, src_tbl)
                preproc_df = preprocessing(df, src_tbl.name)
                load_full(bq_client, src_tbl, bq_schema, preproc_df)


        # TODO: 실행 순서가 리스트 순서에 암묵 의존 — 문자열 기반이라 순서 실수에 취약. 의존성 명시화 필요
        project_id = bq_client.project
        tables = [
            (SQL_DIR / "stages/activity_log_app_visited.sql", f'{project_id}.stage.activity_log_app_visited'),

            (SQL_DIR / "marts/fact_pomodoro_sessions.sql", f'{project_id}.mart.fact_pomodoro_sessions'),
            (SQL_DIR / "marts/active_user_daily.sql", f'{project_id}.mart.active_user_daily'),
            (SQL_DIR / "marts/active_user_weekly.sql", f'{project_id}.mart.active_user_weekly'),

            (SQL_DIR / "marts/agg_pomodoro_weekly.sql", f'{project_id}.mart.agg_pomodoro_weekly'),
            (SQL_DIR / "marts/agg_nsm_weekly.sql", f'{project_id}.mart.agg_nsm_weekly'),
        ]
        transform(bq_client, tables)

