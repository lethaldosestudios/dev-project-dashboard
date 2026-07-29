export const NVIDIA_BUILD_DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

export const AI_MODELS = {
  primary: "deepseek-ai/deepseek-v4-flash",
  multimodal: "moonshotai/kimi-k2.6",
  reasoning: "nvidia/nemotron-3-super-120b-a12b",
} as const;

export const AI_OPERATIONS = {
  resourceEnrichment: "resource_enrichment",
  projectAttentionReview: "project_attention_review",
  resourceVisualAnalysis: "resource_visual_analysis",
} as const;

export type AiOperation = typeof AI_OPERATIONS[keyof typeof AI_OPERATIONS];

export type AiRunStatus = "queued" | "running" | "completed" | "failed" | "rate_limited";

export function getAiConfig() {
  const apiKey = process.env.NVIDIA_BUILD_API_KEY?.trim();
  const baseUrl = (process.env.NVIDIA_BUILD_BASE_URL || NVIDIA_BUILD_DEFAULT_BASE_URL).replace(/\/$/, "");

  return {
    apiKey,
    baseUrl,
    primaryModel: process.env.NVIDIA_BUILD_PRIMARY_MODEL || AI_MODELS.primary,
    multimodalModel: process.env.NVIDIA_BUILD_MULTIMODAL_MODEL || AI_MODELS.multimodal,
    reasoningModel: process.env.NVIDIA_BUILD_REASONING_MODEL || AI_MODELS.reasoning,
  };
}

export function getAiStatus() {
  const config = getAiConfig();
  return {
    baseUrl: config.baseUrl,
    primaryModel: config.primaryModel,
    multimodalModel: config.multimodalModel,
    reasoningModel: config.reasoningModel,
    keyConfigured: Boolean(config.apiKey),
  };
}