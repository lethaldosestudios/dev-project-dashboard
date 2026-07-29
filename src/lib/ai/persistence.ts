import { getDb, newId, nowIso } from "@/lib/db";
import type { AiOperation } from "./models";
import { normalizeTagName, tagSlug, type ResourceAnalysisResult } from "./schemas";
import { parseAiRun } from "./runs";

export async function persistResourceAnalysis(resourceId: string, result: ResourceAnalysisResult) {
  const db = getDb();
  const now = nowIso();
  const statements = [
    db.prepare("UPDATE resources SET summary = ?, content_type = ?, updated_at = ? WHERE id = ?").bind(result.summary, result.content_type, now, resourceId),
  ];

  for (const tag of result.tags) {
    const name = normalizeTagName(tag.name);
    const slug = tagSlug(name);
    if (!slug) continue;
    const existing = await db.prepare("SELECT id FROM tags WHERE slug = ?").bind(slug).first<{ id: string }>();
    const tagId = existing?.id ?? newId();
    if (!existing) {
      statements.push(db.prepare("INSERT OR IGNORE INTO tags (id, name, slug, created_at) VALUES (?, ?, ?, ?)").bind(tagId, name, slug, now));
    }
    statements.push(
      db.prepare(
        `INSERT INTO resource_tags (resource_id, tag_id, source, confidence)
         VALUES (?, ?, 'ai', ?)
         ON CONFLICT(resource_id, tag_id) DO UPDATE SET
           source = CASE WHEN resource_tags.source = 'manual' THEN resource_tags.source ELSE excluded.source END,
           confidence = CASE WHEN resource_tags.source = 'manual' THEN resource_tags.confidence ELSE excluded.confidence END`
      ).bind(resourceId, tagId, tag.confidence)
    );
  }

  await db.batch(statements);
}

export async function findCachedProjectRun(projectId: string, operation: AiOperation, hash: string) {
  const db = getDb();
  const row = await db.prepare(
    "SELECT * FROM ai_runs WHERE project_id = ? AND operation = ? AND status = 'completed' AND input_hash = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(projectId, operation, hash).first<Record<string, unknown>>();
  return row ? parseAiRun(row) : null;
}

export async function findRunningProjectRun(projectId: string, operation: AiOperation) {
  const db = getDb();
  const row = await db.prepare(
    "SELECT * FROM ai_runs WHERE project_id = ? AND operation = ? AND status IN ('queued', 'running') ORDER BY created_at DESC LIMIT 1"
  ).bind(projectId, operation).first<Record<string, unknown>>();
  return row ? parseAiRun(row) : null;
}
