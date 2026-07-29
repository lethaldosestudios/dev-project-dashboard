import { getDb, newId, nowIso } from "@/lib/db";
import type { AiOperation, AiRunStatus } from "./models";

export interface AiRun {
  id: string;
  operation: AiOperation;
  model: string;
  resource_id?: string | null;
  project_id?: string | null;
  status: AiRunStatus;
  input_hash?: string | null;
  result_json?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  result?: unknown;
}

export async function createAiRun(params: {
  operation: AiOperation;
  model: string;
  resourceId?: string | null;
  projectId?: string | null;
  inputHash: string;
}): Promise<AiRun> {
  const db = getDb();
  const id = newId();
  const now = nowIso();
  await db.prepare(
    `INSERT INTO ai_runs (id, operation, model, resource_id, project_id, status, input_hash, started_at, created_at)
     VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?)`
  ).bind(id, params.operation, params.model, params.resourceId ?? null, params.projectId ?? null, params.inputHash, now, now).run();
  return {
    id,
    operation: params.operation,
    model: params.model,
    resource_id: params.resourceId ?? null,
    project_id: params.projectId ?? null,
    status: "queued",
    input_hash: params.inputHash,
    started_at: now,
    created_at: now,
  };
}

export async function updateAiRunStatus(id: string, status: AiRunStatus, result?: unknown, errorCode?: string, errorMessage?: string) {
  const db = getDb();
  const completedAt = status === "completed" || status === "failed" || status === "rate_limited" ? nowIso() : null;
  await db.prepare(
    `UPDATE ai_runs SET status = ?, result_json = ?, error_code = ?, error_message = ?, completed_at = ? WHERE id = ?`
  ).bind(status, result === undefined ? null : JSON.stringify(result), errorCode ?? null, errorMessage ?? null, completedAt, id).run();
}

export async function getAiRun(id: string) {
  const db = getDb();
  const row = await db.prepare("SELECT * FROM ai_runs WHERE id = ?").bind(id).first<Record<string, unknown>>();
  return row ? parseAiRun(row) : null;
}

export function parseAiRun(row: Record<string, unknown>): AiRun {
  let result: unknown;
  if (typeof row.result_json === "string") {
    try {
      result = JSON.parse(row.result_json);
    } catch {
      result = undefined;
    }
  }
  return { ...row, result } as AiRun;
}

export async function findRunningRun(resourceId: string, operation: AiOperation) {
  const db = getDb();
  const row = await db.prepare(
    `SELECT * FROM ai_runs WHERE resource_id = ? AND operation = ? AND status IN ('queued', 'running') ORDER BY created_at DESC LIMIT 1`
  ).bind(resourceId, operation).first<Record<string, unknown>>();
  return row ? parseAiRun(row) : null;
}

export async function findCachedRun(resourceId: string, operation: AiOperation, inputHash: string) {
  const db = getDb();
  const row = await db.prepare(
    `SELECT * FROM ai_runs WHERE resource_id = ? AND operation = ? AND status = 'completed' AND input_hash = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(resourceId, operation, inputHash).first<Record<string, unknown>>();
  return row ? parseAiRun(row) : null;
}