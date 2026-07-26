// src/app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";

export const runtime = "edge";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();

  const project = await db
    .prepare("SELECT * FROM projects WHERE id = ? OR slug = ?")
    .bind(params.id, params.id)
    .first();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { results: links } = await db
    .prepare("SELECT * FROM project_links WHERE project_id = ? ORDER BY sort_order ASC")
    .bind(project.id)
    .all();

  const { results: notes } = await db
    .prepare("SELECT * FROM notes WHERE project_id = ? ORDER BY updated_at DESC")
    .bind(project.id)
    .all();

  const { results: resources } = await db
    .prepare("SELECT * FROM resources WHERE project_id = ? ORDER BY created_at DESC")
    .bind(project.id)
    .all();

  return NextResponse.json({ project, links, notes, resources });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as any;
  const db = getDb();

  const allowed = ["name", "description", "status", "priority", "stack", "last_activity_at"] as const;
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
  values.push(params.id);

  await db
    .prepare(`UPDATE projects SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return NextResponse.json({ ok: true, id: params.id, updates: body });
}
