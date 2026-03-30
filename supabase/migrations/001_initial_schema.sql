-- 0.1.0 초기 스키마: profiles, pomodoros, activity_log, point_transaction
-- character_types, character_instances → 0.3.0
-- pipeline_checkpoints → 0.2.0

-- 1. profiles (Supabase Auth 연동)
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            VARCHAR(100),
  balance         INTEGER NOT NULL DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. pomodoros
CREATE TABLE public.pomodoros (
  id             SERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES public.profiles(id),
  status         VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  started_at     TIMESTAMPTZ NOT NULL,
  completed_at   TIMESTAMPTZ,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. activity_log (append-only)
CREATE TABLE public.activity_log (
  id             SERIAL PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id),
  event_category VARCHAR(20) NOT NULL,
  event_type     VARCHAR(30) NOT NULL,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. point_transaction
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
