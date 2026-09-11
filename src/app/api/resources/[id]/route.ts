// src/app/api/resources/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { normalizeUrl, extractDomain } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const body = (await req.json()) as any;
  const db = await getDb();
  const existing = await db.prepare("SELECT id FROM resources WHERE id = ?").bind(id).first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  const allowed = ["title", "summary", "note", "content_type"] as const;
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (!(key in body)) continue;
    if (typeof body[key] === "string" && body[key].length > 2000) return NextResponse.json({ error: `${key} is too long` }, { status: 400 });
    updates.push(`${key} = ?`);
    values.push(body[key]);
  }
  if ("url" in body) {
    if (typeof body.url !== "string" || body.url.length > 2000) return NextResponse.json({ error: "url must be 2000 characters or fewer" }, { status: 400 });
    try {
      const parsed = new URL(body.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      return NextResponse.json({ error: "url must be a valid http or https URL" }, { status: 400 });
    }
    const normalizedUrl = normalizeUrl(body.url);
    updates.push("url = ?", "normalized_url = ?", "domain = ?");
    values.push(body.url, normalizedUrl, extractDomain(normalizedUrl));
  }
  if (updates.length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  updates.push("updated_at = ?");
  values.push(nowIso(), id);
  await db.prepare(`UPDATE resources SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  return NextResponse.json({ ok: true, id, updates: body });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = await getDb();
  const existing = await db.prepare("SELECT id FROM resources WHERE id = ?").bind(id).first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  await db.batch([
    db.prepare("DELETE FROM resource_tags WHERE resource_id = ?").bind(id),
    db.prepare("DELETE FROM resources WHERE id = ?").bind(id),
  ]);
  return NextResponse.json({ ok: true, id, deleted: true });
}
