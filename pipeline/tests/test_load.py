import pandas as pd

from nsm.load import load_to_raw, preprocessing


def _make_pomodoro_sessions_df() -> pd.DataFrame:
    return pd.DataFrame({"user_id": [1, 2]})

class TestPreprocessing:
    def test_user_id를_str_타입으로_변경한다(self) -> None:
        table_name = 'test_table'
        pomodoro_sessions_df = _make_pomodoro_sessions_df()

        df = preprocessing(pomodoro_sessions_df, table_name)

        assert df["user_id"].tolist() == ["1", "2"]

    def test_activity_log이면_metadata를_json으로_직렬화한다(self):
        table_name = "activity_log"
        df = pd.DataFrame({"user_id": [1], "metadata": [{"k": "v"}]})

        res = preprocessing(df, table_name)

        assert res["metadata"].tolist() == ['{"k": "v"}']

    def test_loaded_at_컬럼을_추가한다(self):
        table_name = "pomodoro_sessions"
        df = _make_pomodoro_sessions_df()

        res = preprocessing(df, table_name)

        assert 'loaded_at' in res.columns


def test_올바른_table_id로_적재를_한번_호출한다(gcp_client) -> None:
    # given
    table_name = "pomodoro_sessions"
    table_id = "test.raw.pomodoro_sessions"
    df = _make_pomodoro_sessions_df()

    # when
    load_to_raw(gcp_client, table_name, df, schema=[])

    # then
    gcp_client.load_table_from_dataframe.assert_called_once()
    args, kwargs = gcp_client.load_table_from_dataframe.call_args
    assert args[1] == table_id


def test_전체적재는_write_truncate로_적재한다(gcp_client) -> None:
    # given
    table_name = "pomodoro_sessions"
    df = _make_pomodoro_sessions_df()

    # when
    load_to_raw(gcp_client, table_name, df, schema=[])

    # then
    args, kwargs = gcp_client.load_table_from_dataframe.call_args
    assert kwargs['job_config'].write_disposition == "WRITE_TRUNCATE"

