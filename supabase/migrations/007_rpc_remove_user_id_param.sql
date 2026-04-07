-- =============================================================
-- rpc 함수에서 p_user_id 파라미터 제거 → auth.uid() 직접 사용
-- =============================================================
-- 기존: API Route가 p_user_id를 전달 → 외부 입력, 조작 가능
-- 변경: 함수 내부에서 auth.uid()로 직접 가져옴 → 조작 불가
--
-- SECURITY DEFINER 함수에서도 auth.uid()는 호출자의 JWT 기반으로 동작.
-- 파라미터 시그니처가 변경되므로 기존 함수를 DROP 후 재생성.

-- 기존 함수 DROP (시그니처가 바뀌므로 REPLACE만으로는 불가)
DROP FUNCTION IF EXISTS public.start_session(UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.complete_pomodoro(INTEGER, UUID);
DROP FUNCTION IF EXISTS public.stop_pomodoro(INTEGER, UUID);
DROP FUNCTION IF EXISTS public.end_session(INTEGER, UUID);
DROP FUNCTION IF EXISTS public.start_next_pomodoro(INTEGER, UUID);


-- =============================================================
-- 1. start_session
-- =============================================================
CREATE OR REPLACE FUNCTION public.start_session(
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
  v_user_id     UUID := auth.uid();
  v_session_id  INTEGER;
  v_pomodoro_id INTEGER;
  v_now         TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.pomodoro_sessions (
    user_id, character_instance_id, target_count, focus_minutes,
    short_break_minutes, long_break_minutes, status, started_at
  ) VALUES (
    v_user_id, p_character_instance_id, p_target_count, p_focus_minutes,
    p_short_break_minutes, p_long_break_minutes, 'in_progress', v_now
  ) RETURNING id INTO v_session_id;

  INSERT INTO public.pomodoros (
    session_id, user_id, status, started_at
  ) VALUES (
    v_session_id, v_user_id, 'in_progress', v_now
  ) RETURNING id INTO v_pomodoro_id;

  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata
  ) VALUES (
    v_user_id, 'session', 'session_started',
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
    v_user_id, 'pomodoro', 'pomodoro_started',
    jsonb_build_object(
      'session_id', v_session_id,
      'pomodoro_id', v_pomodoro_id
    )
  );

  UPDATE public.profiles
  SET last_session_at = v_now
  WHERE id = v_user_id;

  RETURN json_build_object(
    'session_id', v_session_id,
    'pomodoro_id', v_pomodoro_id
  );
END;
$$;


-- =============================================================
-- 2. complete_pomodoro
-- =============================================================
CREATE OR REPLACE FUNCTION public.complete_pomodoro(
  p_pomodoro_id  INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id         UUID := auth.uid();
  v_session_id      INTEGER;
  v_completed_count INTEGER;
  v_target_count    INTEGER;
  v_now             TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.pomodoros
  SET status = 'completed', completed_at = v_now
  WHERE id      = p_pomodoro_id
    AND user_id = v_user_id
    AND status  = 'in_progress'
  RETURNING session_id INTO v_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pomodoro not found or already completed'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.pomodoro_sessions
  SET completed_count = completed_count + 1
  WHERE id = v_session_id
    AND completed_count < target_count
  RETURNING completed_count, target_count
    INTO v_completed_count, v_target_count;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'All pomodoros already completed for this session'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata, created_at
  ) VALUES (
    v_user_id, 'pomodoro', 'pomodoro_completed',
    json_build_object(
      'session_id', v_session_id,
      'pomodoro_id', p_pomodoro_id,
      'completed_count', v_completed_count,
      'target_count', v_target_count
    ),
    v_now
  );

  RETURN json_build_object(
    'pomodoro_id', p_pomodoro_id,
    'session_id', v_session_id,
    'completed_count', v_completed_count,
    'target_count', v_target_count
  );
END;
$$;


-- =============================================================
-- 3. stop_pomodoro
-- =============================================================
CREATE OR REPLACE FUNCTION public.stop_pomodoro(
  p_pomodoro_id  INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_session_id INTEGER;
  v_now        TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.pomodoros
  SET status = 'stopped'
  WHERE id      = p_pomodoro_id
    AND user_id = v_user_id
    AND status  = 'in_progress'
  RETURNING session_id
    INTO v_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pomodoro not found or already stopped'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata, created_at
  ) VALUES (
    v_user_id, 'pomodoro', 'pomodoro_stopped',
    json_build_object(
      'session_id', v_session_id,
      'pomodoro_id', p_pomodoro_id
    ),
    v_now
  );

  RETURN json_build_object(
    'pomodoro_id', p_pomodoro_id,
    'session_id', v_session_id
  );
END;
$$;


-- =============================================================
-- 4. end_session
-- =============================================================
CREATE OR REPLACE FUNCTION public.end_session(
  p_session_id  INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id         UUID := auth.uid();
  v_completed_count INTEGER;
  v_point_value     INTEGER;
  v_points_earned   INTEGER;
  v_new_balance     INTEGER;
  v_now             TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.pomodoro_sessions
  SET status = 'completed', ended_at = v_now
  WHERE id      = p_session_id
    AND user_id = v_user_id
    AND status  = 'in_progress'
  RETURNING completed_count INTO v_completed_count;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or already ended'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT (value::INTEGER)
    INTO v_point_value
  FROM public.app_config
  WHERE key = 'pomodoro_point_value';

  IF v_point_value IS NULL THEN
    RAISE EXCEPTION 'pomodoro_point_value config missing'
      USING ERRCODE = 'P0002';
  END IF;

  v_points_earned := v_completed_count * v_point_value;

  IF v_points_earned > 0 THEN
    UPDATE public.profiles
    SET balance = balance + v_points_earned
    WHERE id = v_user_id
    RETURNING balance
      INTO v_new_balance;

    INSERT INTO public.point_transaction (
      user_id, tx_type, amount, running_balance, ref_id, ref_type, created_at
    ) VALUES (
      v_user_id, 'pomodoro_reward', v_points_earned, v_new_balance,
      p_session_id, 'pomodoro_session', v_now
    );
  ELSE
    SELECT balance
      INTO v_new_balance
    FROM public.profiles
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata, created_at
  ) VALUES (
    v_user_id, 'session', 'session_ended',
    json_build_object(
      'session_id', p_session_id,
      'completed_count', v_completed_count,
      'points_earned', v_points_earned,
      'new_balance', v_new_balance
    ),
    v_now
  );

  RETURN json_build_object(
    'session_id', p_session_id,
    'completed_count', v_completed_count,
    'points_earned', v_points_earned,
    'new_balance', v_new_balance
  );
END;
$$;


-- =============================================================
-- 5. start_next_pomodoro
-- =============================================================
CREATE OR REPLACE FUNCTION public.start_next_pomodoro(
  p_session_id  INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id          UUID := auth.uid();
  v_pomodoro_id      INTEGER;
  v_status           VARCHAR(20);
  v_completed_count  INTEGER;
  v_target_count     INTEGER;
  v_now              TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT status, completed_count, target_count
    INTO v_status, v_completed_count, v_target_count
  FROM public.pomodoro_sessions
  WHERE id = p_session_id AND user_id = v_user_id;

  IF v_status IS NULL OR v_status != 'in_progress' THEN
    RAISE EXCEPTION 'Session not found or not in progress';
  END IF;

  IF v_completed_count >= v_target_count THEN
    RAISE EXCEPTION 'All pomodoros already completed for this session'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.pomodoros (
    session_id, user_id, status, started_at
  ) VALUES (
    p_session_id, v_user_id, 'in_progress', v_now
  ) RETURNING id INTO v_pomodoro_id;

  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata
  ) VALUES (
    v_user_id, 'pomodoro', 'pomodoro_started',
    jsonb_build_object(
      'session_id', p_session_id,
      'pomodoro_id', v_pomodoro_id
    )
  );

  RETURN json_build_object(
    'pomodoro_id', v_pomodoro_id,
    'session_id', p_session_id
  );
END;
$$;
