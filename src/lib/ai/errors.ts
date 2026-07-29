export type AiErrorCode =
  | "auth_failed"
  | "rate_limited"
  | "timeout"
  | "invalid_response"
  | "provider_error"
  | "configuration_error";

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;
  readonly retryable: boolean;

  constructor(code: AiErrorCode, message: string, status = 502, retryable = false) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return new AiError("timeout", "The NVIDIA request timed out.", 408, true);
  }
  return new AiError("provider_error", "The NVIDIA provider returned an unexpected error.", 502, true);
}

export function publicAiError(error: unknown) {
  const normalized = toAiError(error);
  const status = normalized.code === "auth_failed" ? 503 : normalized.status;
  return {
    status,
    body: {
      error: normalized.message,
      code: normalized.code,
      retryable: normalized.retryable,
    },
  };
}