// src/app/api/capture/route.ts
import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { normalizeUrl, extractDomain } from "@/lib/utils";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.json();
  const { url, title, projectId } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const db = getDb();
  const normalizedUrl = normalizeUrl(url);

  const existing = await db
    .prepare("SELECT id FROM resources WHERE normalized_url = ?")
    .bind(normalizedUrl)
    .first();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true, id: existing.id });
  }

  const id = newId();
  const now = nowIso();
  const domain = extractDomain(normalizedUrl);

  await db
    .prepare(
      `INSERT INTO resources (id, project_id, url, normalized_url, title, domain, saved_via, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'bookmarklet', ?, ?)`
    )
    .bind(id, projectId ?? null, url, normalizedUrl, title ?? null, domain ?? null, now, now)
    .run();

  return NextResponse.json({ ok: true, captured: { id, url, normalizedUrl, title } }, { status: 201 });
}
