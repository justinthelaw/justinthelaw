/**
 * Phoenix Tracing Setup (Dev Only)
 * Initializes OpenTelemetry tracing with Phoenix OTLP exporter
 * Only active in development mode - completely excluded from production builds
 */

import { trace } from "@opentelemetry/api";

/**
 * Initialize Phoenix tracing (dev-only)
 * Uses dynamic imports to avoid bundling in production
 * @returns Promise that resolves when tracing is initialized
 */
export async function initTracing(): Promise<void> {
  // Skip in production - this entire module won't be bundled
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  try {
    // Dynamic imports - only loaded in development
    const { WebTracerProvider, SimpleSpanProcessor } = await import(
      "@opentelemetry/sdk-trace-web"
    );
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-proto"
    );
    const { resourceFromAttributes } = await import("@opentelemetry/resources");

    // Configure OTLP exporter for Phoenix
    const exporter = new OTLPTraceExporter({
      url: "http://localhost:6006/v1/traces", // Phoenix OTLP HTTP endpoint
    });

    // Create resource with service metadata
    const resource = resourceFromAttributes({
      "service.name": "justinthelaw-ai-worker",
      "service.version": "1.0.0",
    });

    // Use simple processor for immediate export in dev (no batching)
    const simpleProcessor = new SimpleSpanProcessor(exporter);

    // Create tracer provider with simple processing
    const provider = new WebTracerProvider({
      resource: resource,
      spanProcessors: [simpleProcessor],
    });

    // Register the provider
    provider.register();

    console.log("[Tracing] Phoenix tracing initialized");
  } catch (error) {
    // Fail gracefully - don't break the app if tracing fails
    console.warn("[Tracing] Failed to initialize Phoenix tracing:", error);
  }
}

/**
 * Get the AI worker tracer instance
 * Returns a no-op tracer in production
 */
export function getTracer() {
  if (process.env.NODE_ENV !== "development") {
    return trace.getTracer("noop");
  }
  return trace.getTracer("ai-worker", "1.0.0");
}
