from typing import List
from google.cloud import bigquery
from utils.logger import get_logger, timed

logger = get_logger(__name__)

def execute_sql_query(client, file_path, table_name) -> None:
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


def transform(bq_client, tables: List[tuple]) -> None:
    for file, table in tables:
        execute_sql_query(bq_client, file, table)
