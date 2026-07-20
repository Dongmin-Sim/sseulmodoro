import json

from google.cloud import bigquery
import pandas as pd

from schema.sources import LoadMode
from utils.logger import get_logger, timed

logger = get_logger(__name__)

def preprocessing(df, table_name):
    df = df.assign(user_id=df['user_id'].astype(str))

    if table_name == 'activity_log':
        df["metadata"] = df["metadata"].apply(lambda x: json.dumps(x) if x is not None else None)

    df["loaded_at"] = pd.Timestamp.now(tz='UTC')
    return df


def load_to_raw(client, table_name, df, schema, mode=LoadMode.FULL):
    """supabase로부터 추출된 테이블 레코드를 bigquery raw 데이터 셋에 업로드

    Args:
        df (_type_): Pandas Dataframe
        :param client: BigQuery client
        :param table_name: 적재할 테이블 명
        :param df: 적재 대상 데이터프레임
        :param schema: BigQuery schema
    """
    with timed(logger, "load", "load", target=table_name) as t:
        df = preprocessing(df, table_name)

        if mode == LoadMode.FULL:
            job_config = bigquery.LoadJobConfig(
                schema=schema,
                write_disposition="WRITE_TRUNCATE"
            )
        else:
            # TODO: 현재 placeholder 멱등하게 작성 필요, 재적재시 현재 처리 파티션 삭제 코드 필요
            job_config = bigquery.LoadJobConfig(
                schema=schema,
                write_disposition="WRITE_APPEND"
            )
        load_job = client.load_table_from_dataframe(df, f'{client.project}.raw.{table_name}', job_config=job_config)
        load_job.result()
        t.add(rows=load_job.output_rows)
