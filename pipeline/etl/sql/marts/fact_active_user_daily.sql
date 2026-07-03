SELECT
    ps.user_id,
    DATE(ps.created_at, 'Asia/Seoul') AS activity_date_kst
FROM
    `raw.activity_log` ps
WHERE
    ps.user_id IS NOT NULL AND
    ps.event_category = 'app' AND
    ps.event_type = 'app_visited'
GROUP BY
    ps.user_id,
    DATE(ps.created_at, 'Asia/Seoul')
;
