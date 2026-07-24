-- db/schema.sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'normal',
  stack TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TEXT,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS project_links (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  type TEXT NOT NULL,
  label TEXT,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT,
  content_md TEXT,
  note_type TEXT DEFAULT 'general',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  note TEXT,
  domain TEXT,
  content_type TEXT,
  saved_via TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id TEXT NOT NULL REFERENCES resources(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  source TEXT DEFAULT 'manual',
  confidence REAL,
  PRIMARY KEY (resource_id, tag_id)
);

CREATE TABLE IF NOT EXISTS github_activity (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  event_type TEXT,
  external_id TEXT,
  commit_sha TEXT,
  title TEXT,
  author TEXT,
  url TEXT,
  occurred_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT
);
