-- db/migrations/0003_add_repo_metadata.sql
-- Add repo_metadata JSON/TEXT column to projects for GitHub stats display.

ALTER TABLE projects ADD COLUMN repo_metadata TEXT;
