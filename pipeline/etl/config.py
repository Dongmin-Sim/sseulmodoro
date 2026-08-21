from pathlib import Path

ETL_DIR = Path(__file__).parent

SQL_DIR = ETL_DIR / "sql"
DDL_DIR = SQL_DIR / "ddl"

SCHEMA_DIR = ETL_DIR / "schema"
SOURCE_CONFIG_DIR = SCHEMA_DIR / "source_schema.yaml"