// src/app/api/resources/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as any;
  const db = await getDb();

  const allowed = ["title", "summary", "note", "project_id", "content_type"] as const;
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.push("updated_at = ?");
  values.push(nowIso());
  values.push(id);

  await db
    .prepare(`UPDATE resources SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return NextResponse.json({ ok: true, id, updates: body });
}
