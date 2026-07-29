from unittest.mock import Mock

import pytest
from context import AppContext, BackfillConfig
from schema.sources import LoadMode, Source, SourceTable


@pytest.fixture
def gcp_client() -> Mock:
    client = Mock()
    client.project = "test"
    return client


@pytest.fixture
def make_source_table_full():
    def _make(**overrides) -> SourceTable:
        base = {
            "name": "test_log",
            "columns": ["id"],
            "primary_key": "id",
            "load_mode": LoadMode.FULL,
            "incremental_key": None,
        }
        # pyrefly: ignore [bad-argument-type]
        return SourceTable(**{**base, **overrides})

    return _make


@pytest.fixture
def make_source_table_incremental():
    from schema.sources import LoadMode, SourceTable

    def _make(**overrides) -> SourceTable:
        base = {
            "name": "test_log",
            "columns": ["id"],
            "primary_key": "id",
            "load_mode": LoadMode.INCREMENTAL_APPEND,
            "incremental_key": "id",
            "backfill_key": "created_at",
        }
        # pyrefly: ignore [bad-argument-type]
        return SourceTable(**{**base, **overrides})

    return _make


@pytest.fixture
def app_context(gcp_client, make_source_table_full, make_source_table_incremental):
    def _make(**overrides) -> AppContext:
        base = {
            "source_database_url": "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
            "bigquery_project": "bigquery-test-project",
            "bigquery_client": gcp_client,
            "source_schema": Source(
                "test_app",
                "postgres",
                [
                    make_source_table_full(),
                    make_source_table_incremental(name="test_backfill_table")
                ]
            ),
            "bigquery_schema":{
                "test_backfill_table": []
            }
        }
        # pyrefly: ignore [bad-argument-type]
        return AppContext(**{**base, **overrides})
    return _make


@pytest.fixture
def backfill_config():
    def _make(**overrides) -> BackfillConfig:
        base = {
            "table_name": "test_backfill_table",
            "start_date": "2026-01-01",
            "end_date": "2026-01-02",
        }
        # pyrefly: ignore [bad-argument-type]
        return BackfillConfig(**{**base, **overrides})
    return _make