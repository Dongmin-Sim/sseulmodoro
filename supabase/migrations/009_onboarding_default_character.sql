-- =============================================================
-- 온보딩 — 기본 캐릭터 자동 부여
-- =============================================================
--
-- 회원가입(auth.users INSERT) 시 profiles 생성에 더해 기본 캐릭터 1개를
-- character_instances에 자동 삽입한다.
--
-- 트랜잭션으로 묶을 내용:
--   1) profiles INSERT              (005에서 구현된 기존 로직 유지)
--   2) 기본 character_type 선택     (common 중 id 오름차순 첫 번째)
--   3) character_instances INSERT   (level=1, exp=0)
--   4) 환영 포인트 지급 (선택)      (app_config.onboarding_welcome_points > 0 인 경우)
--      → profiles.balance 상대 UPDATE + point_transaction INSERT + activity_log INSERT
--
-- 적용 방법:
--   npx supabase db push  또는  npm run db:reset (로컬)
-- =============================================================


-- =============================================================
-- 1. app_config 시드 — 환영 포인트 (기본값 0 = 지급 안 함)
-- =============================================================

INSERT INTO public.app_config (key, value)
VALUES ('onboarding_welcome_points', '0')
ON CONFLICT (key) DO NOTHING;


-- =============================================================
-- 2. handle_new_user() 확장 — 기본 캐릭터 + 환영 포인트 추가
--    (005의 profiles INSERT 로직 유지 + TODO 추가)
-- =============================================================
--
-- 호출 예시 (트리거 자동 호출, 직접 호출 불가):
--   → 회원가입 시 자동 실행

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
  -- 1) profiles INSERT (005 기존 로직 유지)
  INSERT INTO public.profiles (id, name, balance)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), 0);

  -- TODO(user): 2) 기본 캐릭터 부여
  -- common 레어리티 캐릭터 중 id 오름차순 첫 번째 선택
  --
  -- SELECT id INTO v_default_type_id
  -- FROM public.character_types
  -- WHERE rarity = 'common'
  -- ORDER BY id
  -- LIMIT 1;
  --
  -- IF v_default_type_id IS NOT NULL THEN
  --   INSERT INTO public.character_instances (user_id, character_type_id, level, exp)
  --   VALUES (NEW.id, v_default_type_id, 1, 0)
  --   RETURNING id INTO v_instance_id;
  -- END IF;

  -- TODO(user): 3) 환영 포인트 지급 (선택)
  -- app_config에서 onboarding_welcome_points 조회 → 0 초과 시에만 지급
  --
  -- SELECT (value::text)::integer INTO v_welcome_points
  -- FROM public.app_config WHERE key = 'onboarding_welcome_points';
  --
  -- IF v_welcome_points IS NOT NULL AND v_welcome_points > 0 THEN
  --   -- profiles.balance 상대 UPDATE (race condition 방지)
  --   UPDATE public.profiles
  --   SET balance = balance + v_welcome_points
  --   WHERE id = NEW.id;
  --
  --   -- point_transaction INSERT (running_balance 기록 필수)
  --   INSERT INTO public.point_transaction (user_id, tx_type, amount, running_balance, ref_type)
  --   VALUES (NEW.id, 'earned', v_welcome_points, v_welcome_points, 'onboarding');
  --
  --   -- activity_log INSERT (append-only)
  --   INSERT INTO public.activity_log (user_id, event_category, event_type, metadata)
  --   VALUES (NEW.id, 'onboarding', 'welcome_bonus',
  --     jsonb_build_object('points', v_welcome_points));
  -- END IF;

  RETURN NEW;
END;
$$;

-- 트리거는 005에서 이미 생성되었으므로 재생성 불필요
-- on_auth_user_created: AFTER INSERT ON auth.users → handle_new_user()
