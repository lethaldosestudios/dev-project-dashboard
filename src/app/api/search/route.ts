// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { getDbFromRequest } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const db = getDbFromRequest(req);
  const searchPattern = `%${query}%`;

  const { results: projects } = await db
    .prepare(
      "SELECT id, name, slug, description FROM projects WHERE name LIKE ? OR description LIKE ? OR stack LIKE ?"
    )
    .bind(searchPattern, searchPattern, searchPattern)
    .all();

  const { results: resources } = await db
    .prepare(
      "SELECT id, url, title, note, domain FROM resources WHERE title LIKE ? OR url LIKE ? OR note LIKE ? OR summary LIKE ?"
    )
    .bind(searchPattern, searchPattern, searchPattern, searchPattern)
    .all();

  const { results: notes } = await db
    .prepare("SELECT id, project_id, title, content_md FROM notes WHERE title LIKE ? OR content_md LIKE ?")
    .bind(searchPattern, searchPattern)
    .all();

  return NextResponse.json({ projects, resources, notes });
}
