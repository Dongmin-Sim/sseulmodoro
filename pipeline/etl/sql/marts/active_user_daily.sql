SELECT
    DATE(alav.created_at, 'Asia/Seoul') AS date_kst,
    COUNT(distinct alav.user_id)        AS active_user_count
FROM
    `stage.activity_log_app_visited` alav
GROUP BY
    date_kst
;
