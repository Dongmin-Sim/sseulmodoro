import os

import psycopg

import pandas as pd
from google.cloud import bigquery

from ddl.raw import RAW_ACTIVITY_LOG_TABLE_DDL
from utils.gcp import get_bigquery_client, create_dataset
from utils.logger import get_logger
from utils.env import load_env

load_env()
logger = get_logger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

def extract():
    """supabase에서 activity_log 테이블을 추출하여 Pandas Dataframe으로 반환
    """
    
    with psycopg.connect(DATABASE_URL) as conn:
        sql = """SELECT * FROM activity_log;"""
        df = pd.read_sql(sql, conn)
        logger.info(f"extracted {len(df)} rows")
    return df

def load(df):
    """supabase로부터 추출된 activity_log 레코드를 bigquer raw 데이터 셋에 업로드

    Args:
        df (_type_): Pandas Dataframe
    """
    # 전처리 
    df['created_at'] = df['created_at'].apply(lambda x: x.isoformat() if x is not None else None)
    records = df.to_dict(orient='records')
    
    client = get_bigquery_client()
    project_id = f"{client.project}"

    # raw dataset, activity_log 생성
    create_dataset(client, f'{project_id}.raw')
    
    table_ddl = RAW_ACTIVITY_LOG_TABLE_DDL.format(project_id=project_id)
    job = client.query(table_ddl)
    job.result()
    logger.info(f"table activity_log created: state={job.state}, errors={job.errors}")
    
    # load: supabase 에서 가져온 데이터를 gcp bigquery에 적재하기.
    table_id = f'{project_id}.raw.activity_log'
    job_config = bigquery.LoadJobConfig(write_disposition='WRITE_TRUNCATE')
    load_job = client.load_table_from_json(records, table_id, job_config=job_config)
    load_job.result()
    logger.info(f"loaded {load_job.output_rows} rows into {table_id}")

def extract_load():
    rows = extract()
    load(rows)


if __name__ == "__main__":
    extract_load()