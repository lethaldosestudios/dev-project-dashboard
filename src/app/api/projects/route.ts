// src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/lib/db";
import { normalizeGithubRepo } from "@/lib/utils";
import { uniqueProjectSlug } from "@/lib/projects";
import { requireAuth } from "@/lib/auth";

const priorities = new Set(["low", "normal", "high"]);

export async function GET() {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM projects WHERE archived_at IS NULL ORDER BY last_activity_at DESC, created_at DESC")
    .all();
  return NextResponse.json({ projects: results });
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
  const description = typeof body.description === "string" ? body.description : null;
  const stack = typeof body.stack === "string" ? body.stack : null;
  const priority = typeof body.priority === "string" ? body.priority : "normal";
  const rawGithubRepo = typeof body.github_repo === "string" ? body.github_repo : null;
  const github_repo = normalizeGithubRepo(rawGithubRepo);

  // A supplied github_repo must resolve to a valid owner/repo; reject otherwise.
  if (rawGithubRepo && rawGithubRepo.trim() !== "" && !github_repo) {
    return NextResponse.json({ error: "github_repo must be a valid GitHub owner/repo (e.g. owner/repo or a github.com URL)" }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 120) {
    return NextResponse.json({ error: "name must be 120 characters or fewer" }, { status: 400 });
  }
  if (description && description.length > 5000) {
    return NextResponse.json({ error: "description must be 5000 characters or fewer" }, { status: 400 });
  }
  if (stack && stack.length > 5000) {
    return NextResponse.json({ error: "stack must be 5000 characters or fewer" }, { status: 400 });
  }
  if (!priorities.has(priority)) {
    return NextResponse.json({ error: "priority must be low, normal, or high" }, { status: 400 });
  }
  if (github_repo && github_repo.length > 200) {
    return NextResponse.json({ error: "github_repo must be 200 characters or fewer" }, { status: 400 });
  }

  const db = await getDb();
  const id = newId();
  const slug = await uniqueProjectSlug(db, name);
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO projects (id, name, slug, description, status, priority, stack, github_repo, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`
    )
    .bind(id, name, slug, description ?? null, priority, stack ?? null, github_repo, now, now)
    .run();

  return NextResponse.json({ ok: true, project: { id, name, slug, status: "active", priority, github_repo } }, { status: 201 });
}
