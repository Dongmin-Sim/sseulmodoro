WITH pomodoro_session_per_week as (
    SELECT
        DATE_TRUNC(DATE(fps.started_at, 'Asia/Seoul'), WEEK(MONDAY))  AS week_kst,
        SUM(fps.completed)                          AS total_completions,
        SUM(fps.target)                             AS total_target,
        COUNT(fps.session_id)                       AS total_sessions
    FROM
        `mart.fact_pomodoro_sessions` fps
    GROUP BY
        week_kst
),
active_user_per_week AS (
    SELECT
        DATE_TRUNC(faud.activity_date_kst, WEEK(MONDAY))    AS week_kst,
        COUNT(distinct faud.user_id)                        AS active_user_count
    FROM
        `mart.fact_active_user_daily` faud
    GROUP BY
        week_kst
)
SELECT
    aupw.week_kst,
    SAFE_DIVIDE(COALESCE(pspw.total_completions, 0), aupw.active_user_count) AS completions_per_user,
    SAFE_DIVIDE(COALESCE(pspw.total_sessions, 0), aupw.active_user_count) AS sessions_per_user,
    SAFE_DIVIDE(pspw.total_target, pspw.total_sessions)    AS target_per_session,
    SAFE_DIVIDE(pspw.total_completions, pspw.total_target)      AS completion_rate,
    aupw.active_user_count,
    COALESCE(pspw.total_sessions, 0)                AS total_sessions,
    COALESCE(pspw.total_completions, 0)             AS total_completions,
    COALESCE(pspw.total_target, 0)                  AS total_target
FROM
    active_user_per_week aupw
LEFT JOIN
    pomodoro_session_per_week pspw
ON
    aupw.week_kst = pspw.week_kst
;

