// src/app/page.tsx
import { getDb } from "@/lib/db";
import { ProjectCard } from "@/components/project-card";
import { AttentionPanel } from "@/components/attention-panel";
import type { Project } from "@/types";

export const runtime = "edge";

async function getHomeData() {
  const db = getDb();
  const { results: projects } = await db
    .prepare("SELECT * FROM projects WHERE archived_at IS NULL ORDER BY last_activity_at DESC LIMIT 12")
    .all();

  const staleThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { results: stale } = await db
    .prepare("SELECT * FROM projects WHERE archived_at IS NULL AND (last_activity_at IS NULL OR last_activity_at < ?)")
    .bind(staleThreshold)
    .all();

  return { projects: projects as unknown as Project[], stale: stale as unknown as Project[] };
}

export default async function HomePage() {
  const { projects, stale } = await getHomeData();

  return (
    <main className="p-8 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section>
        <h2 className="text-lg font-medium mb-2">Needs attention</h2>
        <AttentionPanel staleProjects={stale} />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Active projects</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-neutral-400">No projects yet. Add your first one to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
