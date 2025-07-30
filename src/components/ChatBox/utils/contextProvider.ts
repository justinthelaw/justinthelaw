/**
 * This file provides the context information about Justin Law for the chat assistant.
 * The context is used to generate responses that are relevant to Justin's background.
 */

/**
 * This file provides the context information about Justin Law for the chat assistant.
 * The context is used to generate responses that are relevant to Justin's background.
 * Uses a single-turn conversation pattern optimized for smaller language models.
 */

// Function to get Justin Law's context as a single comprehensive conversation
export function getJustinLawContext(): Array<{ role: string, content: string }> {
  return [
    {
      role: "user",
      content: "Tell me about Justin Law - his job, education, military background, and interests."
    },
    {
      role: "assistant", 
      content: "Justin Law is an AI/ML Software Engineer at Defense Unicorns, where he works on full-stack AI applications and MLOps/GenAIOps platforms. He has a bachelor's in Mechanical Engineering with minors in Communications and Military Leadership from Rochester Institute of Technology, plus master's level studies in Computer Science at Johns Hopkins University and Georgia Institute of Technology focusing on Enterprise Web computing and AI. Justin is a veteran of the US Air and Space Forces, served as a Captain (O3) and Developmental Engineer (62E), and was honorably discharged. He's organized, disciplined, and diligent. In his free time, Justin likes to run, cook, play video games, travel, and work on personal coding projects."
    }
  ];
}

// System instructions for the AI assistant - optimized for smaller models
export function getSystemInstructions(): string {
  return [
    "You are an AI assistant created by Justin Law.",
    "Answer questions about Justin using the conversation context provided.",
    "Keep responses brief, factual, and focused only on the information given.",
    "If asked about something not covered in the context, politely say you don't have that information."
  ].join(" ");
}

// Generate conversation messages for the AI assistant with single-turn context
export function generateConversationMessages(userInput: string): Array<{ role: string, content: string }> {
  const messages = [
    {
      role: "system",
      content: getSystemInstructions(),
    },
    // Add single-turn context learning example
    ...getJustinLawContext(),
    // Add the user's actual query
    {
      role: "user",
      content: cleanInput(userInput),
    },
  ];

  return messages;
}

// Helper function to clean user input
export const cleanInput = (input?: string): string => {
  return input ? input.replace(/`/g, "").trim() : "";
};
