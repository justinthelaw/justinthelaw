/**
 * Tracing Span Helpers (Dev Only)
 * Typed wrapper functions for instrumenting LLM operations with OpenInference semantics
 * Only active in development - zero overhead in production
 */

import { SpanStatusCode, type Span } from "@opentelemetry/api";
import { getTracer } from "./setup";
import type { ModelType } from "@/types";

/**
 * OpenInference semantic conventions for LLM traces
 * Based on: https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md
 */
export const LLMAttributes = {
  // Span kind
  SPAN_KIND: "openinference.span.kind",

  // Model info
  MODEL_NAME: "llm.model_name",
  PROVIDER: "llm.provider",

  // Input/Output (structured messages)
  INPUT_MESSAGE_ROLE: (index: number) =>
    `llm.input_messages.${index}.message.role`,
  INPUT_MESSAGE_CONTENT: (index: number) =>
    `llm.input_messages.${index}.message.content`,
  OUTPUT_MESSAGE_ROLE: (index: number) =>
    `llm.output_messages.${index}.message.role`,
  OUTPUT_MESSAGE_CONTENT: (index: number) =>
    `llm.output_messages.${index}.message.content`,

  // Generation params
  TEMPERATURE: "llm.invocation_parameters.temperature",
  MAX_TOKENS: "llm.invocation_parameters.max_tokens",
  TOP_K: "llm.invocation_parameters.top_k",
  REPETITION_PENALTY: "llm.invocation_parameters.repetition_penalty",

  // Metadata
  TOKEN_COUNT_TOTAL: "llm.token_count.total",
  TOKEN_COUNT_PROMPT: "llm.token_count.prompt",
  TOKEN_COUNT_COMPLETION: "llm.token_count.completion",
} as const;

/**
 * Span kind for LLM operations (OpenInference)
 */
export const SpanKind = {
  LLM: "LLM",
  CHAIN: "CHAIN",
  RETRIEVER: "RETRIEVER",
} as const;

interface LLMSpanOptions {
  modelType: ModelType;
  modelId: string;
  systemMessage?: string;
  input: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  repetitionPenalty?: number;
}

interface LLMSpanResult {
  output: string;
  fullResponse?: string;
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * Trace an LLM text generation operation
 * Returns the result of the operation with tracing metadata attached
 */
export async function traceLLMGeneration<T extends LLMSpanResult>(
  options: LLMSpanOptions,
  operation: () => Promise<T>
): Promise<T> {
  // Skip tracing in production
  if (process.env.NODE_ENV !== "development") {
    return operation();
  }

  const tracer = getTracer();
  const startTime = performance.now();

  return tracer.startActiveSpan(
    "llm.generation",
    {
      attributes: {
        // OpenInference span kind
        [LLMAttributes.SPAN_KIND]: SpanKind.LLM,

        // Model metadata
        [LLMAttributes.MODEL_NAME]: options.modelId,
        [LLMAttributes.PROVIDER]: "huggingface",

        // Input messages (structured format)
        // System message first if provided
        ...(options.systemMessage && {
          [LLMAttributes.INPUT_MESSAGE_ROLE(0)]: "system",
          [LLMAttributes.INPUT_MESSAGE_CONTENT(0)]: options.systemMessage,
        }),
        // User message
        [LLMAttributes.INPUT_MESSAGE_ROLE(options.systemMessage ? 1 : 0)]: "user",
        [LLMAttributes.INPUT_MESSAGE_CONTENT(options.systemMessage ? 1 : 0)]: options.input,

        // Generation parameters
        ...(options.temperature && {
          [LLMAttributes.TEMPERATURE]: options.temperature,
        }),
        ...(options.maxTokens && {
          [LLMAttributes.MAX_TOKENS]: options.maxTokens,
        }),
        ...(options.topK && { [LLMAttributes.TOP_K]: options.topK }),
        ...(options.repetitionPenalty && {
          [LLMAttributes.REPETITION_PENALTY]: options.repetitionPenalty,
        }),
      },
    },
    async (span: Span) => {
      try {
        const result = await operation();

        // Record output message (structured format)
        const outputContent = result.fullResponse || result.output;
        span.setAttribute(
          LLMAttributes.OUTPUT_MESSAGE_ROLE(0),
          "assistant"
        );
        span.setAttribute(
          LLMAttributes.OUTPUT_MESSAGE_CONTENT(0),
          outputContent
        );

        // Record token usage if available
        if (result.promptTokens !== undefined || result.completionTokens !== undefined) {
          const promptTokens = result.promptTokens || 0;
          const completionTokens = result.completionTokens || 0;
          const totalTokens = promptTokens + completionTokens;

          span.setAttribute(LLMAttributes.TOKEN_COUNT_TOTAL, totalTokens);
          if (result.promptTokens !== undefined) {
            span.setAttribute(LLMAttributes.TOKEN_COUNT_PROMPT, promptTokens);
          }
          if (result.completionTokens !== undefined) {
            span.setAttribute(
              LLMAttributes.TOKEN_COUNT_COMPLETION,
              completionTokens
            );
          }
        }

        // Record duration
        const durationMs = performance.now() - startTime;
        span.setAttribute("llm.duration_ms", durationMs);

        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

interface ModelLoadSpanOptions {
  modelType: ModelType;
  modelId: string;
  attemptNumber?: number;
}

/**
 * Trace model loading operation
 * Tracks load time and any fallback attempts
 */
export async function traceModelLoad<T>(
  options: ModelLoadSpanOptions,
  operation: () => Promise<T>
): Promise<T> {
  // Skip tracing in production
  if (process.env.NODE_ENV !== "development") {
    return operation();
  }

  const tracer = getTracer();
  const startTime = performance.now();

  return tracer.startActiveSpan(
    "model.load",
    {
      attributes: {
        // Use OpenInference conventions where applicable
        [LLMAttributes.MODEL_NAME]: options.modelId,
        [LLMAttributes.PROVIDER]: "huggingface",
        "model.type": options.modelType,
        ...(options.attemptNumber && {
          "model.load.attempt": options.attemptNumber,
        }),
      },
    },
    async (span: Span) => {
      try {
        const result = await operation();

        const durationMs = performance.now() - startTime;
        span.setAttribute("model.load.duration_ms", durationMs);
        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Record a progress event within the current span
 * Used for tracking model download/load progress
 */
export function recordProgress(progress: number, message: string): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const tracer = getTracer();
  const span = tracer.startSpan("model.load.progress");

  span.setAttributes({
    "model.load.progress": progress,
    "model.load.message": message,
  });

  span.end();
}
