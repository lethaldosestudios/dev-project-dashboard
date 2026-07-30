"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResourceDialog } from "./resource-dialog";
import { LiquidButton } from "./ui/liquid-button";
import type { Resource } from "@/types";

interface ResourceActionsProps {
  resource: Resource;
  projectId: string;
}

export function ResourceActions({ resource, projectId }: ResourceActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function deleteResource() {
    if (!window.confirm("Delete this resource? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete resource.");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not delete resource.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <ResourceDialog
        projectId={projectId}
        resource={resource}
        trigger={<LiquidButton variant="ghost" size="sm">Edit</LiquidButton>}
      />
      <LiquidButton variant="ghost" size="sm" onClick={deleteResource} isLoading={busy}>
        Delete
      </LiquidButton>
      {error && <p className="basis-full text-xs text-accent-red">{error}</p>}
    </div>
  );
}
