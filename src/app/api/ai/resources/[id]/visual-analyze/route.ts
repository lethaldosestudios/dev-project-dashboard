import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { analyzeVisual } from "@/lib/ai/enrich";
import { AiError } from "@/lib/ai/errors";
import { AI_OPERATIONS, getAiConfig } from "@/lib/ai/models";
import { createAiRun, findCachedRun, findRunningRun, getAiRun, updateAiRunStatus } from "@/lib/ai/runs";
import { inputHash } from "@/lib/ai/hash";

export const runtime = "edge";

function errorResponse(error: unknown) {
  if (error instanceof AiError) return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ ok: false, error: "provider_error", message: "Visual review failed." }, { status: 502 });
}

function isSafeImageReference(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_000_000) return false;
  if (value.startsWith("data:image/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null) as { imageUrl?: unknown; force?: unknown } | null;
  const force = body?.force === true;
  if (!body || !isSafeImageReference(body.imageUrl)) {
    return NextResponse.json({ ok: false, error: "invalid_image_reference", message: "Provide an HTTPS image URL or data:image reference." }, { status: 400 });
  }

  const db = getDb();
  const resource = await db.prepare("SELECT id, project_id, title FROM resources WHERE id = ?").bind(params.id).first<Record<string, unknown>>();
  if (!resource) return NextResponse.json({ ok: false, error: "not_found", message: "Resource not found." }, { status: 404 });

  let projectName: string | null = null;
  if (typeof resource.project_id === "string" && resource.project_id) {
    const project = await db.prepare("SELECT name FROM projects WHERE id = ?").bind(resource.project_id).first<{ name: string }>();
    projectName = project?.name ?? null;
  }

  const operation = AI_OPERATIONS.resourceVisualAnalysis;
  const model = getAiConfig().multimodalModel;
  const promptInput = { imageUrl: body.imageUrl, resourceTitle: typeof resource.title === "string" ? resource.title : null, projectName };
  const hash = await inputHash(promptInput);
  const cached = await findCachedRun(params.id, operation, hash);
  if (cached && !force) return NextResponse.json({ ok: true, cached: true, run: cached });

  const running = await findRunningRun(params.id, operation);
  if (running) return NextResponse.json({ ok: false, error: "run_in_progress", message: "An identical visual review is already running.", run: running }, { status: 409 });

  const run = await createAiRun({ operation, model, resourceId: params.id, projectId: typeof resource.project_id === "string" ? resource.project_id : null, inputHash: hash });
  await updateAiRunStatus(run.id, "running");

  try {
    const result = await analyzeVisual(promptInput, run.id);
    await updateAiRunStatus(run.id, "completed", result.result);
    return NextResponse.json({ ok: true, cached: false, run: (await getAiRun(run.id)) || { ...run, status: "completed", result: result.result, model: result.model } });
  } catch (error) {
    const status = error instanceof AiError && error.code === "rate_limited" ? "rate_limited" : "failed";
    await updateAiRunStatus(run.id, status, undefined, error instanceof AiError ? error.code : "provider_error", error instanceof Error ? error.message : "Visual review failed.");
    return errorResponse(error);
  }
}
