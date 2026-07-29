import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { reviewProject } from "@/lib/ai/enrich";
import { AiError } from "@/lib/ai/errors";
import { AI_OPERATIONS, getAiConfig } from "@/lib/ai/models";
import { createAiRun, getAiRun, updateAiRunStatus } from "@/lib/ai/runs";
import { inputHash } from "@/lib/ai/hash";
import { findCachedProjectRun, findRunningProjectRun } from "@/lib/ai/persistence";

export const runtime = "edge";

function errorResponse(error: unknown) {
  if (error instanceof AiError) {
    return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ ok: false, error: "provider_error", message: "Project review failed." }, { status: 502 });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null) as { force?: unknown } | null;
  const force = body?.force === true;
  const db = getDb();
  const project = await db.prepare("SELECT * FROM projects WHERE id = ? OR slug = ?").bind(params.id, params.id).first<Record<string, unknown>>();
  if (!project) return NextResponse.json({ ok: false, error: "not_found", message: "Project not found." }, { status: 404 });

  const projectId = String(project.id);
  const [{ results: notes }, { results: resources }, { results: activity }] = await Promise.all([
    db.prepare("SELECT id, title, content_md, updated_at FROM notes WHERE project_id = ? ORDER BY updated_at DESC LIMIT 20").bind(projectId).all(),
    db.prepare("SELECT id, title, url, summary, note, content_type, created_at FROM resources WHERE project_id = ? ORDER BY created_at DESC LIMIT 20").bind(projectId).all(),
    db.prepare("SELECT id, event_type, title, author, url, occurred_at FROM github_activity WHERE project_id = ? ORDER BY occurred_at DESC LIMIT 30").bind(projectId).all(),
  ]);

  const lastActivity = typeof project.last_activity_at === "string" ? new Date(project.last_activity_at).getTime() : NaN;
  const stale = Number.isFinite(lastActivity) && Date.now() - lastActivity > 14 * 24 * 60 * 60 * 1000;
  const promptInput = { project, notes: notes as Record<string, unknown>[], resources: resources as Record<string, unknown>[], activity: activity as Record<string, unknown>[], stale };
  const operation = AI_OPERATIONS.projectAttentionReview;
  const model = getAiConfig().reasoningModel;
  const hash = await inputHash(promptInput);
  const cached = await findCachedProjectRun(projectId, operation, hash);
  if (cached && !force) return NextResponse.json({ ok: true, cached: true, run: cached });

  const running = await findRunningProjectRun(projectId, operation);
  if (running) return NextResponse.json({ ok: false, error: "run_in_progress", message: "An identical AI action is already running.", run: running }, { status: 409 });

  const run = await createAiRun({ operation, model, projectId, inputHash: hash });
  await updateAiRunStatus(run.id, "running");

  try {
    const review = await reviewProject(promptInput, run.id);
    await updateAiRunStatus(run.id, "completed", review.result);
    return NextResponse.json({ ok: true, cached: false, run: (await getAiRun(run.id)) || { ...run, status: "completed", result: review.result, model: review.model } });
  } catch (error) {
    const status = error instanceof AiError && error.code === "rate_limited" ? "rate_limited" : "failed";
    await updateAiRunStatus(run.id, status, undefined, error instanceof AiError ? error.code : "provider_error", error instanceof Error ? error.message : "Project review failed.");
    return errorResponse(error);
  }
}
