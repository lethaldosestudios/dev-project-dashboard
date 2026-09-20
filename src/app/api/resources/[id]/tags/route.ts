// src/app/api/resources/[id]/tags/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Verify the resource exists so we don't return an empty list for a bogus id
  // without distinguishing "no tags" from "not found".
  const db = await getDb();
  const resource = await db.prepare("SELECT id FROM resources WHERE id = ?").bind(id).first<{ id: string }>();
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const { results } = await db
    .prepare(
      `SELECT t.id, t.name, t.slug, t.created_at
       FROM tags t
       JOIN resource_tags rt ON rt.tag_id = t.id
       WHERE rt.resource_id = ?
       ORDER BY t.name ASC`,
    )
    .bind(id)
    .all();

  return NextResponse.json({ tags: results });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const tagId = typeof body.tagId === "string" ? body.tagId.trim() : "";
  if (!tagId) {
    return NextResponse.json({ error: "tagId is required" }, { status: 400 });
  }

  const db = await getDb();

  const resource = await db.prepare("SELECT id FROM resources WHERE id = ?").bind(id).first<{ id: string }>();
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const tag = await db.prepare("SELECT id FROM tags WHERE id = ?").bind(tagId).first<{ id: string }>();
  if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  const existing = await db
    .prepare("SELECT resource_id FROM resource_tags WHERE resource_id = ? AND tag_id = ?")
    .bind(id, tagId)
    .first<{ resource_id: string }>();

  if (existing) {
    return NextResponse.json({ ok: true, alreadyAssigned: true, resourceId: id, tagId });
  }

  await db
    .prepare("INSERT INTO resource_tags (resource_id, tag_id, source) VALUES (?, ?, 'manual')")
    .bind(id, tagId)
    .run();

  return NextResponse.json({ ok: true, resourceId: id, tagId }, { status: 201 });
}
