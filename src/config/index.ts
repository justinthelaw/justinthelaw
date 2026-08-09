/**
 * Configuration Index
 *
 * Centralized exports for all configuration files.
 * For customization instructions, see docs/CUSTOMIZATION.md
 */

export {
  SITE_CONFIG,
  DERIVED_CONFIG,
  PROFILE_SECTIONS,
  PROFILE_SUBJECT,
  PERSONAL_CONTEXT,
  type ProfileFact,
  type ProfileSection,
  type ProfileSubject,
} from "./site";
export {
  MODEL_ID,
  MODEL_DISPLAY_NAME,
  MODEL_CONTEXT_LIMIT,
  getDeviceSpecificDtype,
  getDtypeFallbackOrder,
} from "./models";
export {
  GENERATION_PARAMS,
  CHATBOT_CONFIG,
  createChatbotConfig,
} from "./prompts";
