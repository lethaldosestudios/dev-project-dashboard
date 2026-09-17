// src/app/api/resources/route.ts
import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { normalizeUrl, extractDomain } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { findDuplicateResource } from "@/lib/resources";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function parsePaging(searchParams: URLSearchParams): { limit: number; offset: number } | null {
  const rawLimit = searchParams.get("limit");
  const rawOffset = searchParams.get("offset");

  const limit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit);
  const offset = rawOffset === null ? 0 : Number(rawOffset);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return null;
  if (!Number.isInteger(offset) || offset < 0) return null;

  return { limit, offset };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const paging = parsePaging(searchParams);
  if (!paging) {
    return NextResponse.json(
      { error: `limit must be an integer from 1 to ${MAX_LIMIT}, and offset an integer of 0 or greater` },
      { status: 400 }
    );
  }
  const { limit, offset } = paging;

  const db = await getDb();

  // Two explicit branches rather than an assembled WHERE clause, so no part of the SQL is built
  // from request input.
  const [countRow, list] = projectId
    ? await Promise.all([
        db
          .prepare("SELECT COUNT(*) AS total FROM resources WHERE project_id = ?")
          .bind(projectId)
          .first<{ total: number }>(),
        db
          .prepare("SELECT * FROM resources WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
          .bind(projectId, limit, offset)
          .all(),
      ])
    : await Promise.all([
        db.prepare("SELECT COUNT(*) AS total FROM resources").first<{ total: number }>(),
        db
          .prepare("SELECT * FROM resources ORDER BY created_at DESC LIMIT ? OFFSET ?")
          .bind(limit, offset)
          .all(),
      ]);

  return NextResponse.json({
    resources: list.results,
    total: countRow?.total ?? 0,
    limit,
    offset,
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const title = typeof body.title === "string" ? body.title : null;
  const note = typeof body.note === "string" ? body.note : null;
  const projectId = typeof body.projectId === "string" && body.projectId.trim() ? body.projectId.trim() : null;
  const savedVia = typeof body.savedVia === "string" ? body.savedVia : "manual";

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (url.length > 2000) {
    return NextResponse.json({ error: "url must be 2000 characters or fewer" }, { status: 400 });
  }
  if (title && title.length > 500) {
    return NextResponse.json({ error: "title must be 500 characters or fewer" }, { status: 400 });
  }
  if (note && note.length > 5000) {
    return NextResponse.json({ error: "note must be 5000 characters or fewer" }, { status: 400 });
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

  const existing = await findDuplicateResource(db, normalizedUrl, projectId);

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
