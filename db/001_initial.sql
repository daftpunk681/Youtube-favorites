CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(40) NOT NULL CHECK (length(trim(name)) > 0),
  color varchar(10) NOT NULL DEFAULT 'teal' CHECK (color IN ('teal','orange','purple','blue','rose')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique ON categories (lower(name));
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id varchar(11) NOT NULL UNIQUE CHECK (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title varchar(200) NOT NULL CHECK (length(trim(title)) > 0),
  author varchar(200) NOT NULL DEFAULT '',
  notes varchar(2000) NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS video_categories (
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, category_id)
);
CREATE INDEX IF NOT EXISTS video_categories_category_idx ON video_categories(category_id);
CREATE INDEX IF NOT EXISTS videos_created_idx ON videos(created_at DESC);
CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash varchar(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
