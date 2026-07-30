// src/app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";

const statuses = new Set(["active", "paused", "archived"]);
const priorities = new Set(["low", "normal", "high"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();

  const project = await db
    .prepare("SELECT * FROM projects WHERE id = ? OR slug = ?")
    .bind(id, id)
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as any;
  const db = await getDb();
  const existing = await db.prepare("SELECT id, status FROM projects WHERE id = ? OR slug = ?").bind(id, id).first<{ id: string; status: string }>();
  if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const allowed = ["name", "description", "status", "priority", "stack", "last_activity_at"] as const;
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (!(key in body)) continue;
    if (key === "name") {
      if (typeof body[key] !== "string" || !body[key].trim() || body[key].trim().length > 120) return NextResponse.json({ error: "name must be 1-120 characters" }, { status: 400 });
      values.push(body[key].trim());
    } else if (key === "status") {
      if (!statuses.has(body[key])) return NextResponse.json({ error: "status must be active, paused, or archived" }, { status: 400 });
      values.push(body[key]);
    } else if (key === "priority") {
      if (!priorities.has(body[key])) return NextResponse.json({ error: "priority must be low, normal, or high" }, { status: 400 });
      values.push(body[key]);
    } else {
      values.push(body[key]);
    }
    updates.push(`${key} = ?`);
  }
  if ("status" in body) {
    updates.push("archived_at = ?");
    values.push(body.status === "archived" ? nowIso() : null);
  }
  if (updates.length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  updates.push("updated_at = ?");
  values.push(nowIso(), existing.id);
  await db.prepare(`UPDATE projects SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  return NextResponse.json({ ok: true, id: existing.id, updates: body });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const project = await db.prepare("SELECT id FROM projects WHERE id = ? OR slug = ?").bind(id, id).first<{ id: string }>();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  await db.batch([
    db.prepare("DELETE FROM resource_tags WHERE resource_id IN (SELECT id FROM resources WHERE project_id = ?)").bind(project.id),
    db.prepare("DELETE FROM resources WHERE project_id = ?").bind(project.id),
    db.prepare("DELETE FROM notes WHERE project_id = ?").bind(project.id),
    db.prepare("DELETE FROM project_links WHERE project_id = ?").bind(project.id),
    db.prepare("DELETE FROM github_activity WHERE project_id = ?").bind(project.id),
    db.prepare("DELETE FROM projects WHERE id = ?").bind(project.id),
  ]);
  return NextResponse.json({ ok: true, id: project.id, deleted: true });
}
