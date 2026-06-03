-- =============================================================
-- 007 이력 조회 — 인덱스 + get_record_history RPC
-- =============================================================
-- M-S-3 "이력 탭"용. 완료한 포모도로의 전체/오늘 집계 + 개별
-- 최신순 로그를 조회 시점에 즉석 집계(COUNT/SUM)하여 반환한다.
--   데이터 소스 : pomodoros JOIN pomodoro_sessions (분석 파이프라인과 분리)
--   집중시간    : SUM(pomodoro_sessions.focus_minutes) — 계획값
--   신뢰 경계   : user_id는 외부 파라미터가 아닌 auth.uid()로 직접 조회


-- -------------------------------------------------------------
-- 1. 인덱스 — 이력 조회 (user_id + status 필터, completed_at 정렬)
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pomodoros_user_status_completed
  ON public.pomodoros (user_id, status, completed_at DESC);


-- -------------------------------------------------------------
-- 2. get_record_history — 이력 집계 + 개별 로그 (커서 페이지네이션)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_record_history(
  p_cursor  TIMESTAMPTZ DEFAULT NULL,
  p_limit   INTEGER     DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id       UUID := auth.uid();
  v_today_start   TIMESTAMPTZ;
  v_total_count   INTEGER;
  v_total_minutes INTEGER;
  v_today_count   INTEGER;
  v_today_minutes INTEGER;
  v_logs          JSON;
  v_has_more      BOOLEAN;
  v_next_cursor   TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  -- 오늘 0시(KST)를 UTC 순간으로 환산 — completed_at(TIMESTAMPTZ) 비교용
  v_today_start :=
    date_trunc('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';

  -- (1)(2) 집계 — 전체 / 오늘 (한 번의 스캔에서 FILTER로 동시 산출)
  SELECT
    COUNT(*),
    COALESCE(SUM(s.focus_minutes), 0),
    COUNT(*) FILTER (WHERE p.completed_at >= v_today_start),
    COALESCE(SUM(s.focus_minutes) FILTER (WHERE p.completed_at >= v_today_start), 0)
  INTO v_total_count, v_total_minutes, v_today_count, v_today_minutes
  FROM public.pomodoros p
  JOIN public.pomodoro_sessions s ON s.id = p.session_id
  WHERE p.user_id = v_user_id
    AND p.status = 'completed'
    AND p.completed_at IS NOT NULL;

  -- (3)(4) 개별 로그 — 최신순, 커서 이후, limit + 1건 조회로 다음 페이지 판정
  WITH page AS (
    SELECT
      p.id            AS pomodoro_id,
      p.completed_at  AS completed_at,
      s.focus_minutes AS focus_minutes,
      ROW_NUMBER() OVER (ORDER BY p.completed_at DESC) AS rn
    FROM public.pomodoros p
    JOIN public.pomodoro_sessions s ON s.id = p.session_id
    WHERE p.user_id = v_user_id
      AND p.status = 'completed'
      AND p.completed_at IS NOT NULL
      AND (p_cursor IS NULL OR p.completed_at < p_cursor)
    ORDER BY p.completed_at DESC
    LIMIT p_limit + 1
  )
  SELECT
    COALESCE(
      json_agg(
        json_build_object(
          'pomodoro_id',   page.pomodoro_id,
          'completed_at',  page.completed_at,
          'focus_minutes', page.focus_minutes
        )
        ORDER BY page.completed_at DESC
      ) FILTER (WHERE page.rn <= p_limit),
      '[]'::json
    ),
    COALESCE(bool_or(page.rn > p_limit), FALSE),
    MIN(page.completed_at) FILTER (WHERE page.rn <= p_limit)
  INTO v_logs, v_has_more, v_next_cursor
  FROM page;

  -- 다음 페이지가 없으면 커서는 NULL (마지막 반환 항목의 completed_at = 가장 오래된 것)
  IF NOT v_has_more THEN
    v_next_cursor := NULL;
  END IF;

  RETURN json_build_object(
    'summary', json_build_object(
      'total', json_build_object(
        'count', v_total_count, 'focus_minutes', v_total_minutes
      ),
      'today', json_build_object(
        'count', v_today_count, 'focus_minutes', v_today_minutes
      )
    ),
    'logs', v_logs,
    'next_cursor', v_next_cursor
  );
END;
$$;
