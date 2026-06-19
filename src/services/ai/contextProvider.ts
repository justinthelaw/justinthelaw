/**
 * AI context provider.
 * Generates browser-only profile Q&A prompts with section retrieval.
 */

import { MODEL_CONTEXT_LIMIT } from "@/config/models";
import { CHATBOT_CONFIG, MAX_SINGLE_MESSAGE_LENGTH } from "@/config/prompts";
import {
  PERSONAL_CONTEXT,
  PROFILE_SECTIONS,
  SITE_CONFIG,
  type ProfileSection,
} from "@/config/site";
import type { ChatMessage, ConversationTurn } from "@/types";

const ESTIMATED_CHARS_PER_TOKEN = 4;
const PROMPT_SAFETY_MARGIN_TOKENS = 48;
const TOKEN_DENSE_CHARACTER_WEIGHT = 4;
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_TURN_CHARACTERS = 220;
const MAX_RETRIEVAL_QUESTION_CHARACTERS = 320;
const PROFILE_CONTEXT_SECTIONS: readonly ProfileSection[] = PROFILE_SECTIONS;

export interface ResponseValidation {
  isValid: boolean;
  issues: string[];
}

export interface PromptBudgetOptions {
  conversationTurns?: readonly ConversationTurn[];
  contextLimit?: number;
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
  selectedProfileSectionIds: string[];
  includedConversationTurns: number;
  isHistoryTrimmed: boolean;
  trimmedHistoryTurns: number;
}

export interface PersonalContextBudget {
  text: string;
  isTrimmed: boolean;
  overBudgetCharacters: number;
  trimmedCharacters: number;
  selectedProfileSectionIds: string[];
}

export interface ProfileSectionSelection {
  section: ProfileSection;
  score: number;
}

interface InputTrimResult {
  text: string;
  isTrimmed: boolean;
  trimmedCharacters: number;
}

interface PromptContext {
  personalContextBudget: PersonalContextBudget;
  conversationTurns: ConversationTurn[];
  trimmedHistoryTurns: number;
}

function getMaxPromptCharacters(contextLimit: number = MODEL_CONTEXT_LIMIT): number {
  return Math.max(
    0,
    (contextLimit - PROMPT_SAFETY_MARGIN_TOKENS) * ESTIMATED_CHARS_PER_TOKEN
  );
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

function normalizeSearchText(text: string): string {
  return cleanRawInput(text).toLowerCase();
}

function tokenize(text: string): string[] {
  return normalizeSearchText(text).match(/[a-z0-9]+(?:\/[a-z0-9]+)?/g) ?? [];
}

function getKeywordScore(keyword: string, searchText: string, tokens: Set<string>): number {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) {
    return 0;
  }

  if (normalizedKeyword.includes(" ")) {
    return searchText.includes(normalizedKeyword) ? 6 : 0;
  }

  return tokens.has(normalizedKeyword) ? 3 : 0;
}

function getSectionText(section: ProfileSection): string {
  return `${section.title}: ${section.facts.map((fact) => fact.text).join(" ")}`;
}

function getProfileContextText(sections: readonly ProfileSection[]): string {
  return sections.map((section) => getSectionText(section)).join("\n\n");
}

function buildHistoryText(conversationTurns: readonly ConversationTurn[]): string {
  if (conversationTurns.length === 0) {
    return "";
  }

  const lines = conversationTurns.map((turn) => {
    const role = turn.role === "assistant" ? "Assistant" : "User";
    return `${role}: ${turn.content}`;
  });

  return `\n\nRecent conversation:\n${lines.join("\n")}`;
}

function buildPrompt(
  personalContext: string,
  question: string,
  conversationTurns: readonly ConversationTurn[] = []
): string {
  return `${CHATBOT_CONFIG.systemPrompt}

Context:
${SITE_CONFIG.name} refers to ${SITE_CONFIG.fullName}.
${personalContext}${buildHistoryText(conversationTurns)}

Question:
${question}

Answer:`;
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / ESTIMATED_CHARS_PER_TOKEN);
}

function sanitizeConversationTurns(
  conversationTurns: readonly ConversationTurn[] = []
): ConversationTurn[] {
  return conversationTurns
    .filter((turn) => turn.content.trim().length > 0)
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      role: turn.role,
      content: trimInputToBudget(
        cleanRawInput(turn.content),
        MAX_HISTORY_TURN_CHARACTERS
      ).text,
    }))
    .filter((turn) => turn.content.length > 0);
}

export function getRecentConversationTurns(
  messages: readonly ChatMessage[],
  limit: number = MAX_HISTORY_TURNS
): ConversationTurn[] {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-limit)
    .map((message) => ({
      role: message.type === "ai" ? "assistant" : "user",
      content: message.content,
    }));
}

export function rankProfileSections(
  question: string,
  conversationTurns: readonly ConversationTurn[] = []
): ProfileSectionSelection[] {
  const searchText = normalizeSearchText(
    [
      question,
      ...conversationTurns.map((turn) => turn.content),
    ].join(" ")
  );
  const tokens = new Set(tokenize(searchText));

  return PROFILE_CONTEXT_SECTIONS.map((section) => {
    let score = section.priority / 1000;
    if (section.alwaysInclude) {
      score += 10_000;
    }

    for (const keyword of section.keywords) {
      score += getKeywordScore(keyword, searchText, tokens);
    }

    for (const fact of section.facts) {
      score += getKeywordScore(fact.text, searchText, tokens) / 2;
      for (const keyword of fact.keywords ?? []) {
        score += getKeywordScore(keyword, searchText, tokens);
      }
    }

    return { section, score };
  }).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return right.section.priority - left.section.priority;
  });
}

function getSelectedContextBudget(sections: readonly ProfileSection[]): PersonalContextBudget {
  const text = getProfileContextText(sections);
  const selectedProfileSectionIds = sections.map((section) => section.id);
  const overBudgetCharacters = Math.max(0, PERSONAL_CONTEXT.length - text.length);

  return {
    text,
    isTrimmed: selectedProfileSectionIds.length < PROFILE_CONTEXT_SECTIONS.length,
    overBudgetCharacters,
    trimmedCharacters: overBudgetCharacters,
    selectedProfileSectionIds,
  };
}

function canFitPrompt(
  sections: readonly ProfileSection[],
  question: string,
  conversationTurns: readonly ConversationTurn[],
  contextLimit: number
): boolean {
  const prompt = buildPrompt(
    getProfileContextText(sections),
    question,
    conversationTurns
  );
  return prompt.length <= getMaxPromptCharacters(contextLimit);
}

function fitConversationTurns(
  turns: readonly ConversationTurn[],
  selectedSections: readonly ProfileSection[],
  question: string,
  contextLimit: number
): ConversationTurn[] {
  const selectedTurns: ConversationTurn[] = [];

  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const candidateTurns = [turns[index], ...selectedTurns];
    if (canFitPrompt(selectedSections, question, candidateTurns, contextLimit)) {
      selectedTurns.unshift(turns[index]);
    }
  }

  return selectedTurns;
}

function buildPromptContext(
  userInput: string,
  options: PromptBudgetOptions = {}
): PromptContext {
  const contextLimit = options.contextLimit ?? MODEL_CONTEXT_LIMIT;
  const questionForRetrieval = trimInputToBudget(
    cleanRawInput(userInput),
    MAX_RETRIEVAL_QUESTION_CHARACTERS
  ).text;
  const conversationTurns = sanitizeConversationTurns(options.conversationTurns);
  const rankedSections = rankProfileSections(questionForRetrieval, conversationTurns);
  const selectedSections: ProfileSection[] = [];

  for (const { section } of rankedSections.filter(
    (selection) => selection.section.alwaysInclude
  )) {
    selectedSections.push(section);
  }

  const selectedConversationTurns = fitConversationTurns(
    conversationTurns,
    selectedSections,
    "",
    contextLimit
  );

  for (const { section } of rankedSections) {
    if (section.alwaysInclude || selectedSections.includes(section)) {
      continue;
    }

    const candidateSections = [...selectedSections, section];
    if (
      canFitPrompt(
        candidateSections,
        "",
        selectedConversationTurns,
        contextLimit
      )
    ) {
      selectedSections.push(section);
    }
  }

  return {
    personalContextBudget: getSelectedContextBudget(selectedSections),
    conversationTurns: selectedConversationTurns,
    trimmedHistoryTurns: conversationTurns.length - selectedConversationTurns.length,
  };
}

export function getPersonalContextBudget(
  userInput: string = "",
  options: PromptBudgetOptions = {}
): PersonalContextBudget {
  return buildPromptContext(userInput, options).personalContextBudget;
}

export function getInputCharacterLimit(
  personalContext?: string,
  conversationTurns: readonly ConversationTurn[] = [],
  contextLimit: number = MODEL_CONTEXT_LIMIT
): number {
  const contextText = personalContext ?? getPersonalContextBudget().text;
  const promptWithoutQuestion = buildPrompt(
    contextText,
    "",
    sanitizeConversationTurns(conversationTurns)
  );
  const remainingCharacters =
    getMaxPromptCharacters(contextLimit) - promptWithoutQuestion.length;

  return Math.max(
    0,
    Math.min(MAX_SINGLE_MESSAGE_LENGTH, remainingCharacters)
  );
}

export function getPromptBudget(
  userInput: string = "",
  options: PromptBudgetOptions = {}
): PromptBudget {
  const contextLimit = options.contextLimit ?? MODEL_CONTEXT_LIMIT;
  const promptContext = buildPromptContext(userInput, options);
  const inputCharacterLimit = getInputCharacterLimit(
    promptContext.personalContextBudget.text,
    promptContext.conversationTurns,
    contextLimit
  );
  const inputBudget = trimInputToBudget(
    cleanRawInput(userInput),
    inputCharacterLimit
  );
  const prompt = buildPrompt(
    promptContext.personalContextBudget.text,
    inputBudget.text,
    promptContext.conversationTurns
  );

  return {
    personalContext: promptContext.personalContextBudget.text,
    isPersonalContextTrimmed: promptContext.personalContextBudget.isTrimmed,
    overBudgetPersonalContextCharacters:
      promptContext.personalContextBudget.overBudgetCharacters,
    trimmedPersonalContextCharacters:
      promptContext.personalContextBudget.trimmedCharacters,
    inputCharacterLimit,
    isInputTrimmed: inputBudget.isTrimmed,
    trimmedInputCharacters: inputBudget.trimmedCharacters,
    estimatedPromptTokens: estimateTokenCount(prompt),
    maxPromptCharacters: getMaxPromptCharacters(contextLimit),
    selectedProfileSectionIds:
      promptContext.personalContextBudget.selectedProfileSectionIds,
    includedConversationTurns: promptContext.conversationTurns.length,
    isHistoryTrimmed: promptContext.trimmedHistoryTurns > 0,
    trimmedHistoryTurns: promptContext.trimmedHistoryTurns,
  };
}

/**
 * Generate a prompt for Teapot-style context question answering.
 */
export function generatePrompt(
  userInput: string,
  options: PromptBudgetOptions = {}
): string {
  const contextLimit = options.contextLimit ?? MODEL_CONTEXT_LIMIT;
  const promptContext = buildPromptContext(userInput, options);
  const question = cleanInput(
    userInput,
    getInputCharacterLimit(
      promptContext.personalContextBudget.text,
      promptContext.conversationTurns,
      contextLimit
    )
  );

  return buildPrompt(
    promptContext.personalContextBudget.text,
    question,
    promptContext.conversationTurns
  );
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
