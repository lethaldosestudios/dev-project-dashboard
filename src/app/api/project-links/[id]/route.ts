// src/app/api/project-links/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
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
  const existing = await db.prepare("SELECT * FROM project_links WHERE id = ?").bind(id).first<{
    type: string;
    label: string | null;
    url: string;
    sort_order: number;
  }>();
  if (!existing) return NextResponse.json({ error: "Project link not found" }, { status: 404 });

  const allowed = ["type", "label", "url", "sort_order"] as const;
  if (!allowed.some((key) => key in body)) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  if ("type" in body) {
    if (typeof body.type !== "string") {
      return NextResponse.json({ error: "type must be a string" }, { status: 400 });
    }
    if (!body.type.trim()) {
      return NextResponse.json({ error: "type must not be empty" }, { status: 400 });
    }
    if (body.type.trim().length > 50) {
      return NextResponse.json({ error: "type must be 50 characters or fewer" }, { status: 400 });
    }
  }

  if ("label" in body) {
    if (body.label !== null && typeof body.label !== "string") {
      return NextResponse.json({ error: "label must be a string or null" }, { status: 400 });
    }
    if (typeof body.label === "string" && body.label.length > 200) {
      return NextResponse.json({ error: "label must be 200 characters or fewer" }, { status: 400 });
    }
  }

  if ("url" in body) {
    if (typeof body.url !== "string") {
      return NextResponse.json({ error: "url must be a string" }, { status: 400 });
    }
    if (!body.url.trim()) {
      return NextResponse.json({ error: "url must not be empty" }, { status: 400 });
    }
    if (body.url.length > 2000) {
      return NextResponse.json({ error: "url must be 2000 characters or fewer" }, { status: 400 });
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
    } catch {
      return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 });
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "only HTTP and HTTPS URLs are supported" }, { status: 400 });
    }
  }

  if ("sort_order" in body) {
    if (typeof body.sort_order !== "number" || !Number.isInteger(body.sort_order) || body.sort_order < 0) {
      return NextResponse.json({ error: "sort_order must be a non-negative integer" }, { status: 400 });
    }
  }

  const type = "type" in body ? (body.type as string).trim() : existing.type;
  const label =
    "label" in body ? (body.label === null ? null : (body.label as string).trim() || null) : existing.label;
  const url = "url" in body ? (body.url as string).trim() : existing.url;
  const sort_order = "sort_order" in body ? (body.sort_order as number) : existing.sort_order;

  await db
    .prepare(
      `UPDATE project_links
       SET type = ?, label = ?, url = ?, sort_order = ?
       WHERE id = ?`,
    )
    .bind(type, label, url, sort_order, id)
    .run();

  return NextResponse.json({ ok: true, id, updates: body });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const db = await getDb();
  const existing = await db
    .prepare("SELECT id FROM project_links WHERE id = ?")
    .bind(id)
    .first<{ id: string }>();
  if (!existing) return NextResponse.json({ error: "Project link not found" }, { status: 404 });

  await db.prepare("DELETE FROM project_links WHERE id = ?").bind(id).run();

  return NextResponse.json({ ok: true, id, deleted: true });
}
