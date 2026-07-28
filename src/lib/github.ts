// src/lib/github.ts
// GitHub API client for fetching repository activity

const GITHUB_API_BASE = "https://api.github.com";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  pushed_at: string | null;
  updated_at: string | null;
  stargazers_count: number;
  open_issues_count: number;
  language: string | null;
  archived: boolean;
  visibility: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  repo: {
    name: string;
  };
  payload: Record<string, unknown>;
  created_at: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: {
    login: string;
  } | null;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubActivity {
  id: string;
  project_id: string;
  event_type: string;
  external_id: string;
  commit_sha?: string;
  title?: string;
  author?: string;
  url?: string;
  occurred_at: string;
}

// Map of owner/repo to project slug for auto-linking
// This should eventually come from project settings in the DB
const REPO_TO_PROJECT: Record<string, string> = {
  // Add your repositories here as you create projects
  // Format: "owner/repo": "project-slug"
};

function getHeaders(token: string): HeadersInit {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "dev-project-dashboard",
  };
}

/**
 * Fetch all repositories for the authenticated user
 */
export async function fetchUserRepos(token: string, perPage: number = 100): Promise<GitHubRepo[]> {
  const headers = getHeaders(token);
  const response = await fetch(
    `${GITHUB_API_BASE}/user/repos?type=owner&sort=updated&per_page=${perPage}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json() as Promise<GitHubRepo[]>;
}

/**
 * Fetch repository events for a specific repo
 */
export async function fetchRepoEvents(
  token: string,
  owner: string,
  repo: string,
  perPage: number = 30
): Promise<GitHubEvent[]> {
  const headers = getHeaders(token);
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/events?per_page=${perPage}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json() as Promise<GitHubEvent[]>;
}

/**
 * Fetch recent commits for a repository
 */
export async function fetchRepoCommits(
  token: string,
  owner: string,
  repo: string,
  perPage: number = 10
): Promise<GitHubCommit[]> {
  const headers = getHeaders(token);
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${perPage}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json() as Promise<GitHubCommit[]>;
}

/**
 * Fetch open issues for a repository
 */
export async function fetchRepoIssues(
  token: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
  perPage: number = 20
): Promise<GitHubIssue[]> {
  const headers = getHeaders(token);
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json() as Promise<GitHubIssue[]>;
}

/**
 * Fetch open pull requests for a repository
 */
export async function fetchRepoPullRequests(
  token: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
  perPage: number = 20
): Promise<GitHubPullRequest[]> {
  const headers = getHeaders(token);
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json() as Promise<GitHubPullRequest[]>;
}

/**
 * Get the project_id for a given repository full name
 * Uses a simple mapping; in production this should query the projects table
 */
export function getProjectIdForRepo(repoFullName: string): string | null {
  return REPO_TO_PROJECT[repoFullName] ?? null;
}

/**
 * Extract activity events from GitHub events
 */
export function extractActivityFromEvents(events: GitHubEvent[]): GitHubActivity[] {
  return events.map((event) => {
    const activity: GitHubActivity = {
      id: event.id,
      project_id: "", // Will be set when linked to project
      event_type: event.type,
      external_id: event.id,
      occurred_at: event.created_at,
    };

    // Extract useful info based on event type
    switch (event.type) {
      case "PushEvent":
        const commits = (event.payload as { commits: GitHubCommit[] }).commits;
        if (commits && commits.length > 0) {
          activity.commit_sha = commits[0].sha;
          activity.title = commits[0].commit.message.split("\n")[0];
          activity.author = event.actor.login;
          activity.url = commits[0].html_url;
        }
        break;
      case "IssuesEvent":
      case "IssueCommentEvent":
        const issue = (event.payload as { issue: GitHubIssue }).issue;
        activity.title = issue.title;
        activity.author = event.actor.login;
        activity.url = issue.html_url;
        break;
      case "PullRequestEvent":
      case "PullRequestReviewEvent":
      case "PullRequestReviewCommentEvent":
        const pr = (event.payload as { pull_request: GitHubPullRequest }).pull_request;
        activity.title = pr?.title;
        activity.author = event.actor.login;
        activity.url = pr?.html_url;
        break;
      case "CreateEvent":
      case "DeleteEvent":
        activity.title = (event.payload as { ref_type: string; ref?: string }).ref;
        activity.author = event.actor.login;
        break;
      default:
        activity.title = event.type;
        activity.author = event.actor.login;
    }

    return activity;
  });
}

/**
 * Determine if a repository has recent activity (within threshold days)
 */
export function isRepoStale(repo: GitHubRepo, thresholdDays: number = 14): boolean {
  if (repo.archived) return true;
  
  const pushedAt = repo.pushed_at ? new Date(repo.pushed_at).getTime() : null;
  const updatedAt = repo.updated_at ? new Date(repo.updated_at).getTime() : null;
  
  const latestActivity = Math.max(
    pushedAt ?? 0,
    updatedAt ?? 0
  );
  
  if (latestActivity === 0) return true;
  
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  return Date.now() - latestActivity > thresholdMs;
}

/**
 * Get the most recent activity timestamp from a repository
 */
export function getRepoLastActivity(repo: GitHubRepo): Date | null {
  const pushedAt = repo.pushed_at ? new Date(repo.pushed_at) : null;
  const updatedAt = repo.updated_at ? new Date(repo.updated_at) : null;
  
  if (!pushedAt && !updatedAt) return null;
  
  if (!pushedAt) return updatedAt;
  if (!updatedAt) return pushedAt;
  
  return pushedAt > updatedAt ? pushedAt : updatedAt;
}
