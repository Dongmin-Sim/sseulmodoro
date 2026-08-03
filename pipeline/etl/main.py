import argparse
import os
from datetime import datetime

from context import AppContext, BackfillConfig, BigqueryContext
from ddl.raw import RAW_SCHEMAS
from nsm import run_backfill, run_batch, run_transform
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


def _build_bigquery_context() -> BigqueryContext:
    bq_project = os.getenv("BQ_PROJECT")
    bq_client = get_bigquery_client(bq_project)
    bigquery_schema = RAW_SCHEMAS

    return BigqueryContext(
        bigquery_client=bq_client,
        bigquery_schema=bigquery_schema,
    )


def _build_app_context() -> AppContext:
    src_db_url = _validate_database_url(os.getenv("DATABASE_URL"))
    source_schema = load_source_config("app")

    return AppContext(
        source_database_url=src_db_url,
        source_schema=source_schema,
        bigquery_context=_build_bigquery_context(),
    )


def _build_backfill_config(args: argparse.Namespace) -> BackfillConfig:
    return BackfillConfig(
        start_date=args.start_date,
        end_date=args.end_date,
        table_name=args.table_name,
    )


# TODO: 추후 datetime 타입으로 반환하도록 변경 필요. 내부의 str -> datetime 변환 로직 대체 예정
def _valid_args_date(s: str) -> str:
    try:
        parsed = datetime.strptime(s, "%Y-%m-%d")
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"input date '{s}' does not match format '%Y-%m-%d'"
        ) from None

    if parsed.strftime("%Y-%m-%d") != s:
        raise argparse.ArgumentTypeError(
            f"input date '{s}' must be zero-padded in YYYY-MM-DD format"
        )
    return s


def _run(args: argparse.Namespace) -> None:
    run_batch(_build_app_context())


def _run_backfill(args: argparse.Namespace) -> None:
    backfill_config = _build_backfill_config(args)
    app_context = _build_app_context()

    run_backfill(app_context, backfill_config)


def _run_transform(args: argparse.Namespace) -> None:
    bigquery_context = _build_bigquery_context()
    run_transform(bigquery_context)


def build_args_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    command_sub = parser.add_subparsers(dest="command", required=True)

    run_p = command_sub.add_parser("run")
    run_p.set_defaults(func=_run)

    backfill_p = command_sub.add_parser("backfill")
    backfill_p.add_argument("--start-date", type=_valid_args_date, required=True)
    backfill_p.add_argument("--end-date", type=_valid_args_date, required=True)
    backfill_p.add_argument("--table-name", required=True)
    backfill_p.set_defaults(func=_run_backfill)

    transform_p = command_sub.add_parser("transform")
    transform_p.set_defaults(func=_run_transform)

    return parser


def main(argv=None) -> None:
    parser = build_args_parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    load_env()
    setup_logger()
    main()
