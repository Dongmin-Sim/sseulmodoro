-- RLS 활성화 + POLICY

-- ============================================================
-- 1. RLS 활성화
-- ============================================================
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_instances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transaction    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. POLICY 스캐폴딩
-- ============================================================

-- profiles: 본인 데이터만 조회/수정
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- pomodoro_sessions: 본인 세션만 조회/생성
CREATE POLICY "sessions_select_own" ON public.pomodoro_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sessions_insert_own" ON public.pomodoro_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- pomodoros: 본인 포모도로만 조회/생성
CREATE POLICY "pomodoros_select_own" ON public.pomodoros
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "pomodoros_insert_own" ON public.pomodoros
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- character_instances: 본인 캐릭터만 조회
CREATE POLICY "characters_select_own" ON public.character_instances
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- character_types: 전체 공개 (도감 데이터)
CREATE POLICY "character_types_select_all" ON public.character_types
  FOR SELECT TO authenticated USING (true);

-- point_transaction: 본인 거래만 조회
CREATE POLICY "points_select_own" ON public.point_transaction
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- activity_log: 본인 로그만 조회 (INSERT는 SECURITY DEFINER rpc가 처리)
CREATE POLICY "activity_log_select_own" ON public.activity_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- app_config: 전체 조회만 허용 (수정 불가 — policy 없음 = 거부)
CREATE POLICY "app_config_select_all" ON public.app_config
  FOR SELECT TO authenticated USING (true);