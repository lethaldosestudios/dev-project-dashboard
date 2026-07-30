// src/components/resource-list.tsx
import Link from "next/link";
import { GlassCard } from "./ui/glass-card";
import { LiquidButton } from "./ui/liquid-button";
import type { Resource } from "@/types";

interface ResourceListProps {
  resources: Resource[];
  projectId?: string;
}

export function ResourceList({ resources, projectId }: ResourceListProps) {
  if (resources.length === 0) {
    return (
      <GlassCard variant="bordered" className="text-center py-12">
        <div className="text-3xl mb-4">📚</div>
        <p className="text-white/60 text-sm">No resources yet</p>
        <p className="text-white/40 text-sm mt-1">Add links, documents, or other references.</p>
      </GlassCard>
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

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  };

  const domain = resource.url ? getDomain(resource.url) : null;

  return (
    <GlassCard 
      variant="elevated" 
      className="p-4 glass-interactive hover:border-white/20 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl text-white/60 group-hover:text-accent-primary transition-colors">
          🔗
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            {resource.url && (
              <Link
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white truncate hover:text-accent-primary transition-colors focus-ring rounded-sm"
              >
                {resource.title || resource.url}
              </Link>
            )}
            <span className="text-xs text-white/50 ml-auto">
              {formatDate(resource.created_at)}
            </span>
          </div>
          {domain && (
            <p className="text-xs text-white/40 mt-1">{domain}</p>
          )}
          {resource.note && (
            <p className="text-sm text-white/70 mt-2">{resource.note}</p>
          )}
          {resource.summary && (
            <p className="text-sm text-white/50 mt-1 line-clamp-2">{resource.summary}</p>
          )}
          <div className="mt-3 flex gap-2">
            <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">
              {resource.saved_via}
            </span>
            {resource.content_type && (
              <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">
                {resource.content_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
