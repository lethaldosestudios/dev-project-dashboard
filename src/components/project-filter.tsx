"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "./project-card";
import { GlassCard } from "./ui/glass-card";
import { GlowInput } from "./ui/glow-input";
import type { Project } from "@/types";

interface ProjectFilterProps {
  projects: Project[];
}

export function ProjectFilter({ projects }: ProjectFilterProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;

    return projects.filter((project) =>
      [project.name, project.description, project.stack, project.github_repo]
        .filter((field): field is string => typeof field === "string")
        .some((field) => field.toLowerCase().includes(needle)),
    );
  }, [projects, query]);

  const trimmed = query.trim();

  return (
    <div className="space-y-4">
      <GlowInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter projects..."
        aria-label="Filter projects"
        className="w-full sm:w-72"
        glowColor="cyan"
      />

      {filtered.length === 0 ? (
        <GlassCard variant="bordered" className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white/60">No projects match &ldquo;{trimmed}&rdquo;.</p>
          <p className="text-white/40 text-sm mt-1">Try a different name, stack, or repo.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
