CREATE TABLE IF NOT EXISTS `{project_id}.meta.watermark_store` (
    source_name             STRING
    OPTIONS(description="원천시스템"),
    watermark_value         STRING
    OPTIONS(description="기준 워터마크"),
    marked_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="작업 기록")
)
