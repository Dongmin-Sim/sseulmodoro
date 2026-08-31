-- =============================================================
-- 010 이벤트 계측 — 클라이언트 emit 이벤트 RPC (TASK-85)
-- =============================================================
-- 사용자가 페이지를 여는 행위(접속·페이지뷰 등)는 DB 함수가 아니라
-- 클라이언트에서 찍어야 하므로, 클라이언트가 호출하는 전용 emit RPC를 둔다.
-- activity_log는 RLS로 직접 INSERT가 막혀 있어 SECURITY DEFINER로 우회한다.
-- user_id는 파라미터가 아닌 auth.uid()로 직접 조회(신뢰 경계).

-- -------------------------------------------------------------
-- log_app_visited — 앱 첫 로드 접속 이벤트 (활성 유저 원천)
-- -------------------------------------------------------------
-- 앱 로드당 1회 클라이언트에서 호출. 중복 제거·활성 판정은
-- 다운스트림 파이프라인(mart.fact_active_user_daily)이 담당하므로
-- 여기서는 dedupe 없이 append만 한다.
CREATE OR REPLACE FUNCTION public.log_app_visited()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.activity_log (user_id, event_category, event_type, metadata)
  VALUES (v_user_id, 'app', 'app_visited', NULL);
END;
$$;
