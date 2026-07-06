CREATE OR REPLACE TABLE `{project_id}.stage.activity_log_app_visited`(
    id                  INT64 NOT NULL
    OPTIONS(description="로그 ID"),
    user_id             STRING
    OPTIONS(description="사용자 uuid"),
    event_category      STRING NOT NULL
    OPTIONS(description="이벤트 종류"),
    event_type          STRING NOT NULL
    OPTIONS(description="이벤트 상세 종류"),
    created_at          TIMESTAMP
    OPTIONS(description="이벤트 생성 시각"),
    etl_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL
    OPTIONS(description="ETL 적재 시각. full refresh 시 INSERT로 기록")
)
PARTITION BY TIMESTAMP_TRUNC(created_at, DAY)
CLUSTER BY user_id;