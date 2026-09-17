// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ query: q, results: [] });
  }

  const db = await getDb();
  const like = `%${q}%`;

  const [projects, notes, resources] = await Promise.all([
    db.prepare("SELECT id, name, slug, 'project' as type FROM projects WHERE name LIKE ? OR description LIKE ?").bind(like, like).all(),
    db
      .prepare(
        `SELECT n.id, n.project_id, n.title, p.slug AS project_slug, 'note' as type
         FROM notes n LEFT JOIN projects p ON p.id = n.project_id
         WHERE n.title LIKE ? OR n.content_md LIKE ?`
      )
      .bind(like, like)
      .all(),
    db
      .prepare(
        `SELECT r.id, r.project_id, r.title, r.url, p.slug AS project_slug, 'resource' as type
         FROM resources r LEFT JOIN projects p ON p.id = r.project_id
         WHERE r.title LIKE ? OR r.url LIKE ? OR r.note LIKE ?`
      )
      .bind(like, like, like)
      .all(),
  ]);

  return NextResponse.json({
    query: q,
    results: [...projects.results, ...notes.results, ...resources.results],
  });
}
