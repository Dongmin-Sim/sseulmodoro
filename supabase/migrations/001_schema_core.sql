-- =============================================================
-- 001 schema core — 테이블 / PK·FK / 인덱스
-- =============================================================
-- 이전의 누적 DROP→CREATE 마이그레이션(8개)을 ISSUE-5에서 정리하여
-- 도메인 단위 6개 파일로 재작성한 baseline. RLS·정책은 003, 함수는
-- 004/005/006에서 정의.

-- 1. profiles (Supabase Auth 연동)
-- nickname: 식별자. 가입 직후엔 NULL(닉네임 등록 전 = 신규 판별 기준),
--   등록 화면에서 채운다. 한글·영문·숫자 2~12자. 중복은 대소문자 무시.
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname        VARCHAR(12) CHECK (nickname ~ '^[0-9A-Za-z가-힣]{2,12}$'),
  balance         INTEGER NOT NULL DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 닉네임 대소문자 무시 유일성 (NULL 다중 허용)
CREATE UNIQUE INDEX uniq_profiles_nickname_lower
  ON public.profiles (lower(nickname));

-- 2. character_types
CREATE TABLE public.character_types (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  rarity      VARCHAR(20) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. character_instances
CREATE TABLE public.character_instances (
  id                SERIAL PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.profiles(id),
  character_type_id INTEGER NOT NULL REFERENCES public.character_types(id),
  level             INTEGER NOT NULL DEFAULT 1,
  exp               INTEGER NOT NULL DEFAULT 0,
  is_main           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 유저당 대표 캐릭터(is_main=true)는 반드시 1개
CREATE UNIQUE INDEX uniq_character_instances_main_per_user
  ON public.character_instances (user_id)
  WHERE is_main = true;

-- 4. pomodoro_sessions (사이클 단위)
CREATE TABLE public.pomodoro_sessions (
  id                    SERIAL PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES public.profiles(id),
  character_instance_id INTEGER REFERENCES public.character_instances(id),
  target_count          INTEGER NOT NULL,
  completed_count       INTEGER NOT NULL DEFAULT 0,
  focus_minutes         INTEGER NOT NULL,
  short_break_minutes   INTEGER NOT NULL,
  long_break_minutes    INTEGER NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  started_at            TIMESTAMPTZ NOT NULL,
  ended_at              TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. pomodoros
CREATE TABLE public.pomodoros (
  id             SERIAL PRIMARY KEY,
  session_id     INTEGER NOT NULL REFERENCES public.pomodoro_sessions(id),
  user_id        UUID NOT NULL REFERENCES public.profiles(id),
  status         VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  started_at     TIMESTAMPTZ NOT NULL,
  completed_at   TIMESTAMPTZ,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. activity_log (append-only)
CREATE TABLE public.activity_log (
  id             SERIAL PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id),
  event_category VARCHAR(20) NOT NULL,
  event_type     VARCHAR(30) NOT NULL,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. point_transaction
CREATE TABLE public.point_transaction (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  tx_type         VARCHAR(20) NOT NULL,
  amount          INTEGER NOT NULL,
  running_balance INTEGER NOT NULL,
  ref_id          INTEGER,
  ref_type        VARCHAR(30),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. app_config (서비스 설정 — key/value)
CREATE TABLE public.app_config (
  key   VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL
);
