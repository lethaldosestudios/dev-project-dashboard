// src/components/project-card.tsx
import Link from "next/link";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="rounded-lg border border-neutral-800 p-4 block hover:border-neutral-600 transition-colors">
      <h3 className="font-medium">{project.name}</h3>
      <p className="text-sm text-neutral-400">{project.status}</p>
    </Link>
  );
}
