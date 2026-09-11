// src/app/api/resources/route.ts
import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { normalizeUrl, extractDomain } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const db = await getDb();

  const query = projectId
    ? db.prepare("SELECT * FROM resources WHERE project_id = ? ORDER BY created_at DESC").bind(projectId)
    : db.prepare("SELECT * FROM resources ORDER BY created_at DESC LIMIT 100");

  const { results } = await query.all();
  return NextResponse.json({ resources: results });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = (await req.json()) as any;
  const { url, title, note, projectId, savedVia = "manual" } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (url.length > 2000) {
    return NextResponse.json({ error: "url must be 2000 characters or fewer" }, { status: 400 });
  }
  if (projectId !== undefined && projectId !== null && typeof projectId !== "string") {
    return NextResponse.json({ error: "projectId must be a string" }, { status: 400 });
  }
  if (!["manual", "bookmarklet", "extension", "ai"].includes(savedVia)) {
    return NextResponse.json({ error: "savedVia is invalid" }, { status: 400 });
  }

  const db = await getDb();
  if (projectId) {
    const project = await db.prepare("SELECT id FROM projects WHERE id = ? AND archived_at IS NULL").bind(projectId).first();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }

  const normalizedUrl = normalizeUrl(url);

  const existing = await db
    .prepare("SELECT id FROM resources WHERE normalized_url = ? AND (project_id = ? OR ? IS NULL)")
    .bind(normalizedUrl, projectId ?? null, projectId ?? null)
    .first();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true, id: existing.id }, { status: 200 });
  }

  const id = newId();
  const now = nowIso();
  const domain = extractDomain(normalizedUrl);

  await db
    .prepare(
      `INSERT INTO resources (id, project_id, url, normalized_url, title, note, domain, saved_via, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, projectId ?? null, url, normalizedUrl, title ?? null, note ?? null, domain ?? null, savedVia, now, now)
    .run();

  return NextResponse.json({ ok: true, resource: { id, url, normalizedUrl, title, projectId } }, { status: 201 });
}
