-- =============================================================
-- start_session: 포모도로 세션 시작 트랜잭션
-- =============================================================
--
-- 트랜잭션으로 묶을 내용:
--   1) 세션 생성 (pomodoro_sessions INSERT)
--   2) 포모도로 생성 (pomodoros INSERT)
--   3) 세션 생성 로그 (activity_log INSERT)
--   4) 프로필 업데이트 (profiles UPDATE)
--
-- 호출 예시:
--   SELECT public.start_session(
--     '00000000-0000-0000-0000-000000000001',  -- p_user_id
--     25,   -- p_focus_minutes
--     5,    -- p_short_break_minutes
--     15,   -- p_long_break_minutes
--     4,    -- p_target_count
--     NULL  -- p_character_instance_id (nullable)
--   );
--
-- 반환값:
--   { "session_id": 1, "pomodoro_id": 1 }

CREATE OR REPLACE FUNCTION public.start_session(
  p_user_id              UUID,
  p_focus_minutes        INTEGER,
  p_short_break_minutes  INTEGER,
  p_long_break_minutes   INTEGER,
  p_target_count         INTEGER,
  p_character_instance_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id  INTEGER;
  v_pomodoro_id INTEGER;
  v_now         TIMESTAMPTZ := NOW();
BEGIN
  -- 1) pomodoro_sessions INSERT
  INSERT INTO public.pomodoro_sessions (
    user_id, character_instance_id, target_count, focus_minutes,
    short_break_minutes, long_break_minutes, status, started_at
  ) VALUES (
    p_user_id, p_character_instance_id, p_target_count, p_focus_minutes,
    p_short_break_minutes, p_long_break_minutes, 'in_progress', v_now
  ) RETURNING id INTO v_session_id;
  
  -- 2) pomodoros INSERT (첫 번째 포모도로)
  INSERT INTO public.pomodoros (
    session_id, user_id, status, started_at
  ) VALUES (
    v_session_id, p_user_id, 'in_progress', v_now
  ) RETURNING id INTO v_pomodoro_id;
  
  -- 3) activity_log INSERT
  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata
  ) VALUES (
    p_user_id, 'session', 'session_started',
    jsonb_build_object(
      'session_id', v_session_id,
      'pomodoro_id', v_pomodoro_id,
      'focus_minutes', p_focus_minutes,
      'character_instance_id', p_character_instance_id
    )
  );

  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata
  ) VALUES (
    p_user_id, 'pomodoro', 'pomodoro_started',
    jsonb_build_object(
      'session_id', v_session_id,
      'pomodoro_id', v_pomodoro_id
    )
  );

  -- 4) profiles.last_session_at UPDATE
  UPDATE public.profiles
  SET last_session_at = v_now
  WHERE id = p_user_id;

  RETURN json_build_object(
    'session_id', v_session_id,
    'pomodoro_id', v_pomodoro_id
  );
END;
$$;
