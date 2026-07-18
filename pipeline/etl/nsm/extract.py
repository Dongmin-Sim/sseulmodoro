from typing import List

import psycopg
from psycopg import sql
import pandas as pd

from utils.logger import get_logger, timed

logger = get_logger(__name__)


def build_extract_columns_query(table_name:str, columns:List[str]) -> str:
    if not columns: raise ValueError(f"{table_name}: columns is empty")

    return sql.SQL("SELECT {cols} FROM {tbl}").format(
        cols=sql.SQL(", ").join(map(sql.Identifier, columns)),
        tbl=sql.Identifier(table_name),
    ).as_string()


def extract_table(database_url: str | None, table_name: str, columns:List[str]) -> pd.DataFrame:
    """supabase에서 테이블을 추출하여 Pandas Dataframe으로 반환"""
    if database_url is None:
        logger.error(
            "DATABASE_URL not set",
            extra={"stage": "extract", "event": "extract_error", "status": "fail"},
        )
        raise RuntimeError("DATABASE_URL not set")

    with timed(logger, "extract", "extract", target=table_name) as t:
        query = build_extract_columns_query(table_name, columns)
        with psycopg.connect(database_url) as conn:
            df = pd.read_sql(query, conn)
            t.add(rows=len(df))
            return df
