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

      console.error(`Model loading attempt ${attempts} failed:`, errorStr);

      if (isMemoryError) {
        const nextSelection = getNextModelSelection(currentSelection);
        // If fallback returned the same selection, we're at the smallest model
        if (nextSelection.model === currentSelection.model && nextSelection.dtype === currentSelection.dtype) {
          console.error("Already at smallest model, cannot fallback further");
          break;
        }
        currentSelection = nextSelection;
        onSelectionChange(nextSelection);
        console.log(`Falling back to smaller model: ${nextSelection.model} with dtype: ${nextSelection.dtype}`);
        // Continue the loop to try the next smaller model
      } else {
        // Non-memory errors should break the loop as they won't be fixed by smaller models
        console.error("Non-memory error encountered, stopping fallback attempts:", errorStr);
        break;
      }
    }
  }
  return null;
}
