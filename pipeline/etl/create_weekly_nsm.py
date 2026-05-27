from ddl.mart import MART_WEEKLY_NSM_TABLE_DDL
from utils.gcp import get_bigquery_client, create_dataset
from utils.logger import get_logger
from utils.env import load_env

load_env()
logger = get_logger(__name__)

def create_weekly_nsm_table(client):
    project_id = client.project
    table_ddl = MART_WEEKLY_NSM_TABLE_DDL.format(project_id=project_id)

    job = client.query(table_ddl)
    job.result()
    logger.info(f"table weekly_nsm created: state={job.state}, errors={job.errors}")

if __name__ == "__main__":
    bq_client = get_bigquery_client()
    project_id = f'{bq_client.project}'

    create_dataset(bq_client, f'{project_id}.mart')
    create_weekly_nsm_table(bq_client)