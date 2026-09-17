// src/app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { normalizeGithubRepo } from "@/lib/utils";

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
  const existing = await db.prepare("SELECT * FROM projects WHERE id = ? OR slug = ?").bind(id, id).first<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    stack: string | null;
    github_repo: string | null;
    last_activity_at: string | null;
  }>();
  if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // No updatable field present in the body.
  const allowed = ["name", "description", "status", "priority", "stack", "github_repo", "last_activity_at"] as const;
  if (!allowed.some((key) => key in body)) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const name = "name" in body ? body.name : existing.name;
  if ("name" in body) {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
      return NextResponse.json({ error: "name must be 1-120 characters" }, { status: 400 });
    }
  }

  const status = "status" in body ? body.status : existing.status;
  if ("status" in body) {
    if (typeof status !== "string" || !statuses.has(status)) {
      return NextResponse.json({ error: "status must be active, paused, or archived" }, { status: 400 });
    }
  }

  const priority = "priority" in body ? body.priority : existing.priority;
  if ("priority" in body) {
    if (typeof priority !== "string" || !priorities.has(priority)) {
      return NextResponse.json({ error: "priority must be low, normal, or high" }, { status: 400 });
    }
  }

  const description = "description" in body ? body.description : existing.description;
  if ("description" in body && description !== null && typeof description !== "string") {
    return NextResponse.json({ error: "description must be a string" }, { status: 400 });
  }
  if (typeof description === "string" && description.length > 5000) {
    return NextResponse.json({ error: "description must be 5000 characters or fewer" }, { status: 400 });
  }

  const stack = "stack" in body ? body.stack : existing.stack;
  if ("stack" in body && stack !== null && typeof stack !== "string") {
    return NextResponse.json({ error: "stack must be a string" }, { status: 400 });
  }
  if (typeof stack === "string" && stack.length > 5000) {
    return NextResponse.json({ error: "stack must be 5000 characters or fewer" }, { status: 400 });
  }

  const githubRepoVal = "github_repo" in body ? body.github_repo : existing.github_repo;
  let github_repo: string | null = existing.github_repo;
  if ("github_repo" in body) {
    if (githubRepoVal !== null && typeof githubRepoVal !== "string") {
      return NextResponse.json({ error: "github_repo must be a string" }, { status: 400 });
    }
    github_repo = normalizeGithubRepo(githubRepoVal as string | null);
    if (githubRepoVal && typeof githubRepoVal === "string" && githubRepoVal.trim() !== "" && !github_repo) {
      return NextResponse.json({ error: "github_repo must be a valid GitHub owner/repo (e.g. owner/repo or a github.com URL)" }, { status: 400 });
    }
    if (github_repo && github_repo.length > 200) {
      return NextResponse.json({ error: "github_repo must be 200 characters or fewer" }, { status: 400 });
    }
  }

  const last_activity_at = "last_activity_at" in body ? body.last_activity_at : existing.last_activity_at;
  if ("last_activity_at" in body && last_activity_at !== null && typeof last_activity_at !== "string") {
    return NextResponse.json({ error: "last_activity_at must be a string" }, { status: 400 });
  }

  // `slug` is deliberately absent from this UPDATE. It is a stable permalink assigned at
  // creation; rewriting it on rename would break every existing link. See src/lib/projects.ts.
  await db
    .prepare(
      `UPDATE projects
       SET name = ?, description = ?, status = ?, priority = ?, stack = ?, github_repo = ?, last_activity_at = ?, archived_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      typeof name === "string" ? name.trim() : existing.name,
      typeof description === "string" ? description : null,
      typeof status === "string" ? status : existing.status,
      typeof priority === "string" ? priority : existing.priority,
      typeof stack === "string" ? stack : null,
      github_repo,
      typeof last_activity_at === "string" ? last_activity_at : null,
      status === "archived" ? nowIso() : null,
      nowIso(),
      existing.id
    )
    .run();

  return NextResponse.json({ ok: true, id: existing.id, updates: body });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

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
