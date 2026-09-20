// src/components/project-link-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LiquidButton } from "./ui/liquid-button";
import { ProjectLinkDialog } from "./project-link-dialog";
import type { ProjectLink } from "@/types";

interface ProjectLinkWithActionsProps {
  link: ProjectLink;
  projectId: string;
}

export function ProjectLinkWithActions({ link, projectId }: ProjectLinkWithActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteLink() {
    if (!window.confirm("Delete this link? This cannot be undone.")) return;
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/project-links/${link.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete link.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete link.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="liquid-glass px-4 py-2 rounded-xl text-sm hover:scale-105 transition-transform"
      >
        {link.label || link.url}
      </Link>
      <ProjectLinkDialog
        projectId={projectId}
        link={link}
        trigger={
          <LiquidButton variant="ghost" size="sm">
            Edit
          </LiquidButton>
        }
      />
      <LiquidButton variant="ghost" size="sm" isLoading={isDeleting} onClick={deleteLink}>
        Delete
      </LiquidButton>
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
}
