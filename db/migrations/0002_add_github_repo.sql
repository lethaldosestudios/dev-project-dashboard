-- db/migrations/0002_add_github_repo.sql
-- Add github_repo column to projects, referenced by /api/sync/github (owner/repo format).

ALTER TABLE projects ADD COLUMN github_repo TEXT;