// src/app/api/notes/route.ts
import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";

export const runtime = "edge";

/**
 * GET notes for a project
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const db = getDb();
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
  const body = (await req.json()) as any;
  const { projectId, title, content_md, note_type = "general" } = body;

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  if (!content_md || typeof content_md !== "string") {
    return NextResponse.json({ error: "content_md is required" }, { status: 400 });
  }

  const db = getDb();
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
