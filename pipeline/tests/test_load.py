import pandas as pd

from nsm.load import preprocessing, load_full, load_incremental


def _minimal_df() -> pd.DataFrame:
    """preprocessing이 요구하는 최소 컬럼(user_id)만 가진 df"""
    return pd.DataFrame({"user_id": [1, 2]})


class TestPreprocessing:
    def test_user_id를_str_타입으로_변경한다(self) -> None:
        table_name = 'test_table'
        df = _minimal_df()

        res = preprocessing(df, table_name)

        assert res["user_id"].tolist() == ["1", "2"]


    def test_activity_log이면_metadata를_json으로_직렬화한다(self):
        table_name = "activity_log"
        df = pd.DataFrame({"user_id": [1], "metadata": [{"k": "v"}]})

        res = preprocessing(df, table_name)

        assert res["metadata"].tolist() == ['{"k": "v"}']


    def test_loaded_at_컬럼을_추가한다(self):
        table_name = "pomodoro_sessions"
        df = _minimal_df()

        res = preprocessing(df, table_name)

        assert 'loaded_at' in res.columns


class TestLoadFull:
    def test_전체적재는_write_truncate로_적재한다(self, gcp_client, make_source_table_full):
        load_full(gcp_client, make_source_table_full(), [], _minimal_df())

        _, kwargs = gcp_client.load_table_from_dataframe.call_args
        assert kwargs['job_config'].write_disposition == "WRITE_TRUNCATE"


    def test_raw_데이터셋의_해당_테이블로_적재한다(self, gcp_client, make_source_table_full):
        src_tbl = make_source_table_full(name="pomodoro_sessions")

        load_full(gcp_client, src_tbl, [], _minimal_df())

        args, _ = gcp_client.load_table_from_dataframe.call_args
        assert args[1] == "test.raw.pomodoro_sessions"


class TestLoadIncremental:
    def test_증분적재는_write_append로_적재한다(self, gcp_client, make_source_table_incremental):
        load_incremental(gcp_client, make_source_table_incremental(), [], _minimal_df(), 1)

        _, kwargs = gcp_client.load_table_from_dataframe.call_args
        assert kwargs['job_config'].write_disposition == "WRITE_APPEND"

    def test_since_이후_행을_삭제한다(self, gcp_client, make_source_table_incremental):
        load_incremental(gcp_client, make_source_table_incremental(name="test_tbl"), [], _minimal_df(), 1)
        args, kwargs = gcp_client.query.call_args
        params = {p.name: p.value for p in kwargs["job_config"].query_parameters}

        assert "id > @since" in args[0]
        assert "test_tbl" in args[0]
        assert params == {"since": 1}


    def test_since_이후_삭제쿼리를_적재보다_먼저_실행한다(self, gcp_client, make_source_table_incremental):
        load_incremental(gcp_client, make_source_table_incremental(), [], _minimal_df(), 1)
        call_seq = [mc[0] for mc in gcp_client.mock_calls]
        assert call_seq.index("query") < call_seq.index("load_table_from_dataframe")
