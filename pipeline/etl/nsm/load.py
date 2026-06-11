from google.cloud import bigquery

from utils.logger import get_logger

logger = get_logger(__name__)


def load_to_raw(client, table_name, df):
    """supabase로부터 추출된 activity_log 레코드를 bigquery raw 데이터 셋에 업로드

    Args:
        df (_type_): Pandas Dataframe
        :param table_name:
        :param df:
        :param client:
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
