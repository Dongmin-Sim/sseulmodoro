SELECT
    al.user_id, 
    DATE(al.created_at, 'Asia/Seoul') as event_date_kst,
    COUNT(al.id) as completions
FROM
    `raw.activity_log` al
WHERE 
    al.event_type = 'pomodoro_completed'
GROUP BY
    al.user_id,
    DATE(al.created_at, 'Asia/Seoul');