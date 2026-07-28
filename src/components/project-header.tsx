// src/components/project-header.tsx
import Link from "next/link";
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-neutral-400">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            project.status === "active" 
              ? "bg-green-900/50 text-green-300" 
              : project.status === "paused" 
                ? "bg-yellow-900/50 text-yellow-300" 
                : "bg-neutral-800 text-neutral-400"
          }`}>
            {project.status}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            project.priority === "high" 
              ? "bg-red-900/50 text-red-300" 
              : project.priority === "low" 
                ? "bg-neutral-800 text-neutral-400" 
                : "bg-blue-900/50 text-blue-300"
          }`}>
            {project.priority}
          </span>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-neutral-400">
        {daysSinceActivity !== null && (
          <span className={isStale ? "text-red-400" : "text-neutral-400"}>
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
            className="text-blue-400 hover:text-blue-300"
          >
            {project.github_repo}
          </Link>
        )}
      </div>

      {links.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-neutral-800 rounded-md text-sm hover:bg-neutral-700 transition-colors"
            >
              {link.label || link.url}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
