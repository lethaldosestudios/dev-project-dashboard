// src/components/resource-list.tsx
import type { Resource } from "@/types";

export function ResourceList({ resources }: { resources: Resource[] }) {
  return (
    <ul className="space-y-2">
      {resources.map((r) => (
        <li key={r.id} className="text-sm">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline">
            {r.title || r.url}
          </a>
        </li>
      ))}
    </ul>
  );
}
