from pathlib import Path

from google.cloud import bigquery

from utils.env import load_env
from utils.logger import get_logger
from utils.gcp import get_bigquery_client

load_env()
logger = get_logger(__name__)

def transform(client, file_path, table_name):
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


if __name__ == '__main__':
    SQL_DIR = Path(__file__).parent / "sql"
    
    bq_client = get_bigquery_client()
    project_id = f'{bq_client.project}'
    logger.info(f"starting transformation for project: {project_id}")

    # 순차 수행.
    file_paths = [SQL_DIR / "raw_to_fact.sql", SQL_DIR / "fact_to_mart.sql"]
    table_names = [f'{project_id}.fact.daily_user_pomodoro_completions', f'{project_id}.mart.weekly_nsm']

    for file, table in zip(file_paths, table_names):
        transform(bq_client, file, table)
    