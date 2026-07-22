from dataclasses import dataclass
import yaml

from config import SOURCE_CONFIG_DIR

@dataclass(frozen=True)
class SourceTable:
    name: str
    columns: list[str]
    primary_key: str
    load_mode: str
    incremental_key: str | None = None


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
                tables=[SourceTable(**t) for t in s["tables"]],
            )
    raise KeyError(f"Source {name} not found")

