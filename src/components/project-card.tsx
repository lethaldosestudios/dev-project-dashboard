// src/components/project-card.tsx
import Link from "next/link";
import type { Project } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="block">
      <Card glow hoverEffect className="h-full">
        <CardHeader>
          <CardTitle className="text-white">{project.name}</CardTitle>
          {project.description && (
            <CardDescription>{project.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-neutral-400">
              {project.status}
            </span>
            {project.priority !== "normal" && (
              <span className="text-xs px-2 py-1 bg-liquid-base rounded-full text-white">
                {project.priority}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
