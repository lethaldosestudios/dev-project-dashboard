// src/types/index.ts
export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "active" | "paused" | "archived";
  priority: "low" | "normal" | "high";
  stack?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export interface Resource {
  id: string;
  projectId?: string;
  url: string;
  normalizedUrl: string;
  title?: string;
  summary?: string;
  note?: string;
  domain?: string;
  contentType?: string;
  savedVia: "manual" | "bookmarklet" | "extension" | "ai";
  createdAt: string;
}

export interface Note {
  id: string;
  projectId: string;
  title?: string;
  contentMd: string;
  noteType: string;
  updatedAt: string;
}
