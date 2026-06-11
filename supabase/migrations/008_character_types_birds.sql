-- =============================================================
-- 008 character_types: 더미('모또') → 픽셀 새 정체성 교체 (M-S-4 / TASK-76)
-- =============================================================
-- 005의 '모또' 7행은 정체성 확립 전 더미 데이터다. 이 마이그레이션이
-- name·slug·description을 전부 새(픽셀 새 카드)로 갈아엎는다.
--
-- 왜 in-place UPDATE인가:
--   - 이미 적용된 005는 불변(수정 시 prod 체크섬 드리프트).
--   - prod엔 이 type id를 FK로 참조하는 character_instances가 있어
--     DELETE+재INSERT는 새 id를 만들어 FK·트리거(ORDER BY id)·가챠를 깨뜨린다.
--   - id·rarity를 보존하는 in-place UPDATE만 안전하다.
--
-- 매니페스트 src/lib/characters/birds.ts(BIRDS)가 SSOT.
-- 시작 자동부여 트리거(006)는 손대지 않음 — rarity='common' ORDER BY id LIMIT 1
-- = id 1(파랑새)이 고정 시작 새가 된다.

-- 1) sprite 매핑용 slug 컬럼 추가
ALTER TABLE public.character_types
  ADD COLUMN slug VARCHAR(50);

-- 2) id 기준 in-place 교체 (rarity 보존, FK 안전). description = 실제 그 새의 정보.
UPDATE public.character_types
  SET slug = 'bluebird', name = '파랑새',
      description = '청록빛 깃을 가진 여름 철새. 예부터 행복과 길조의 상징으로 여겨진다.'
  WHERE id = 1;

UPDATE public.character_types
  SET slug = 'sparrow', name = '참새',
      description = '도시·시골 어디서나 흔한 텃새. 무리 지어 다니며 곡식과 벌레를 먹는다.'
  WHERE id = 2;

UPDATE public.character_types
  SET slug = 'pigeon', name = '비둘기',
      description = '구구 울며 도심에 사는 새. 귀소 본능이 뛰어나 옛날엔 전서구로 쓰였다.'
  WHERE id = 3;

UPDATE public.character_types
  SET slug = 'magpie', name = '까치',
      description = '검고 흰 깃의 영리한 텃새. 좋은 소식을 전하는 길조로 여겨진다.'
  WHERE id = 4;

UPDATE public.character_types
  SET slug = 'owl', name = '부엉이',
      description = '귀깃을 가진 야행성 맹금. 소리 없이 날며 뛰어난 청각으로 사냥한다.'
  WHERE id = 5;

UPDATE public.character_types
  SET slug = 'parrot', name = '앵무',
      description = '굽은 부리와 화려한 깃을 가진 새. 사람의 말소리를 흉내 내는 영리한 새다.'
  WHERE id = 6;

UPDATE public.character_types
  SET slug = 'peacock', name = '공작',
      description = '수컷이 부채처럼 깃을 펼치는 새. 구애할 때 화려한 꽁지깃을 활짝 편다.'
  WHERE id = 7;

-- 3) 백필 완료 후 제약 — 한 행이라도 누락되면 NOT NULL이 실패시켜 안전망 역할
ALTER TABLE public.character_types
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.character_types
  ADD CONSTRAINT character_types_slug_key UNIQUE (slug);
