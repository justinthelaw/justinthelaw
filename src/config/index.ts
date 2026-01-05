/**
 * Configuration Index
 *
 * Centralized exports for all configuration files.
 * For customization instructions, see docs/CUSTOMIZATION.md
 */

export { SITE_CONFIG, DERIVED_CONFIG, PROFILE } from "./site";
export {
  MODEL_SIZES,
  MODEL_IDS,
  MODEL_DISPLAY_NAMES,
  MODEL_DTYPE,
  MODEL_MEMORY_REQUIREMENTS,
  MODEL_CONTEXT_LIMITS,
  DEFAULT_MODEL_SIZE,
} from "./models";
export {
  GENERATION_PARAMS,
  INPUT_CONSTRAINTS,
  CHATBOT_CONFIG,
} from "./prompts";
