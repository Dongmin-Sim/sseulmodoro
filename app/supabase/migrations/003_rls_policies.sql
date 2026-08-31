-- =============================================================
-- 003 RLS — 활성화 + POLICY
-- =============================================================
-- RLS는 2차 방어선. API Route에서 1차 권한 검증(소유권) 후 적용.
-- INSERT는 SECURITY DEFINER rpc로 처리하므로 일부 테이블에는
-- INSERT 정책 없음 (activity_log, point_transaction, character_instances).

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
-- 2. POLICY
-- ============================================================

-- profiles: 본인 데이터만 조회/수정
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- 닉네임 중복확인: profiles_select_own이 본인 행만 노출해 온보딩 중엔
-- 남의 닉네임도 안 보임 → 전역 조회가 막힘. SECURITY DEFINER로 정책을
-- 좁게 우회하고 boolean만 반환(닉네임 비노출). lower(nickname) 유일 인덱스와 정합.
CREATE OR REPLACE FUNCTION public.is_nickname_available(p_nickname text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''            -- search_path 하이재킹 방지 — 객체는 전부 schema-qualify
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(nickname) = lower(p_nickname)
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_nickname_available(text) TO authenticated;

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

-- point_transaction: 본인 거래만 조회 (INSERT는 SECURITY DEFINER rpc)
CREATE POLICY "points_select_own" ON public.point_transaction
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- activity_log: 본인 로그만 조회 (INSERT는 SECURITY DEFINER rpc)
CREATE POLICY "activity_log_select_own" ON public.activity_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- app_config: 전체 조회만 (수정 정책 없음 = 거부, 대시보드 직접 수정)
CREATE POLICY "app_config_select_all" ON public.app_config
  FOR SELECT TO authenticated USING (true);
