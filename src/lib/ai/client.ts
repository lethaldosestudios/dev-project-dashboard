import { AiError } from "./errors";
import { getAiConfig } from "./models";

export type AiTextMessage = {
  role: "system" | "user";
  content: string;
};

export type AiImageMessage = {
  role: "user";
  content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;
};

export type AiMessage = AiTextMessage | AiImageMessage;

interface CompletionOptions {
  model: string;
  messages: AiMessage[];
  maxTokens: number;
  temperature?: number;
  runId: string;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new AiError("invalid_response", "NVIDIA returned an invalid response envelope.");
  }

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new AiError("invalid_response", "NVIDIA returned no completion choices.");
  }

  const message = (choices[0] as { message?: { content?: unknown } }).message;
  if (!message || typeof message.content !== "string" || !message.content.trim()) {
    throw new AiError("invalid_response", "NVIDIA returned an empty completion.");
  }

  return message.content.trim();
}

function statusError(status: number): AiError {
  if (status === 401 || status === 403) {
    return new AiError("auth_failed", "The NVIDIA API key was rejected.", 503, false);
  }
  if (status === 429) {
    return new AiError("rate_limited", "The NVIDIA endpoint is rate-limited. Retry shortly.", 429, true);
  }
  if (status >= 500) {
    return new AiError("provider_error", "The NVIDIA endpoint is temporarily unavailable.", 502, true);
  }
  return new AiError("provider_error", "The NVIDIA request was rejected.", 502, false);
}

export async function requestNvidiaCompletion(options: CompletionOptions): Promise<string> {
  const config = getAiConfig();
  if (!config.apiKey) {
    throw new AiError("configuration_error", "NVIDIA_BUILD_API_KEY is not configured.", 503, false);
  }

  const endpoint = `${config.baseUrl}/chat/completions`;
  const payload = {
    model: options.model,
    messages: options.messages,
    max_tokens: options.maxTokens,
    temperature: options.temperature ?? 0.2,
    stream: false,
  };
  const startedAt = Date.now();
  let lastError: AiError | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = statusError(response.status);
        lastError = error;
        if (error.retryable && attempt === 0) {
          await wait(500);
          continue;
        }
        throw error;
      }

      const body = await response.json();
      console.info(JSON.stringify({ operation: "nvidia_completion", model: options.model, runId: options.runId, status: "completed", latencyMs: Date.now() - startedAt }));
      return extractContent(body);
    } catch (error) {
      const normalized = error instanceof AiError ? error : error instanceof Error && error.name === "AbortError" ? new AiError("timeout", "The NVIDIA request timed out.", 408, true) : new AiError("provider_error", "The NVIDIA provider returned an unexpected error.", 502, true);
      lastError = normalized;
      if (normalized.retryable && attempt === 0) {
        await wait(500);
        continue;
      }
      throw normalized;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new AiError("provider_error", "The NVIDIA request failed.", 502, true);
}