CREATE TABLE IF NOT EXISTS notes (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  title_en    VARCHAR(200) NOT NULL DEFAULT '',
  content_en  TEXT NOT NULL DEFAULT '',
  transcript  TEXT NOT NULL DEFAULT '',
  tags_en     TEXT[] NOT NULL DEFAULT '{}',
  source_lang VARCHAR(10) NOT NULL DEFAULT 'zh',
  image_url   TEXT NOT NULL DEFAULT '',
  audio_url   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 兼容旧库：纯音频笔记的可选文字稿
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS transcript TEXT NOT NULL DEFAULT '';

-- 兼容旧库：原文语言（zh / en），旧笔记默认视为中文原文。
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS source_lang VARCHAR(10) NOT NULL DEFAULT 'zh';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.notes'::regclass
      AND conname = 'notes_source_lang_check'
  ) THEN
    ALTER TABLE public.notes
      ADD CONSTRAINT notes_source_lang_check
      CHECK (source_lang IN ('zh', 'en'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes (created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  nickname    VARCHAR(50) NOT NULL,
  content     TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 兼容旧库：新增审核字段。旧留言此前已在前台展示，迁移时视为已通过。
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'approved';

ALTER TABLE public.messages
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass
      AND conname = 'messages_status_check'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status_created_at
  ON messages (status, created_at DESC);
