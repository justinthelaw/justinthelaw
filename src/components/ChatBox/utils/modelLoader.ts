import {
  pipeline,
  env,
} from "@huggingface/transformers";
import type { TextGenerationPipeline } from "@huggingface/transformers";
import {
  type ModelSelection,
  getNextModelSelection,
  MODEL_SIZES,
  getModelSizeFromSelection,
} from "./modelSelection";

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

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
  const maxAttempts = MODEL_SIZES.length;

  while (!generator && attempts < maxAttempts) {
    attempts++;
    try {
      // Use explicit typing to help TypeScript resolve the pipeline function
      const pipelineResult = await pipeline("text-generation", currentSelection.model, {
        dtype: currentSelection.dtype,
        progress_callback: (progressData: unknown) => {
          if (typeof progressData === "object" && progressData !== null) {
            const data = progressData as { progress?: number };
            if (data.progress !== undefined) {
              const modelSize = getModelSizeFromSelection(currentSelection);
              self.postMessage({
                status: "load",
                response: {
                  message: `Loading ${modelSize} model... ${Math.round(data.progress)}%`,
                },
              });
            }
          }
        },
      });
      generator = pipelineResult as TextGenerationPipeline;
      return generator;
    } catch (e) {
      const errorStr = String(e);
      const modelSize = getModelSizeFromSelection(currentSelection);
      console.error(`Model loading attempt ${attempts} failed:`, errorStr);

      // If LARGE model fails, immediately provide error message and recommend MEDIUM
      if (modelSize === "LARGE") {
        self.postMessage({
          status: "error",
          response: {
            message: "Large model failed to load. We recommend using the Medium model for better compatibility with your device.",
          },
        });
        const nextSelection = getNextModelSelection(currentSelection);
        currentSelection = nextSelection;
        onSelectionChange(nextSelection);
        console.log(`Large model failed, falling back to: ${nextSelection.model} with dtype: ${nextSelection.dtype}`);
        // Continue the loop to try the medium model
      } else {
        const isMemoryError =
          errorStr.includes("memory") || errorStr.includes("allocation");

        if (isMemoryError) {
          const nextSelection = getNextModelSelection(currentSelection);
          // If fallback returned the same selection, we're at the smallest model
          if (
            nextSelection.model === currentSelection.model &&
            nextSelection.dtype === currentSelection.dtype
          ) {
            console.error("Already at smallest model, cannot fallback further");
            break;
          }
          currentSelection = nextSelection;
          onSelectionChange(nextSelection);
          console.log(
            `Falling back to smaller model: ${nextSelection.model} with dtype: ${nextSelection.dtype}`
          );
          // Continue the loop to try the next smaller model
        } else {
          // Non-memory errors or network issues should stop attempts
          break;
        }
      }
    }
  }

  return null;
}
