import type { AiMessage } from "./client";

function clip(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

function json(value: unknown) {
  return JSON.stringify(value);
}

export interface ResourcePromptInput {
  resource: {
    url: string;
    domain?: string | null;
    title?: string | null;
    note?: string | null;
    summary?: string | null;
  };
  project?: {
    name?: string | null;
    description?: string | null;
    stack?: string | null;
  } | null;
}

export function buildResourceMessages(input: ResourcePromptInput): AiMessage[] {
  const context = {
    resource: {
      url: clip(input.resource.url, 1000),
      domain: clip(input.resource.domain, 160),
      title: clip(input.resource.title, 500),
      note: clip(input.resource.note, 5000),
      existing_summary: clip(input.resource.summary, 1200),
    },
    project: input.project ? {
      name: clip(input.project.name, 240),
      description: clip(input.project.description, 1200),
      stack: clip(input.project.stack, 500),
    } : null,
  };

  return [
    {
      role: "system",
      content: "You analyze saved development resources. Return exactly one JSON object with exactly these keys: summary, tags, content_type, actionability, next_action. tags must be an array of objects with exactly name and confidence, where confidence is a number from 0 to 1. Do not invent page contents that are not present in the supplied metadata. Keep the summary and next_action concise.",
    },
    {
      role: "user",
      content: `Analyze this stored dashboard resource. Return JSON only.\n\n${json(context)}`,
    },
  ];
}

export interface ProjectPromptInput {
  project: Record<string, unknown>;
  notes: Array<Record<string, unknown>>;
  resources: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  stale: boolean;
}

export function buildProjectMessages(input: ProjectPromptInput): AiMessage[] {
  const context = {
    project: {
      id: clip(input.project.id, 100),
      name: clip(input.project.name, 240),
      description: clip(input.project.description, 1200),
      status: clip(input.project.status, 80),
      priority: clip(input.project.priority, 80),
      stack: clip(input.project.stack, 500),
      last_activity_at: clip(input.project.last_activity_at, 80),
      stale: input.stale,
    },
    notes: input.notes.slice(0, 20).map((note) => ({
      id: clip(note.id, 100),
      title: clip(note.title, 240),
      content: clip(note.content_md, 1800),
      updated_at: clip(note.updated_at, 80),
    })),
    resources: input.resources.slice(0, 20).map((resource) => ({
      id: clip(resource.id, 100),
      title: clip(resource.title, 240),
      url: clip(resource.url, 500),
      summary: clip(resource.summary, 1200),
      note: clip(resource.note, 800),
      content_type: clip(resource.content_type, 100),
      created_at: clip(resource.created_at, 80),
    })),
    github_activity: input.activity.slice(0, 30).map((event) => ({
      id: clip(event.id, 100),
      event_type: clip(event.event_type, 100),
      title: clip(event.title, 300),
      author: clip(event.author, 160),
      url: clip(event.url, 500),
      occurred_at: clip(event.occurred_at, 80),
    })),
  };

  return [
    {
      role: "system",
      content: "You review a solo developer project dashboard. Return exactly one JSON object with exactly these keys: headline, priority, items, confidence. priority must be high, normal, or low. Each item must have exactly title, reason, source_ids, recommended_action. Use only supplied source IDs. Do not modify project metadata. Return an empty items array when there is no concrete attention item.",
    },
    {
      role: "user",
      content: `Review what needs attention first in this project. Return JSON only.\n\n${json(context)}`,
    },
  ];
}

export function buildVisualMessages(input: { imageUrl: string; resourceTitle?: string | null; projectName?: string | null }): AiMessage[] {
  return [
    {
      role: "system",
      content: "Review the supplied development screenshot or visual artifact. Return exactly one JSON object with exactly these keys: summary, findings, recommended_action. Each finding must have exactly title, detail, priority, where priority is high, normal, or low. Do not claim details that are not visible.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: `Review this visual artifact for the development dashboard. Resource title: ${clip(input.resourceTitle, 240)}. Project: ${clip(input.projectName, 240)}. Return JSON only.` },
        { type: "image_url", image_url: { url: input.imageUrl } },
      ],
    },
  ];
}