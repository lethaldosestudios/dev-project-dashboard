// src/components/project-card.tsx
import Link from "next/link";
import type { Project } from "@/types";

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

  return (
    <Link 
      href={`/projects/${project.slug}`} 
      className="rounded-lg border border-neutral-800 p-4 block hover:border-neutral-600 transition-colors group"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{project.name}</h3>
          <p className="text-sm text-neutral-400">{project.status}</p>
        </div>
        {activityCount > 0 && (
          <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full text-neutral-300">
            {activityCount} updates
          </span>
        )}
      </div>
      {project.description && (
        <p className="text-sm text-neutral-400 mt-2 line-clamp-2">{project.description}</p>
      )}
      {daysSinceActivity !== null && (
        <p className={`text-xs mt-2 ${isStale ? "text-red-400" : "text-neutral-500"}`}>
          {daysSinceActivity === 0 
            ? "Active today" 
            : daysSinceActivity === 1 
              ? "Active yesterday" 
              : `Active ${daysSinceActivity} days ago`}
        </p>
      )}
    </Link>
  );
}
