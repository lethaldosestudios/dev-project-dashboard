// src/app/api/resources/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { normalizeUrl, extractDomain } from "@/lib/utils";
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
  const existing = await db.prepare("SELECT id FROM resources WHERE id = ?").bind(id).first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const allowed = ["title", "summary", "note", "content_type", "url"] as const;
  if (!allowed.some((key) => key in body)) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const stringFields = ["title", "summary", "note", "content_type"] as const;
  for (const key of stringFields) {
    const value = key in body ? body[key] : undefined;
    if (value !== undefined && value !== null && typeof value !== "string") {
      return NextResponse.json({ error: `${key} must be a string` }, { status: 400 });
    }
    if (typeof value === "string" && value.length > 2000) {
      return NextResponse.json({ error: `${key} must be 2000 characters or fewer` }, { status: 400 });
    }
  }

  let url: string | null = null;
  let normalizedUrl: string | null = null;
  let domain: string | null = null;
  if ("url" in body) {
    if (typeof body.url !== "string" || body.url.length > 2000) {
      return NextResponse.json({ error: "url must be 2000 characters or fewer" }, { status: 400 });
    }
    try {
      const parsed = new URL(body.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      return NextResponse.json({ error: "url must be a valid http or https URL" }, { status: 400 });
    }
    url = body.url;
    normalizedUrl = normalizeUrl(body.url);
    domain = extractDomain(normalizedUrl) ?? null;
  }

  const getStr = (key: typeof stringFields[number]): string | null =>
    key in body && typeof body[key] === "string" ? (body[key] as string) : null;

  // Explicit column-by-column update — every value is a bound parameter.
  await db
    .prepare(
      `UPDATE resources
       SET title = ?, summary = ?, note = ?, content_type = ?, url = ?, normalized_url = ?, domain = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      getStr("title"),
      getStr("summary"),
      getStr("note"),
      getStr("content_type"),
      url,
      normalizedUrl,
      domain,
      nowIso(),
      id
    )
    .run();

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
