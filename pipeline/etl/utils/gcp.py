import google.cloud.bigquery as bigquery

from utils.logger import get_logger
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
    new_dataset = bigquery.Dataset(f'{client.project}.{dataset_id}')
    new_dataset.location = location

    dataset = client.create_dataset(
        dataset=new_dataset, 
        exists_ok=True,
        timeout=30)
    logger.info("Created dataset {}.{}".format(client.project, dataset.dataset_id))

def create_table_from_ddl(client, table_name: str, ddl_template: str) -> None:
    """

    :param client:
    :param table_name:
    :param ddl_template:
    :return:
    """
    ddl = ddl_template.format(project_id=client.project)
    job = client.query(ddl)
    job.result()
    logger.info(f"Table Created: {table_name}, state={job.state}, errors={job.errors}")

def create_table_from_ddl_file(bq_client, table_name, ddl_filename):
    ddl_path = DDL_DIR / ddl_filename
    with open(ddl_path, "r", encoding="utf-8") as f:
        ddl_sql = f.read()
        logger.info(f"read ddl from {ddl_path}")
    create_table_from_ddl(bq_client, table_name, ddl_sql)
