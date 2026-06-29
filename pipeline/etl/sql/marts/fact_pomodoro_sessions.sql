SELECT
    id                as session_id,
    user_id,
    started_at,
    target_count      as target,
    completed_count   as completed,
    status
FROM `raw.pomodoro_sessions`
;