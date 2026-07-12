import json

from google.cloud import bigquery
import pandas as pd

from utils.logger import get_logger, timed

logger = get_logger(__name__)

def converts_user_id_to_str(df: pd.DataFrame)-> pd.DataFrame:
    return df.assign(user_id=df['user_id'].astype(str))

def load_to_raw(client, table_name, df, schema):
    """supabase로부터 추출된 테이블 레코드를 bigquery raw 데이터 셋에 업로드

    Args:
        df (_type_): Pandas Dataframe
        :param client: BigQuery client
        :param table_name: 적재할 테이블 명
        :param df: 적재 대상 데이터프레임
        :param schema: BigQuery schema
    """
    with timed(logger, "load", "load", target=table_name) as t:
        if table_name == 'activity_log':
            df["metadata"] = df["metadata"].apply(lambda x: json.dumps(x) if x is not None else None)

        df["loaded_at"] = pd.Timestamp.now(tz='UTC')

        table_id = f'{client.project}.raw.{table_name}'
        job_config = bigquery.LoadJobConfig(
            schema=schema,
            write_disposition="WRITE_TRUNCATE"
        )
        load_job = client.load_table_from_dataframe(df, table_id, job_config=job_config)
        load_job.result()
        t.add(rows=load_job.output_rows)
