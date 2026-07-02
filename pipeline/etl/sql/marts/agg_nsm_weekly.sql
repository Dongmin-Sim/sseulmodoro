WITH pomodoro_session_per_week as (
    SELECT
        DATE_TRUNC(DATE(fps.started_at, 'Asia/Seoul'), WEEK(MONDAY))  AS week_kst,
        SUM(fps.completed)                          AS total_completions,
        SUM(fps.target)                             AS total_target,
        COUNT(fps.session_id)                       AS total_sessions,
        COUNT(DISTINCT fps.user_id)                 AS active_user_count
    FROM
        `mart.fact_pomodoro_sessions` fps
    GROUP BY
        week_kst
)
SELECT
    pspw.week_kst,
    SAFE_DIVIDE(pspw.total_completions, pspw.active_user_count) AS completions_per_user,
    SAFE_DIVIDE(pspw.total_sessions,    pspw.active_user_count) AS sessions_per_user,
    SAFE_DIVIDE(pspw.total_target,      pspw.total_sessions)    AS target_per_session,
    SAFE_DIVIDE(pspw.total_completions, pspw.total_target)      AS completion_rate,
    pspw.active_user_count,
    pspw.total_sessions,
    pspw.total_completions,
    pspw.total_target
FROM
    pomodoro_session_per_week pspw;

