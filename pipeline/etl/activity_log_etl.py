import os   

import psycopg
import dotenv
import pandas as pd
import logging
from pathlib import Path
from google.cloud import bigquery

from utils.gcp import get_bigquery_client
from ddl.activity_log import ACTIVITY_TABLE_DDL, SCHEMA_DDL

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

logger = logging.getLogger(__name__)

BASE = Path(__file__).resolve().parent.parent   # pipeline/ 경로

dotenv.load_dotenv(BASE / ".env")
dotenv.load_dotenv(BASE / (".env.production" if os.getenv("ENV") == "production" else ".env.development"))
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