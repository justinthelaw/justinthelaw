/**
 * Enhanced context provider optimized for SmolLM2 models.
 * Provides structured, model-aware contextual information with improved
 * prompt engineering for better answer quality from small language models.
 */

import { type ModelSizeKey, getModelSizeFromSelection, type ModelSelection } from './modelSelection';
import { getMessageHistory } from './messageHistory';

export interface ChatMessage {
  role: string;
  content: string;
}

// Context length limits by model size (conservative estimates for SmolLM2 models)
const MODEL_CONTEXT_LIMITS: Record<ModelSizeKey, number> = {
  SMALL: 512,   // SmolLM2-135M - very limited context
  MEDIUM: 768,  // SmolLM2-360M - moderate context  
  LARGE: 1024,  // SmolLM2-1.7B - better context handling
};

// Core factual background structured for better parsing by small models
interface JustinProfile {
  role: string;
  company: string;
  background: string;
  education: string;
  military: string;
  skills: string;
  personality: string;
  interests: string;
}

function getJustinProfile(): JustinProfile {
  return {
    role: "Senior Software Engineer at Defense Unicorns",
    company: "Defense Unicorns - builds full-stack AI/ML applications and MLOps/GenAIOps platforms",
    background: "Mechanical Engineer turned Software Engineer specializing in AI/ML",
    education: "Bachelor's in Mechanical Engineering from RIT with minors in Communications and Military Leadership. Graduate studies in Computer Science at Johns Hopkins and Georgia Tech focusing on Enterprise Web computing and AI",
    military: "US Air and Space Forces veteran, served as Captain (O3) and Developmental Engineer (62E), honorable discharge",
    skills: "Full-stack development, AI/ML applications, MLOps, GenAIOps platforms",
    personality: "Organized, personable, disciplined, hard-working, enthusiastic, diligent",
    interests: "Running, cooking, video games, traveling, personal coding projects"
  };
}

// Generate structured context optimized for SmolLM2 instruction format
function generateStructuredContext(modelSize: ModelSizeKey): string {
  const profile = getJustinProfile();
  
  // For smaller models, use more concise formatting
  if (modelSize === 'SMALL') {
    return `Justin Law - ${profile.role}. ${profile.company}. Education: ${profile.education}. Military: ${profile.military}. Interests: ${profile.interests}.`;
  }
  
  // For medium/large models, provide more structured detail
  return `About Justin Law:
- Role: ${profile.role}  
- Company: ${profile.company}
- Background: ${profile.background}
- Education: ${profile.education}
- Military Service: ${profile.military}
- Technical Skills: ${profile.skills}
- Personality: ${profile.personality}
- Interests: ${profile.interests}`;
}

// Model-specific system instructions optimized for SmolLM2
function getModelSpecificSystemInstructions(modelSize: ModelSizeKey): string {
  const baseInstruction = "You are Justin Law's AI assistant. Answer questions about Justin using only the provided context.";
  
  switch (modelSize) {
    case 'SMALL':
      // Very explicit, simple instructions for smallest model
      return `${baseInstruction} Keep answers short and factual. Use 1-2 sentences maximum.`;
    case 'MEDIUM':
      // Balanced instructions for medium model
      return `${baseInstruction} Provide brief, accurate responses based on the context. Limit to 2-3 sentences.`;
    case 'LARGE':
      // More flexible instructions for larger model
      return `${baseInstruction} Give informative but concise answers. Stay factual and context-based.`;
    default:
      return baseInstruction;
  }
}

// Truncate text to fit model context limits while preserving important information
function truncateForModel(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Try to truncate at sentence boundaries
  const sentences = text.split(/[.!?]+/);
  let result = '';
  
  for (const sentence of sentences) {
    const withSentence = result + sentence + '.';
    if (withSentence.length > maxLength) break;
    result = withSentence;
  }
  
  // If no complete sentences fit, truncate at word boundaries
  if (result.length < maxLength * 0.5) {
    const words = text.split(' ');
    result = '';
    for (const word of words) {
      const withWord = result + (result ? ' ' : '') + word;
      if (withWord.length > maxLength - 10) break;
      result = withWord;
    }
    result += '...';
  }
  
  return result;
}

// Build conversation history context for continuity
function buildConversationContext(modelSize: ModelSizeKey): string {
  const history = getMessageHistory();
  if (history.length === 0) return '';
  
  // Limit history based on model size
  const historyLimit = modelSize === 'SMALL' ? 2 : modelSize === 'MEDIUM' ? 4 : 6;
  const recentHistory = history.slice(-historyLimit);
  
  const contextPairs = recentHistory
    .filter(msg => msg.type === 'user' || msg.type === 'ai')
    .map(msg => `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
    .join('\n');
    
  return contextPairs ? `\nRecent conversation:\n${contextPairs}\n` : '';
}

// Enhanced conversation message generation with model-aware optimization
export function generateConversationMessages(userInput: string, modelSelection?: ModelSelection): ChatMessage[] {
  const question = cleanInput(userInput);
  const modelSize = modelSelection ? getModelSizeFromSelection(modelSelection) : 'MEDIUM';
  
  // Get context limit for this model
  const contextLimit = MODEL_CONTEXT_LIMITS[modelSize];
  
  // Build structured context
  const profileContext = generateStructuredContext(modelSize);
  const conversationContext = buildConversationContext(modelSize);
  const fullContext = profileContext + conversationContext;
  
  // Truncate context if needed
  const truncatedContext = truncateForModel(fullContext, Math.floor(contextLimit * 0.7));
  
  // Build optimized system message
  const systemInstructions = getModelSpecificSystemInstructions(modelSize);
  const systemMessage = `${systemInstructions}\n\nContext: ${truncatedContext}`;
  
  return [
    { role: "system", content: systemMessage },
    { role: "user", content: question }
  ];
}

// Enhanced input sanitization with better cleaning for small models
export const cleanInput = (input?: string): string => {
  if (!input) return "";
  
  return input
    .replace(/`/g, "")           // Remove backticks
    .replace(/[<>]/g, "")        // Remove potential HTML/XML tags
    .replace(/\s+/g, " ")        // Normalize whitespace
    .trim()
    .slice(0, 200);              // Limit input length to prevent context overflow
};

// Model-specific generation parameters for optimal SmolLM2 performance
export function getGenerationParameters(modelSize: ModelSizeKey) {
  switch (modelSize) {
    case 'SMALL':
      return {
        temperature: 0.1,           // Lower temperature for more focused responses
        max_new_tokens: 64,         // Very limited output for small model
        do_sample: false,           // Use greedy decoding for consistency  
        repetition_penalty: 1.1,    // Light repetition control
        early_stopping: true,
      };
    case 'MEDIUM':
      return {
        temperature: 0.15,          // Slightly higher for medium model
        max_new_tokens: 96,         // Moderate output length
        do_sample: false,
        repetition_penalty: 1.15,   // Moderate repetition control
        early_stopping: true,
      };
    case 'LARGE':
      return {
        temperature: 0.2,           // Original temperature for larger model
        max_new_tokens: 128,        // Original token limit
        do_sample: false,
        repetition_penalty: 1.2,    // Original repetition penalty
        early_stopping: true,
      };
    default:
      // Fallback to conservative settings
      return {
        temperature: 0.1,
        max_new_tokens: 64,
        do_sample: false,
        repetition_penalty: 1.1,
        early_stopping: true,
      };
  }
}

// Legacy exports for backwards compatibility during transition
export { getJustinProfile as getJustinBackground };

// Legacy function for backwards compatibility
export function getSystemInstructions(): string {
  return "You are Justin Law's AI assistant. Answer questions about Justin using only the provided context. Provide brief, accurate responses based on the context. Limit to 2-3 sentences.";
}
