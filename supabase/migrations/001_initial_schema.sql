-- 1. users
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  balance         INTEGER NOT NULL DEFAULT 0,
  last_session_at TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. character_types
CREATE TABLE character_types (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  rarity      VARCHAR(20) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. character_instances
CREATE TABLE character_instances (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id),
  character_type_id   INTEGER NOT NULL REFERENCES character_types(id),
  level               INTEGER NOT NULL DEFAULT 1,
  exp                 INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. pomodoros
CREATE TABLE pomodoros (
  id                     SERIAL PRIMARY KEY,
  user_id                INTEGER NOT NULL REFERENCES users(id),
  character_instance_id  INTEGER REFERENCES character_instances(id),
  status                 VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  started_at             TIMESTAMP NOT NULL,
  completed_at           TIMESTAMP,
  note                   TEXT,
  created_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. activity_log
CREATE TABLE activity_log (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id),
  event_category VARCHAR(20) NOT NULL,
  event_type     VARCHAR(30) NOT NULL,
  metadata       JSONB,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. point_transaction
CREATE TABLE point_transaction (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  tx_type         VARCHAR(20) NOT NULL,
  amount          INTEGER NOT NULL,
  running_balance INTEGER NOT NULL,
  ref_id          INTEGER,
  ref_type        VARCHAR(30),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. pipeline_checkpoints
CREATE TABLE pipeline_checkpoints (
  pipeline_name      VARCHAR(100) PRIMARY KEY,
  last_processed_at  TIMESTAMP NOT NULL,
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);
