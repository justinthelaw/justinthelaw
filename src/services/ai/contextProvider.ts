/**
 * AI context provider.
 * Generates text-to-text prompts for the browser chatbot model.
 */

import { MODEL_CONTEXT_LIMIT } from "@/config/models";
import { CHATBOT_CONFIG, MAX_SINGLE_MESSAGE_LENGTH } from "@/config/prompts";
import { PERSONAL_CONTEXT, SITE_CONFIG } from "@/config/site";

const ESTIMATED_CHARS_PER_TOKEN = 4;
const PROMPT_SAFETY_MARGIN_TOKENS = 48;
const TOKEN_DENSE_CHARACTER_WEIGHT = 4;

export interface ResponseValidation {
  isValid: boolean;
  issues: string[];
}

export interface PromptBudget {
  personalContext: string;
  isPersonalContextTrimmed: boolean;
  overBudgetPersonalContextCharacters: number;
  trimmedPersonalContextCharacters: number;
  inputCharacterLimit: number;
  isInputTrimmed: boolean;
  trimmedInputCharacters: number;
  estimatedPromptTokens: number;
  maxPromptCharacters: number;
}

export interface PersonalContextBudget {
  text: string;
  isTrimmed: boolean;
  overBudgetCharacters: number;
  trimmedCharacters: number;
}

interface InputTrimResult {
  text: string;
  isTrimmed: boolean;
  trimmedCharacters: number;
}

function getMaxPromptCharacters(): number {
  return Math.max(
    0,
    (MODEL_CONTEXT_LIMIT - PROMPT_SAFETY_MARGIN_TOKENS) *
      ESTIMATED_CHARS_PER_TOKEN
  );
}

function trimFromTail(
  text: string,
  maxCharacters: number
): PersonalContextBudget {
  const normalizedText = text.trim();

  if (normalizedText.length <= maxCharacters) {
    return {
      text: normalizedText,
      isTrimmed: false,
      overBudgetCharacters: 0,
      trimmedCharacters: 0,
    };
  }

  const trimmedText = normalizedText.slice(0, Math.max(0, maxCharacters));
  const trimmedCharacters = normalizedText.length - trimmedText.length;

  return {
    text: trimmedText,
    isTrimmed: true,
    overBudgetCharacters: trimmedCharacters,
    trimmedCharacters,
  };
}

function getInputCharacterWeight(character: string): number {
  const codePoint = character.codePointAt(0) ?? 0;
  return codePoint >= 32 && codePoint <= 126
    ? 1
    : TOKEN_DENSE_CHARACTER_WEIGHT;
}

function trimInputToBudget(text: string, maxBudget: number): InputTrimResult {
  let usedBudget = 0;
  let endIndex = 0;

  for (const character of text) {
    const nextBudget = usedBudget + getInputCharacterWeight(character);
    if (nextBudget > maxBudget) {
      break;
    }

    usedBudget = nextBudget;
    endIndex += character.length;
  }

  const trimmedText = text.slice(0, endIndex).trimEnd();

  return {
    text: trimmedText,
    isTrimmed: trimmedText.length < text.length,
    trimmedCharacters: text.length - trimmedText.length,
  };
}

function buildPrompt(personalContext: string, question: string): string {
  return `${CHATBOT_CONFIG.systemPrompt}

Context:
${SITE_CONFIG.name} refers to ${SITE_CONFIG.fullName}.
${personalContext}

Question:
${question}

Answer:`;
}

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / ESTIMATED_CHARS_PER_TOKEN);
}

function getMaxPersonalContextCharacters(): number {
  const promptWithoutPersonalContext = buildPrompt(
    "",
    "x".repeat(MAX_SINGLE_MESSAGE_LENGTH)
  );

  return Math.max(
    0,
    getMaxPromptCharacters() - promptWithoutPersonalContext.length
  );
}

export function getPersonalContextBudget(): PersonalContextBudget {
  return trimFromTail(PERSONAL_CONTEXT, getMaxPersonalContextCharacters());
}

export function getInputCharacterLimit(personalContext?: string): number {
  const contextText = personalContext ?? getPersonalContextBudget().text;
  const promptWithoutQuestion = buildPrompt(contextText, "");
  const remainingCharacters =
    getMaxPromptCharacters() - promptWithoutQuestion.length;

  return Math.max(
    0,
    Math.min(MAX_SINGLE_MESSAGE_LENGTH, remainingCharacters)
  );
}

export function getPromptBudget(userInput: string = ""): PromptBudget {
  const personalContextBudget = getPersonalContextBudget();
  const inputCharacterLimit = getInputCharacterLimit(
    personalContextBudget.text
  );
  const inputBudget = trimInputToBudget(
    cleanRawInput(userInput),
    inputCharacterLimit
  );
  const question = inputBudget.text;
  const prompt = buildPrompt(personalContextBudget.text, question);

  return {
    personalContext: personalContextBudget.text,
    isPersonalContextTrimmed: personalContextBudget.isTrimmed,
    overBudgetPersonalContextCharacters:
      personalContextBudget.overBudgetCharacters,
    trimmedPersonalContextCharacters:
      personalContextBudget.trimmedCharacters,
    inputCharacterLimit,
    isInputTrimmed: inputBudget.isTrimmed,
    trimmedInputCharacters: inputBudget.trimmedCharacters,
    estimatedPromptTokens: estimateTokenCount(prompt),
    maxPromptCharacters: getMaxPromptCharacters(),
  };
}

/**
 * Generate a single-turn prompt for Teapot-style context question answering.
 */
export function generatePrompt(userInput: string): string {
  const budget = getPromptBudget(userInput);
  const question = cleanInput(userInput, budget.inputCharacterLimit);

  return buildPrompt(budget.personalContext, question);
}

function cleanRawInput(input?: string): string {
  if (!input) return "";

  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/`/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitize user input.
 */
export function cleanInput(
  input?: string,
  maxCharacters: number = getInputCharacterLimit()
): string {
  return trimInputToBudget(cleanRawInput(input), maxCharacters).text;
}
