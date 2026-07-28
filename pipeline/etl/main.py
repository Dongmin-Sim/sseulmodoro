import os

from context import AppContext
from ddl.raw import RAW_SCHEMAS
from nsm import run_nsm
from schema.sources import load_source_config
from utils.env import load_env
from utils.gcp import get_bigquery_client
from utils.logger import get_logger, setup_logger

logger = get_logger(__name__)


def _validate_database_url(database_url: str | None) -> str:
    if database_url is None:
        logger.error(
            "DATABASE_URL not set",
            extra={"stage": "extract", "event": "extract_error", "status": "fail"},
        )
        raise RuntimeError("DATABASE_URL not set")

    return database_url


def _build_app_context() -> AppContext:
    src_db_url = _validate_database_url(
        os.getenv("DATABASE_URL")
    )
    bq_project = os.getenv("BQ_PROJECT")
    bq_client = get_bigquery_client(bq_project)
    source_schema = load_source_config("app")
    bigquery_schema = RAW_SCHEMAS

    return AppContext(
        source_database_url=src_db_url,
        bigquery_project=bq_client.project,
        bigquery_client=bq_client,
        source_schema=source_schema,
        bigquery_schema=bigquery_schema
    )


if __name__ == "__main__":
    load_env()
    setup_logger()
    # TODO: 환경변수 인자 받기. 여기서 백필 분기, 현재 플레이스 홀더
    app_context = _build_app_context()
    run_nsm(app_context)
