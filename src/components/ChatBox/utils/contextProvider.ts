/**
 * This file provides the context information about Justin Law for the chat assistant.
 * The context is used to generate responses that are relevant to Justin's background.
 */

// Function to get Justin Law's context
export function getJustinLawContext(): string {
  return [
    "He is currently an AI/ML Software Engineer at Defense Unicorns.",
    "He currently works on full-stack AI applications and MLOps and GenAIOps platforms at Defense Unicorns.",
    "He holds a bachelor's degree in Mechanical Engineering, a minor in Communications, and a minor in Military Leadership.",
    "He completed the bachelor's degree and minors at Rochester Institute of Technology (RIT)",
    "He has completed some master's level graduate studies in Computer Science, with focuses in Enterprise and Web computing, and AI.",
    "He completed these master's level graduate studies at John's Hopkins University and Georgia Tech.",
    "He is veteran of the United States Air and Space Forces.",
    "He was a Captain (O3) in the United States Air and Space Forces, originally assigned as a Developmental Engineer (62E).",
    "He was honorably discharged and is no longer a member of the military.",
    "In his free time, he likes to run, cook, play video games, travel, and work on personal coding projects.",
    "He is an organized, disciplined, and diligent person.",
  ].join(" ");
}

// System instructions for the AI assistant
export function getSystemInstructions(): string {
  return [
    "You are an AI assistant created by Justin Law.",
    "Answer queries using full sentences, being as terse possible.",
    "Answer queries using only the context in Justin's background, and nothing else.",
  ].join(" ");
}

// Generate conversation messages for the AI assistant
export function generateConversationMessages(userInput: string): Array<{ role: string, content: string }> {
  return [
    {
      role: "system",
      content: getSystemInstructions(),
    },
    {
      role: "user",
      content: [
        `Using Justin's background, answer the following query: \"${cleanInput(userInput)}\". This is Justin's background: \"${getJustinLawContext()}\"`,
      ].join(" "),
    },
  ];
}

// Helper function to clean user input
export const cleanInput = (input?: string): string => {
  return input ? input.replace(/`/g, "").trim() : "";
};
