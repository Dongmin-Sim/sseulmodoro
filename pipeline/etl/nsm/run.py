import os
from pathlib import Path

from utils.gcp import get_bigquery_client, create_dataset, create_table_from_ddl
from ddl.raw import RAW_ACTIVITY_LOG_TABLE_DDL
from ddl.fact import FACT_USER_DAILY_POMODORO_TABLE_DDL
from ddl.mart import MART_WEEKLY_NSM_TABLE_DDL

from .extract import extract_activity_log, extract_pomodoro_sessions
from .load import load_to_raw, load_pomodoro_sessions, preprocess_pomodoro_sessions
from .transform import transform

def prepare_schema(bq_client):
    create_dataset(bq_client, 'raw')
    create_table_from_ddl(bq_client, 'activity_log', RAW_ACTIVITY_LOG_TABLE_DDL)

    create_dataset(bq_client, 'fact')
    create_table_from_ddl(bq_client, 'daily_user_pomodoro_completions', FACT_USER_DAILY_POMODORO_TABLE_DDL)

    create_dataset(bq_client, 'mart')
    create_table_from_ddl(bq_client, 'weekly_nsm', MART_WEEKLY_NSM_TABLE_DDL)

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
    sql_dir = Path(__file__).parent.parent / "sql"
    file_paths = [sql_dir / "raw_to_fact.sql", sql_dir / "fact_to_mart.sql"]
    table_names = [f'{project_id}.fact.daily_user_pomodoro_completions', f'{project_id}.mart.weekly_nsm']

    transform(bq_client, file_paths, table_names)

