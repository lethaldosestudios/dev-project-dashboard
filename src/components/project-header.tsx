// src/components/project-header.tsx
import Link from "next/link";
import { GlassCard } from "./ui/glass-card";
import type { Project, ProjectLink } from "@/types";

interface ProjectHeaderProps {
  project: Project;
  links: ProjectLink[];
}

export function ProjectHeader({ project, links }: ProjectHeaderProps) {
  // Calculate days since last activity
  const lastActivityDate = project.last_activity_at ? new Date(project.last_activity_at) : null;
  const daysSinceActivity = lastActivityDate 
    ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isStale = daysSinceActivity !== null && daysSinceActivity > 14;

  const statusColor = {
    active: "bg-accent-emerald/20 text-accent-emerald",
    paused: "bg-accent-orange/20 text-accent-orange",
    archived: "bg-white/10 text-white/40",
  }[project.status] || "bg-white/10 text-white/60";

  const priorityColor = {
    high: "bg-accent-red/20 text-accent-red",
    normal: "bg-accent-cyan/20 text-accent-cyan",
    low: "bg-white/10 text-white/50",
  }[project.priority] || "bg-white/10 text-white/70";

  return (
    <GlassCard variant="elevated" className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                {project.status}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${priorityColor}`}>
                {project.priority}
              </span>
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-white/70">{project.description}</p>
        )}

        <div className="flex gap-4 text-sm text-white/50 pt-4 border-t border-white/5">
          {daysSinceActivity !== null && (
            <span className={isStale ? "text-accent-red/70" : "text-white/50"}>
              {daysSinceActivity === 0 
                ? "Active today" 
                : daysSinceActivity === 1 
                  ? "Active yesterday" 
                  : `Active ${daysSinceActivity} days ago`}
            </span>
          )}
          {project.stack && (
            <span>Stack: {project.stack}</span>
          )}
          {project.github_repo && (
            <Link 
              href={`https://github.com/${project.github_repo}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent-primary/70 hover:text-accent-primary transition-colors"
            >
              {project.github_repo}
            </Link>
          )}
        </div>

        {links.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-4 border-t border-white/5">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass px-3 py-1.5 rounded-lg text-xs hover:scale-105 transition-transform"
              >
                {link.label || link.url}
              </Link>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
