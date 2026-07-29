import { requestNvidiaCompletion } from "./client";
import { getAiConfig } from "./models";
import { buildProjectMessages, buildResourceMessages, buildVisualMessages } from "./prompts";
import { parseJsonObject, validateProjectAttention, validateResourceAnalysis, validateVisualAnalysis, type ProjectAttentionResult, type ResourceAnalysisResult, type VisualAnalysisResult } from "./schemas";

export async function analyzeResource(input: Parameters<typeof buildResourceMessages>[0], runId: string): Promise<{ model: string; result: ResourceAnalysisResult }> {
  const model = getAiConfig().primaryModel;
  const content = await requestNvidiaCompletion({ model, messages: buildResourceMessages(input), maxTokens: 1400, temperature: 0.2, runId });
  return { model, result: validateResourceAnalysis(parseJsonObject(content)) };
}

export async function reviewProject(input: Parameters<typeof buildProjectMessages>[0], runId: string): Promise<{ model: string; result: ProjectAttentionResult }> {
  const model = getAiConfig().reasoningModel;
  const content = await requestNvidiaCompletion({ model, messages: buildProjectMessages(input), maxTokens: 2200, temperature: 0.2, runId });
  return { model, result: validateProjectAttention(parseJsonObject(content)) };
}

export async function analyzeVisual(input: { imageUrl: string; resourceTitle?: string | null; projectName?: string | null }, runId: string): Promise<{ model: string; result: VisualAnalysisResult }> {
  const model = getAiConfig().multimodalModel;
  const content = await requestNvidiaCompletion({ model, messages: buildVisualMessages(input), maxTokens: 1800, temperature: 0.2, runId });
  return { model, result: validateVisualAnalysis(parseJsonObject(content)) };
}