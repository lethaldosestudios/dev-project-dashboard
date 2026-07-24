// src/types/index.ts
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
