-- 회원가입 시 profiles 자동 생성 + 기본 캐릭터(대표) 자동 부여 trigger
-- auth.users INSERT → trigger → profiles INSERT + character_instances INSERT (트랜잭션 보장)

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
  -- 1) profiles INSERT
  INSERT INTO public.profiles (id, name, balance)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), 0);

  -- 2) 기본 캐릭터 부여 + 대표 캐릭터 설정
  -- common 레어리티 캐릭터 중 id 오름차순 첫 번째 선택
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

  -- 3) 환영 포인트 지급 (app_config.onboarding_welcome_points > 0 인 경우만)
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
