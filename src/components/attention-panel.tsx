// src/components/attention-panel.tsx
import type { Project } from "@/types";

export function AttentionPanel({ staleProjects }: { staleProjects: Project[] }) {
  if (staleProjects.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-400">
        Nothing stale — all projects have recent activity.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {staleProjects.map((p) => (
        <li key={p.id} className="rounded-lg border border-neutral-800 p-4 text-sm">
          <span className="font-medium">{p.name}</span>
          <span className="text-neutral-400"> — no recent activity</span>
        </li>
      ))}
    </ul>
  );
}
