from nsm.load import build_merge_query, load_upsert
from google.cloud import bigquery
import pandas as pd
from nsm.load import (
    build_backfill_delete_query,
    build_count_rows_query,
    build_incremental_delete_query,
    count_backfill_target_rows,
    load_backfill,
    load_full,
    load_incremental,
    preprocessing,
)


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


class TestLoadBackfill:
    def test_백필적재는_write_append로_적재한다(self, gcp_client, make_source_table_incremental):
        load_backfill(gcp_client, make_source_table_incremental(), [], _minimal_df(), "2026-01-01", "2026-01-02")

        _, kwargs = gcp_client.load_table_from_dataframe.call_args
        assert kwargs['job_config'].write_disposition == "WRITE_APPEND"

    def test_삭제쿼리를_적재보다_먼저_실행한다(self, gcp_client, make_source_table_incremental):
        load_backfill(gcp_client, make_source_table_incremental(), [], _minimal_df(), "2026-01-01", "2026-01-02")

        call_seq = [mc[0] for mc in gcp_client.mock_calls]
        assert call_seq.index("query") < call_seq.index("load_table_from_dataframe")


class TestLoadUpsert:
    def test_staging_적재는_write_truncate로_적재한다(self, gcp_client, make_source_table_upsert):
        load_upsert(gcp_client, make_source_table_upsert(), [], _minimal_df())
        _, kwargs = gcp_client.load_table_from_dataframe.call_args

        assert kwargs['job_config'].write_disposition == "WRITE_TRUNCATE"


    def test_staging_적재_후_merge_쿼리를_실행한다(self, gcp_client, make_source_table_upsert):
        load_upsert(gcp_client, make_source_table_upsert(), [], _minimal_df())

        call_seq = [mc[0] for mc in gcp_client.mock_calls]
        assert call_seq.index("load_table_from_dataframe") < call_seq.index("query")


class TestCountBackfillTargetRows:
    def test_카운트_결과의_첫_행_첫_컬럼을_정수로_반환한다(self, gcp_client, make_source_table_incremental):
        gcp_client.query.return_value.result.return_value = iter([[5]])

        res = count_backfill_target_rows(make_source_table_incremental(), gcp_client, "2026-01-01", "2026-01-02")

        assert res == 5

    def test_start_end를_쿼리_파라미터로_바인딩한다(self, gcp_client, make_source_table_incremental):
        gcp_client.query.return_value.result.return_value = iter([[0]])

        count_backfill_target_rows(make_source_table_incremental(), gcp_client, "2026-01-01", "2026-01-02")

        _, kwargs = gcp_client.query.call_args
        params = {p.name: p.value for p in kwargs["job_config"].query_parameters}
        assert params == {"start": "2026-01-01", "end": "2026-01-02"}


class TestBuildLoadQuery:
    def test_증분적재_쿼리를_생성한다(self, gcp_client, make_source_table_incremental):
        source_table = make_source_table_incremental(
            name = 'test_table',
            incremental_key="id",
        )
        res = build_incremental_delete_query(gcp_client, source_table)

        assert isinstance(res, str)
        assert "DELETE FROM `test.raw.test_table`" in res
        assert "WHERE id > @since" in res


    def test_백필적재_쿼리를_생성한다(self, gcp_client, make_source_table_incremental):
        source_table = make_source_table_incremental(
            name = 'test_table',
            incremental_key="id",
            backfill_key="created_at",
        )
        res = build_backfill_delete_query(gcp_client, source_table)

        assert isinstance(res, str)
        assert "DELETE FROM `test.raw.test_table`" in res
        assert "WHERE created_at >= TIMESTAMP(@start)" in res
        assert "AND created_at < TIMESTAMP(@end) + INTERVAL 1 DAY" in res

    def test_행수_카운트_쿼리를_생성한다(self, gcp_client, make_source_table_incremental):
        source_table = make_source_table_incremental(
            name = 'test_table',
        )
        res = build_count_rows_query(gcp_client, source_table)

        assert isinstance(res, str)
        assert "SELECT COUNT(*)" in res
        assert "FROM `test.raw.test_table`" in res
        assert "WHERE created_at >= TIMESTAMP(@start)" in res
        assert "AND created_at < TIMESTAMP(@end) + INTERVAL 1 DAY" in res

    def test_머지쿼리를_생성한다(self, gcp_client, make_source_table_upsert):
        targ_tbl = make_source_table_upsert(
            name="test_table",
            incremental_key= "updated_at",
            merge_key="id",
        )
        target_schema = [
            bigquery.SchemaField("id", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
            bigquery.SchemaField("created_at", bigquery.enums.SqlTypeNames.TIMESTAMP, mode="NULLABLE"),
            bigquery.SchemaField("loaded_at", bigquery.enums.SqlTypeNames.TIMESTAMP, mode="REQUIRED"),
        ]

        res = build_merge_query(gcp_client, targ_tbl, target_schema)

        assert isinstance(res, str)
        assert "MERGE `test.raw.test_table` as t" in res
        assert "USING `test._load_stage.test_table` as s" in res
        assert "ON t.id = s.id" in res
        assert "WHEN MATCHED AND s.updated_at > t.updated_at THEN" in res
        assert "t.id = s.id, t.created_at = s.created_at, t.loaded_at = s.loaded_at" in res




def test_백필적재는_start_end를_쿼리_파라미터로_바인딩한다(gcp_client, make_source_table_incremental):
    start_date, end_date = "2026-01-01", "2026-01-02"
    load_backfill(gcp_client, make_source_table_incremental(), [], _minimal_df(), start_date, end_date)

    _, kwargs = gcp_client.query.call_args
    query_job_params = {p.name: p.value for p in kwargs["job_config"].query_parameters}

    assert query_job_params['start'] == start_date
    assert query_job_params['end'] == end_date


def test_증분적재는_since를_쿼리_파라미터로_바인딩한다(gcp_client, make_source_table_incremental):
    since = 1
    load_incremental(gcp_client, make_source_table_incremental(), [], _minimal_df(), since)

    _, kwargs = gcp_client.query.call_args
    query_job_params = {p.name: p.value for p in kwargs['job_config'].query_parameters}

    assert query_job_params['since'] == since

