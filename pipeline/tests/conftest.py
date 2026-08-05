from unittest.mock import Mock

import pytest
from context import AppContext, BackfillConfig, BigqueryContext
from google.cloud import bigquery
from schema.sources import LoadMode, Source, SourceTable


@pytest.fixture
def gcp_client() -> Mock:
    client = Mock()
    client.project = "test"
    return client


@pytest.fixture
def make_source_table_full():
    """
    default:
    - name: test_log
    - columns: [id]
    - primary_key: id
    - load_mode: FULL
    - incremental_key: None
    """
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
    """
    default:
    - name: test_log
    - columns: [id]
    - primary_key: id
    - load_mode: INCREMENTAL_APPEND
    - incremental_key: id
    - backfill_key: created_at
    """
    from schema.sources import LoadMode, SourceTable

    def _make(**overrides) -> SourceTable:
        base = {
            "name": "test_log",
            "columns": ["id"],
            "primary_key": "id",
            "load_mode": LoadMode.INCREMENTAL_APPEND,
            "incremental_key": "id",
            "incremental_key_type": "int",
            "backfill_key": "created_at",
        }
        # pyrefly: ignore [bad-argument-type]
        return SourceTable(**{**base, **overrides})

    return _make


@pytest.fixture
def make_source_table_upsert():
    """
    default:
    - name: test_log
    - columns: [id]
    - primary_key: id
    - load_mode: INCREMENTAL_UPSERT
    - incremental_key: updated_at
    - merge_key: id
    - backfill_key: created_at
    """
    from schema.sources import LoadMode, SourceTable

    def _make(**overrides) -> SourceTable:
        base = {
            "name": "test_log",
            "columns": ["id"],
            "primary_key": "id",
            "load_mode": LoadMode.INCREMENTAL_UPSERT,
            "incremental_key": "updated_at",
            "incremental_key_type": "timestamptz",
            "backfill_key": "created_at",
            "merge_key": "id",
        }
        # pyrefly: ignore [bad-argument-type]
        return SourceTable(**{**base, **overrides})

    return _make


@pytest.fixture
def bigquery_context(gcp_client):
    def _make(**overrides) -> BigqueryContext:
        base = {
            "bigquery_client": gcp_client,
            "bigquery_schema": {
                "test_log": [
                    bigquery.SchemaField(
                        "id", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"
                    ),
                    bigquery.SchemaField(
                        "user_id", bigquery.enums.SqlTypeNames.STRING, mode="NULLABLE"
                    ),
                ],
                "test_incremental_log": [
                    bigquery.SchemaField(
                        "id", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"
                    ),
                    bigquery.SchemaField(
                        "user_id", bigquery.enums.SqlTypeNames.STRING, mode="NULLABLE"
                    ),
                ],
            },
        }
        # pyrefly: ignore [bad-argument-type]
        return BigqueryContext(**{**base, **overrides})
    return _make


@pytest.fixture
def app_context(gcp_client, make_source_table_full, make_source_table_incremental, bigquery_context):
    def _make(**overrides) -> AppContext:
        base = {
            "source_database_url": "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
            "source_schema": Source(
                "test_app",
                "postgres",
                [
                    make_source_table_full(),
                    make_source_table_incremental(name="test_incremental_log"),
                ],
            ),
            "bigquery_context": bigquery_context(),
        }
        # pyrefly: ignore [bad-argument-type]
        return AppContext(**{**base, **overrides})
    return _make


@pytest.fixture
def backfill_config():
    def _make(**overrides) -> BackfillConfig:
        base = {
            "table_name": "test_incremental_log",
            "start_date": "2026-01-01",
            "end_date": "2026-01-02",
        }
        # pyrefly: ignore [bad-argument-type]
        return BackfillConfig(**{**base, **overrides})
    return _make