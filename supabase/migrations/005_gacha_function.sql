-- =============================================================
-- 005 가차(뽑기) — character_types 시드 + gacha() 함수
-- =============================================================
-- character_types는 가차의 입력 데이터(레어리티별 후보 풀)이므로
-- 가차 도메인 파일에 함께 둠. 비용·가중치는 002_app_config_seed.

-- =============================================================
-- 1. character_types 시드 — 모또 테마 캐릭터
-- =============================================================
INSERT INTO public.character_types (name, rarity, description) VALUES
  ('공부하는 모또',     'common',    '열심히 책을 읽고 있는 모또. 집중력이 넘친다.'),
  ('운동하는 모또',     'common',    '땀을 흘리며 달리는 모또. 에너지가 폭발적이다.'),
  ('낮잠자는 모또',     'common',    '폭신한 이불 위에서 꿈나라 여행 중인 모또.'),
  ('명상하는 모또',     'rare',      '눈을 감고 고요히 앉아 있는 모또. 내면이 깊다.'),
  ('독서하는 모또',     'rare',      '두꺼운 책을 천천히 넘기는 모또. 지식이 쌓인다.'),
  ('요리하는 모또',     'epic',      '앞치마를 두르고 맛있는 요리를 만드는 모또.'),
  ('우주비행사 모또',   'legendary', '별빛 가득한 우주를 유영하는 전설의 모또.')
ON CONFLICT DO NOTHING;


-- =============================================================
-- 2. gacha() — 5개 테이블 트랜잭션
-- =============================================================
-- 흐름:
--   1) app_config에서 gacha_cost, gacha_rarity_weights 조회
--   2) profiles.balance 검증 (부족 시 insufficient_balance 예외)
--   3) 가중치 기반 레어리티 추첨 (Efraimidis-Spirakis weighted sampling)
--   4) 해당 레어리티의 character_types 중 랜덤 선택
--   5) 기존 보유 여부 → v_is_new
--   6) character_instances INSERT
--   7) profiles.balance 상대 UPDATE (race condition 방지)
--   8) point_transaction INSERT (running_balance 기록)
--   9) activity_log INSERT (append-only)

CREATE OR REPLACE FUNCTION public.gacha()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id     UUID    := auth.uid();
  v_cost        INTEGER;
  v_weights     JSONB;
  v_balance     INTEGER;
  v_rarity      TEXT;
  v_type_id     INTEGER;
  v_type_name   TEXT;
  v_instance_id INTEGER;
  v_new_balance INTEGER;
  v_is_new      BOOLEAN;
BEGIN
  -- 인증 가드
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  -- 1) app_config에서 gacha_cost 조회
  SELECT (value::text)::integer INTO v_cost
  FROM public.app_config WHERE key = 'gacha_cost';

  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'gacha_cost config missing' USING ERRCODE = 'P0002';
  END IF;

  -- 2) app_config에서 gacha_rarity_weights 조회
  SELECT value INTO v_weights
  FROM public.app_config WHERE key = 'gacha_rarity_weights';

  IF v_weights IS NULL THEN
    RAISE EXCEPTION 'gacha_rarity_weights config missing' USING ERRCODE = 'P0002';
  END IF;

  -- 3) 잔액 검증
  SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_balance < v_cost THEN
    RAISE EXCEPTION 'insufficient_balance' USING ERRCODE = 'P0001';
  END IF;

  -- 4) 레어리티 추첨 — 가중치 기반 랜덤 (Efraimidis-Spirakis)
  WITH weights AS (
    SELECT key AS rarity, value::numeric AS w
    FROM jsonb_each_text(v_weights)
    WHERE value::numeric > 0
  )
  SELECT rarity INTO v_rarity
  FROM weights
  ORDER BY random() ^ (1.0 / w) DESC
  LIMIT 1;

  -- 5) 해당 레어리티에서 랜덤 character_type 선택
  SELECT id, name INTO v_type_id, v_type_name
  FROM public.character_types
  WHERE rarity = v_rarity
  ORDER BY random()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no character_type for rarity %', v_rarity USING ERRCODE = 'P0002';
  END IF;

  -- 6) 기존 보유 여부 체크 → v_is_new
  SELECT NOT EXISTS (
    SELECT 1 FROM public.character_instances
    WHERE user_id = v_user_id AND character_type_id = v_type_id
  ) INTO v_is_new;

  -- 7) character_instances INSERT
  INSERT INTO public.character_instances (user_id, character_type_id, level, exp)
  VALUES (v_user_id, v_type_id, 1, 0)
  RETURNING id INTO v_instance_id;

  -- 8) profiles.balance 상대적 UPDATE (race condition 방지)
  UPDATE public.profiles
  SET balance = balance - v_cost
  WHERE id = v_user_id
  RETURNING balance INTO v_new_balance;

  -- 9) point_transaction INSERT (tx_type='spent', running_balance 필수)
  INSERT INTO public.point_transaction (user_id, tx_type, amount, running_balance, ref_type, ref_id)
  VALUES (v_user_id, 'spent', -v_cost, v_new_balance, 'gacha', v_instance_id);

  -- 10) activity_log INSERT (append-only)
  INSERT INTO public.activity_log (user_id, event_category, event_type, metadata)
  VALUES (v_user_id, 'gacha', 'draw',
    jsonb_build_object('type_id', v_type_id, 'rarity', v_rarity, 'is_new', v_is_new));

  RETURN json_build_object(
    'instance_id', v_instance_id,
    'type_id',     v_type_id,
    'name',        v_type_name,
    'rarity',      v_rarity,
    'level',       1,
    'new_balance', v_new_balance,
    'is_new',      v_is_new
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.gacha() TO authenticated;
