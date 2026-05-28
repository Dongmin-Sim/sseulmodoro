import os

import psycopg

import pandas as pd
from google.cloud import bigquery

from ddl.activity_log import ACTIVITY_TABLE_DDL, SCHEMA_DDL
from utils.gcp import get_bigquery_client
from utils.logger import get_logger
from utils.env import load_env

load_env()
logger = get_logger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

def extract():
    # extract: supabase 에서 데이터 가져오기 
    with psycopg.connect(DATABASE_URL) as conn:
        sql = """SELECT * FROM activity_log;"""
        df = pd.read_sql(sql, conn)
        logger.info(f"extracted {len(df)} rows")
    return df

def load(df):
    # 전처리 
    df['created_at'] = df['created_at'].apply(lambda x: x.isoformat() if x is not None else None)
    records = df.to_dict(orient='records')
    
    # load: supabase 에서 가져온 데이터를 gcp bigquery에 적재하기.
    client = get_bigquery_client()
    project_id = f"{client.project}"

    # 기존 dataset_table 있는지 확인
    # dataset 생성
    schema_id = f'{project_id}.etl'
    schema_ddl = SCHEMA_DDL.format(schema_id=schema_id)

    job = client.query(schema_ddl)
    job.result()
    logger.info(f"schema {schema_id} created: state={job.state}, errors={job.errors}")

    table_id = f'{schema_id}.activity_log'
    table_ddl = ACTIVITY_TABLE_DDL.format(table_id=table_id)

    job = client.query(table_ddl)
    job.result()
    logger.info(f"table {table_id} created: state={job.state}, errors={job.errors}")

    # 테이블 로드
    job_config = bigquery.LoadJobConfig(write_disposition='WRITE_TRUNCATE')
    load_job = client.load_table_from_json(records, table_id, job_config=job_config)
    load_job.result()
    logger.info(f"loaded {load_job.output_rows} rows into {table_id}")

def process():
    rows = extract()
    load(rows)


if __name__ == "__main__":
    process()