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
        "--table=activity_log",
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
        table="test",
    )

    res = _build_backfill_config(namespace)

    assert isinstance(res, BackfillConfig)
    assert res.start_date == "2026-01-01"
    assert res.end_date == "2026-12-31"


@patch("main._build_app_context")
@patch("main.run_batch")
def test_run은_args로_만든_컨텍스트로_run_batch를_호출한다(mock_run_batch, mock_app_context):
    args = Namespace()
    _run(args)

    app_ctx = mock_app_context.return_value

    mock_run_batch.assert_called_once_with(app_ctx)
    mock_app_context.assert_called_once_with(args)


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
    def test_build_args_parser_run_서브커맨드를_파싱한다(self):
        args = build_args_parser().parse_args(["run"])
        assert args.command == "run"

    def test_build_args_parser_backfill_인자를_네임스페이스에_담는다(self, backfill_argv):
        args = build_args_parser().parse_args(backfill_argv)

        assert args.command == "backfill"
        assert args.start_date == "2026-01-01"
        assert args.end_date == "2026-01-02"
        assert args.table == "activity_log"

    @pytest.mark.parametrize(
        argnames="args, expected_func",
        argvalues=[
            (["run"], _run),
            (["transform"], _run_transform),
            (
                [
                    "backfill",
                    "--start-date=2026-01-01",
                    "--end-date=2026-01-02",
                    "--table=test",
                ],
                _run_backfill,
            ),
        ],
        ids=["run 서브커맨드", "transform 서브커맨드", "backfill 서브커맨드"],
    )
    def test_build_args_parser_서브커맨드마다_실행함수가_매핑된다(
        self, args, expected_func
    ):
        parser = build_args_parser()
        parsed_namespace = parser.parse_args(args)

        assert parsed_namespace.func is expected_func

    def test_build_args_parser_run_서브커맨드에_table_인자가_없으면_None이_담긴다(self):
        args = ["run"]

        parser = build_args_parser()
        parsed_namespace = parser.parse_args(args)

        assert parsed_namespace.table is None

    def test_build_args_parser_run_서브커맨드에_table_인자가_있으면_테이블_이름이_담긴다(self):
        args = ["run", "--table=test_table"]

        parser = build_args_parser()
        parsed_namespace = parser.parse_args(args)

        assert parsed_namespace.table == "test_table"

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
                "--table=activity_log",
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
    def test_build_args_parser_잘못된_입력이면_종료한다(self, argv):
        with pytest.raises(SystemExit):
            build_args_parser().parse_args(argv)


@patch("main._build_app_context")
@patch("main.run_backfill")
@patch("main.run_batch")
class TestMain:
    def test_run_서브커맨드로_실행하면_run_batch가_호출된다(
        self, mock_run_batch, mock_run_backfill, mock_build_app_context
    ):
        main(["run"])

        app_ctx = mock_build_app_context.return_value

        mock_run_batch.assert_called_once_with(app_ctx)
        mock_run_backfill.assert_not_called()

    @patch("main._build_bigquery_context")
    @patch("main.run_transform")
    def test_transform_서브커맨드로_실행하면_run_transform이_호출된다(
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

    def test_backfill_서브커맨드로_실행하면_run_backfill이_호출된다(
        self, mock_run_batch, mock_run_backfill, mock_build_app_context, backfill_argv
    ):
        main(backfill_argv)

        app_ctx = mock_build_app_context.return_value

        mock_run_backfill.assert_called_once_with(
            app_ctx,
            BackfillConfig(
                start_date="2026-01-01",
                end_date="2026-01-02",
            ),
        )
        mock_run_batch.assert_not_called()

    def test_backfill_필수_인자가_빠지면_아무것도_실행하지_않는다(
        self, mock_run_batch, mock_run_backfill, mock_build_app_context
    ):
        with pytest.raises(SystemExit):
            main(["backfill"])

        mock_run_batch.assert_not_called()
        mock_run_backfill.assert_not_called()
        mock_build_app_context.assert_not_called()
