import google.cloud.bigquery as bigquery

from utils.logger import get_logger

logger = get_logger(__name__)

def get_bigquery_client():
    return bigquery.Client()

def create_dataset(client, new_dataset_id, location='US'):
    """Bigquery 데이터 셋 생성 함수

    Args:
        client (_type_): bigquery.Client
        new_dataset_id (_type_): "project_id.new_dataset_id" 형식으로 작성
        location (str, optional): _description_. Defaults to 'US'.
    """
    new_dataset = bigquery.Dataset(new_dataset_id)
    new_dataset.location = location

    dataset = client.create_dataset(
        dataset=new_dataset, 
        exists_ok=True,
        timeout=30)
    logger.info("Created dataset {}.{}".format(client.project, dataset.dataset_id))

def create_table(client, new_table_id, schema):
    table_obj = bigquery.Table(new_table_id, schema=schema)
    table = client.create_table(table_obj, exists_ok=True, timeout=30)
    logger.info(
        "Table Created: {}.{}.{}".format(table.project, table.dataset_id, table.table_id)
    )
