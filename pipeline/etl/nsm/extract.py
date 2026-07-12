import psycopg
import pandas as pd

from utils.logger import get_logger, timed

logger = get_logger(__name__)


def extract_table(database_url: str | None, table_name: str) -> pd.DataFrame:
    """supabase에서 테이블을 추출하여 Pandas Dataframe으로 반환"""
    if database_url is None:
        logger.error(
            "DATABASE_URL not set",
            extra={"stage": "extract", "event": "extract_error", "status": "fail"},
        )
        raise RuntimeError("DATABASE_URL not set")

    with timed(logger, "extract", "extract", target=table_name) as t:
        with psycopg.connect(database_url) as conn:
            sql = f"""SELECT * FROM {table_name};"""
            df = pd.read_sql(sql, conn)
            t.add(rows=len(df))
            return df
