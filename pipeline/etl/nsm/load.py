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
) -> bigquery.LoadJob:
    job_config = bigquery.LoadJobConfig(
        schema=schema,
        write_disposition=write_disposition
    )
    load_job = client.load_table_from_dataframe(
        df,
        f'{client.project}.raw.{tbl_name}',
        job_config=job_config
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


def load_incremental(
    client: bigquery.Client,
    src_tbl: SourceTable,
    schema: list[bigquery.SchemaField],
    df: pd.DataFrame,
    since: int,
) -> None:
    with timed(logger, "load", "incremental-load", target=src_tbl.name) as t:
        query = f"""
        DELETE FROM `{client.project}.raw.{src_tbl.name}` 
        WHERE {src_tbl.required_incremental_key} > @since
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("since", "INT64", since)]
        )
        client.query(query, job_config=job_config).result()
        load_job = _load_df(client, src_tbl.name, df, schema, "WRITE_APPEND")
        load_job.result()
        t.add(rows=load_job.output_rows)
