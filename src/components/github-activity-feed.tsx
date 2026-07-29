// src/components/github-activity-feed.tsx
import { GlassCard } from "./ui/glass-card";
import type { GitHubActivity } from "@/types";

interface GitHubActivityFeedProps {
  activities: GitHubActivity[];
}

export function GitHubActivityFeed({ activities }: GitHubActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <GlassCard variant="bordered" className="text-center py-8">
        <div className="text-3xl mb-2">🐙</div>
        <p className="text-white/60 text-sm">No GitHub activity yet.</p>
        <p className="text-white/40 text-sm mt-1">Sync your repositories to see updates.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: GitHubActivity }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getEventConfig = (type: string) => {
    switch (type) {
      case "PushEvent":
        return { icon: "↑", label: "Pushed", color: "text-accent-emerald" };
      case "IssuesEvent":
      case "IssueCommentEvent":
        return { icon: "🐛", label: "Issue", color: "text-accent-red" };
      case "PullRequestEvent":
      case "PullRequestReviewEvent":
      case "PullRequestReviewCommentEvent":
        return { icon: "📥", label: "Pull request", color: "text-accent-purple" };
      case "CreateEvent":
        return { icon: "+", label: "Created", color: "text-accent-cyan" };
      case "DeleteEvent":
        return { icon: "-", label: "Deleted", color: "text-white/60" };
      default:
        return { icon: "•", label: type, color: "text-white/70" };
    }
  };

  const config = getEventConfig(activity.event_type);

  return (
    <GlassCard
      id={`source-${activity.id}`}
      variant="elevated"
      className="p-4 hover:border-white/20 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl ${config.color}`}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-white text-sm">{config.label}</span>
            {activity.author && (
              <span className="text-xs text-white/50">by {activity.author}</span>
            )}
            <span className="text-xs text-white/40 ml-auto">
              {formatDate(activity.occurred_at)}
            </span>
          </div>
          {activity.title && (
            <p className="text-sm text-white/80 mt-1">{activity.title}</p>
          )}
          {activity.commit_sha && (
            <code className="text-xs text-white/40 mt-1 block">{activity.commit_sha.slice(0, 7)}</code>
          )}
          {activity.url && (
            <a 
              href={activity.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-accent-primary/70 hover:text-accent-primary mt-1 inline-block"
            >
              View on GitHub →
            </a>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
