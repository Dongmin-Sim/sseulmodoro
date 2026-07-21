import pytest
from unittest.mock import Mock

@pytest.fixture
def gcp_client() -> Mock:
    client = Mock()
    client.project = "test"
    return client


@pytest.fixture
def make_source_table_full():
  from schema.sources import SourceTable, LoadMode
  def _make(**overrides) -> SourceTable:
      base = dict(
          name="test_log",
          columns=["id"],
          primary_key="id",
          load_mode=LoadMode.FULL,
          incremental_key=None,
      )
      # pyrefly: ignore [bad-argument-type]
      return SourceTable(**{**base, **overrides})
  return _make

@pytest.fixture
def make_source_table_incremental():
  from schema.sources import SourceTable, LoadMode
  def _make(**overrides) -> SourceTable:
      base = dict(
          name="test_log",
          columns=["id"],
          primary_key="id",
          load_mode=LoadMode.INCREMENTAL,
          incremental_key="id",
      )
      # pyrefly: ignore [bad-argument-type]
      return SourceTable(**{**base, **overrides})
  return _make
