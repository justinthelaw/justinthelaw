/**
 * Model configuration for the in-browser chatbot.
 */

/**
 * HuggingFace model ID used by the browser worker.
 */
export const MODEL_ID = "justinthelaw/teapot-profile-qa-browser-1024";

/**
 * User-friendly display name for the configured model.
 */
export const MODEL_DISPLAY_NAME = "Profile-QA Teapot";

export type ModelDtype = "fp32" | "int8" | "uint8" | "q4";

/**
 * Get the preferred dtype for browser loading.
 * Browser loading defaults to int8 because q4 artifacts can be less reliable
 * across browsers and runtimes.
 */
export function getDeviceSpecificDtype(_viewportWidth?: number): ModelDtype {
  return "int8";
}

/**
 * Ordered dtype options to try, with the preferred dtype first.
 * Automatic fallback skips q4 for broad browser reliability. fp32 is kept for
 * explicit/manual diagnostics.
 */
export function getDtypeFallbackOrder(preferredDtype: ModelDtype): ModelDtype[] {
  if (preferredDtype === "uint8") {
    return ["uint8", "int8"];
  }
  if (preferredDtype === "int8") {
    return ["int8", "uint8"];
  }
  if (preferredDtype === "q4") {
    return ["int8", "uint8"];
  }
  return ["fp32", "int8", "uint8"];
}

/**
 * Conservative context length limit for the configured model.
 */
export const MODEL_CONTEXT_LIMIT = 1024;
