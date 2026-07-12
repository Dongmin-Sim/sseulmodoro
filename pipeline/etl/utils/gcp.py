import google.cloud.bigquery as bigquery

from utils.logger import get_logger, timed
from config import DDL_DIR

logger = get_logger(__name__)


def get_bigquery_client(bq_project):
    if not bq_project: raise RuntimeError("BQ_PROJECT not set")
    return bigquery.Client(project=bq_project)


def create_dataset(client, dataset_id, location='US'):
    """Bigquery 데이터 셋 생성 함수

    Args:
        client (_type_): bigquery.Client
        dataset_id (_type_): "dataset_id" 형식으로 작성
        location (str, optional): _description_. Defaults to 'US'.
    """
    with timed(logger, "prepare", "create_dataset", target=dataset_id):
        new_dataset = bigquery.Dataset(f'{client.project}.{dataset_id}')
        new_dataset.location = location

        client.create_dataset(
            dataset=new_dataset,
            exists_ok=True,
            timeout=30
        )


def create_table_from_ddl_file(bq_client, table_name, ddl_filename):
    with timed(logger, "prepare", "create_table", target=table_name):
        ddl_path = DDL_DIR / ddl_filename
        with open(ddl_path, "r", encoding="utf-8") as f:
            ddl_sql = f.read()
            logger.debug(f"Read ddl from {ddl_path}")

        ddl = ddl_sql.format(project_id=bq_client.project)
        job = bq_client.query(ddl)
        job.result()

