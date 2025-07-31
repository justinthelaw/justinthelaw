import {
  pipeline,
  env,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { type ModelSelection, getNextModelSelection } from "./modelSelection";

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

/**
 * Mock text generation pipeline for when HuggingFace is not accessible
 */
export class MockTextGenerationPipeline {
  tokenizer = { /* mock tokenizer */ };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async call(input: string, options: unknown) {
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple mock responses
    const responses = [
      "I'm a mock AI assistant. The actual model couldn't be loaded due to network restrictions.",
      "This is a demonstration response. In a real environment, I would connect to HuggingFace models.",
      "Hello! I'm currently running in mock mode since the HuggingFace models can't be accessed.",
      "Thanks for your question! This is a simulated response to show the chat interface works."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

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

  while (!generator && attempts < maxAttempts) {
    attempts++;
    try {
      // First try to load the real model
      generator = await pipeline("text-generation", currentSelection.model, {
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
      const isNetworkError = errorStr.includes("fetch") || errorStr.includes("network") || errorStr.includes("CORS");
      
      console.error(`Model loading attempt ${attempts} failed:`, errorStr);

      // If this is a network error and it's the first attempt, try mock mode
      if (isNetworkError && attempts === 1) {
        console.log("Network error detected, falling back to mock mode");
        
        // Simulate loading progress
        for (let i = 0; i <= 100; i += 10) {
          self.postMessage({
            status: "load",
            response: {
              message: `Loading mock model... ${i}%`,
            },
          });
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Return mock pipeline
        return new MockTextGenerationPipeline() as TextGenerationPipeline;
      }

      const isMemoryError = errorStr.includes("memory") || errorStr.includes("allocation");
      
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
