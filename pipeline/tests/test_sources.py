import pytest
from pathlib import Path
from schema.sources import load_source_config, SourceTable, Source

RESOURCES_PATH = Path(__file__).parent / "resources"
YAML_FIXTURES_PATH = RESOURCES_PATH / "fixture_source_schema.yaml"

source_name = 'test_app'

def test_load_source_config():
    res = load_source_config(source_name, YAML_FIXTURES_PATH)
    assert isinstance(res, Source)


def test_parses_table_fields():
    sources = load_source_config(source_name, YAML_FIXTURES_PATH)
    orders = sources.tables[0]
    assert orders.name == "test_log"
    assert orders.columns == ["id", "user_id", "created_at"]
    assert orders.load_mode == "incremental"


def test_table_names_returns_all_names():
    res = load_source_config(source_name, YAML_FIXTURES_PATH)
    assert res.table_names == ['test_log', 'test_session']

def test_fail_wrong_name():
    with pytest.raises(KeyError):
        load_source_config("WRONG NAME", YAML_FIXTURES_PATH)
