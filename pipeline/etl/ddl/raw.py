RAW_ACTIVITY_LOG_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS `{project_id}.raw.activity_log`(
    id             INT64 NOT NULL,
    user_id        STRING,
    event_category STRING NOT NULL,
    event_type     STRING NOT NULL,
    metadata       JSON,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL)
"""