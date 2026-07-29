import { AiError } from "./errors";

export interface ResourceAnalysisTag {
  name: string;
  confidence: number;
}

export interface ResourceAnalysisResult {
  summary: string;
  tags: ResourceAnalysisTag[];
  content_type: string;
  actionability: string;
  next_action: string;
}

export interface ProjectAttentionItem {
  title: string;
  reason: string;
  source_ids: string[];
  recommended_action: string;
}

export interface ProjectAttentionResult {
  headline: string;
  priority: "high" | "normal" | "low";
  items: ProjectAttentionItem[];
  confidence: number;
}

export interface VisualAnalysisFinding {
  title: string;
  detail: string;
  priority: "high" | "normal" | "low";
}

export interface VisualAnalysisResult {
  summary: string;
  findings: VisualAnalysisFinding[];
  recommended_action: string;
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AiError("invalid_response", "The model returned a non-object result.");
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new AiError("invalid_response", "The model returned fields outside the expected schema.");
  }
}

function stringField(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new AiError("invalid_response", `The model returned an invalid ${name}.`);
  }
  return value.trim();
}

function confidence(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new AiError("invalid_response", `The model returned an invalid ${name}.`);
  }
  return Math.round(value * 100) / 100;
}

export function parseJsonObject(content: string): unknown {
  const withoutFence = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new AiError("invalid_response", "The model did not return a JSON object.");
  }

  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch {
    throw new AiError("invalid_response", "The model returned malformed JSON.");
  }
}

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tagSlug(name: string): string {
  return normalizeTagName(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function validateResourceAnalysis(value: unknown): ResourceAnalysisResult {
  const result = objectValue(value);
  exactKeys(result, ["summary", "tags", "content_type", "actionability", "next_action"]);
  if (!Array.isArray(result.tags) || result.tags.length > 12) {
    throw new AiError("invalid_response", "The model returned too many or invalid tags.");
  }

  const tags = result.tags.map((tag) => {
    const item = objectValue(tag);
    exactKeys(item, ["name", "confidence"]);
    const name = normalizeTagName(stringField(item.name, "tag name", 60));
    if (!tagSlug(name)) throw new AiError("invalid_response", "The model returned an unusable tag name.");
    return { name, confidence: confidence(item.confidence, "tag confidence") };
  });

  const uniqueTags = [...new Map(tags.map((tag) => [tagSlug(tag.name), tag])).values()];
  return {
    summary: stringField(result.summary, "summary", 1200),
    tags: uniqueTags,
    content_type: stringField(result.content_type, "content type", 80),
    actionability: stringField(result.actionability, "actionability", 80),
    next_action: stringField(result.next_action, "next action", 600),
  };
}

export function validateProjectAttention(value: unknown): ProjectAttentionResult {
  const result = objectValue(value);
  exactKeys(result, ["headline", "priority", "items", "confidence"]);
  if (result.priority !== "high" && result.priority !== "normal" && result.priority !== "low") {
    throw new AiError("invalid_response", "The model returned an invalid project priority.");
  }
  if (!Array.isArray(result.items) || result.items.length > 10) {
    throw new AiError("invalid_response", "The model returned too many attention items.");
  }

  const items = result.items.map((item) => {
    const entry = objectValue(item);
    exactKeys(entry, ["title", "reason", "source_ids", "recommended_action"]);
    if (!Array.isArray(entry.source_ids) || entry.source_ids.length > 10 || entry.source_ids.some((id) => typeof id !== "string" || !id.trim())) {
      throw new AiError("invalid_response", "The model returned invalid source IDs.");
    }
    return {
      title: stringField(entry.title, "attention title", 160),
      reason: stringField(entry.reason, "attention reason", 800),
      source_ids: entry.source_ids.map((id) => (id as string).trim()),
      recommended_action: stringField(entry.recommended_action, "recommended action", 600),
    };
  });

  return {
    headline: stringField(result.headline, "headline", 240),
    priority: result.priority,
    items,
    confidence: confidence(result.confidence, "review confidence"),
  };
}

export function validateVisualAnalysis(value: unknown): VisualAnalysisResult {
  const result = objectValue(value);
  exactKeys(result, ["summary", "findings", "recommended_action"]);
  if (!Array.isArray(result.findings) || result.findings.length > 10) {
    throw new AiError("invalid_response", "The model returned too many visual findings.");
  }
  const findings = result.findings.map((finding) => {
    const item = objectValue(finding);
    exactKeys(item, ["title", "detail", "priority"]);
    if (item.priority !== "high" && item.priority !== "normal" && item.priority !== "low") {
      throw new AiError("invalid_response", "The model returned an invalid visual priority.");
    }
    return {
      title: stringField(item.title, "finding title", 160),
      detail: stringField(item.detail, "finding detail", 800),
      priority: item.priority as "high" | "normal" | "low",
    };
  });
  return {
    summary: stringField(result.summary, "visual summary", 1200),
    findings,
    recommended_action: stringField(result.recommended_action, "visual recommended action", 600),
  };
}