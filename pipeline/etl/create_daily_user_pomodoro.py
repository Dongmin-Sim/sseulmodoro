from ddl.fact import FACT_USER_DAILY_POMODORO_TABLE_DDL
from utils.gcp import get_bigquery_client, create_dataset
from utils.logger import get_logger
from utils.env import load_env

load_env()
logger = get_logger(__name__)

def create_daily_user_pomodoro_completions_table(client):
    project_id = f"{client.project}"
    table_ddl = FACT_USER_DAILY_POMODORO_TABLE_DDL.format(project_id=project_id)

    job = client.query(table_ddl)
    job.result()
    logger.info(f"table daily_user_pomodoro_completions created: state={job.state}, errors={job.errors}")

if __name__ == "__main__":
    bq_client = get_bigquery_client()
    project_id = f'{bq_client.project}'

    create_dataset(bq_client, f'{project_id}.fact')
    create_daily_user_pomodoro_completions_table(bq_client)