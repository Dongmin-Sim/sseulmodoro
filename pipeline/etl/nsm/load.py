from google.cloud import bigquery
import pandas as pd

from utils.logger import get_logger
from ddl.raw import RAW_POMODORO_SESSIONS_TABLE_SCHEMA

logger = get_logger(__name__)


def load_to_raw(client, table_name, df):
    """supabase로부터 추출된 activity_log 레코드를 bigquery raw 데이터 셋에 업로드

    Args:
        df (_type_): Pandas Dataframe
        :param client: BigQuery client
        :param table_name: 적재할 테이블 명
        :param df: 적재 대상 데이터프레임
    """
    # 전처리
    df['user_id'] = df['user_id'].astype(str)
    df['created_at'] = df['created_at'].apply(lambda x: x.isoformat() if x is not None else None)
    records = df.to_dict(orient='records')

    # load: supabase 에서 가져온 데이터를 gcp bigquery에 적재하기.
    table_id = f'{client.project}.raw.{table_name}'
    job_config = bigquery.LoadJobConfig(write_disposition='WRITE_TRUNCATE')
    load_job = client.load_table_from_json(records, table_id, job_config=job_config)
    load_job.result()
    logger.info(f"loaded {load_job.output_rows} rows into {table_id}")

def preprocess_pomodoro_sessions(df: pd.DataFrame)-> pd.DataFrame:
    return df.assign(user_id=df['user_id'].astype(str))

def load_pomodoro_sessions(client, table_name, df):
    """supabase로부터 추출된 pomodoro_sessions 테이블을 bigquery raw 데이터 셋에 업로드

        Args:
            df (_type_): Pandas Dataframe
            :param client: BigQuery client
            :param table_name: 적재할 테이블 명
            :param df: 적재 대상 데이터프레임
        """
    df["loaded_at"] = pd.Timestamp.now(tz='UTC')

    table_id = f'{client.project}.raw.{table_name}'
    job_config = bigquery.LoadJobConfig(
        schema=RAW_POMODORO_SESSIONS_TABLE_SCHEMA,
        write_disposition="WRITE_TRUNCATE"
    )
    load_job = client.load_table_from_dataframe(df, table_id, job_config=job_config)
    load_job.result()
    logger.info(f"loaded {load_job.output_rows} rows into {table_id}")