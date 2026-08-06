// src/components/project-card.tsx
import Link from "next/link";
import type { Project } from "@/types";
import { GlassCard } from "./ui/glass-card";

interface ProjectCardProps {
  project: Project;
  activityCount?: number;
}

export function ProjectCard({ project, activityCount = 0 }: ProjectCardProps) {
  // Calculate days since last activity
  const lastActivityDate = project.last_activity_at ? new Date(project.last_activity_at) : null;
  const daysSinceActivity = lastActivityDate 
    ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isStale = daysSinceActivity !== null && daysSinceActivity > 14;

  const priorityColor = {
    high: "text-accent-red",
    normal: "text-accent-cyan",
    low: "text-white/50",
  }[project.priority] || "text-white/70";

  const statusColor = {
    active: "text-accent-emerald",
    paused: "text-accent-orange",
    archived: "text-white/40",
  }[project.status] || "text-white/60";

  return (
    <Link 
      href={`/projects/${project.slug}`} 
      className="block group focus-ring"
    >
      <GlassCard 
        variant="elevated" 
        glow={isStale ? "none" : "subtle"}
        className="h-full glass-interactive border-white/5 hover:border-white/10"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate group-hover:text-accent-primary transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${statusColor}`}>
                {project.status}
              </span>
              <span className={`text-xs ${priorityColor}`}>
                {project.priority}
              </span>
            </div>
          </div>
          {activityCount > 0 && (
            <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-1 rounded-full">
              +{activityCount}
            </span>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-white/60 line-clamp-2 mb-3">{project.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-white/40">
          {daysSinceActivity !== null ? (
            <span className={isStale ? "text-accent-red/70" : "text-white/50"}>
              {daysSinceActivity === 0 
                ? "Active today" 
                : daysSinceActivity === 1 
                  ? "Active yesterday" 
                  : `Active ${daysSinceActivity}d ago`}
            </span>
          ) : (
            <span className="text-white/40">No activity yet</span>
          )}
          {project.stack && (
            <span className="text-white/50">{project.stack}</span>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
