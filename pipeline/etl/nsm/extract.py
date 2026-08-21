import psycopg
from psycopg import sql
import pandas as pd

from schema.sources import SourceTable
from utils.logger import get_logger, timed

logger = get_logger(__name__)


def _fetch(database_url: str, query: str, params: dict | None = None) -> pd.DataFrame:
    # TODO: SQLAlchemy 변환 필요
    with psycopg.connect(database_url) as conn:
        return pd.read_sql(query, conn, params=params)


def build_extract_columns_query(table_name: str, columns: list[str]) -> str:
    return sql.SQL("SELECT {cols} FROM {tbl}").format(
        cols=sql.SQL(", ").join(map(sql.Identifier, columns)),
        tbl=sql.Identifier(table_name),
    ).as_string()


def build_extract_incremental_query(table_name: str, columns: list[str], incremental_key: str, incremental_key_type: str) -> str:
    return sql.SQL("SELECT {cols} FROM {tbl} WHERE {incre_key} > %(since)s::{incre_key_type}").format(
        cols=sql.SQL(", ").join(map(sql.Identifier, columns)),
        tbl=sql.Identifier(table_name),
        incre_key=sql.Identifier(incremental_key),
        # pyrefly: ignore [bad-argument-type]
        incre_key_type=sql.SQL(incremental_key_type),
    ).as_string()


def build_extract_backfill_query(table_name: str, columns: list[str], backfill_key: str) -> str:
    return (sql.SQL(
        """SELECT {cols}
           FROM {tbl}
           WHERE {backfill_key} >= %(start)s::timestamp AND {backfill_key} < %(end)s::timestamp + INTERVAL '1 DAY'
        """
    ).format(
        cols=sql.SQL(", ").join(map(sql.Identifier, columns)),
        tbl=sql.Identifier(table_name),
        backfill_key=sql.Identifier(backfill_key),
    ).as_string())


def extract_full(database_url: str, src_tbl: SourceTable) -> pd.DataFrame:
    with timed(logger, "extract", "extract", target=src_tbl.name) as t:
        query = build_extract_columns_query(src_tbl.name, src_tbl.columns)
        df = _fetch(database_url, query)
        t.add(rows=len(df))
        return df


def extract_incremental(database_url: str, src_tbl: SourceTable, since: str | None) -> pd.DataFrame:
    with timed(logger, "extract", "extract", target=src_tbl.name) as t:
        query = build_extract_incremental_query(
            src_tbl.name,
            src_tbl.columns,
            src_tbl.required_incremental_key,
            src_tbl.required_incremental_key_type
        )
        df = _fetch(database_url, query, params={"since": since})
        t.add(rows=len(df))
        return df


def extract_backfill(database_url: str, src_tbl: SourceTable, start: str, end: str) -> pd.DataFrame:
    with timed(logger, "extract", "backfill", target=src_tbl.name) as t:
        query = build_extract_backfill_query(
            src_tbl.name, src_tbl.columns, src_tbl.required_backfill_key
        )
        df = _fetch(database_url, query, params={"start": start, "end": end})
        t.add(rows=len(df), backfill_start=start, backfill_end=end)
        return df
