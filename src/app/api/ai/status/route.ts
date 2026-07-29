import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAiStatus } from "@/lib/ai/models";
import { parseAiRun } from "@/lib/ai/runs";

export const runtime = "edge";

export async function GET() {
  const db = getDb();
  const [latest, failures] = await Promise.all([
    db.prepare("SELECT * FROM ai_runs ORDER BY created_at DESC LIMIT 1").first<Record<string, unknown>>(),
    db.prepare("SELECT COUNT(*) AS count FROM ai_runs WHERE status IN ('failed', 'rate_limited')").first<{ count: number }>(),
  ]);

  return NextResponse.json({
    ok: true,
    ai: getAiStatus(),
    latestRun: latest ? parseAiRun(latest) : null,
    providerErrorCount: Number(failures?.count || 0),
  });
}
