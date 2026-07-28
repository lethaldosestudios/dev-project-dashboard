// src/components/github-activity-feed.tsx
import type { GitHubActivity } from "@/types";

interface GitHubActivityFeedProps {
  activities: GitHubActivity[];
}

export function GitHubActivityFeed({ activities }: GitHubActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-400">
        No GitHub activity yet.
      </div>
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case "PushEvent":
        return "↑";
      case "IssuesEvent":
      case "IssueCommentEvent":
        return "🐛";
      case "PullRequestEvent":
        return "📥";
      case "CreateEvent":
        return "+";
      case "DeleteEvent":
        return "-";
      default:
        return "•";
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "PushEvent":
        return "Pushed";
      case "IssuesEvent":
        return "Issue";
      case "IssueCommentEvent":
        return "Commented";
      case "PullRequestEvent":
        return "Pull request";
      case "CreateEvent":
        return "Created";
      case "DeleteEvent":
        return "Deleted";
      default:
        return type;
    }
  };

  return (
    <div className="rounded-lg border border-neutral-800 p-4 hover:border-neutral-700 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-neutral-500 text-lg">{getEventIcon(activity.event_type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm">{getEventLabel(activity.event_type)}</span>
            {activity.author && (
              <span className="text-xs text-neutral-400">by {activity.author}</span>
            )}
            <span className="text-xs text-neutral-500 ml-auto">
              {formatDate(activity.occurred_at)}
            </span>
          </div>
          {activity.title && (
            <p className="text-sm text-neutral-300 mt-1">{activity.title}</p>
          )}
          {activity.commit_sha && (
            <code className="text-xs text-neutral-500 mt-1 block">{activity.commit_sha.slice(0, 7)}</code>
          )}
          {activity.url && (
            <a 
              href={activity.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
            >
              View on GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
