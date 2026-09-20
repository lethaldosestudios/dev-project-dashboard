// src/app/api/project-links/route.ts
import { NextResponse } from "next/server";
import { getDb, newId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const label = typeof body.label === "string" ? body.label.trim() || null : null;
  const sort_order = typeof body.sort_order === "number" ? body.sort_order : 0;

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }
  if (type.length > 50) {
    return NextResponse.json({ error: "type must be 50 characters or fewer" }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (url.length > 2000) {
    return NextResponse.json({ error: "url must be 2000 characters or fewer" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "only HTTP and HTTPS URLs are supported" }, { status: 400 });
  }
  if (label && label.length > 200) {
    return NextResponse.json({ error: "label must be 200 characters or fewer" }, { status: 400 });
  }
  if (!Number.isInteger(sort_order) || sort_order < 0) {
    return NextResponse.json({ error: "sort_order must be a non-negative integer" }, { status: 400 });
  }

  const db = await getDb();
  const project = await db
    .prepare("SELECT id FROM projects WHERE id = ? AND archived_at IS NULL")
    .bind(projectId)
    .first<{ id: string }>();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const id = newId();

  await db
    .prepare(
      `INSERT INTO project_links (id, project_id, type, label, url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, projectId, type, label, url, sort_order)
    .run();

  return NextResponse.json(
    { ok: true, link: { id, projectId, type, label, url, sort_order } },
    { status: 201 },
  );
}
