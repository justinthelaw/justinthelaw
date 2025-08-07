/**
 * Provides contextual information about Justin Law for the chat assistant.
 * The context is injected as a system prompt so that all model sizes start
 * with the same background knowledge about Justin.
 */

export interface ChatMessage {
  role: string;
  content: string;
}

// Core factual background about Justin Law presented in a concise format.
function getJustinBackground(): string {
  return "Justin Law is currently a senior Software Engineer at Defense Unicorns. Builds full-stack AI/ML applications and MLOps/GenAIOps platforms.He has a Bachelor's in Mechanical Engineering with minors in Communications and Military Leadership from Rochester Institute of Technology, and completed graduate studies in Computer Science at Johns Hopkins University and Georgia Institute of Technology focusing on Enterprise Web computing and AI. He is a veteran of the US Air and Space Forces, served as a Captain (O3) and Developmental Engineer (62E) before an honorable discharge. He has exceptional character, being an organized, personable, disciplined, hard-working, enthusiastic and diligent person. His interests and hobbies include tunning, cooking, playing video games, traveling and working on personal coding projects."
}

// Base system instructions shared by all models.
export function getSystemInstructions(): string {
  return "You are an AI assistant created by Justin Law. Use the provided context to answer questions about Justin. Keep responses brief, factual and only based on the information in the context. Limit answers to one sentence."
}

// Create conversation messages that include background context in the system prompt.
export function generateConversationMessages(userInput: string): ChatMessage[] {
  const question = cleanInput(userInput);
  const context = getJustinBackground();
  return [
    { role: "system", content: getSystemInstructions() },
    { role: "user", content: `Question: ${question}; Context: ${context}` }
];
}

// Helper to sanitise user input before sending to models.
export const cleanInput = (input?: string): string => {
  return input ? input.replace(/`/g, "").trim() : "";
};

export { getJustinBackground };
