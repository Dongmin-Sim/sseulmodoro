import pandas as pd

from unittest.mock import Mock
from nsm.load import load_to_raw, converts_user_id_to_str


def _make_gcp_client() -> Mock:
    client = Mock()
    client.project = "test"
    return client

def _make_pomodoro_sessions_df() -> pd.DataFrame:
    return pd.DataFrame({"user_id": [1, 2]})

def test_converts_user_id_to_str()-> None:
    pomodoro_sessions_df = _make_pomodoro_sessions_df()

    df = converts_user_id_to_str(pomodoro_sessions_df)

    assert df["user_id"].tolist() == ["1", "2"]


def test_calls_load_table_once_with_correct_table_id() -> None:
    # given
    client = _make_gcp_client()
    table_name = "pomodoro_sessions"
    table_id = "test.raw.pomodoro_sessions"
    df = _make_pomodoro_sessions_df()

    # when
    load_to_raw(client, table_name, df, schema=[])

    # then
    client.load_table_from_dataframe.assert_called_once()
    args, kwargs = client.load_table_from_dataframe.call_args
    assert args[1] == table_id

def test_uses_write_truncate_disposition() -> None:
    # given
    client = _make_gcp_client()
    table_name = "pomodoro_sessions"
    df = _make_pomodoro_sessions_df()

    # when
    load_to_raw(client, table_name, df, schema=[])

    # then
    args, kwargs = client.load_table_from_dataframe.call_args
    assert kwargs['job_config'].write_disposition == "WRITE_TRUNCATE"

def test_stamps_loaded_at_column() -> None:
    # given
    client = _make_gcp_client()
    table_name = "pomodoro_sessions"
    df = _make_pomodoro_sessions_df()

    # when
    load_to_raw(client, table_name, df, schema=[])

    # then
    args, kwargs = client.load_table_from_dataframe.call_args
    assert 'loaded_at' in args[0].columns

def test_serializes_metadata_to_json_when_activity_log() -> None:
    # given
    client = _make_gcp_client()
    table_name = "activity_log"
    df = pd.DataFrame({"user_id": [1], "metadata": [{"k": "v"}]})

    # when
    load_to_raw(client, table_name, df, schema=[])

    # then
    assert df["metadata"].tolist() == ['{"k": "v"}']