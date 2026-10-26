CREATE TABLE IF NOT EXISTS notes (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  title_en    VARCHAR(200) NOT NULL DEFAULT '',
  content_en  TEXT NOT NULL DEFAULT '',
  tags_en     TEXT[] NOT NULL DEFAULT '{}',
  image_url   TEXT NOT NULL DEFAULT '',
  audio_url   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes (created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  nickname    VARCHAR(50) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
