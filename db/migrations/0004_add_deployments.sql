-- db/migrations/0004_add_deployments.sql
-- Add a deployments table for deploy-sync widgets (source = 'cloudflare' for now).
CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  sync_run_id TEXT REFERENCES sync_runs(id),
  source TEXT NOT NULL,
  deployment_id TEXT NOT NULL,
  author_email TEXT,
  created_on TEXT,
  strategy TEXT,
  version_id TEXT,
  percentage INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployments_sync_run ON deployments(sync_run_id);
CREATE INDEX IF NOT EXISTS idx_deployments_deployment_id ON deployments(deployment_id);
