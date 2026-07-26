export const runtime = 'edge';

// src/app/projects/[slug]/page.tsx
import { getDb } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-button";
import { GlowInput } from "@/components/ui/glow-input";
import { GitHubActivityFeed } from "@/components/github-activity-feed";
import { ResourceList } from "@/components/resource-list";
import { NotesEditor } from "@/components/notes-editor";
import Link from "next/link";
import type { Project, Resource, Note, GitHubActivity, ProjectLink } from "@/types";
import { ProjectDialog } from "@/components/project-dialog";
import { ResourceDialog } from "@/components/resource-dialog";
import { ProjectActions } from "@/components/project-actions";

export const dynamic = "force-dynamic";

async function getProjectData(slug: string) {
  const db = await getDb();

  // Get project by slug
  const project = await db
    .prepare("SELECT * FROM projects WHERE slug = ?")
    .bind(slug)
    .first();

  if (!project) {
    return null;
  }

  // Get project links
  const { results: links } = await db
    .prepare("SELECT * FROM project_links WHERE project_id = ? ORDER BY sort_order ASC")
    .bind(project.id)
    .all();

  // Get notes
  const { results: notes } = await db
    .prepare("SELECT * FROM notes WHERE project_id = ? ORDER BY updated_at DESC")
    .bind(project.id)
    .all();

  // Get resources
  const { results: resources } = await db
    .prepare("SELECT * FROM resources WHERE project_id = ? ORDER BY created_at DESC")
    .bind(project.id)
    .all();

  // Get GitHub activity
  const { results: githubActivity } = await db
    .prepare("SELECT * FROM github_activity WHERE project_id = ? ORDER BY occurred_at DESC LIMIT 50")
    .bind(project.id)
    .all();

  return {
    project: project as unknown as Project,
    links: links as unknown as ProjectLink[],
    notes: notes as unknown as Note[],
    resources: resources as unknown as Resource[],
    githubActivity: githubActivity as unknown as GitHubActivity[],
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProjectData(slug);

  if (!data) {
    return (
      <main className="p-6 md:p-8 max-w-7xl mx-auto">
        <GlassCard variant="bordered" className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-semibold text-white mb-2">Project not found</h1>
          <p className="text-white/50">The project with slug "{slug}" doesn't exist.</p>
          <Link href="/projects" className="inline-block mt-4">
            <LiquidButton variant="secondary" size="sm">
              ← Back to Projects
            </LiquidButton>
          </Link>
        </GlassCard>
      </main>
    );
  }

  const { project, links, notes, resources, githubActivity } = data;

  // Calculate days since last activity
  const lastActivityDate = project.last_activity_at ? new Date(project.last_activity_at) : null;
  const daysSinceActivity = lastActivityDate 
    ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isStale = daysSinceActivity !== null && daysSinceActivity > 14;

  const statusColor = {
    active: "text-accent-emerald",
    paused: "text-accent-orange",
    archived: "text-white/40",
  }[project.status] || "text-white/60";

  const priorityColor = {
    high: "text-accent-red",
    normal: "text-accent-cyan",
    low: "text-white/50",
  }[project.priority] || "text-white/70";

  return (
    <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <span className={`text-sm ${statusColor} bg-${statusColor.replace("text-", "").replace("/", "_")}/20 px-2 py-1 rounded-full`}>
              {project.status}
            </span>
            <span className={`text-sm ${priorityColor}`}>
              {project.priority}
            </span>
          </div>
          {project.description && (
            <p className="text-white/60">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ProjectDialog
            mode="edit"
            project={project}
            trigger={
              <LiquidButton variant="secondary" size="sm">
                <EditIcon className="w-4 h-4" />
                Edit
              </LiquidButton>
            }
          />
          <ResourceDialog
            projectId={project.id}
            trigger={
              <LiquidButton variant="primary" size="sm">
                <PlusIcon className="w-4 h-4" />
                Add Resource
              </LiquidButton>
            }
          />
          <ProjectActions projectId={project.id} status={project.status} />
        </div>
      </div>

      {/* Stats Bar */}
      <GlassCard variant="elevated" className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <StatItem 
          label="Last Activity" 
          value={daysSinceActivity !== null 
            ? daysSinceActivity === 0 
              ? "Today" 
              : daysSinceActivity === 1 
                ? "Yesterday" 
                : `${daysSinceActivity}d ago`
            : "Never"}
          icon={isStale ? "⚠️" : "✨"}
          color={isStale ? "text-accent-red" : "text-accent-emerald"}
        />
        <StatItem label="Resources" value={resources.length.toString()} icon="📚" />
        <StatItem label="Notes" value={notes.length.toString()} icon="📝" />
        <StatItem label="Links" value={links.length.toString()} icon="🔗" />
      </GlassCard>

      {/* Links */}
      {links.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4">Links</h2>
          <div className="flex gap-3 flex-wrap">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass px-4 py-2 rounded-xl text-sm hover:scale-105 transition-transform"
              >
                {link.label || link.url}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* GitHub Activity */}
      {githubActivity.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-white mb-4">GitHub Activity</h2>
          <GitHubActivityFeed activities={githubActivity} />
        </section>
      )}

      {/* Resources */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Resources</h2>
          <ResourceDialog
            projectId={project.id}
            trigger={
              <LiquidButton variant="secondary" size="sm">
                <PlusIcon className="w-4 h-4" />
                Add
              </LiquidButton>
            }
          />
        </div>
        <ResourceList resources={resources} projectId={project.id} />
      </section>

      {/* Notes */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Notes</h2>
        </div>
        <NotesEditor projectId={project.id} notes={notes} />
      </section>
    </main>
  );
}

function StatItem({ label, value, icon, color = "text-white" }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

function EditIcon({ className }: { className?: string }) {
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
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
      />
    </svg>
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
