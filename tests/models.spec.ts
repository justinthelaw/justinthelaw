import { expect, test } from "@playwright/test";
import {
  MODEL_CONTEXT_LIMIT,
  MODEL_ID,
  getDeviceSpecificDtype,
  getDtypeFallbackOrder,
} from "../src/config/models";
import canonicalProfileSections from "../src/config/public-profile.json" with {
  type: "json",
};
import {
  PERSONAL_CONTEXT,
  PROFILE_SECTIONS,
  PROFILE_SUBJECT,
} from "../src/config/site";
import {
  CHATBOT_CONFIG,
  createChatbotConfig,
} from "../src/config/prompts";
import {
  cleanInput,
  estimateTokenCount,
  generatePrompt,
  getPersonalContextBudget,
  getProfileIdentityContext,
  getPromptBudget,
} from "../src/services/ai/contextProvider";
import type { ConversationTurn } from "../src/types";
import {
  loadModel,
  type GenerationPipelineFactory,
} from "../src/services/ai/modelLoader";
import type { Text2TextGenerationPipeline } from "@huggingface/transformers";

interface PipelineCall {
  task: Parameters<GenerationPipelineFactory>[0];
  modelId: string;
  dtype: string;
}

interface ProgressUpdate {
  progress: number;
  message: string;
}

test.describe("Model dtype policy", () => {
  test("uses monolithic ONNX dtypes for automatic browser loading", () => {
    expect(getDeviceSpecificDtype(390)).toBe("int8");
    expect(getDeviceSpecificDtype(1280)).toBe("int8");
    expect(getDtypeFallbackOrder("int8")).toEqual(["int8", "uint8"]);
  });

  test("does not automatically retry q4 after a q4 preference", () => {
    expect(getDtypeFallbackOrder("q4")).toEqual(["int8", "uint8"]);
  });

  test("loads the configured text2text generation task directly", async () => {
    const calls: PipelineCall[] = [];
    const fakeText2TextGenerator = {} as unknown as Text2TextGenerationPipeline;
    const fakePipeline: GenerationPipelineFactory = async (
      task,
      modelId,
      options
    ) => {
      calls.push({
        task,
        modelId,
        dtype: typeof options.dtype === "string" ? options.dtype : "unknown",
      });

      return fakeText2TextGenerator;
    };

    const loadedPipeline = await loadModel({}, fakePipeline);

    expect(loadedPipeline?.task).toBe("text2text-generation");
    expect(calls).toEqual([
      {
        task: "text2text-generation",
        modelId: MODEL_ID,
        dtype: "int8",
      },
    ]);
  });

  test("preserves dtype fallback for text2text generation", async () => {
    const calls: PipelineCall[] = [];
    const fakeText2TextGenerator = {} as unknown as Text2TextGenerationPipeline;
    const fakePipeline: GenerationPipelineFactory = async (
      task,
      modelId,
      options
    ) => {
      const dtype =
        typeof options.dtype === "string" ? options.dtype : "unknown";
      calls.push({ task, modelId, dtype });

      if (dtype === "int8") {
        throw new Error("Failed to allocate memory buffer");
      }

      return fakeText2TextGenerator;
    };

    const loadedPipeline = await loadModel({}, fakePipeline);

    expect(loadedPipeline?.generator).toBe(fakeText2TextGenerator);
    expect(calls).toEqual([
      {
        task: "text2text-generation",
        modelId: MODEL_ID,
        dtype: "int8",
      },
      {
        task: "text2text-generation",
        modelId: MODEL_ID,
        dtype: "uint8",
      },
    ]);
  });

  test("reports aggregate download progress before the memory loading phase", async () => {
    const progressUpdates: ProgressUpdate[] = [];
    const fakeText2TextGenerator = {} as unknown as Text2TextGenerationPipeline;
    const fakePipeline: GenerationPipelineFactory = async (
      _task,
      _modelId,
      options
    ) => {
      const progressCallback = options.progress_callback;

      if (typeof progressCallback !== "function") {
        throw new Error("Missing progress callback");
      }

      const emitProgress = progressCallback as (progressData: unknown) => void;
      emitProgress({ status: "progress_total", progress: 33.2 });
      emitProgress({ status: "progress", progress: 99.8 });
      emitProgress({ status: "progress_total", progress: 35.4 });
      emitProgress({ status: "progress_total", progress: 34.1 });
      emitProgress({ status: "progress_total", progress: 100 });
      emitProgress({ status: "done" });

      return fakeText2TextGenerator;
    };

    await loadModel(
      {
        onProgress: (progress, message) => {
          progressUpdates.push({ progress, message });
        },
      },
      fakePipeline
    );

    expect(progressUpdates).toEqual([
      { progress: 33, message: "Downloading model... 33%" },
      { progress: 35, message: "Downloading model... 35%" },
      { progress: 100, message: "Loading into memory..." },
    ]);
  });
});

test.describe("Model prompt policy", () => {
  test("uses the promoted profile-QA model as the single configured browser model", () => {
    expect(MODEL_ID).toBe("justinthelaw/teapot-profile-qa-browser-1024");
    expect(MODEL_CONTEXT_LIMIT).toBe(1024);
  });

  test("uses reusable resume section ids instead of person-specific ontology", () => {
    expect(PROFILE_SECTIONS.map((section) => section.id)).toEqual([
      "identity",
      "current_role",
      "experience",
      "projects",
      "education",
      "recommendations",
      "skills",
      "interests",
    ]);
    const priorities = new Map(
      PROFILE_SECTIONS.map((section) => [section.id, section.priority]),
    );

    expect(Object.fromEntries(priorities)).toEqual({
      identity: 100,
      current_role: 90,
      experience: 80,
      projects: 75,
      education: 70,
      recommendations: 65,
      skills: 60,
      interests: 40,
    });
    expect(priorities.get("experience")).toBeGreaterThan(
      priorities.get("education") ?? 0,
    );
    expect(priorities.get("education")).toBeGreaterThan(
      priorities.get("recommendations") ?? 0,
    );
    expect(priorities.get("recommendations")).toBeGreaterThan(
      priorities.get("interests") ?? 0,
    );
  });

  test("loads browser profile facts from the canonical profile source", () => {
    expect(PROFILE_SECTIONS).toEqual(canonicalProfileSections);
  });

  test("derives browser prompt identity from the canonical profile subject", () => {
    const identitySection = canonicalProfileSections.find(
      (section) => section.id === "identity",
    );
    const customSubject = {
      name: "Ada Lovelace",
      shortName: "Ada",
      subjectPronoun: "she",
      objectPronoun: "her",
      possessivePronoun: "her",
    };
    const customChatbotConfig = createChatbotConfig(customSubject);

    expect(PROFILE_SUBJECT).toEqual(identitySection?.subject);
    expect(CHATBOT_CONFIG.systemPrompt).toContain(PROFILE_SUBJECT.name);
    expect(generatePrompt("Who is this profile about?")).toContain(
      `${PROFILE_SUBJECT.shortName} refers to ${PROFILE_SUBJECT.name}.`,
    );
    expect(customChatbotConfig.systemPrompt).toContain(
      "Ada Lovelace's AI assistant",
    );
    expect(customChatbotConfig.welcomeMessages).toContain(
      "Hi! Interested in learning more about Ada?",
    );
    expect(getProfileIdentityContext(customSubject)).toBe(
      "Ada refers to Ada Lovelace.",
    );
    expect(
      getProfileIdentityContext({
        ...customSubject,
        name: "Prince",
        shortName: "Prince",
      }),
    ).toBe("This profile is about Prince.");
  });

  test("keeps retrieved personal context compact for Teapot", () => {
    const prompt = generatePrompt("What are Justin's hobbies?");
    const normalizedPrompt = prompt.replace(/\s+/g, " ");
    const personalContextBudget = getPersonalContextBudget();

    expect(PERSONAL_CONTEXT).toContain("Current Role:");
    expect(PROFILE_SECTIONS.length).toBeGreaterThanOrEqual(7);
    expect(personalContextBudget.selectedProfileSectionIds).toContain(
      "identity",
    );
    expect(normalizedPrompt).toContain(
      "videogames, hiking, running, and cooking",
    );
    expect(estimateTokenCount(prompt)).toBeLessThanOrEqual(MODEL_CONTEXT_LIMIT);
  });

  test("retrieves relevant education sections under a tight budget", () => {
    const budget = getPromptBudget(
      "Where did Justin complete graduate CS studies?",
      { contextLimit: 220 },
    );

    expect(budget.selectedProfileSectionIds).toContain("identity");
    expect(budget.selectedProfileSectionIds).toContain("education");
    expect(budget.selectedProfileSectionIds.length).toBeLessThan(
      PROFILE_SECTIONS.length,
    );
    expect(budget.estimatedPromptTokens).toBeLessThanOrEqual(220);
  });

  test("packs recent conversation turns into a 1024-token prompt", () => {
    const conversationTurns: ConversationTurn[] = [
      {
        role: "user",
        content: "Tell me about Justin's Defense Unicorns work.",
      },
      {
        role: "assistant",
        content:
          "Justin worked at Defense Unicorns across Kubernetes, AI/ML, and full-stack repos.",
      },
    ];
    const prompt = generatePrompt("What did he improve there?", {
      conversationTurns,
      contextLimit: 1024,
    });
    const budget = getPromptBudget("What did he improve there?", {
      conversationTurns,
      contextLimit: 1024,
    });

    expect(prompt).toContain("Recent conversation:");
    expect(prompt).toContain("Defense Unicorns");
    expect(prompt).toContain("MRR by 15%");
    expect(budget.includedConversationTurns).toBe(2);
    expect(estimateTokenCount(prompt)).toBeLessThanOrEqual(1024);
  });

  test("trims older history before exceeding the prompt budget", () => {
    const conversationTurns: ConversationTurn[] = Array.from(
      { length: 10 },
      (_, index) => ({
        role: index % 2 === 0 ? "user" : "assistant",
        content: `history turn ${index} ${"x".repeat(220)}`,
      }),
    );
    const budget = getPromptBudget("What did Justin build at OpenAI?", {
      conversationTurns,
      contextLimit: 260,
    });

    expect(budget.isHistoryTrimmed).toBe(true);
    expect(budget.includedConversationTurns).toBeLessThan(
      conversationTurns.length,
    );
    expect(budget.estimatedPromptTokens).toBeLessThanOrEqual(260);
  });

  test("warns and trims input beyond the remaining prompt budget", () => {
    const inputCharacterLimit = getPromptBudget().inputCharacterLimit;
    const overLimitInput = "x".repeat(inputCharacterLimit + 12);
    const overLimitBudget = getPromptBudget(overLimitInput);

    expect(inputCharacterLimit).toBeGreaterThan(0);
    expect(overLimitBudget.isInputTrimmed).toBe(true);
    expect(overLimitBudget.trimmedInputCharacters).toBe(12);
    expect(cleanInput(overLimitInput)).toHaveLength(inputCharacterLimit);
  });

  test("warns and trims token-dense unicode input", () => {
    const inputCharacterLimit = getPromptBudget().inputCharacterLimit;
    const tokenDenseInput = "¼".repeat(inputCharacterLimit);
    const tokenDenseBudget = getPromptBudget(tokenDenseInput);

    expect(tokenDenseBudget.isInputTrimmed).toBe(true);
    expect(tokenDenseBudget.trimmedInputCharacters).toBeGreaterThan(0);
    expect(cleanInput(tokenDenseInput).length).toBeLessThan(
      tokenDenseInput.length,
    );
  });

  test("normalizes typographic quotation marks", () => {
    expect(cleanInput("\u2018Justin\u2019 said \u201chello\u201d.")).toBe(
      "'Justin' said \"hello\".",
    );
  });
});
