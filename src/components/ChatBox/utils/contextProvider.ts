/**
 * This file provides the context information about Justin Law for the chat assistant.
 * The context is used to generate responses that are relevant to Justin's background.
 */

// Function to get Justin Law's context
export function getJustinLawContext(): string {
  return [
    "He is currently an AI/ML Software Engineer at Defense Unicorns.",
    "At Defense Unicorns, he currently works on full-stack AI applications and MLOps and GenAIOps platforms.\n",
    "He is veteran of the United States Air and Space Forces.",
    "He was a Captain (O3) in the United States Air and Space Forces, originally assigned as a Developmental Engineer (62E).",
    "He was honorably discharged and is no longer a member of the military.\n",
    "He holds a bachelor's degree in Mechanical Engineering, a minor in Communications, and a minor in Military Leadership.",
    "He completed the bachelor's degree and minors at Rochester Institute of Technology (RIT)",
    "He has completed some master's level graduate studies in Computer Science, with focuses in Enterprise and Web computing, and AI.",
    "He completed these master's level graduate studies at John's Hopkins University and Georgia Tech.\n",
    "In his free time, he likes to run, cook, play video games, travel, and work on personal coding projects.",
    "He is an organized, disciplined, and diligent person.\n",
    "You can find more information about him, including his contact info, in the PDF on the website you are currently on.",
  ].join(" ");
}

// System instructions for the AI assistant
export function getSystemInstructions(): string {
  return [
    "You are an AI assistant created by Justin Law.",
    "Answer queries using full sentences, being as terse possible.",
    "Answer queries using only the context in Justin's background, and nothing else.",
    "Do not answer if the question contains inappropriate, explicit, violent or sexual content.",
  ].join(" ");
}

// Generate conversation messages for the AI assistant
export function generateConversationMessages(userInput: string): Array<{role: string, content: string}> {
  const cleanedInput = userInput ? userInput.replace(/`/g, "").trim() : "";
  
  return [
    {
      role: "system",
      content: getSystemInstructions(),
    },
    {
      role: "user",
      content: "Tell me about Justin Law!",
    },
    {
      role: "assistant",
      content: `Sure, here is Justin's background: \"${getJustinLawContext()}\"`,
    },
    {
      role: "user",
      content: [
        `Using Justin Law's background, answer the query: \"What is Justin's current job?\".`,
      ].join(" "),
    },
    {
      role: "assistant",
      content:
        "He is currently an AI/ML Software Engineer at Defense Unicorns, where he works on full-stack AI applications and MLOps and GenAIOps platforms.",
    },
    {
      role: "user",
      content: [
        `Using Justin Law's background, answer the query: \"${cleanedInput}\".`,
      ].join(" "),
    },
  ];
}

// Helper function to clean user input
export const cleanInput = (input?: string): string => {
  return input ? input.replace(/`/g, "").trim() : "";
};
