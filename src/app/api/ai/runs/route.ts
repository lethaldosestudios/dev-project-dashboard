import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseAiRun } from "@/lib/ai/runs";

export const runtime = "edge";

const operations = new Set(["resource_enrichment", "project_attention_review", "resource_visual_analysis"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");
  const projectId = searchParams.get("projectId");
  const operation = searchParams.get("operation");
  const requestedLimit = Number(searchParams.get("limit") || "20");
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 50) : 20;

  if (operation && !operations.has(operation)) {
    return NextResponse.json({ ok: false, error: "invalid_operation" }, { status: 400 });
  }

  const clauses: string[] = [];
  const values: string[] = [];
  if (resourceId) { clauses.push("resource_id = ?"); values.push(resourceId); }
  if (projectId) { clauses.push("project_id = ?"); values.push(projectId); }
  if (operation) { clauses.push("operation = ?"); values.push(operation); }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const db = getDb();
  const rows = await db.prepare(`SELECT id, operation, model, resource_id, project_id, status, result_json, error_code, error_message, started_at, completed_at, created_at FROM ai_runs ${where} ORDER BY created_at DESC LIMIT ${limit}`).bind(...values).all<Record<string, unknown>>();
  return NextResponse.json({ ok: true, runs: rows.results.map(parseAiRun) });
}
