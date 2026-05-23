

SCHEMA_DDL = """
CREATE SCHEMA IF NOT EXISTS `{schema_id}`
"""

ACTIVITY_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS `{table_id}`(
    id             INT64 NOT NULL,
    user_id        STRING,
    event_category STRING NOT NULL,
    event_type     STRING NOT NULL,
    metadata       JSON,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL)
"""