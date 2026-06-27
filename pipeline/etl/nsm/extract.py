import psycopg
import pandas as pd

from utils.logger import get_logger

logger = get_logger(__name__)

def extract_activity_log(database_url:str|None):
    """supabase에서 activity_log 테이블을 추출하여 Pandas Dataframe으로 반환
    """
    if database_url is None: raise RuntimeError("DATABASE_URL not set")

    with psycopg.connect(database_url) as conn:
        sql = """SELECT * FROM activity_log;"""
        df = pd.read_sql(sql, conn)
        logger.info(f"extracted {len(df)} rows")
    return df

def extract_pomodoro_session(database_url:str|None):
    """supabase에서 pomodoro_sessions 테이블을 추출하여 Pandas Dataframe으로 반환
    """
    if database_url is None: raise RuntimeError("DATABASE_URL not set")

    with psycopg.connect(database_url) as conn:
        sql = """SELECT * FROM pomodoro_sessions;"""
        df = pd.read_sql(sql, conn)
        logger.info(f"extracted {len(df)} rows")
    return df
