import {
  pipeline,
  env,
} from "@huggingface/transformers";
import type { TextGenerationPipeline } from "@huggingface/transformers";
import {
  type ModelSelection,
  getNextModelSelection,
  MODEL_SIZES,
  MODEL_MEMORY_REQUIREMENTS,
  getModelSizeFromSelection,
} from "./modelSelection";
import { recordLargeModelFailure } from "./modelPreferences";

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

/**
 * Estimates available system memory for model loading
 */
function estimateAvailableMemory(): number {
  if (typeof navigator === "undefined") return 2048; // Default fallback
  
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory) {
    // Conservative estimate: use 40% of device memory for model loading
    return deviceMemory * 1024 * 0.4;
  }
  
  // Fallback: estimate based on user agent
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
    return 1024; // 1GB estimate for mobile
  }
  
  return 2048; // 2GB estimate for desktop
}

/**
 * Checks if model can likely be loaded based on memory requirements
 */
function canLikelyLoadModel(selection: ModelSelection): boolean {
  const modelSize = getModelSizeFromSelection(selection);
  const requiredMemory = MODEL_MEMORY_REQUIREMENTS[modelSize];
  const availableMemory = estimateAvailableMemory();
  
  console.log(`Memory check: ${modelSize} model needs ${requiredMemory}MB, estimated available: ${availableMemory}MB`);
  
  return availableMemory >= requiredMemory;
}

/**
 * Creates a promise that rejects after a timeout
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Model loading timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Determines appropriate timeout based on model size
 */
function getModelLoadTimeout(selection: ModelSelection): number {
  const modelSize = getModelSizeFromSelection(selection);
  switch (modelSize) {
    case 'LARGE':
      return 90000; // 90 seconds for large model
    case 'MEDIUM':
      return 60000; // 60 seconds for medium model
    case 'SMALL':
      return 30000; // 30 seconds for small model
    default:
      return 60000;
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
  const maxAttempts = MODEL_SIZES.length;

  while (!generator && attempts < maxAttempts) {
    attempts++;
    const modelSize = getModelSizeFromSelection(currentSelection);
    
    console.log(`Attempting to load ${modelSize} model: ${currentSelection.model} (attempt ${attempts})`);
    
    // Proactive memory check - skip large models if insufficient memory
    if (!canLikelyLoadModel(currentSelection)) {
      console.warn(`Insufficient memory estimated for ${modelSize} model, falling back to smaller model`);
      const nextSelection = getNextModelSelection(currentSelection);
      if (
        nextSelection.model === currentSelection.model &&
        nextSelection.dtype === currentSelection.dtype
      ) {
        console.error("Already at smallest model, cannot fallback further");
        break;
      }
      currentSelection = nextSelection;
      onSelectionChange(nextSelection);
      continue;
    }
    
    try {
      const timeout = getModelLoadTimeout(currentSelection);
      
      // Create pipeline loading promise with timeout
      const pipelinePromise = pipeline("text-generation", currentSelection.model, {
        progress_callback: (progressData: unknown) => {
          if (typeof progressData === "object" && progressData !== null) {
            const data = progressData as { progress?: number };
            if (data.progress !== undefined) {
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
      
      // Race between pipeline loading and timeout
      const pipelineResult = await Promise.race([
        pipelinePromise,
        createTimeoutPromise(timeout)
      ]);
      
      generator = pipelineResult as TextGenerationPipeline;
      console.log(`Successfully loaded ${modelSize} model`);
      return generator;
    } catch (e) {
      const errorStr = String(e);
      console.error(`Model loading attempt ${attempts} failed:`, errorStr);

      // Enhanced error detection
      const isMemoryError =
        errorStr.includes("memory") || 
        errorStr.includes("allocation") ||
        errorStr.includes("oom") ||
        errorStr.includes("out of memory");
        
      const isTimeoutError = errorStr.includes("timeout");
      const isNetworkError = 
        errorStr.includes("network") ||
        errorStr.includes("fetch") ||
        errorStr.includes("connection") ||
        errorStr.includes("cors");
      
      const isLargeModelError = modelSize === 'LARGE' && (
        isTimeoutError || 
        isMemoryError ||
        errorStr.includes("failed to load") ||
        errorStr.includes("webassembly") ||
        errorStr.includes("wasm")
      );

      // Be more aggressive with fallbacks for large models and memory issues
      if (isMemoryError || isTimeoutError || isLargeModelError) {
        // Record failure if this was a large model
        if (modelSize === 'LARGE') {
          recordLargeModelFailure();
          console.log('Recorded large model failure for future reference');
        }
        
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
          `Falling back to smaller model due to ${isMemoryError ? 'memory' : isTimeoutError ? 'timeout' : 'loading'} error: ${nextSelection.model} with dtype: ${nextSelection.dtype}`
        );
        // Continue the loop to try the next smaller model
      } else if (isNetworkError && attempts < 2) {
        // Retry network errors once before falling back
        console.log(`Network error, retrying same model (attempt ${attempts + 1})`);
        attempts--; // Don't count network retries against attempt limit
        continue;
      } else {
        // Other errors should stop attempts
        console.error(`Stopping attempts due to non-recoverable error: ${errorStr}`);
        break;
      }
    }
  }

  return null;
}
