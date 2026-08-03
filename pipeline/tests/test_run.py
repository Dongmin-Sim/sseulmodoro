from functools import partial
from unittest.mock import Mock, patch

import pandas as pd
import pytest
from nsm import run_batch, run_transform
from nsm.run import (
    HANDLERS,
    _run_full,
    _run_incremental,
    load_incremental_append,
    load_incremental_upsert,
    run_backfill,
)
from schema.sources import LoadMode


class TestRunBatch:

    @patch("nsm.run.transform")
    @patch("nsm.run.HANDLERS")
    @patch("nsm.run.prepare_schema")
    def test_적재_전에_스키마를_준비한다(
        self, mock_prepare, mock_handlers, mock_transform, app_context
    ):
        app_ctx = app_context()

        run_batch(app_ctx)

        mock_prepare.assert_called_once_with(app_ctx.bigquery_client)

    @patch("nsm.run.transform")
    @patch("nsm.run.HANDLERS")
    @patch("nsm.run.prepare_schema")
    def test_소스_테이블마다_핸들러를_조회해_호출한다(
        self, mock_prepare, mock_handlers, mock_transform, app_context
    ):
        app_ctx = app_context()
        table_count = len(app_ctx.source_schema.tables)

        run_batch(app_ctx)

        assert mock_handlers.__getitem__.call_count == table_count
        assert mock_handlers.__getitem__.return_value.call_count == table_count

    @patch("nsm.run.transform")
    @patch("nsm.run.HANDLERS")
    @patch("nsm.run.prepare_schema")
    def test_적재는_변환을_호출하지_않는다(
        self, mock_prepare, mock_handlers, mock_transform, app_context
    ):
        run_batch(app_context())

        mock_transform.assert_not_called()


class TestBatchHandlers:

    def test_적재모드마다_알맞은_핸들러가_연결된다(self):
        assert HANDLERS[LoadMode.FULL] is _run_full

        append_handler = HANDLERS[LoadMode.INCREMENTAL_APPEND]
        assert isinstance(append_handler, partial)
        assert append_handler.keywords["load_step"] is load_incremental_append

        upsert_handler = HANDLERS[LoadMode.INCREMENTAL_UPSERT]
        assert isinstance(upsert_handler, partial)
        assert upsert_handler.keywords["load_step"] is load_incremental_upsert


class TestRunBatchFull:
    @patch("nsm.run.load_full")
    @patch("nsm.run.preprocessing")
    @patch("nsm.run.extract_full")
    def test_full_테이블은_전체_흐름을_따른다(self, mock_extract, mock_pre, mock_load_full, app_context, make_source_table_full):
        app_ctx = app_context()

        _run_full(
            bq_client=app_ctx.bigquery_client,
            src_db_url=app_ctx.source_database_url,
            src_tbl=make_source_table_full(),
            tbl_schema=app_ctx.bigquery_schema
        )

        mock_extract.assert_called()
        mock_pre.assert_called()
        mock_load_full.assert_called()


class TestRunBatchIncremental:
    @patch("nsm.run.update_watermark")
    @patch("nsm.run.load_full")
    @patch("nsm.run.preprocessing")
    @patch("nsm.run.extract_incremental")
    @patch("nsm.run.read_watermark")
    def test_워터마크가_있으면_주입된_load_step을_호출한다(self, mock_rw, mock_extract, mock_pre, mock_full, mock_uw, gcp_client, make_source_table_incremental):
        mock_rw.return_value = "100"
        mock_extract.return_value = pd.DataFrame({"id": [1, 2]})
        mock_pre.return_value = pd.DataFrame({"id": [1, 2]})
        mock_step = Mock()

        _run_incremental(gcp_client, "url", make_source_table_incremental(), [], load_step=mock_step)

        mock_step.assert_called()
        mock_full.assert_not_called()
        mock_uw.assert_called()

    @patch("nsm.run.update_watermark")
    @patch("nsm.run.load_full")
    @patch("nsm.run.preprocessing")
    @patch("nsm.run.extract_full")
    @patch("nsm.run.read_watermark")
    def test_워터마크가_없으면_전체적재하고_load_step은_건너뛴다(self, mock_rw, mock_extract, mock_pre, mock_full, mock_uw, gcp_client, make_source_table_incremental):
        mock_rw.return_value = None
        mock_extract.return_value = pd.DataFrame({"id": [1, 2]})
        mock_pre.return_value = pd.DataFrame({"id": [1, 2]})
        mock_step = Mock()

        _run_incremental(gcp_client, "url", make_source_table_incremental(), [], load_step=mock_step)

        mock_full.assert_called()
        mock_step.assert_not_called()
        mock_uw.assert_called()


class TestRunBackfill:

    @patch("nsm.run.transform")
    @patch("nsm.run.load_backfill")
    @patch("nsm.run.count_backfill_target_rows")
    @patch("nsm.run.extract_backfill")
    @patch("nsm.run.update_watermark")
    def test_워터마크를_전진시키지_않는다(self, mock_uw, mock_extract, mock_count, mock_load, mock_transform, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config()
        mock_extract.return_value = pd.DataFrame({"user_id": [1, 2]})
        mock_count.return_value = 2

        run_backfill(app_ctx, bf_cfg)
        mock_uw.assert_not_called()
        mock_transform.assert_not_called()

    @patch("nsm.run.transform")
    @patch("nsm.run.load_backfill")
    @patch("nsm.run.count_backfill_target_rows")
    @patch("nsm.run.extract_backfill")
    def test_삭제_행이_갱신_행보다_많으면_중단한다(self, mock_extract, mock_count, mock_load, mock_transform, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config()
        mock_extract.return_value = pd.DataFrame({"user_id": [1, 2]})
        mock_count.return_value = 3

        with pytest.raises(RuntimeError):
            run_backfill(app_ctx, bf_cfg)


    @patch("nsm.run.transform")
    @patch("nsm.run.load_backfill")
    @patch("nsm.run.count_backfill_target_rows")
    @patch("nsm.run.extract_backfill")
    def test_건수_비교에_걸리면_적재하지_않는다(self, mock_extract, mock_count, mock_load, mock_transform, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config()
        mock_extract.return_value = pd.DataFrame({"user_id": [1, 2]})
        mock_count.return_value = 3

        with pytest.raises(RuntimeError):
            run_backfill(app_ctx, bf_cfg)

        mock_load.assert_not_called()
        mock_transform.assert_not_called()

    @patch("nsm.run.transform")
    @patch("nsm.run.load_backfill")
    @patch("nsm.run.count_backfill_target_rows")
    @patch("nsm.run.preprocessing")
    @patch("nsm.run.extract_backfill")
    def test_지정_구간을_추출과_적재에_전달한다(self, mock_extract, mock_pre, mock_count, mock_load, mock_transform, app_context, backfill_config):
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
        mock_transform.assert_not_called()

    def test_없는_테이블을_지정하면_중단한다(self, app_context, backfill_config):
        app_ctx, bf_cfg = app_context(), backfill_config(table_name=None)
        with pytest.raises(RuntimeError):
            run_backfill(app_ctx, bf_cfg)


class TestTransform:

    @patch("nsm.run.transform")
    @patch("nsm.run.prepare_schema")
    def test_스키마_준비후_변환한다(self, mock_prepare, mock_transform, bigquery_context):
        bq_ctx = bigquery_context()

        run_transform(bq_ctx)

        mock_prepare.assert_called_once_with(bq_ctx.bigquery_client)
        mock_transform.assert_called_once_with(bq_ctx.bigquery_client)

