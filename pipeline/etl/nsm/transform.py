from typing import List
from google.cloud import bigquery
from utils.logger import get_logger

logger = get_logger(__name__)

def execute_sql_query(client, file_path, table_name) -> None:
    with open(file_path, "r", encoding="utf-8") as f:
        sql_query = f.read()
        logger.info(f"read sql query from {file_path}")
    
    job_config = bigquery.QueryJobConfig(
        destination=table_name,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE_DATA
    )
    
    query_job = client.query(
        sql_query, 
        job_config=job_config
    )
    rows = query_job.result()
    logger.info(f"transformed {rows.total_rows} rows into {table_name}: state={query_job.state}, errors={query_job.errors}")

def transform(bq_client, tables: List[tuple]) -> None:
    logger.info(f"starting transformation for project: {bq_client.project}")

    for file, table in tables:
        execute_sql_query(bq_client, file, table)
