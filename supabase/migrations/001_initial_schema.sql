-- 1. profiles (Supabase Auth 연동)
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            VARCHAR(100),
  balance         INTEGER NOT NULL DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- 8. app_config (서비스 설정)
CREATE TABLE public.app_config (
  key   VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL
);

