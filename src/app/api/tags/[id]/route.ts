// src/app/api/tags/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { uniqueTagSlug } from "@/lib/tags";

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
  const existing = await db.prepare("SELECT id, name, slug FROM tags WHERE id = ?").bind(id).first<{
    id: string;
    name: string;
    slug: string;
  }>();
  if (!existing) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  const allowed = ["name"] as const;
  if (!allowed.some((key) => key in body)) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 200) {
    return NextResponse.json({ error: "name must be 200 characters or fewer" }, { status: 400 });
  }

  const slug = await uniqueTagSlug(db, name, id);

  await db
    .prepare("UPDATE tags SET name = ?, slug = ? WHERE id = ?")
    .bind(name, slug, id)
    .run();

  return NextResponse.json({ ok: true, id, name, slug });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = await getDb();
  const existing = await db.prepare("SELECT id FROM tags WHERE id = ?").bind(id).first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  await db.batch([
    db.prepare("DELETE FROM resource_tags WHERE tag_id = ?").bind(id),
    db.prepare("DELETE FROM tags WHERE id = ?").bind(id),
  ]);

  return NextResponse.json({ ok: true, id, deleted: true });
}
