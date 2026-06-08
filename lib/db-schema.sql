-- Lagos Events Platform — PostgreSQL Schema
-- Run this against your Railway PostgreSQL instance

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Other',
  event_date  DATE,
  event_day   TEXT,
  event_time  TEXT,
  venue       TEXT,
  area        TEXT,
  organiser   TEXT,
  cost        TEXT,
  link        TEXT,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'Interested',
  source      TEXT NOT NULL DEFAULT 'ai_search',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  remind_at        TIMESTAMPTZ NOT NULL,
  channel          TEXT NOT NULL DEFAULT 'email',
  calendar_event_id TEXT,
  sent             BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Auto-update updated_at
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

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(sent, remind_at);
