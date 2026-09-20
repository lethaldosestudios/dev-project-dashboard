// src/app/api/resources/[id]/tags/[tagId]/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> },
) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id, tagId } = await params;
  const db = await getDb();

  const resource = await db.prepare("SELECT id FROM resources WHERE id = ?").bind(id).first<{ id: string }>();
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const existing = await db
    .prepare("SELECT resource_id FROM resource_tags WHERE resource_id = ? AND tag_id = ?")
    .bind(id, tagId)
    .first<{ resource_id: string }>();

  if (!existing) {
    return NextResponse.json({ ok: true, alreadyRemoved: true, resourceId: id, tagId });
  }

  await db
    .prepare("DELETE FROM resource_tags WHERE resource_id = ? AND tag_id = ?")
    .bind(id, tagId)
    .run();

  return NextResponse.json({ ok: true, resourceId: id, tagId, deleted: true });
}
