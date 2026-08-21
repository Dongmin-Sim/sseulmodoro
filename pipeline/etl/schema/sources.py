from dataclasses import dataclass
from enum import Enum

import yaml
from config import SOURCE_CONFIG_DIR
from google.cloud import bigquery
from utils.gcp import create_dataset, create_table_from_ddl_file


def prepare_load_schema(bq_client: bigquery.Client) -> None:
    create_dataset(bq_client, "_load_stage")
    create_dataset(bq_client, 'raw')

    create_dataset(bq_client, 'meta')
    create_table_from_ddl_file(bq_client, 'watermark_store', 'meta_watermark_store.sql')


def prepare_transform_schema(bq_client: bigquery.Client) -> None:
    create_dataset(bq_client, 'stage')
    create_table_from_ddl_file(bq_client, 'activity_log_app_visited', 'stage_activity_log_app_visited.sql')

    create_dataset(bq_client, 'mart')
    create_table_from_ddl_file(bq_client, 'fact_pomodoro_sessions', 'mart_fact_pomodoro_sessions.sql')
    create_table_from_ddl_file(bq_client, 'active_user_daily', 'mart_active_user_daily.sql')
    create_table_from_ddl_file(bq_client, 'active_user_weekly', 'mart_active_user_weekly.sql')
    create_table_from_ddl_file(bq_client, 'agg_pomodoro_weekly', 'mart_agg_pomodoro_weekly.sql')
    create_table_from_ddl_file(bq_client, 'agg_nsm_weekly', 'mart_agg_nsm_weekly.sql')


class LoadMode(Enum):
    FULL = "full"
    INCREMENTAL_APPEND = "incremental_append"
    INCREMENTAL_UPSERT = "incremental_upsert"

@dataclass(frozen=True)
class SourceTable:
    # TODO: rename(SourceSchema) + 분리(loadmode에 따른 소스 스키마)
    name: str
    columns: list[str]
    primary_key: str
    load_mode: LoadMode
    incremental_key: str | None = None
    incremental_key_type: str | None = None
    backfill_key: str | None = None
    merge_key: str | None = None

    def __post_init__(self):
        if not self.columns:
            raise ValueError(f"{self.name} columns cannot be empty")

        if self.load_mode is LoadMode.INCREMENTAL_APPEND:
            self._valid_attr(("incremental_key", "incremental_key_type", "backfill_key"))

        if self.load_mode is LoadMode.INCREMENTAL_UPSERT:
            self._valid_attr(("incremental_key", "incremental_key_type", "merge_key"))

    def _valid_attr(self, attr_names: tuple[str, ...]) -> None:
        missing = [f for f in attr_names if not getattr(self, f)]
        if missing:
            raise ValueError(
                f"{self.name}: load_mode={self.load_mode.value} requires "
                f"{', '.join(missing)}"
            )

    @property
    def is_incremental_append(self) -> bool:
        return self.load_mode is LoadMode.INCREMENTAL_APPEND

    @property
    def is_upsert(self) -> bool:
        return self.load_mode is LoadMode.INCREMENTAL_UPSERT

    @property
    def required_incremental_key(self) -> str:
        if self.incremental_key is None:
            raise ValueError(f"{self.name} incremental_key required for incremental")
        return self.incremental_key

    @property
    def required_incremental_key_type(self) -> str:
        if self.incremental_key_type is None:
            raise ValueError(f"{self.name} incremental_key_type required for incremental")
        return self.incremental_key_type

    @property
    def required_backfill_key(self) -> str:
        if self.backfill_key is None:
            raise ValueError(f"{self.name} backfill_key required for incremental")
        return self.backfill_key

    @property
    def required_merge_key(self) -> str:
        if self.merge_key is None:
            raise ValueError(f"{self.name} merge_key required for upsert")
        return self.merge_key


@dataclass(frozen=True)
class Source:
    name: str
    type: str
    tables: list[SourceTable]

    @property
    def table_names(self) -> list[str]:
        return [t.name for t in self.tables]


def load_source_config(name: str, table: str | None, path=SOURCE_CONFIG_DIR) -> Source:
    with open(path, "r") as f:
        src_schema_config = yaml.safe_load(f)

    for s in src_schema_config["sources"]:
        if s["name"] == name:
            return Source(
                name=name,
                type=s["type"],
                tables=to_source_tables(s["tables"], table),
            )
    raise KeyError(f"Source {name} not found")


def to_source_tables(tables: list[dict], table: str | None) -> list[SourceTable]:
    source_tables = [
        SourceTable(
            name=t["name"],
            columns=t["columns"],
            primary_key=t["primary_key"],
            load_mode=LoadMode(t["load_mode"]),
            incremental_key=t.get("incremental_key"),
            incremental_key_type=t.get("incremental_key_type"),
            backfill_key=t.get("backfill_key"),
            merge_key=t.get("primary_key"),
        )
        for t in tables
        if table is None or t["name"] == table
    ]
    if not source_tables:
        raise KeyError(f"table {table} not found or empty tables")
    return source_tables
