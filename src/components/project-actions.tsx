"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LiquidButton } from "./ui/liquid-button";

interface ProjectActionsProps {
  projectId: string;
  status: "active" | "paused" | "archived";
}

export function ProjectActions({ projectId, status }: ProjectActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: "active" | "archived") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update project.");
      router.push(nextStatus === "archived" ? "/projects" : window.location.pathname);
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update project.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject() {
    if (!window.confirm("Delete this project and all of its notes, resources, links, and activity? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete project.");
      router.push("/projects");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not delete project.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {status === "archived" ? (
          <LiquidButton variant="secondary" size="sm" onClick={() => updateStatus("active")} isLoading={busy}>
            Restore
          </LiquidButton>
        ) : (
          <LiquidButton variant="ghost" size="sm" onClick={() => updateStatus("archived")} isLoading={busy}>
            Archive
          </LiquidButton>
        )}
        <LiquidButton variant="ghost" size="sm" onClick={deleteProject} isLoading={busy}>
          Delete
        </LiquidButton>
      </div>
      {error && <p className="max-w-xs text-right text-xs text-accent-red">{error}</p>}
    </div>
  );
}
