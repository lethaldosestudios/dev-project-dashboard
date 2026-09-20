// src/app/api/notes/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.prepare("SELECT * FROM notes WHERE id = ?").bind(id).first<{
    title: string | null;
    content_md: string | null;
    note_type: string;
  }>();
  if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const allowed = ["title", "content_md", "note_type"] as const;
  if (!allowed.some((key) => key in body)) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const title =
    "title" in body
      ? typeof body.title === "string"
        ? body.title.trim() || null
        : null
      : existing.title;
  if ("title" in body && body.title !== null && typeof body.title !== "string") {
    return NextResponse.json({ error: "title must be a string" }, { status: 400 });
  }
  if (title && title.length > 500) {
    return NextResponse.json({ error: "title must be 500 characters or fewer" }, { status: 400 });
  }

  const content_md =
    "content_md" in body
      ? typeof body.content_md === "string"
        ? body.content_md
        : null
      : existing.content_md;
  if ("content_md" in body && body.content_md !== null && typeof body.content_md !== "string") {
    return NextResponse.json({ error: "content_md must be a string" }, { status: 400 });
  }
  if (typeof content_md === "string" && content_md.length > 50000) {
    return NextResponse.json({ error: "content_md must be 50000 characters or fewer" }, { status: 400 });
  }

  const note_type =
    "note_type" in body
      ? typeof body.note_type === "string"
        ? body.note_type
        : "general"
      : existing.note_type;
  if ("note_type" in body && body.note_type !== null && typeof body.note_type !== "string") {
    return NextResponse.json({ error: "note_type must be a string" }, { status: 400 });
  }
  if (typeof note_type === "string" && note_type.length > 50) {
    return NextResponse.json({ error: "note_type must be 50 characters or fewer" }, { status: 400 });
  }

  await db
    .prepare(
      `UPDATE notes
       SET title = ?, content_md = ?, note_type = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(title, content_md, note_type, nowIso(), id)
    .run();

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = await getDb();
  const existing = await db.prepare("SELECT id FROM notes WHERE id = ?").bind(id).first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  await db.prepare("DELETE FROM notes WHERE id = ?").bind(id).run();

  return NextResponse.json({ ok: true, id, deleted: true });
}
