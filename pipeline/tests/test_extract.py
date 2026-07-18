import pytest

from nsm.extract import build_extract_columns_query


def test_success_build_sql_given_parameter():
    table_name = "test"
    columns = ["id", "name", "created_at"]

    res = build_extract_columns_query(table_name, columns)

    assert isinstance(res, str)
    assert res == "SELECT \"id\", \"name\", \"created_at\" FROM \"test\""

def test_fail_build_sql_given_parameter_with_empty_columns():
    with pytest.raises(ValueError):
        build_extract_columns_query("test", [])



