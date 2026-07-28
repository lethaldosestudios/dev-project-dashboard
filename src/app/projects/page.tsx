// src/app/projects/page.tsx
import Link from "next/link";
import { getDb } from "@/lib/db";
import { ProjectCard } from "@/components/project-card";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-button";
import { GlowInput } from "@/components/ui/glow-input";
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
    <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
          <p className="text-white/50 text-sm">Manage all your development projects</p>
        </div>
        <div className="flex items-center gap-3">
          <GlowInput 
            placeholder="Search projects..." 
            className="w-full sm:w-64" 
            glowColor="cyan"
          />
          <LiquidButton variant="primary" size="sm">
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </LiquidButton>
        </div>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
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
