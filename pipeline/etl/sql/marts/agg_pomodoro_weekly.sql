SELECT
    DATE_TRUNC(DATE(fps.started_at, 'Asia/Seoul'), WEEK(MONDAY))  AS date_kst,
    SUM(fps.completed)                          AS total_completions,
    SUM(fps.target)                             AS total_target,
    COUNT(fps.session_id)                       AS total_sessions
FROM
    `mart.fact_pomodoro_sessions` fps
GROUP BY
    date_kst