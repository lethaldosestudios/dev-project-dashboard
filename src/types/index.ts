export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "active" | "paused" | "archived";
  priority: "low" | "normal" | "high";
  stack?: string;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  github_repo?: string;
}

export interface Resource {
  id: string;
  project_id?: string;
  url: string;
  normalized_url: string;
  title?: string;
  summary?: string;
  note?: string;
  domain?: string;
  content_type?: string;
  saved_via: "manual" | "bookmarklet" | "extension" | "ai";
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  title?: string;
  content_md: string;
  note_type: string;
  updated_at: string;
}

export interface ProjectLink {
  id: string;
  project_id: string;
  type: string;
  label?: string;
  url: string;
  sort_order: number;
}

export interface GitHubActivity {
  id: string;
  project_id: string;
  event_type: string;
  external_id: string;
  commit_sha?: string;
  title?: string;
  author?: string;
  url?: string;
  occurred_at: string;
  created_at: string;
}

export interface SyncRun {
  id: string;
  sync_type: string;
  status: "started" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  records_processed: number;
  error_message?: string;
}

export interface SyncResult {
  ok: boolean;
  synced: number;
  skipped: number;
  errors?: string[];
  syncRun?: SyncRun;
}

export interface AiRun {
  id: string;
  operation: "resource_enrichment" | "project_attention_review" | "resource_visual_analysis";
  model: string;
  resource_id?: string | null;
  project_id?: string | null;
  status: "queued" | "running" | "completed" | "failed" | "rate_limited";
  input_hash?: string | null;
  result_json?: string | null;
  result?: unknown;
  error_code?: string | null;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
}
