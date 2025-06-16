/**
 * This file provides the context information about Justin Law for the chat assistant.
 * The context is used to generate responses that are relevant to Justin's background.
 */

// Function to get Justin Law's context as in-context learning examples
export function getJustinLawContext(): Array<{ role: string, content: string }> {
  return [
    {
      role: "user",
      content: "QUESTION: `What is Justin's current job title and where does he work?`"
    },
    {
      role: "assistant",
      content: "Justin is an AI/ML Software Engineer at Defense Unicorns."
    },
    {
      role: "user",
      content: "QUESTION: `What kind of work does Justin do at Defense Unicorns?`"
    },
    {
      role: "assistant",
      content: "Justin works on full-stack AI applications and MLOps and GenAIOps platforms."
    },
    {
      role: "user",
      content: "QUESTION: `What is Justin's educational background?`"
    },
    {
      role: "assistant",
      content: "Justin has a bachelor's in Mechanical Engineering with minors in Communications and Military Leadership from RIT."
    },
    {
      role: "user",
      content: "QUESTION: `Did Justin pursue any graduate studies?`"
    },
    {
      role: "assistant",
      content: "Yes, Justin completed master's level studies in Computer Science at Johns Hopkins University and Georgia Tech, focusing on Enterprise Web computing and AI."
    },
    {
      role: "user",
      content: "QUESTION: `What is Justin's military background?`"
    },
    {
      role: "assistant",
      content: "Justin is a veteran of the US Air and Space Forces, served as a Captain (O3) and Developmental Engineer (62E), and was honorably discharged."
    },
    {
      role: "user",
      content: "QUESTION: `What does Justin enjoy doing in his free time?`"
    },
    {
      role: "assistant",
      content: "Justin likes to run, cook, play video games, travel, and work on personal coding projects."
    },
    {
      role: "user",
      content: "QUESTION: `How would you describe Justin's personality?`"
    },
    {
      role: "assistant",
      content: "Justin is organized, disciplined, and diligent."
    }
  ];
}

// System instructions for the AI assistant
export function getSystemInstructions(): string {
  return [
    "You are an AI assistant created by Justin Law.",
    "Answer questions about Justin using the existing conversation context.",
    "Keep responses brief and factual, and only use existing information.",
  ].join(" ");
}

// Generate conversation messages for the AI assistant with in-context learning
export function generateConversationMessages(userInput: string): Array<{ role: string, content: string }> {
  const messages = [
    {
      role: "system",
      content: getSystemInstructions(),
    },
    // Add in-context learning examples
    ...getJustinLawContext(),
    // Add the user's actual query
    {
      role: "user",
      content: `QUESTION: \`${cleanInput(userInput)}\``,
    },
  ];

  return messages;
}

// Helper function to clean user input
export const cleanInput = (input?: string): string => {
  return input ? input.replace(/`/g, "").trim() : "";
};
