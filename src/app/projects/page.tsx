// src/app/projects/page.tsx
import Link from "next/link";
import { getDb } from "@/lib/db";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/types";

export const runtime = "edge";

async function getProjects() {
  const db = getDb();
  const { results } = await db
    .prepare("SELECT * FROM projects WHERE archived_at IS NULL ORDER BY last_activity_at DESC, created_at DESC")
    .all();
  return results as unknown as Project[];
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm transition-colors"
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-neutral-400">No projects yet. Add your first one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}
