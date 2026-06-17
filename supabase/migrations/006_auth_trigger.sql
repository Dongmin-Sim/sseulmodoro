-- =============================================================
-- 006 회원가입 트리거 — handle_new_user() + on_auth_user_created
-- =============================================================
-- auth.users INSERT 시 트리거 실행:
--   1) profiles INSERT
--   2) 기본 캐릭터(common, id 오름차순 첫 번째) 부여 + 대표 캐릭터로 설정
--   3) onboarding_welcome_points > 0 인 경우 환영 포인트 지급 + 거래·로그 기록
-- character_types 시드(005)와 app_config 시드(002)가 선행되어야 함.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_default_type_id INTEGER;
  v_instance_id     INTEGER;
  v_welcome_points  INTEGER;
BEGIN
  -- 1) profiles INSERT (nickname은 NULL로 시작 — 닉네임 등록 화면에서 채움)
  INSERT INTO public.profiles (id, balance)
  VALUES (NEW.id, 0);

  -- 2) 기본 캐릭터 부여 + 대표 캐릭터 설정 (common 레어리티, id 오름차순 첫 번째)
  SELECT id INTO v_default_type_id
  FROM public.character_types
  WHERE rarity = 'common'
  ORDER BY id
  LIMIT 1;

  IF v_default_type_id IS NOT NULL THEN
    INSERT INTO public.character_instances (user_id, character_type_id, level, exp, is_main)
    VALUES (NEW.id, v_default_type_id, 1, 0, true)
    RETURNING id INTO v_instance_id;
  END IF;

  -- 3) 환영 포인트 지급 (app_config.onboarding_welcome_points > 0 인 경우)
  SELECT (value::text)::integer INTO v_welcome_points
  FROM public.app_config WHERE key = 'onboarding_welcome_points';

  IF v_welcome_points IS NOT NULL AND v_welcome_points > 0 THEN
    UPDATE public.profiles
    SET balance = balance + v_welcome_points
    WHERE id = NEW.id;

    INSERT INTO public.point_transaction (user_id, tx_type, amount, running_balance, ref_type)
    VALUES (NEW.id, 'earned', v_welcome_points, v_welcome_points, 'onboarding');

    INSERT INTO public.activity_log (user_id, event_category, event_type, metadata)
    VALUES (NEW.id, 'onboarding', 'welcome_bonus',
      jsonb_build_object('points', v_welcome_points));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
