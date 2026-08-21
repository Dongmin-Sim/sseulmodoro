from pathlib import Path
from unittest.mock import call, patch

import pytest
from schema.sources import (
    LoadMode,
    Source,
    SourceTable,
    load_source_config,
    prepare_load_schema,
    prepare_transform_schema,
)

RESOURCES_PATH = Path(__file__).parent / "resources"
YAML_FIXTURES_PATH = RESOURCES_PATH / "fixture_source_schema.yaml"

source_name = 'test_app'

class TestLoadSourceConfig:
    def test_load_source_config_Source를_반환한다(self):
        res = load_source_config(source_name, None, YAML_FIXTURES_PATH)
        assert isinstance(res, Source)

    def test_load_source_config_YAML의_소스와_테이블_필드가_매핑된다(self):
        sources = load_source_config(source_name, None, YAML_FIXTURES_PATH)

        assert sources.type == "postgres"
        assert sources.table_names == ["test_log", "test_session"]

        source_table = sources.tables[0]
        assert source_table.name == "test_log"
        assert source_table.columns == ["id", "user_id", "created_at"]
        assert source_table.load_mode == LoadMode.INCREMENTAL_APPEND

    def test_load_source_config_없는_소스_이름이_주어지면_KeyError를_던진다(self):
        wrong_source_name = "WRONG NAME"
        with pytest.raises(KeyError):
            load_source_config(wrong_source_name, "test_log", YAML_FIXTURES_PATH)

    def test_load_source_config_table_인자가_없으면_모든_테이블이_담긴다(self):
        source = load_source_config(source_name, None, YAML_FIXTURES_PATH)

        assert source.table_names == ["test_log", "test_session"]

    def test_load_source_config_table_인자가_주어지면_해당_테이블만_담긴다(self):
        source = load_source_config(source_name, "test_log", YAML_FIXTURES_PATH)

        assert source.table_names == ["test_log"]

    def test_load_source_config_없는_테이블_이름이_주어지면_KeyError를_던진다(self):
        table_name = "test_wrong"

        with pytest.raises(KeyError):
            load_source_config(source_name, table_name, YAML_FIXTURES_PATH)


class TestSourceTable:
    @staticmethod
    def _valid(**overrides) -> SourceTable:
        base = {
            "name": "test_log",
            "columns": ["id"],
            "primary_key": "id",
            "load_mode": LoadMode.FULL,
            "incremental_key": None,
            "backfill_key": None,
            "merge_key": None,
        }
        # pyrefly: ignore [bad-argument-type]
        return SourceTable(**{**base, **overrides})

    @pytest.mark.parametrize("columns", [[], None])
    def test_컬럼이_없거나_리스트가_비어있으면_ValueError를_던진다(self, columns):
        with pytest.raises(ValueError):
            self._valid(columns=columns)

    def test_load_mode가_incremental인데_key가_없으면_ValueError를_던진다(self):
        with pytest.raises(ValueError):
            self._valid(
                load_mode=LoadMode.INCREMENTAL_APPEND,
                incremental_key=None,
                backfill_key="created_at",
            )

    def test_load_mode가_incremental인데_backfill_key가_없으면_ValueError를_던진다(self):
        with pytest.raises(ValueError):
            self._valid(
                load_mode=LoadMode.INCREMENTAL_APPEND,
                incremental_key="id",
                backfill_key=None,
            )

    @pytest.mark.parametrize(
        "incremental_key, merge_key", [("updated_at", None), (None, "updated_at")]
    )
    def test_load_mode가_incremental_upsert인데_merge_key_없으면_ValueError를_던진다(self, incremental_key, merge_key):
        with pytest.raises(ValueError):
            self._valid(
                load_mode=LoadMode.INCREMENTAL_UPSERT,
                incremental_key=incremental_key,
                merge_key=merge_key
            )


class TestPrepareLoadSchema:
    @patch("schema.sources.create_dataset")
    def test_load에_필요한_데이터세트를_순서대로_생성한다(self, mock_create_dataset, gcp_client):
        prepare_load_schema(gcp_client)

        expected_args = [
            call(gcp_client, "_load_stage"),
            call(gcp_client, "raw"),
            call(gcp_client, "meta"),
        ]

        assert mock_create_dataset.call_args_list == expected_args

    @patch("schema.sources.create_table_from_ddl_file")
    def test_load에_필요한_테이블만_생성한다(self, mock_create_table_from_ddl_file, gcp_client):
        prepare_load_schema(gcp_client)

        expected_args = [
            call(gcp_client, "watermark_store", "meta_watermark_store.sql"),
        ]

        assert mock_create_table_from_ddl_file.call_args_list == expected_args


class TestPrepareTransformSchema:
    @patch("schema.sources.create_dataset")
    def test_transform에_필요한_데이터세트를_순서대로_생성한다(self, mock_create_dataset, gcp_client):
        prepare_transform_schema(gcp_client)

        expected_args = [
            call(gcp_client, "stage"),
            call(gcp_client, "mart"),
        ]

        assert mock_create_dataset.call_args_list == expected_args

    @patch("schema.sources.create_table_from_ddl_file")
    def test_적재용_테이블은_생성하지_않는다(self, mock_create_table_from_ddl_file, gcp_client):
        prepare_transform_schema(gcp_client)

        ddl_files = [c.args[2] for c in mock_create_table_from_ddl_file.call_args_list]

        assert ddl_files
        assert not any(f.startswith("meta_") for f in ddl_files)
