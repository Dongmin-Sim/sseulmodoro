-- =============================================================
-- 005 가차(뽑기) — character_types 시드 + gacha() 함수
-- =============================================================

INSERT INTO public.character_types (slug, name, scientific_name, rarity, description) VALUES
  ('glaucousgull', '흰큰갈매기',               'Larus hyperboreus',       'common',    '북극권 해안에 사는 큰 갈매기. 새하얀 깃과 당당한 풍채가 특징이다.'),
  ('dove',         '동양의 멧비둘기',           'Streptopelia orientalis', 'common',    '산과 들에 흔한 텃새 비둘기. 구구 울며 짝과 함께 다닌다.'),
  ('mandarin',     '작은 관모를 쓴 물새(원앙)', 'Aix galericulata',        'common',    '화려한 깃과 작은 관모를 가진 물새. 금실 좋은 한 쌍으로 유명하다.'),
  ('crane',        '붉은머리의 두루미',          'Grus japonensis',         'rare',      '정수리가 붉은 큰 두루미. 예부터 장수와 길조의 상징으로 여겨진다.'),
  ('reedwarbler',  '만주의 개개비',             'Acrocephalus tangorum',   'rare',      '갈대밭에 사는 작은 휘파람새. 쉼 없이 지저귄다.'),
  ('godwit',       '라플란드의 갯벌새',          'Limosa lapponica',        'epic',      '갯벌을 누비는 도요. 긴 부리로 먹이를 찾으며 먼 거리를 난다.'),
  ('dunlin',       '알프스의 도요새',           'Calidris alpina',         'epic',      '작고 야무진 도요. 무리 지어 갯벌 위를 빠르게 오간다.'),
  ('gaeri',        '개리',                    'Anser cygnoid',           'legendary', '긴 목을 가진 기러기. 우직하게 무리를 이끌고 난다.'),
  ('mongolplover', '몽골의 계곡새',             'Charadrius mongolus',     'legendary', '자갈밭에 둥지를 트는 물떼새. 야무진 걸음걸이가 인상적이다.'),
  ('maemsae',      '황금빛의 맴새',             NULL,                      'mythic',    '황금빛으로 빛나는 신화 속의 새. 깊은 집중 끝에 아주 드물게 모습을 드러낸다.')
ON CONFLICT (slug) DO NOTHING;


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


-- =============================================================
-- 3. set_main_character() — 대표 캐릭터 교체
-- =============================================================
-- 유저당 is_main=true 1개(uniq_character_instances_main_per_user) 제약 때문에
-- 기존 대표 해제 → 신규 대표 설정을 한 함수(트랜잭션) 안에서 처리한다.
--   1) 인증 가드 + 소유권 검증 (auth.uid 기준, 클라이언트 user_id 불신뢰)
--   2) 기존 is_main=true 해제
--   3) 대상 인스턴스 is_main=true 설정
CREATE OR REPLACE FUNCTION public.set_main_character(p_instance_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_owns    BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.character_instances
    WHERE id = p_instance_id AND user_id = v_user_id
  ) INTO v_owns;

  IF NOT v_owns THEN
    RAISE EXCEPTION 'instance_not_found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.character_instances
    SET is_main = false
    WHERE user_id = v_user_id AND is_main = true;

  UPDATE public.character_instances
    SET is_main = true
    WHERE id = p_instance_id;

  RETURN json_build_object('instance_id', p_instance_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_main_character(INTEGER) TO authenticated;
