CREATE TABLE IF NOT EXISTS ai_runs (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  model TEXT NOT NULL,
  resource_id TEXT REFERENCES resources(id),
  project_id TEXT REFERENCES projects(id),
  status TEXT NOT NULL,
  input_hash TEXT,
  result_json TEXT,
  error_code TEXT,
  error_message TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_resource_created ON ai_runs(resource_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_runs_project_created ON ai_runs(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_runs_status_created ON ai_runs(status, created_at);