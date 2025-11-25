/**
 * Worker Message Types
 * Typed enums and constants for AI worker communication
 */

/**
 * Actions sent TO the worker
 */
export enum WorkerAction {
  INIT = 'init',
  LOAD = 'load',
  GENERATE = 'generate',
}

/**
 * Status messages received FROM the worker
 */
export enum WorkerStatus {
  LOAD = 'load',
  INITIATE = 'initiate',
  STREAM = 'stream',
  DONE = 'done',
  ERROR = 'error',
  FALLBACK_MODEL = 'fallback-model',
}

/**
 * Message sent TO the worker
 */
export interface WorkerRequest {
  action: WorkerAction;
  input?: string;
  modelSelection?: string;
}

/**
 * Message received FROM the worker
 */
export interface WorkerResponse {
  status: WorkerStatus;
  message?: string;
  response?: string;
  error?: string;
  progress?: number;
  fallbackModel?: string;
}
