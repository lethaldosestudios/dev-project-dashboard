import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { analyzeResource } from "@/lib/ai/enrich";
import { AiError } from "@/lib/ai/errors";
import { AI_OPERATIONS, getAiConfig } from "@/lib/ai/models";
import { createAiRun, findCachedRun, findRunningRun, getAiRun, updateAiRunStatus } from "@/lib/ai/runs";
import { inputHash } from "@/lib/ai/hash";
import { persistResourceAnalysis } from "@/lib/ai/persistence";

export const runtime = "edge";

function errorResponse(error: unknown) {
  if (error instanceof AiError) {
    return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ ok: false, error: "provider_error", message: "AI enrichment failed." }, { status: 502 });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null) as { force?: unknown } | null;
  const force = body?.force === true;
  const db = getDb();
  const resource = await db.prepare("SELECT * FROM resources WHERE id = ?").bind(params.id).first<Record<string, unknown>>();
  if (!resource) return NextResponse.json({ ok: false, error: "not_found", message: "Resource not found." }, { status: 404 });

  let project: Record<string, unknown> | null = null;
  if (typeof resource.project_id === "string" && resource.project_id) {
    project = await db.prepare("SELECT name, description, stack FROM projects WHERE id = ?").bind(resource.project_id).first<Record<string, unknown>>();
  }

  const operation = AI_OPERATIONS.resourceEnrichment;
  const model = getAiConfig().primaryModel;
  const promptInput = { resource, project };
  const hash = await inputHash(promptInput);
  const cached = await findCachedRun(params.id, operation, hash);
  if (cached && !force) return NextResponse.json({ ok: true, cached: true, run: cached });

  const running = await findRunningRun(params.id, operation);
  if (running) return NextResponse.json({ ok: false, error: "run_in_progress", message: "An identical AI action is already running.", run: running }, { status: 409 });

  const run = await createAiRun({ operation, model, resourceId: params.id, projectId: typeof resource.project_id === "string" ? resource.project_id : null, inputHash: hash });
  await updateAiRunStatus(run.id, "running");

  try {
    const analysis = await analyzeResource(promptInput as Parameters<typeof analyzeResource>[0], run.id);
    await persistResourceAnalysis(params.id, analysis.result);
    await updateAiRunStatus(run.id, "completed", analysis.result);
    return NextResponse.json({ ok: true, cached: false, run: (await getAiRun(run.id)) || { ...run, status: "completed", result: analysis.result, model: analysis.model } });
  } catch (error) {
    const status = error instanceof AiError && error.code === "rate_limited" ? "rate_limited" : "failed";
    await updateAiRunStatus(run.id, status, undefined, error instanceof AiError ? error.code : "provider_error", error instanceof Error ? error.message : "AI enrichment failed.");
    return errorResponse(error);
  }
}
