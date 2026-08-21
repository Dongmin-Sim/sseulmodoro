from pathlib import Path

from config import SQL_DIR
from google.cloud import bigquery
from utils.logger import get_logger, timed

logger = get_logger(__name__)


def execute_sql_query(client: bigquery.Client, file_path: Path, table_name: str) -> None:
    with timed(logger, "transform", "transform", target=table_name) as t:
        with open(file_path, "r", encoding="utf-8") as f:
            sql_query = f.read()
            logger.debug(f"Read sql query from {file_path}")

        job_config = bigquery.QueryJobConfig(
            destination=table_name,
            write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE_DATA
        )

        query_job = client.query(
            sql_query,
            job_config=job_config
        )
        result = query_job.result()
        t.add(rows=result.total_rows)


def transform(bq_client: bigquery.Client) -> None:
    project_id = bq_client.project

    # TODO: 실행 순서가 리스트 순서에 암묵 의존 — 문자열 기반이라 순서 실수에 취약. 의존성 명시화 필요
    tables = [
        (SQL_DIR / "stages/activity_log_app_visited.sql", f'{project_id}.stage.activity_log_app_visited'),

        (SQL_DIR / "marts/fact_pomodoro_sessions.sql", f'{project_id}.mart.fact_pomodoro_sessions'),
        (SQL_DIR / "marts/active_user_daily.sql", f'{project_id}.mart.active_user_daily'),
        (SQL_DIR / "marts/active_user_weekly.sql", f'{project_id}.mart.active_user_weekly'),

        (SQL_DIR / "marts/agg_pomodoro_weekly.sql", f'{project_id}.mart.agg_pomodoro_weekly'),
        (SQL_DIR / "marts/agg_nsm_weekly.sql", f'{project_id}.mart.agg_nsm_weekly'),
    ]

    for file, table in tables:
        execute_sql_query(bq_client, file, table)
