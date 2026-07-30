from unittest.mock import patch

import pandas as pd
import pytest
from nsm import run_nsm
from nsm.run import run_backfill
from schema.sources import Source


class TestRunBackfill:

    @patch("nsm.run.transform")
    @patch("nsm.run.load_backfill")
    @patch("nsm.run.count_backfill_target_rows")
    @patch("nsm.run.extract_backfill")
    @patch("nsm.run.update_watermark")
    def test_워터마크를_전진시키지_않는다(self, mock_uw, mock_extract, mock_count, mock_load, mock_trans, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config()
        mock_extract.return_value = pd.DataFrame({"user_id": [1, 2]})
        mock_count.return_value = 2

        run_backfill(app_ctx, bf_cfg)
        mock_uw.assert_not_called()

    @patch("nsm.run.transform")
    @patch("nsm.run.load_backfill")
    @patch("nsm.run.count_backfill_target_rows")
    @patch("nsm.run.extract_backfill")
    def test_삭제_행이_갱신_행보다_많으면_중단한다(self, mock_extract, mock_count, mock_load, mock_trans, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config()
        mock_extract.return_value = pd.DataFrame({"user_id": [1, 2]})
        mock_count.return_value = 3

        with pytest.raises(RuntimeError):
            run_backfill(app_ctx, bf_cfg)

    @patch("nsm.run.transform")
    @patch("nsm.run.load_backfill")
    @patch("nsm.run.count_backfill_target_rows")
    @patch("nsm.run.extract_backfill")
    def test_건수_비교에_걸리면_적재하지_않는다(self, mock_extract, mock_count, mock_load, _, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config()
        mock_extract.return_value = pd.DataFrame({"user_id": [1, 2]})
        mock_count.return_value = 3

        with pytest.raises(RuntimeError):
            run_backfill(app_ctx, bf_cfg)

        mock_load.assert_not_called()

    @patch("nsm.run.transform")
    @patch("nsm.run.load_backfill")
    @patch("nsm.run.count_backfill_target_rows")
    @patch("nsm.run.preprocessing")
    @patch("nsm.run.extract_backfill")
    def test_지정_구간을_추출과_적재에_전달한다(self, mock_extract, mock_pre, mock_count, mock_load, _, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config()
        src_db_url = app_ctx.source_database_url
        bf_tbl_name = bf_cfg.table_name
        backfill_table = app_ctx.source_schema.find_source_table(bf_tbl_name)
        start_date, end_date = bf_cfg.start_date, bf_cfg.end_date
        df = pd.DataFrame({"user_id": [1, 2]})

        mock_extract.return_value = df
        mock_pre.return_value = df
        mock_count.return_value = 2

        run_backfill(app_ctx, bf_cfg)

        mock_extract.assert_called_with(src_db_url, backfill_table, start_date, end_date)
        mock_load.assert_called_with(
            app_ctx.bigquery_client, backfill_table, app_ctx.bigquery_schema[bf_tbl_name], df, start_date, end_date
        )

    def test_없는_테이블을_지정하면_중단한다(self, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config(table_name=None)
        with pytest.raises(RuntimeError):
            run_backfill(app_ctx, bf_cfg)


class TestRunNsm:

    @patch("nsm.run.load_full")
    @patch("nsm.run.update_watermark")
    @patch("nsm.run.load_incremental")
    @patch("nsm.run.preprocessing")
    @patch("nsm.run.extract_incremental")
    @patch("nsm.run.read_watermark")
    def test_증분_테이블은_증분_흐름을_따른다(self, mock_rw, mock_extract, mock_pre, mock_load, mock_uw, mock_full, app_context, make_source_table_incremental):
        app_ctx = app_context(
            source_schema=Source(
                name="test-app", type="db", tables=[
                make_source_table_incremental(name="test_tbl")
            ]),
            bigquery_schema={
                "test_tbl": []
            }
        )
        mock_extract.return_value = pd.DataFrame({"user_id": [1, 2]})
        run_nsm(app_ctx)

        mock_load.assert_called()
        mock_full.assert_not_called()
        mock_uw.assert_called()


    @patch("nsm.run.update_watermark")
    @patch("nsm.run.load_incremental")
    @patch("nsm.run.load_full")
    @patch("nsm.run.preprocessing")
    @patch("nsm.run.extract_full")
    @patch("nsm.run.read_watermark")
    def test_full_테이블은_전체_흐름을_따른다(self, mock_rw, mock_extract, mock_pre, mock_load_full, mock_load_incr, mock_uw, app_context, make_source_table_full):
        app_ctx = app_context(
            source_schema=Source(
                name="test-app",
                type="db",
                tables=[make_source_table_full(name="test_tbl")],
            ),
            bigquery_schema={"test_tbl": []},
        )
        run_nsm(app_ctx)

        mock_load_full.assert_called()
        mock_load_incr.assert_not_called()
        mock_uw.assert_not_called()
