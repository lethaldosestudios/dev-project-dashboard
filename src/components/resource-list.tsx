// src/components/resource-list.tsx
import Link from "next/link";
import type { Resource } from "@/types";

interface ResourceListProps {
  resources: Resource[];
  projectId?: string;
}

export function ResourceList({ resources, projectId }: ResourceListProps) {
  if (resources.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-400">
        No resources yet. Add links, documents, or other references.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <ResourceItem key={resource.id} resource={resource} />
      ))}
    </div>
  );
}

function ResourceItem({ resource }: { resource: Resource }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-lg border border-neutral-800 p-4 hover:border-neutral-700 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-neutral-500 text-lg">🔗</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            {resource.url && (
              <Link
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm text-blue-400 hover:text-blue-300 truncate"
              >
                {resource.title || resource.url}
              </Link>
            )}
            <span className="text-xs text-neutral-500 ml-auto">
              {formatDate(resource.created_at)}
            </span>
          </div>
          {resource.domain && (
            <p className="text-xs text-neutral-500 mt-1">{resource.domain}</p>
          )}
          {resource.note && (
            <p className="text-sm text-neutral-400 mt-2">{resource.note}</p>
          )}
          {resource.summary && (
            <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{resource.summary}</p>
          )}
          <div className="mt-2 flex gap-2">
            <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full">
              {resource.saved_via}
            </span>
            {resource.content_type && (
              <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full">
                {resource.content_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
