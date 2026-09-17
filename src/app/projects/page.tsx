import { getDb } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { LiquidButton } from "@/components/ui/liquid-button";
import { ProjectFilter } from "@/components/project-filter";
import type { Project } from "@/types";
import { ProjectDialog } from "@/components/project-dialog";

export const dynamic = "force-dynamic";

async function getProjects() {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM projects WHERE archived_at IS NULL ORDER BY last_activity_at DESC, created_at DESC")
    .all();
  return results as unknown as Project[];
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <Header
        title="Projects"
        subtitle="Manage all your development projects"
        actions={
          <ProjectDialog
            mode="create"
            trigger={
              <LiquidButton variant="primary" size="sm">
                <PlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline">New Project</span>
              </LiquidButton>
            }
          />
        }
      />

      {/* Stats */}
      <GlassCard variant="elevated" className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <StatItem label="Total" value={projects.length.toString()} icon="📊" />
        <StatItem label="Active" value={projects.filter(p => p.status === "active").length.toString()} icon="✨" />
        <StatItem label="Paused" value={projects.filter(p => p.status === "paused").length.toString()} icon="⏸️" />
        <StatItem label="Archived" value="0" icon="📦" />
      </GlassCard>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <GlassCard variant="bordered" className="text-center py-12">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-white/60">No projects yet.</p>
          <p className="text-white/40 text-sm mt-1">Start by creating your first project.</p>
        </GlassCard>
      ) : (
        <ProjectFilter projects={projects} />
      )}
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
