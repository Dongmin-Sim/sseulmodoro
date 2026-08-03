from functools import partial

from context import AppContext, BackfillConfig, BigqueryContext
from google.cloud.bigquery import Client, SchemaField
from schema.sources import LoadMode, SourceTable, prepare_schema
from utils.logger import get_logger, timed
from watermark import read_watermark, update_watermark

from .extract import extract_backfill, extract_full, extract_incremental
from .load import (
    count_backfill_target_rows,
    load_backfill,
    load_full,
    load_incremental_append,
    load_incremental_upsert,
    preprocessing,
)
from .transform import transform

logger = get_logger(__name__)


def _run_full(bq_client: Client, src_db_url: str, src_tbl: SourceTable, tbl_schema: list[SchemaField]) -> None:
    df = extract_full(src_db_url, src_tbl)
    preproc_df = preprocessing(df, src_tbl.name)
    load_full(bq_client, src_tbl, tbl_schema, preproc_df)


def _run_incremental(bq_client: Client, src_db_url: str, src_tbl: SourceTable, tbl_schema: list[SchemaField], load_step) -> None:
    since = read_watermark(bq_client, src_tbl.name)
    if since is None:
        df = extract_full(src_db_url, src_tbl)
    else:
        df = extract_incremental(src_db_url, src_tbl, since)

    if df.empty:
        return
    preproc_df = preprocessing(df, src_tbl.name)

    if since is None:
        load_full(bq_client, src_tbl, tbl_schema, preproc_df)
    else:
        load_step(bq_client, src_tbl, tbl_schema, preproc_df, since)
    new_since = str(preproc_df[src_tbl.required_incremental_key].max())
    update_watermark(bq_client, src_tbl.name, new_since)


HANDLERS = {
    LoadMode.FULL: _run_full,
    LoadMode.INCREMENTAL_APPEND: partial(_run_incremental, load_step=load_incremental_append),
    LoadMode.INCREMENTAL_UPSERT: partial(_run_incremental, load_step=load_incremental_upsert),
}


def run_batch(app_context: AppContext) -> None:
    bq_client = app_context.bigquery_client
    source = app_context.source_schema
    src_db_url = app_context.source_database_url
    bq_schema = app_context.bigquery_schema

    with timed(logger, "run", "run"):
        prepare_schema(bq_client)

        for src_tbl in source.tables:
            tbl_schema = bq_schema[src_tbl.name]
            HANDLERS[src_tbl.load_mode](bq_client, src_db_url, src_tbl, tbl_schema)


def run_backfill(app_context: AppContext, backfill_config: BackfillConfig) -> None:
    bq_client = app_context.bigquery_client
    source = app_context.source_schema
    src_db_url = app_context.source_database_url
    bq_schema = app_context.bigquery_schema

    backfill_tbl_name = backfill_config.table_name
    start_date = backfill_config.start_date
    end_date = backfill_config.end_date

    with timed(logger, "run", "backfill"):
        backfill_table = source.find_source_table(backfill_tbl_name)

        if backfill_table is None:
            raise RuntimeError("backfill table not found")

        df = extract_backfill(src_db_url, backfill_table, start_date, end_date)
        proc_df = preprocessing(df, backfill_table.name)

        delete_count = count_backfill_target_rows(backfill_table, bq_client, start_date, end_date)
        if delete_count > len(df):
            raise RuntimeError(
                f"{backfill_table.name}: rows to delete ({delete_count}) exceed rows to insert ({len(df)}) "
                f"for range {start_date}~{end_date}. Check the backfill range before deleting."
            )

        load_backfill(bq_client, backfill_table, bq_schema[backfill_table.name], proc_df, start_date, end_date)


def run_transform(bq_context: BigqueryContext) -> None:
    bq_client = bq_context.bigquery_client

    with timed(logger, "run", "transform"):
        prepare_schema(bq_client)
        transform(bq_client)
