import pytest
from pathlib import Path
from schema.sources import load_source_config, SourceTable, Source, LoadMode

RESOURCES_PATH = Path(__file__).parent / "resources"
YAML_FIXTURES_PATH = RESOURCES_PATH / "fixture_source_schema.yaml"

source_name = 'test_app'

class TestLoadSourceConfig:
    def test_load_source_config(self):
        res = load_source_config(source_name, YAML_FIXTURES_PATH)
        assert isinstance(res, Source)

    def test_parses_table_fields(self):
        sources = load_source_config(source_name, YAML_FIXTURES_PATH)
        orders = sources.tables[0]
        assert orders.name == "test_log"
        assert orders.columns == ["id", "user_id", "created_at"]
        assert orders.load_mode == LoadMode.INCREMENTAL

    def test_table_names_returns_all_names(self):
        res = load_source_config(source_name, YAML_FIXTURES_PATH)
        assert res.table_names == ['test_log', 'test_session']

    def test_fail_wrong_name(self):
        with pytest.raises(KeyError):
            load_source_config("WRONG NAME", YAML_FIXTURES_PATH)


class TestSourceTable:
    @staticmethod
    def _valid(**overrides) -> SourceTable:
        base = dict(
            name="test_log",
            columns=["id"],
            primary_key="id",
            load_mode=LoadMode.FULL,
            incremental_key=None,
        )
        # pyrefly: ignore [bad-argument-type]
        return SourceTable(**{**base, **overrides})

    @pytest.mark.parametrize("columns", [[], None])
    def test_컬럼이_없거나_리스트가_비어있으면_ValueError를_던진다(self, columns):
        with pytest.raises(ValueError):
            self._valid(columns=columns)

    def test_load_mode가_incremental인데_key가_없으면_ValueError를_던진다(self):
        with pytest.raises(ValueError):
            self._valid(
                load_mode=LoadMode.INCREMENTAL,
                incremental_key=None,
            )
