SELECT
    wau.date_kst,
    SAFE_DIVIDE(COALESCE(wap.total_completions, 0), wau.active_user_count) AS completions_per_user,
    SAFE_DIVIDE(COALESCE(wap.total_sessions, 0), wau.active_user_count) AS sessions_per_user,
    SAFE_DIVIDE(wap.total_target, wap.total_sessions)    AS target_per_session,
    SAFE_DIVIDE(wap.total_completions, wap.total_target)      AS completion_rate,
    wau.active_user_count
FROM
    `mart.active_user_weekly` wau
LEFT JOIN
    `mart.agg_pomodoro_weekly` wap
ON
    wau.date_kst = wap.date_kst
;

