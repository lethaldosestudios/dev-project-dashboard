// src/app/projects/[slug]/page.tsx
import { getDb } from "@/lib/db";
import { ProjectHeader } from "@/components/project-header";
import { ResourceList } from "@/components/resource-list";
import { NotesEditor } from "@/components/notes-editor";
import { GitHubActivityFeed } from "@/components/github-activity-feed";
import type { Project, Resource, Note, GitHubActivity, ProjectLink } from "@/types";

export const runtime = "edge";

async function getProjectData(slug: string) {
  const db = getDb();

  // Get project by slug
  const project = await db
    .prepare("SELECT * FROM projects WHERE slug = ?")
    .bind(slug)
    .first();

  if (!project) {
    return null;
  }

  // Get project links
  const { results: links } = await db
    .prepare("SELECT * FROM project_links WHERE project_id = ? ORDER BY sort_order ASC")
    .bind(project.id)
    .all();

  // Get notes
  const { results: notes } = await db
    .prepare("SELECT * FROM notes WHERE project_id = ? ORDER BY updated_at DESC")
    .bind(project.id)
    .all();

  // Get resources
  const { results: resources } = await db
    .prepare("SELECT * FROM resources WHERE project_id = ? ORDER BY created_at DESC")
    .bind(project.id)
    .all();

  // Get GitHub activity
  const { results: githubActivity } = await db
    .prepare("SELECT * FROM github_activity WHERE project_id = ? ORDER BY occurred_at DESC LIMIT 50")
    .bind(project.id)
    .all();

  return {
    project: project as unknown as Project,
    links: links as unknown as ProjectLink[],
    notes: notes as unknown as Note[],
    resources: resources as unknown as Resource[],
    githubActivity: githubActivity as unknown as GitHubActivity[],
  };
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const data = await getProjectData(params.slug);

  if (!data) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Project not found</h1>
        <p className="text-neutral-400">The project with slug "{params.slug}" doesn't exist.</p>
      </main>
    );
  }

  const { project, links, notes, resources, githubActivity } = data;

  return (
    <main className="p-8 space-y-8">
      <ProjectHeader project={project} links={links} />

      {githubActivity.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-4">GitHub Activity</h2>
          <GitHubActivityFeed activities={githubActivity} />
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-4">Resources</h2>
        <ResourceList resources={resources} projectId={project.id} />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Notes</h2>
        <NotesEditor projectId={project.id} notes={notes} />
      </section>
    </main>
  );
}
