from argparse import ArgumentTypeError, Namespace
from unittest.mock import Mock, patch

import pytest
from context import BackfillConfig
from main import (
    _build_backfill_config,
    _run,
    _run_backfill,
    _run_transform,
    _valid_args_date,
    build_args_parser,
    main,
)


@pytest.fixture
def backfill_argv():
    return [
        "backfill",
        "--start-date=2026-01-01",
        "--end-date=2026-01-02",
        "--table-name=activity_log",
    ]


class TestValidArgsDate:
    @pytest.mark.parametrize(
        "valid_input",
        [
            "2026-01-01",
            "2026-12-31",
            "2000-02-29",
        ],
    )
    def test_올바른_형식의_date가_주어졌을때_주어진_date를_반환한다(self, valid_input):
        res = _valid_args_date(valid_input)

        assert isinstance(res, str)
        assert res == valid_input

    @pytest.mark.parametrize(
        "invalid_input",
        [
            "2026.01.01",
            "2026 12 31",
            "2000/2/29",
            "2026-1-29",
            "2026-01-1",
        ],
        ids=[
            "점_구분자",
            "공백_구분자",
            "슬래시_구분자",
            "월_자릿수_패딩",
            "일_자릿수_패딩",
        ],
    )
    def test_올바르지_않은_형식의_date가_주어졌을때_ArgumentTypeError를_던진다(
        self, invalid_input
    ):
        with pytest.raises(ArgumentTypeError):
            _valid_args_date(invalid_input)


def test_네임스페이스_값으로_BackfillConfig_빌드한다():
    namespace = Namespace(
        start_date="2026-01-01",
        end_date="2026-12-31",
        table_name="test",
    )

    res = _build_backfill_config(namespace)

    assert isinstance(res, BackfillConfig)
    assert res.start_date == "2026-01-01"
    assert res.end_date == "2026-12-31"
    assert res.table_name == "test"


@patch("main._build_app_context")
@patch("main.run_batch")
def test_정상배치는_run_batch을_호출한다(mock_run_batch, mock_app_context):
    _run(Namespace())

    app_ctx = mock_app_context.return_value

    mock_run_batch.assert_called_once_with(app_ctx)
    mock_app_context.assert_called_once()


@patch("main._build_backfill_config")
@patch("main._build_app_context")
@patch("main.run_backfill")
def test_백필시_설정과_함께_run_backfill을_호출한다(
    mock_run_backfill, mock_app_context, mock_backfill_config
):
    mock_namespace = Mock()
    _run_backfill(mock_namespace)

    app_ctx = mock_app_context.return_value
    bf_cfg = mock_backfill_config.return_value

    mock_app_context.assert_called_once()
    mock_backfill_config.assert_called_once_with(mock_namespace)
    mock_run_backfill.assert_called_once_with(app_ctx, bf_cfg)


class TestBuildArgsParser:

    def test_정상배치실행_서브커맨드를_파싱한다(self):
        args = build_args_parser().parse_args(["run"])
        assert args.command == "run"

    def test_backfill_파서의_인자를_네임스페이스에_담는다(self, backfill_argv):
        args = build_args_parser().parse_args(backfill_argv)

        assert args.command == "backfill"
        assert args.start_date == "2026-01-01"
        assert args.end_date == "2026-01-02"
        assert args.table_name == "activity_log"

    def test_서브커맨드마다_실행함수가_매핑된다(self, backfill_argv):
        run_args = build_args_parser().parse_args(["run"])
        transform_args = build_args_parser().parse_args(["transform"])
        backfill_args = build_args_parser().parse_args(backfill_argv)

        assert run_args.func is _run
        assert transform_args.func is _run_transform
        assert backfill_args.func is _run_backfill

    @pytest.mark.parametrize(
        "argv",
        [
            [],
            ["backfil"],
            ["backfill"],
            [
                "backfill",
                "--start-date=bad",
                "--end-date=2026-01-02",
                "--table-name=activity_log",
            ],
            ["run", "--start-date=2026-01-01"],
        ],
        ids=[
            "서브커맨드_없음",
            "없는_서브커맨드",
            "백필_필수_옵션_누락",
            "백필_잘못된_날짜_형식",
            "다른_서브커맨드의_인자_매핑",
        ],
    )
    def test_잘못된_입력이면_종료한다(self, argv):
        with pytest.raises(SystemExit):
            build_args_parser().parse_args(argv)


@patch("main._build_app_context")
@patch("main.run_backfill")
@patch("main.run_batch")
class TestMain:

    def test_run_인자로_실행하면_정상배치가_돈다(
        self, mock_run_batch, mock_run_backfill, mock_build_app_context
    ):
        main(["run"])

        app_ctx = mock_build_app_context.return_value

        mock_run_batch.assert_called_once_with(app_ctx)
        mock_run_backfill.assert_not_called()

    @patch("main._build_bigquery_context")
    @patch("main.run_transform")
    def test_transform_인자로_실행하면_변환쿼리가_실행된다(
        self,
        mock_transform,
        mock_bigquery_context,
        mock_run_batch,
        mock_run_backfill,
        mock_app_context,
    ):
        main(["transform"])

        bq_ctx = mock_bigquery_context.return_value

        mock_transform.assert_called_once_with(bq_ctx)

        mock_run_batch.assert_not_called()
        mock_run_backfill.assert_not_called()
        mock_app_context.assert_not_called()

    def test_backfill_인자로_실행하면_백필배치가_돈다(
        self, mock_run_batch, mock_run_backfill, mock_build_app_context, backfill_argv
    ):
        main(backfill_argv)

        app_ctx = mock_build_app_context.return_value

        mock_run_backfill.assert_called_once_with(
            app_ctx,
            BackfillConfig(
                table_name="activity_log",
                start_date="2026-01-01",
                end_date="2026-01-02",
            ),
        )
        mock_run_batch.assert_not_called()

    def test_백필필수_인자가_빠지면_아무것도_실행하지_않는다(
        self, mock_run_batch, mock_run_backfill, mock_build_app_context
    ):
        with pytest.raises(SystemExit):
            main(["backfill"])

        mock_run_batch.assert_not_called()
        mock_run_backfill.assert_not_called()
        mock_build_app_context.assert_not_called()
