from dataclasses import dataclass
from enum import Enum

import yaml

from config import SOURCE_CONFIG_DIR

class LoadMode(Enum):
    FULL = "full"
    INCREMENTAL = "incremental"

@dataclass(frozen=True)
class SourceTable:
    name: str
    columns: list[str]
    primary_key: str
    load_mode: LoadMode
    incremental_key: str | None = None

    def __post_init__(self):
        if not self.columns:
            raise ValueError(f"{self.name} columns cannot be empty")
        if self.load_mode is LoadMode.INCREMENTAL and not self.incremental_key:
            raise ValueError(f"{self.name} incremental_key required for incremental")

    @property
    def is_incremental(self) -> bool:
        return self.load_mode is LoadMode.INCREMENTAL

    @property
    def required_incremental_key(self) -> str:
        if self.incremental_key is None:
            raise ValueError(f"{self.name} incremental_key required for incremental")
        return self.incremental_key


@dataclass(frozen=True)
class Source:
    name: str
    type:str
    tables: list[SourceTable]

    @property
    def table_names(self) -> list[str]:
        return [t.name for t in self.tables]


def load_source_config(name:str, path=SOURCE_CONFIG_DIR) -> Source:
    with open(path, "r") as f:
        src_schema_config = yaml.safe_load(f)

    for s in src_schema_config["sources"]:
        if s["name"] == name:
            return Source(
                name=name,
                type=s["type"],
                tables=to_source_tables(s["tables"]),
            )
    raise KeyError(f"Source {name} not found")


def to_source_tables(tables: list[dict]) -> list[SourceTable]:
    return [
        SourceTable(
            name=t["name"],
            columns=t["columns"],
            primary_key=t["primary_key"],
            load_mode=LoadMode(t["load_mode"]),
            incremental_key=t.get("incremental_key"),
        )
        for t in tables
    ]

