from dataclasses import dataclass

from google.cloud import bigquery
from google.cloud.bigquery import SchemaField
from schema.sources import Source


@dataclass(frozen=True)
class BigqueryContext:
    bigquery_client: bigquery.Client
    bigquery_schema: dict[str, list[SchemaField]]


@dataclass(frozen=True)
class AppContext:
    source_database_url: str
    source_schema: Source
    bigquery_context: BigqueryContext

    @property
    def bigquery_client(self) -> bigquery.Client:
        return self.bigquery_context.bigquery_client

    @property
    def bigquery_schema(self) -> dict[str, list[SchemaField]]:
        return self.bigquery_context.bigquery_schema


@dataclass(frozen=True)
class BackfillConfig:
    table_name: str
    start_date: str
    end_date: str

    def __post_init__(self) -> None:
        if self.start_date > self.end_date:
            raise ValueError(
                f"start_date({self.start_date}) must be <= end_date({self.end_date})"
            )
