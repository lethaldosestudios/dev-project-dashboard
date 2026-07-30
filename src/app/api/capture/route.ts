import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { normalizeUrl, extractDomain } from "@/lib/utils";

const allowedSavedVia = new Set(["manual", "bookmarklet", "extension", "ai"]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : null;
  const note = typeof body.note === "string" ? body.note.trim() : null;
  const projectId = typeof body.projectId === "string" && body.projectId.trim() ? body.projectId.trim() : null;
  const savedVia = typeof body.savedVia === "string" && allowedSavedVia.has(body.savedVia) ? body.savedVia : "bookmarklet";

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
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

  if (title && title.length > 500) {
    return NextResponse.json({ error: "title must be 500 characters or fewer" }, { status: 400 });
  }

  if (note && note.length > 5000) {
    return NextResponse.json({ error: "note must be 5000 characters or fewer" }, { status: 400 });
  }

  const db = await getDb();
  if (projectId) {
    const project = await db.prepare("SELECT id FROM projects WHERE id = ? AND archived_at IS NULL").bind(projectId).first();
    if (!project) {
      return NextResponse.json({ error: "projectId does not identify an active project" }, { status: 400 });
    }
  }

  const normalizedUrl = normalizeUrl(parsedUrl.toString());
  const existing = await db
    .prepare("SELECT id FROM resources WHERE normalized_url = ?")
    .bind(normalizedUrl)
    .first<{ id: string }>();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true, id: existing.id });
  }

  const id = newId();
  const now = nowIso();
  const domain = extractDomain(normalizedUrl);

  await db
    .prepare(
      `INSERT INTO resources (id, project_id, url, normalized_url, title, note, domain, saved_via, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, projectId, parsedUrl.toString(), normalizedUrl, title, note, domain ?? null, savedVia, now, now)
    .run();

  return NextResponse.json({
    ok: true,
    id,
    captured: { id, url: parsedUrl.toString(), normalizedUrl, title, note, projectId, savedVia },
  }, { status: 201 });
}
