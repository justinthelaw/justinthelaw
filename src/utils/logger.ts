/**
 * Logger Utility
 * Standardized, area-prefixed console logging for the browser app.
 */

export const LOG_AREAS = {
  AI_GENERATION: "AI GENERATION",
  AI_MODEL: "AI MODEL",
  AI_MODEL_LOADER: "AI MODEL LOADER",
  AI_SERVICE: "AI SERVICE",
  AI_WORKER: "AI WORKER",
  GITHUB_SERVICE: "GITHUB SERVICE",
  RESUME: "RESUME",
} as const;

export type LogArea = (typeof LOG_AREAS)[keyof typeof LOG_AREAS];

interface AreaLogger {
  log: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

function formatMessage(area: string, message: string): string {
  return `[${area.toUpperCase()}] ${message}`;
}

export function createLogger(area: LogArea | string): AreaLogger {
  const normalizedArea = area.toUpperCase();

  return {
    log: (message, ...args) =>
      console.log(formatMessage(normalizedArea, message), ...args),
    info: (message, ...args) =>
      console.info(formatMessage(normalizedArea, message), ...args),
    warn: (message, ...args) =>
      console.warn(formatMessage(normalizedArea, message), ...args),
    error: (message, ...args) =>
      console.error(formatMessage(normalizedArea, message), ...args),
  };
}
