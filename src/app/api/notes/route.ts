// src/app/api/notes/route.ts
import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * GET notes for a project
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM notes WHERE project_id = ? ORDER BY updated_at DESC")
    .bind(projectId)
    .all();

  return NextResponse.json({ notes: results });
}

/**
 * POST - Create a new note
 */
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
  const title = typeof body.title === "string" ? body.title.trim() || null : null;
  const content_md = typeof body.content_md === "string" ? body.content_md : "";
  const note_type = typeof body.note_type === "string" ? body.note_type : "general";

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  if (!content_md) {
    return NextResponse.json({ error: "content_md is required" }, { status: 400 });
  }
  if (content_md.length > 50000) {
    return NextResponse.json({ error: "content_md must be 50000 characters or fewer" }, { status: 400 });
  }
  if (title && title.length > 500) {
    return NextResponse.json({ error: "title must be 500 characters or fewer" }, { status: 400 });
  }
  if (note_type.length > 50) {
    return NextResponse.json({ error: "note_type must be 50 characters or fewer" }, { status: 400 });
  }

  const db = await getDb();
  const id = newId();
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO notes (id, project_id, title, content_md, note_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, projectId, title ?? null, content_md, note_type, now, now)
    .run();

  return NextResponse.json(
    { ok: true, note: { id, projectId, title, content_md, note_type, created_at: now, updated_at: now } },
    { status: 201 }
  );
}
