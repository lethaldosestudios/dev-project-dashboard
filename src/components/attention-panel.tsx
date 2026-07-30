// src/components/attention-panel.tsx
import type { Project } from "@/types";
import { GlassCard } from "./ui/glass-card";

interface AttentionPanelProps {
  staleProjects: Project[];
}

export function AttentionPanel({ staleProjects }: AttentionPanelProps) {
  if (staleProjects.length === 0) {
    return (
      <GlassCard variant="bordered" className="text-center py-8">
        <div className="text-3xl mb-2">✨</div>
        <p className="text-white/60 text-sm">Nothing stale — all projects have recent activity.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {staleProjects.map((p) => (
        <GlassCard 
          key={p.id} 
          variant="bordered" 
          className="p-4 glass-interactive border-accent-red/20 bg-red-500/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-white">{p.name}</span>
              <span className="text-xs text-accent-red/70 ml-2">
                {p.status}
              </span>
            </div>
            <span className="text-xs text-accent-red/60">
              Needs attention
            </span>
          </div>
          {p.description && (
            <p className="text-xs text-white/50 mt-1">{p.description}</p>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
