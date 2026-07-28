// src/components/attention-panel.tsx
import type { Project } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function AttentionPanel({ staleProjects }: { staleProjects: Project[] }) {
  if (staleProjects.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <p className="text-sm text-neutral-400">Nothing stale — all projects have recent activity.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card glow className="bg-red-500/5 border-red-500/10">
      <CardHeader>
        <CardTitle className="text-red-400">{staleProjects.length} Stale Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {staleProjects.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-neutral-300">{p.name}</span>
              <span className="text-xs text-neutral-500 ml-auto">no recent activity</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
