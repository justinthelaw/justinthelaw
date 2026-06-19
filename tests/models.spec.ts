import { expect, test } from "@playwright/test";
import {
  MODEL_CONTEXT_LIMIT,
  MODEL_ID,
  getDeviceSpecificDtype,
  getDtypeFallbackOrder,
} from "../src/config/models";
import { PERSONAL_CONTEXT } from "../src/config/site";
import {
  cleanInput,
  generatePrompt,
  getPersonalContextBudget,
  getPromptBudget,
} from "../src/services/ai/contextProvider";
import {
  isLikelyTaskMismatchMessage,
  loadModel,
  type GenerationPipelineFactory,
  type GenerationTask,
} from "../src/services/ai/modelLoader";
import type { Text2TextGenerationPipeline } from "@huggingface/transformers";

interface PipelineCall {
  task: GenerationTask;
  modelId: string;
  dtype: string;
}

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
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

  test("detects incompatible live model architectures for task fallback", () => {
    expect(
      isLikelyTaskMismatchMessage("Unsupported model type: t5")
    ).toBeTruthy();
    expect(
      isLikelyTaskMismatchMessage(
        'Unsupported model type "t5" for task "text-generation".'
      )
    ).toBeTruthy();
    expect(
      isLikelyTaskMismatchMessage("Failed to allocate memory buffer")
    ).toBeFalsy();
  });

  test("retries text2text generation after a task mismatch", async () => {
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

      if (task === "text-generation") {
        throw new Error("Unsupported model type: t5");
      }

      return fakeText2TextGenerator;
    };

    const loadedPipeline = await loadModel({}, fakePipeline);

    expect(loadedPipeline?.task).toBe("text2text-generation");
    expect(calls).toEqual([
      {
        task: "text-generation",
        modelId: MODEL_ID,
        dtype: "int8",
      },
      {
        task: "text2text-generation",
        modelId: MODEL_ID,
        dtype: "int8",
      },
    ]);
  });
});

test.describe("Model prompt policy", () => {
  test("uses Teapot as the single configured browser model", () => {
    expect(MODEL_ID).toBe("teapotai/teapotllm");
  });

  test("keeps the personal context compact for Teapot", () => {
    const prompt = generatePrompt("What are Justin's hobbies?");
    const normalizedPrompt = prompt.replace(/\s+/g, " ");
    const personalContextWords = PERSONAL_CONTEXT.split(/\s+/).length;
    const personalContextBudget = getPersonalContextBudget();

    expect(personalContextWords).toBeLessThanOrEqual(220);
    expect(personalContextBudget.isTrimmed).toBe(false);
    expect(personalContextBudget.overBudgetCharacters).toBe(0);
    expect(personalContextBudget.trimmedCharacters).toBe(0);
    expect(personalContextBudget.text).toBe(PERSONAL_CONTEXT);
    expect(normalizedPrompt).toContain(
      "videogames, hiking, running, and cooking",
    );
    expect(estimateTokenCount(prompt)).toBeLessThanOrEqual(MODEL_CONTEXT_LIMIT);
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
});
