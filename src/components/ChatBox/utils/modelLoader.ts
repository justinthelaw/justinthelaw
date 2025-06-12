import {
  pipeline,
  env,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { type ModelSelection, getNextModelSelection } from "./modelSelection";

/**
 * Loads a text generation model with progressive fallback on failure.
 * @param selection The initial model selection.
 * @param onSelectionChange Callback to update model selection if fallback occurs.
 */
export async function loadModelWithFallback(
  selection: ModelSelection,
  onSelectionChange: (newSelection: ModelSelection) => void
): Promise<TextGenerationPipeline | null> {
  let currentSelection = { ...selection };
  let generator: TextGenerationPipeline | null = null;
  let attempts = 0;
  const maxAttempts = 4;

  env.allowLocalModels = false;

  while (!generator && attempts < maxAttempts) {
    attempts++;
    try {
      generator = await pipeline("text-generation", currentSelection.model, {
        dtype: currentSelection.dtype,
        progress_callback: (progressData: unknown) => {
          if (typeof progressData === "object" && progressData !== null) {
            const data = progressData as { progress?: number };
            if (data.progress !== undefined) {
              self.postMessage({
                status: "load",
                response: {
                  message: `Loading model... ${Math.round(data.progress)}%`,
                },
              });
            }
          }
        },
      });
      return generator;
    } catch (e) {
      const errorStr = String(e);
      const isMemoryError =
        errorStr.includes("memory") || errorStr.includes("allocation");

      if (isMemoryError) {
        const nextSelection = getNextModelSelection(currentSelection);
        currentSelection = nextSelection
        onSelectionChange(nextSelection);
      }
      break;
    }
  }
  return null;
}
