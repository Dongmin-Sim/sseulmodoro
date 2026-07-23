from google.cloud import bigquery

RAW_ACTIVITY_LOG_TABLE_SCHEMA = [
    bigquery.SchemaField("id", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
    bigquery.SchemaField("user_id", bigquery.enums.SqlTypeNames.STRING, mode="NULLABLE"),
    bigquery.SchemaField("event_category", bigquery.enums.SqlTypeNames.STRING, mode="NULLABLE"),
    bigquery.SchemaField("event_type", bigquery.enums.SqlTypeNames.STRING, mode="NULLABLE"),
    bigquery.SchemaField("metadata", bigquery.enums.SqlTypeNames.STRING, mode="NULLABLE"),
    bigquery.SchemaField("created_at", bigquery.enums.SqlTypeNames.TIMESTAMP, mode="NULLABLE"),
    bigquery.SchemaField("loaded_at", bigquery.enums.SqlTypeNames.TIMESTAMP, mode="REQUIRED"),
]


RAW_POMODORO_SESSIONS_TABLE_SCHEMA = [
    bigquery.SchemaField("id", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
    bigquery.SchemaField("user_id", bigquery.enums.SqlTypeNames.STRING, mode="NULLABLE"),
    bigquery.SchemaField("character_instance_id", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
    bigquery.SchemaField("target_count", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
    bigquery.SchemaField("completed_count", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
    bigquery.SchemaField("focus_minutes", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
    bigquery.SchemaField("short_break_minutes", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
    bigquery.SchemaField("long_break_minutes", bigquery.enums.SqlTypeNames.INT64, mode="NULLABLE"),
    bigquery.SchemaField("status", bigquery.enums.SqlTypeNames.STRING, mode="NULLABLE"),
    bigquery.SchemaField("started_at", bigquery.enums.SqlTypeNames.TIMESTAMP, mode="NULLABLE"),
    bigquery.SchemaField("ended_at", bigquery.enums.SqlTypeNames.TIMESTAMP, mode="NULLABLE"),
    bigquery.SchemaField("created_at", bigquery.enums.SqlTypeNames.TIMESTAMP, mode="NULLABLE"),
    bigquery.SchemaField("loaded_at", bigquery.enums.SqlTypeNames.TIMESTAMP, mode="REQUIRED"),
]

RAW_SCHEMAS = {
    "activity_log": RAW_ACTIVITY_LOG_TABLE_SCHEMA,
    "pomodoro_sessions": RAW_POMODORO_SESSIONS_TABLE_SCHEMA,
}
