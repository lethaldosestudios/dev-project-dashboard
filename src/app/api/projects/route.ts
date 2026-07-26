// src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { slugify } from "@/lib/utils";

export const runtime = "edge";

export async function GET() {
  const db = getDb();
  const { results } = await db
    .prepare("SELECT * FROM projects WHERE archived_at IS NULL ORDER BY last_activity_at DESC, created_at DESC")
    .all();
  return NextResponse.json({ projects: results });
}

export async function POST(req: Request) {
  const body = (await req.json()) as any;
  const { name, description, priority = "normal", stack } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const db = getDb();
  const id = newId();
  const slug = slugify(name);
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO projects (id, name, slug, description, status, priority, stack, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`
    )
    .bind(id, name, slug, description ?? null, priority, stack ?? null, now, now)
    .run();

  return NextResponse.json({ ok: true, project: { id, name, slug, status: "active", priority } }, { status: 201 });
}
