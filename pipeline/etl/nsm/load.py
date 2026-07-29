import json

from google.cloud import bigquery
import pandas as pd

from schema.sources import SourceTable
from utils.logger import get_logger, timed

logger = get_logger(__name__)


def preprocessing(df: pd.DataFrame, table_name: str) -> pd.DataFrame:
    df = df.assign(user_id=df['user_id'].astype(str))

    if table_name == 'activity_log':
        df["metadata"] = df["metadata"].apply(lambda x: json.dumps(x) if x is not None else None)

    df["loaded_at"] = pd.Timestamp.now(tz='UTC')
    return df


def _load_df(
    client: bigquery.Client,
    tbl_name: str,
    df: pd.DataFrame,
    schema: list[bigquery.SchemaField],
    write_disposition: str,
    dataset: str = "raw",
) -> bigquery.LoadJob:
    job_config = bigquery.LoadJobConfig(
        schema=schema,
        write_disposition=write_disposition
    )
    load_job = client.load_table_from_dataframe(
        df, f"{client.project}.{dataset}.{tbl_name}", job_config=job_config
    )
    return load_job


def load_full(
    client: bigquery.Client,
    src_tbl: SourceTable,
    schema: list[bigquery.SchemaField],
    df: pd.DataFrame,
) -> None:
    with timed(logger, "load", "full-load", target=src_tbl.name) as t:
        load_job = _load_df(client, src_tbl.name, df, schema, "WRITE_TRUNCATE")
        load_job.result()
        t.add(rows=load_job.output_rows)

def _interval_query(backfill_key: str) -> str:
    return f"""
    WHERE {backfill_key} >= TIMESTAMP(@start)
    AND {backfill_key} < TIMESTAMP(@end) + INTERVAL 1 DAY
    """

def build_count_rows_query(client: bigquery.Client, src_tbl: SourceTable) -> str:
    query = f"""
        SELECT COUNT(*) FROM `{client.project}.raw.{src_tbl.name}` 
        {_interval_query(src_tbl.required_backfill_key)}"""
    return query


def build_incremental_delete_query(client: bigquery.Client, src_tbl: SourceTable) -> str:
    query = f"""
        DELETE FROM `{client.project}.raw.{src_tbl.name}`
        WHERE {src_tbl.required_incremental_key} > @since
        """
    return query


def build_backfill_delete_query(client: bigquery.Client, src_tbl: SourceTable) -> str:
    query = f"""
        DELETE FROM `{client.project}.raw.{src_tbl.name}`
        {_interval_query(src_tbl.required_backfill_key)}
        """
    return query


def build_merge_query(client: bigquery.Client, targ_tbl: SourceTable, schema: list[bigquery.SchemaField]) -> str:
    update_cols_str = ", ".join(f"t.{s.name} = s.{s.name}" for s in schema)

    query = f"""
        MERGE `{client.project}.raw.{targ_tbl.name}` as t
        USING `{client.project}._load_stage.{targ_tbl.name}` as s
            ON t.{targ_tbl.required_merge_key} = s.{targ_tbl.required_merge_key}
        WHEN MATCHED AND s.{targ_tbl.required_incremental_key} > t.{targ_tbl.required_incremental_key} THEN
            UPDATE SET
                {update_cols_str}
        WHEN NOT MATCHED THEN 
            INSERT ROW
        """
    return query


def load_incremental(
    client: bigquery.Client,
    src_tbl: SourceTable,
    schema: list[bigquery.SchemaField],
    df: pd.DataFrame,
    since: int,
) -> None:
    with timed(logger, "load", "incremental-load", target=src_tbl.name) as t:
        query = build_incremental_delete_query(client, src_tbl)
        job_config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("since", "INT64", since)]
        )
        client.query(query, job_config=job_config).result()
        load_job = _load_df(client, src_tbl.name, df, schema, "WRITE_APPEND")
        load_job.result()
        t.add(rows=load_job.output_rows)


def load_backfill(
    client: bigquery.Client,
    src_tbl: SourceTable,
    schema: list[bigquery.SchemaField],
    df: pd.DataFrame,
    start: str,
    end: str
) -> None:
    with timed(logger, "load", "backfill-load", target=src_tbl.name) as t:
        query = build_backfill_delete_query(client, src_tbl)
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("start", "STRING", start),
                bigquery.ScalarQueryParameter("end", "STRING", end),
            ]
        )
        client.query(query, job_config=job_config).result()
        load_job = _load_df(client, src_tbl.name, df, schema, "WRITE_APPEND")
        load_job.result()
        t.add(rows=load_job.output_rows)


def load_upsert(
    client: bigquery.Client,
    src_tbl: SourceTable,
    schema: list[bigquery.SchemaField],
    df: pd.DataFrame,
) -> None:
    with timed(logger, "load", "incremental-upsert", target=src_tbl.name) as t:
        load_job = _load_df(client, src_tbl.name, df, schema, "WRITE_TRUNCATE", "_load_stage")
        load_job.result()
        t.add(rows=load_job.output_rows)

        query = build_merge_query(client, src_tbl, schema)
        query_job_config = bigquery.QueryJobConfig()
        client.query(query, job_config=query_job_config).result()


def count_backfill_target_rows(backfill_table: SourceTable, bq_client: bigquery.Client, start_date: str, end_date: str) -> int:
    with timed(logger, "load", "backfill-count", target=backfill_table.name) as t:
        query = build_count_rows_query(bq_client, backfill_table)
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("start", "STRING", start_date),
                bigquery.ScalarQueryParameter("end", "STRING", end_date),
            ]
        )
        rows = bq_client.query(query, job_config=job_config).result()
        row = next(iter(rows))
        total_rows = int(row[0])
        t.add(rows=total_rows)
        return total_rows
