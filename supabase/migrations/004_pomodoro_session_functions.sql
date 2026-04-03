-- =============================================================
-- 포모도로 완료/중지 + 세션 종료 + 다음 포모도로 시작 함수
-- =============================================================


-- =============================================================
-- 1. complete_pomodoro: 포모도로 1개 완료 처리
-- =============================================================
--
-- 트랜잭션으로 묶을 내용:
--   1) pomodoros.status → 'completed', completed_at 기록
--   2) pomodoro_sessions.completed_count += 1
--   3) activity_log INSERT (pomodoro_completed)
--
-- 포인트는 여기서 지급하지 않음 — 세션 종료(end_session) 시 일괄 지급
--
-- 호출 예시:
--   SELECT public.complete_pomodoro(
--     1,                                              -- p_pomodoro_id
--     '00000000-0000-0000-0000-000000000001'           -- p_user_id
--   );
--
-- 반환값:
--   { "pomodoro_id": 1, "session_id": 1, "completed_count": 2, "target_count": 4 }

CREATE OR REPLACE FUNCTION public.complete_pomodoro(
  p_pomodoro_id  INTEGER,
  p_user_id      UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id      INTEGER;
  v_completed_count INTEGER;
  v_target_count    INTEGER;
  v_now             TIMESTAMPTZ := NOW();
BEGIN
  -- 1) pomodoros.status → 'completed', completed_at = v_now
  UPDATE public.pomodoros
  SET status = 'completed', completed_at = v_now
  WHERE id      = p_pomodoro_id
    AND user_id = p_user_id 
    AND status  = 'in_progress'
  RETURNING session_id INTO v_session_id;

  -- 2) pomodoro_sessions.completed_count += 1
  UPDATE public.pomodoro_sessions
  SET completed_count = completed_count + 1
  WHERE id = v_session_id
  RETURNING completed_count, target_count 
    INTO v_completed_count, v_target_count;

  -- 3) activity_log INSERT
  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata, created_at
  ) VALUES (
    p_user_id,
    'pomodoro',
    'pomodoro_completed',
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
-- 2. stop_pomodoro: 포모도로 1개 중지 (사용자가 타이머 중간에 그만둠)
-- =============================================================
--
-- 트랜잭션으로 묶을 내용:
--   1) pomodoros.status → 'stopped'
--   2) activity_log INSERT (pomodoro_stopped)
--
-- 세션은 계속 진행 가능 (다음 포모도로 시작 가능)
--
-- 호출 예시:
--   SELECT public.stop_pomodoro(
--     1,                                              -- p_pomodoro_id
--     '00000000-0000-0000-0000-000000000001'           -- p_user_id
--   );
--
-- 반환값:
--   { "pomodoro_id": 1, "session_id": 1 }

CREATE OR REPLACE FUNCTION public.stop_pomodoro(
  p_pomodoro_id  INTEGER,
  p_user_id      UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id INTEGER;
  v_now        TIMESTAMPTZ := NOW();
BEGIN
  -- 1) pomodoros.status → 'stopped'
  UPDATE public.pomodoros
  SET status = 'stopped'
  WHERE id      = p_pomodoro_id
    AND user_id = p_user_id
    AND status  = 'in_progress'
  RETURNING session_id 
    INTO v_session_id;

  -- 2) activity_log INSERT
  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata, created_at
  ) VALUES (
    p_user_id,
    'pomodoro',
    'pomodoro_stopped',
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
-- 3. end_session: 세션 종료 + 포인트 일괄 지급
-- =============================================================
--
-- 트랜잭션으로 묶을 내용:
--   1) pomodoro_sessions.status → 'completed', ended_at 기록
--   2) app_config에서 pomodoro_point_value 조회
--   3) 포인트 계산 (completed_count × point_value)
--   4) point_transaction INSERT (포인트 > 0인 경우만)
--      - running_balance = 현재 profiles.balance + amount
--   5) profiles.balance += 포인트 (상대적 UPDATE, race condition 방지)
--   6) activity_log INSERT (session_ended)
--
-- 호출 예시:
--   SELECT public.end_session(
--     1,                                              -- p_session_id
--     '00000000-0000-0000-0000-000000000001'           -- p_user_id
--   );
--
-- 반환값:
--   { "session_id": 1, "completed_count": 3, "points_earned": 30, "new_balance": 130 }

CREATE OR REPLACE FUNCTION public.end_session(
  p_session_id  INTEGER,
  p_user_id     UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_count INTEGER;
  v_point_value     INTEGER;
  v_points_earned   INTEGER;
  v_new_balance     INTEGER;
  v_now             TIMESTAMPTZ := NOW();
BEGIN
  -- 1) pomodoro_sessions.status → 'completed', ended_at = v_now
  UPDATE public.pomodoro_sessions
  SET status = 'completed', ended_at = v_now
  WHERE id      = p_session_id 
    AND user_id = p_user_id 
    AND status  = 'in_progress'
  RETURNING completed_count INTO v_completed_count;

  -- 2) app_config에서 포인트 단가 조회
  SELECT (value::INTEGER) 
    INTO v_point_value
  FROM public.app_config 
  WHERE key = 'pomodoro_point_value';
  
  -- 3) 포인트 계산
  v_points_earned := v_completed_count * v_point_value;
  
  -- 4) 포인트 > 0이면:
  IF v_points_earned > 0 THEN
    UPDATE public.profiles
    SET balance = balance + v_points_earned
    WHERE id = p_user_id
    RETURNING balance 
      INTO v_new_balance;

    INSERT INTO public.point_transaction (
      user_id, tx_type, amount, running_balance, ref_id, ref_type, created_at
    ) VALUES (
      p_user_id,
      'pomodoro_reward',
      v_points_earned,
      v_new_balance,
      p_session_id,
      'pomodoro_session',
      v_now
    );
  -- 5) 포인트 = 0이면: balance 조회만 (activity_log에 기록하기 위함)
  ELSE
    SELECT balance 
      INTO v_new_balance
    FROM public.profiles 
    WHERE id = p_user_id;
  END IF;
  
  -- 6) activity_log INSERT
  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata, created_at
  ) VALUES (
    p_user_id,
    'session',
    'session_ended',
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
-- 4. start_next_pomodoro: 세션 내 다음 포모도로 시작
-- =============================================================
--
-- 트랜잭션으로 묶을 내용:
--   1) 세션 status = 'in_progress' 확인
--   2) pomodoros INSERT (새 포모도로)
--   3) activity_log INSERT (pomodoro_started)
--
-- 호출 예시:
--   SELECT public.start_next_pomodoro(
--     1,                                              -- p_session_id
--     '00000000-0000-0000-0000-000000000001'          -- p_user_id
--   );
-- 반환값:
--   { "pomodoro_id": 2, "session_id": 1 }

CREATE OR REPLACE FUNCTION public.start_next_pomodoro(
  p_session_id    INTEGER,
  p_user_id       UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pomodoro_id INTEGER;
  v_status      VARCHAR(20);
  v_now         TIMESTAMPTZ := NOW();
BEGIN
  -- 1) 세션 상태 확인
  SELECT status INTO v_status  
  FROM public.pomodoro_sessions
  WHERE id = p_session_id AND user_id = p_user_id;

  if v_status IS NULL OR v_status != 'in_progress' THEN
    RAISE EXCEPTION 'Session not found or not in progress';
  END IF;

  -- 2) pomodoros INSERT
  INSERT INTO public.pomodoros (
    session_id, user_id, status, started_at
  ) VALUES (
    p_session_id, p_user_id, 'in_progress', v_now
  ) RETURNING id INTO v_pomodoro_id;

  -- 3) activity_log INSERT
  INSERT INTO public.activity_log (
    user_id, event_category, event_type, metadata
  ) VALUES (
    p_user_id, 'pomodoro', 'pomodoro_started',
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
