// src/app/api/tags/route.ts
import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { uniqueTagSlug } from "@/lib/tags";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const db = await getDb();

  if (q) {
    const like = `%${q}%`;
    const { results } = await db
      .prepare("SELECT id, name, slug, created_at FROM tags WHERE name LIKE ? ORDER BY name ASC")
      .bind(like)
      .all();
    return NextResponse.json({ tags: results });
  }

  const { results } = await db
    .prepare("SELECT id, name, slug, created_at FROM tags ORDER BY name ASC")
    .all();

  return NextResponse.json({ tags: results });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 200) {
    return NextResponse.json({ error: "name must be 200 characters or fewer" }, { status: 400 });
  }

  const db = await getDb();
  const slug = await uniqueTagSlug(db, name);
  const id = newId();
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO tags (id, name, slug, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, name, slug, now)
    .run();

  return NextResponse.json({ ok: true, tag: { id, name, slug, created_at: now } }, { status: 201 });
}
