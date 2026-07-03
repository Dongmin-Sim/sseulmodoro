import os

from config import SQL_DIR
from utils.gcp import get_bigquery_client, create_dataset, create_table_from_ddl, create_table_from_ddl_file
from ddl.raw import RAW_ACTIVITY_LOG_TABLE_DDL
from ddl.fact import FACT_USER_DAILY_POMODORO_TABLE_DDL
from ddl.mart import MART_WEEKLY_NSM_TABLE_DDL
from utils.logger import get_logger

from .extract import extract_activity_log, extract_pomodoro_sessions
from .load import load_to_raw, load_pomodoro_sessions, preprocess_pomodoro_sessions
from .transform import transform

logger = get_logger(__name__)

def prepare_schema(bq_client):
    create_dataset(bq_client, 'raw')
    create_table_from_ddl(bq_client, 'activity_log', RAW_ACTIVITY_LOG_TABLE_DDL)

    create_dataset(bq_client, 'fact')
    create_table_from_ddl(bq_client, 'daily_user_pomodoro_completions', FACT_USER_DAILY_POMODORO_TABLE_DDL)

    create_dataset(bq_client, 'mart')
    create_table_from_ddl(bq_client, 'weekly_nsm', MART_WEEKLY_NSM_TABLE_DDL)

    create_table_from_ddl_file(bq_client, 'fact_pomodoro_sessions', 'mart_fact_pomodoro_sessions.sql')
    create_table_from_ddl_file(bq_client, 'fact_active_user_daily', 'mart_fact_active_user_daily.sql')
    create_table_from_ddl_file(bq_client, 'agg_nsm_weekly', 'mart_agg_nsm_weekly.sql')

def run_nsm() -> None:
    database_url = os.getenv("DATABASE_URL")
    bq_client = get_bigquery_client()
    project_id = bq_client.project
    prepare_schema(bq_client)

    # extract from Supabase activiti_log
    activity_log_df = extract_activity_log(database_url=database_url)
    pomodoro_session_df = extract_pomodoro_sessions(database_url=database_url)

    # load to bigquery raw.activiti_log
    load_to_raw(bq_client, 'activity_log', activity_log_df)

    processed_pomodoro_session_df = preprocess_pomodoro_sessions(pomodoro_session_df)
    load_pomodoro_sessions(bq_client, 'pomodoro_sessions', processed_pomodoro_session_df)

    # transform to fact, mart
    tables = [
        (SQL_DIR / "raw_to_fact.sql", f'{project_id}.fact.daily_user_pomodoro_completions'),
        (SQL_DIR / "fact_to_mart.sql", f'{project_id}.mart.weekly_nsm'),
        (SQL_DIR / "marts/fact_pomodoro_sessions.sql", f'{project_id}.mart.fact_pomodoro_sessions'),
        (SQL_DIR / "marts/fact_active_user_daily.sql", f'{project_id}.mart.fact_active_user_daily'),
        (SQL_DIR / "marts/agg_nsm_weekly.sql", f'{project_id}.mart.agg_nsm_weekly'),
    ]
    transform(bq_client, tables)
