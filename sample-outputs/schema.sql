-- Peblo Notes — PostgreSQL Schema Dump
-- Generated for submission sample outputs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  avatar      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL DEFAULT 'Untitled Note',
  content     TEXT NOT NULL DEFAULT '',
  is_archived BOOLEAN DEFAULT FALSE,
  is_pinned   BOOLEAN DEFAULT FALSE,
  share_id    UUID UNIQUE,
  is_public   BOOLEAN DEFAULT FALSE,
  color       VARCHAR(20) DEFAULT '#ffffff',
  word_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(50) UNIQUE NOT NULL,
  color      VARCHAR(30) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note-Tag join table
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- AI Summaries table
CREATE TABLE ai_summaries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id         UUID UNIQUE NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  summary         TEXT NOT NULL,
  action_items    TEXT[] DEFAULT '{}',
  suggested_title VARCHAR(200),
  key_topics      TEXT[] DEFAULT '{}',
  sentiment       VARCHAR(20) DEFAULT 'neutral',
  provider        VARCHAR(50) DEFAULT 'gemini',
  model_used      VARCHAR(100) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Logs table
CREATE TABLE ai_usage_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_id    UUID REFERENCES notes(id) ON DELETE SET NULL,
  provider   VARCHAR(50) NOT NULL,
  tokens     INTEGER DEFAULT 0,
  feature    VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notes_user_id     ON notes(user_id);
CREATE INDEX idx_notes_share_id    ON notes(share_id);
CREATE INDEX idx_notes_updated_at  ON notes(updated_at DESC);
CREATE INDEX idx_notes_is_archived ON notes(is_archived);
CREATE INDEX idx_ai_usage_user_id  ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_created  ON ai_usage_logs(created_at DESC);

-- Full-text search index (bonus)
CREATE INDEX idx_notes_fts ON notes
  USING GIN(to_tsvector('english', title || ' ' || content));

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at  BEFORE UPDATE ON notes  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ai_sum_updated_at BEFORE UPDATE ON ai_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
