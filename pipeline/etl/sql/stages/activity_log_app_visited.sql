SELECT
    al.id,
    al.user_id,
    al.event_category,
    al.event_type,
    al.created_at
FROM
    `raw.activity_log` al
WHERE
    al.user_id IS NOT NULL AND
    al.event_category = 'app' AND
    al.event_type = 'app_visited'
;
