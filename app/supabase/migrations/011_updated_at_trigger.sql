-- =============================================================
-- 011 updated_at 트리거 — set_updated_at() + 세션/포모도로
-- =============================================================
-- 행이 실제로 달라진 UPDATE에만 updated_at을 NOW()로 채운다.
-- 호출자(rpc·직접 SQL·앞으로 생길 코드)가 챙기지 않아도 적용된다.
-- WHEN 조건이 없으면 값이 그대로인 UPDATE에도 시각이 밀린다.
-- 다른 테이블에 붙일 때는 updated_at 컬럼을 두고 트리거만 추가하면 된다.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_pomodoro_sessions_updated
  BEFORE UPDATE ON public.pomodoro_sessions
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_pomodoros_updated
  BEFORE UPDATE ON public.pomodoros
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.set_updated_at();
