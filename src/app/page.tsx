// src/app/page.tsx
import { getDb } from "@/lib/db";
import { ProjectCard } from "@/components/project-card";
import { AttentionPanel } from "@/components/attention-panel";
import { GitHubSyncStatus } from "@/components/github-sync-status";
import type { Project } from "@/types";

export const runtime = "edge";

async function getHomeData() {
  const db = getDb();
  
  // Get active projects ordered by last activity
  const { results: projects } = await db
    .prepare("SELECT * FROM projects WHERE archived_at IS NULL ORDER BY last_activity_at DESC LIMIT 12")
    .all();

  // Get stale projects (no activity in last 14 days)
  const staleThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { results: stale } = await db
    .prepare("SELECT * FROM projects WHERE archived_at IS NULL AND (last_activity_at IS NULL OR last_activity_at < ?)")
    .bind(staleThreshold)
    .all();

  // Get recent GitHub activity count per project
  const activityCounts: Record<string, number> = {};
  const { results: activity } = await db
    .prepare(
      `SELECT project_id, COUNT(*) as count FROM github_activity 
       WHERE occurred_at > datetime('now', '-14 days') 
       GROUP BY project_id`
    )
    .all();
  
  for (const a of activity as any[]) {
    activityCounts[a.project_id] = a.count;
  }

  // Get last sync time
  const { results: lastSync } = await db
    .prepare(
      `SELECT started_at, status, records_processed FROM sync_runs 
       WHERE sync_type = 'github' 
       ORDER BY started_at DESC LIMIT 1`
    )
    .all();

  return {
    projects: projects as unknown as Project[],
    stale: stale as unknown as Project[],
    activityCounts,
    lastSync: lastSync.length > 0 ? (lastSync[0] as any) : null,
  };
}

export default async function HomePage() {
  const { projects, stale, activityCounts, lastSync } = await getHomeData();

  return (
    <main className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <GitHubSyncStatus lastSync={lastSync} />
      </div>

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
              <ProjectCard 
                key={p.id} 
                project={p} 
                activityCount={activityCounts[p.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
