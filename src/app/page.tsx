// src/app/page.tsx
import { getDb } from "@/lib/db";
import { ProjectCard } from "@/components/project-card";
import { AttentionPanel } from "@/components/attention-panel";
import { GitHubSyncStatus } from "@/components/github-sync-status";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { LiquidButton } from "@/components/ui/liquid-button";
import Link from "next/link";
import type { Project } from "@/types";
import { ProjectDialog } from "@/components/project-dialog";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const db = await getDb();
  
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
    <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <Header
        title="Dashboard"
        subtitle="What needs your attention today?"
        actions={
          <div className="flex items-center gap-3">
            <Link href="/capture" className="text-sm text-white/60 hover:text-white transition-colors">Capture</Link>
            <Link href="/settings" className="text-sm text-white/60 hover:text-white transition-colors">Settings</Link>
            <GitHubSyncStatus lastSync={lastSync} />
            <ProjectDialog
              mode="create"
              trigger={
                <LiquidButton variant="primary" size="sm">
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">New Project</span>
                </LiquidButton>
              }
            />
          </div>
        }
      />

      {/* Stats Overview */}
      <GlassCard variant="elevated" className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <StatItem label="Total Projects" value={projects.length.toString()} icon="📊" />
        <StatItem label="Active" value={projects.filter(p => p.status === "active").length.toString()} icon="✨" />
        <StatItem label="Needs Attention" value={stale.length.toString()} icon="⚠️" />
        <StatItem label="Recent Activity" value={Object.values(activityCounts).reduce((a, b) => a + b, 0).toString()} icon="🔥" />
      </GlassCard>

      {/* Needs Attention Section */}
      <section>
        <h2 className="text-lg font-medium text-white mb-4">
          Needs attention
        </h2>
        <AttentionPanel staleProjects={stale} />
      </section>

      {/* Active Projects Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Active projects</h2>
          <Link href="/projects" className="text-sm text-accent-primary/70 hover:text-accent-primary">
            View all →
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <GlassCard variant="bordered" className="text-center py-12">
            <div className="text-4xl mb-4">🌌</div>
            <p className="text-white/60">No projects yet.</p>
            <p className="text-white/40 text-sm mt-1">Add your first one to get started.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} activityCount={activityCounts[p.id] ?? 0} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 4v16m8-8H4" 
      />
    </svg>
  );
}
