// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ query: q, results: [] });
  }

  const db = getDb();
  const like = `%${q}%`;

  const [projects, notes, resources] = await Promise.all([
    db.prepare("SELECT id, name, slug, 'project' as type FROM projects WHERE name LIKE ? OR description LIKE ?").bind(like, like).all(),
    db.prepare("SELECT id, project_id, title, 'note' as type FROM notes WHERE title LIKE ? OR content_md LIKE ?").bind(like, like).all(),
    db.prepare("SELECT id, project_id, title, url, 'resource' as type FROM resources WHERE title LIKE ? OR url LIKE ? OR note LIKE ?").bind(like, like, like).all(),
  ]);

  return NextResponse.json({
    query: q,
    results: [...projects.results, ...notes.results, ...resources.results],
  });
}
