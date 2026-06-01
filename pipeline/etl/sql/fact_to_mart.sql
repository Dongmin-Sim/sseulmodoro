SELECT
    t.week_kst,
    ROUND(AVG(t.completions), 2) as nsm,
    SUM(t.completions) as total_completions,
    COUNT(1) as active_user_count
FROM (
SELECT 
    DATE_TRUNC(fdu.event_date_kst, WEEK(MONDAY)) as week_kst,
    SUM(fdu.completions) as completions
FROM
    `fact.daily_user_pomodoro_completions` fdu
GROUP BY 
    week_kst, 
    fdu.user_id
) t 
GROUP BY
t.week_kst;