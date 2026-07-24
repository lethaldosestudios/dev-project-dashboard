// src/components/project-card.tsx
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <h3 className="font-medium">{project.name}</h3>
      <p className="text-sm text-neutral-400">{project.status}</p>
    </div>
  );
}
