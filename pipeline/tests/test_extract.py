
from nsm.extract import build_extract_columns_query, build_extract_incremental_query, build_extract_backfill_query


def test_지정_컬럼으로_추출_쿼리를_생성한다():
    table_name = "test"
    columns = ["id", "name", "created_at"]

    res = build_extract_columns_query(table_name, columns)

    assert isinstance(res, str)
    assert res == "SELECT \"id\", \"name\", \"created_at\" FROM \"test\""


def test_증분_추출_쿼리를_생성한다():
    table_name = "test"
    columns = ["id", "name", "created_at"]
    incremental_key = "created_at"

    res = build_extract_incremental_query(table_name, columns, incremental_key)

    assert isinstance(res, str)
    assert res == "SELECT \"id\", \"name\", \"created_at\" FROM \"test\" WHERE \"created_at\" > %(since)s"


def test_백필_추출_쿼리를_생성한다():
    table_name = "test"
    columns = ["id", "name", "created_at"]
    backfill_key = "created_at"

    res = build_extract_backfill_query(table_name, columns, backfill_key)
    assert isinstance(res, str)
    assert "WHERE \"created_at\" >= %(start)s::timestamp AND \"created_at\" < %(end)s::timestamp + INTERVAL '1 DAY'" in res
