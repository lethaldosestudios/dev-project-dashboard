import Link from "next/link";
import { GlassCard } from "./ui/glass-card";
import { ResourceAiActions } from "./resource-ai-actions";
import type { Resource } from "@/types";

interface ResourceListProps {
  resources: Resource[];
  projectId?: string;
}

export function ResourceList({ resources }: ResourceListProps) {
  if (resources.length === 0) {
    return (
      <GlassCard variant="bordered" className="text-center py-12">
        <div className="text-3xl mb-4">📚</div>
        <p className="text-white/60 text-sm">No resources yet</p>
        <p className="text-white/40 text-sm mt-1">Add links, documents, or other references.</p>
      </GlassCard>
    );
  }

  return <div className="space-y-3">{resources.map((resource) => <ResourceItem key={resource.id} resource={resource} />)}</div>;
}

function ResourceItem({ resource }: { resource: Resource }) {
  return (
    <GlassCard id={`source-${resource.id}`} variant="elevated" className="p-4 hover:border-white/20 transition-all group">
      <div className="flex items-start gap-4">
        <div className="text-2xl text-white/60 group-hover:text-accent-primary transition-colors">🔗</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <Link href={resource.url} target="_blank" rel="noopener noreferrer" className="font-medium text-white truncate hover:text-accent-primary transition-colors">{resource.title || resource.url}</Link>
            <span className="text-xs text-white/50 ml-auto">{new Date(resource.created_at).toLocaleDateString()}</span>
          </div>
          {resource.domain && <p className="text-xs text-white/40 mt-1">{resource.domain}</p>}
          {resource.note && <p className="text-sm text-white/70 mt-2">{resource.note}</p>}
          {resource.summary && <p className="text-sm text-white/50 mt-1 line-clamp-2">{resource.summary}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">{resource.saved_via}</span>
            {resource.content_type && <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">{resource.content_type}</span>}
          </div>
          <ResourceAiActions resource={resource} />
        </div>
      </div>
    </GlassCard>
  );
}
