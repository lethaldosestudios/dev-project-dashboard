// src/components/resource-list.tsx
import type { Resource } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

export function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <p className="text-sm text-neutral-400">No resources yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card glow className="p-0">
      <CardContent className="p-0">
        <ul className="divide-y divide-white/5">
          {resources.map((r) => (
            <li key={r.id} className="p-3 hover:bg-white/5 transition-colors">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-glass-primary/50 flex items-center justify-center">
                    <span className="text-xs text-neutral-400">{r.domain?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.title || r.url}</p>
                    <p className="text-xs text-neutral-500">{r.domain}</p>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
