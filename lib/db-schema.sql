-- Eventraka — PostgreSQL Schema
-- Run this against your Railway PostgreSQL instance (pgAdmin or psql)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT        UNIQUE NOT NULL,
  name              TEXT        NOT NULL,
  password_hash     TEXT        NOT NULL,
  email_verified    BOOLEAN     NOT NULL DEFAULT false,
  plan              TEXT        NOT NULL DEFAULT 'trial',
  plan_expires_at   TIMESTAMPTZ,
  trial_started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Email Verification Tokens ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verification_tokens (
  token       TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL
);

-- ─── Events ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'Other',
  city        TEXT,
  event_date  DATE,
  event_day   TEXT,
  event_time  TEXT,
  venue       TEXT,
  area        TEXT,
  organiser   TEXT,
  cost        TEXT,
  link        TEXT,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'Interested',
  source      TEXT        NOT NULL DEFAULT 'ai_search',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Reminders ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reminders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id          UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  remind_at         TIMESTAMPTZ NOT NULL,
  channel           TEXT        NOT NULL DEFAULT 'email',
  calendar_event_id TEXT,
  sent              BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Search Cache (shared across users) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS search_cache (
  filters_key TEXT    PRIMARY KEY,
  results     JSONB   NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Search Usage (per user, for rate limiting) ───────────────────────────────

CREATE TABLE IF NOT EXISTS search_usage (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Settings ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key     TEXT NOT NULL,
  value   TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_events_user        ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_status      ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date        ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user     ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_event    ON reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due      ON reminders(sent, remind_at) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_search_usage_user  ON search_usage(user_id, searched_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_ts    ON search_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_verif_tokens_user  ON verification_tokens(user_id);

-- ─── Migrations: run these if upgrading an existing database ──────────────────
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified   BOOLEAN     NOT NULL DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS plan             TEXT        NOT NULL DEFAULT 'trial';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at  TIMESTAMPTZ;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS city            TEXT;

-- CREATE TABLE IF NOT EXISTS verification_tokens (
--   token       TEXT        PRIMARY KEY,
--   user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   expires_at  TIMESTAMPTZ NOT NULL
-- );

-- CREATE TABLE IF NOT EXISTS search_usage (
--   id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
