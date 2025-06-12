import { pipeline, TextStreamer, env, type TextGenerationPipeline } from "@huggingface/transformers";
import { generateConversationMessages, cleanInput } from "./contextProvider";

// Model options to reference in the worker
const MODEL_OPTIONS = {
  LARGE: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
  MEDIUM: "HuggingFaceTB/SmolLM2-360M-Instruct",
  SMALL: "HuggingFaceTB/SmolLM2-135M-Instruct",
  TINY: "HuggingFaceTB/SmolLM2-135M-Instruct"
};

// This will be populated from the main thread
// eslint-disable-next-line prefer-const
let MODEL_SELECTION: { model: string; dtype: "fp32" | "fp16" | "q4" } = {
  model: MODEL_OPTIONS.MEDIUM, // Default fallback if not specified 
  dtype: "fp32"
};

env.allowLocalModels = false;

let generator: TextGenerationPipeline | null = null;

async function loadGenerator(): Promise<TextGenerationPipeline | null> {
  try {
    if (!generator) {
      // First, inform the main thread that we're starting the model load
      self.postMessage({
        status: "load",
        response: { progress: 0, message: "Starting model download" }
      });

      // Report initial status
      self.postMessage({
        status: "load",
        response: { message: "Checking for cached models..." }
      });
      
      // Check if we need to automatically downgrade model size due to previous failures
      const isLargeModel = MODEL_SELECTION.model.includes("1.7B");
      const isMediumModel = MODEL_SELECTION.model.includes("360M");
      const isSmallModel = MODEL_SELECTION.model.includes("135M") && MODEL_SELECTION.dtype === "fp32";
      
      // Progressive downgrade: LARGE -> MEDIUM -> SMALL -> TINY
      if (modelLoadFailed) {
        let newModel = MODEL_SELECTION.model;
        let newDtype = MODEL_SELECTION.dtype;
        
        if (isLargeModel) {
          newModel = MODEL_OPTIONS.MEDIUM;
          newDtype = "fp32";
          console.log(`Downgrading from Large to Medium model due to previous failures`);
        } else if (isMediumModel) {
          newModel = MODEL_OPTIONS.SMALL;
          newDtype = "fp32";
          console.log(`Downgrading from Medium to Small model due to previous failures`);
        } else if (isSmallModel) {
          newModel = MODEL_OPTIONS.TINY;
          newDtype = "fp16";
          console.log(`Downgrading from Small to Tiny (half precision) model due to previous failures`);
        }
        
        if (newModel !== MODEL_SELECTION.model || newDtype !== MODEL_SELECTION.dtype) {
          self.postMessage({
            status: "load",
            response: { 
              message: `Automatically switching to smaller model for compatibility...`,
              autoDowngrade: true 
            }
          });
          MODEL_SELECTION.model = newModel;
          MODEL_SELECTION.dtype = newDtype;
        }
      }

      const pipelineOptions = {
        dtype: MODEL_SELECTION.dtype,
        progress_callback: (progressData: unknown) => {
          // Properly format and send progress data to the main thread
          if (typeof progressData === 'object' && progressData !== null) {
            const data = progressData as { progress?: number };

            if (data.progress !== undefined) {
              const progressPercent = data.progress;

              self.postMessage({
                status: "load",
                response: {
                  progress: progressPercent, // Convert to percentage
                  message: `Loading model... ${progressPercent.toFixed(0)}%`
                }
              });
            }
          }
        },
      };

      // Log the model and quantization being loaded
      console.log(`Loading ${MODEL_SELECTION.model} with ${MODEL_SELECTION.dtype} precision`);

      // Also send this information to the main thread
      self.postMessage({
        status: "load",
        response: {
          message: `Loading ${MODEL_SELECTION.model.split('/').pop()} model...`,
          modelName: MODEL_SELECTION.model
        }
      });

      generator = await pipeline(
        "text-generation",
        MODEL_SELECTION.model,
        pipelineOptions
      );
    }
  } catch (e) {
    // Mark that we've had a model load failure to enable auto-downgrade on next attempt
    modelLoadFailed = true;
    
    // Check for specific error types
    const errorStr = String(e);
    const isWindowError = errorStr.includes('window is not defined');
    const isMemoryError = 
      errorStr.includes('memory') || 
      errorStr.includes('allocation') || 
      /^\d+$/.test(errorStr) || // Pure numeric errors are often memory related
      errorStr.includes('WebAssembly');
    const isIterableError = errorStr.includes('not iterable');
    
    let errorMessage = "";
    if (isWindowError) {
      errorMessage = "Error: Browser compatibility issue detected. Trying fallback model.";
    } else if (isMemoryError) {
      errorMessage = "Error: Not enough memory to load this model. Trying smaller model.";
    } else if (isIterableError) {
      errorMessage = "Error: API call format issue. Trying alternate configuration.";
    } else {
      errorMessage = `Error loading model: ${errorStr}`;
    }

    console.error(errorMessage);

    self.postMessage({
      status: "load",
      response: {
        error: errorMessage,
        errorType: isMemoryError ? "memory" : (isWindowError ? "browser" : "other"),
        originalError: errorStr
      }
    });

    // Don't send stream error for window issues since we'll handle it with fallback
    if (!isWindowError) {
      self.postMessage({ status: "stream", response: errorMessage });
    }

    // Attempt fallback to smaller model if loading fails
    try {
      console.log("Attempting fallback to smallest model with full precision");
      const fallbackModel = "HuggingFaceTB/SmolLM2-135M-Instruct";
      // Send fallback attempt notification
      self.postMessage({
        status: "load",
        response: { message: "Attempting with smaller model...", progress: 0 }
      });

      const fallbackOptions = {
        dtype: "fp32" as const,
        progress_callback: (progressData: unknown) => {
          // Properly format and send progress data to the main thread
          if (typeof progressData === 'object' && progressData !== null) {
            const data = progressData as { progress?: number };
            if (data.progress !== undefined) {
              const progressPercent = data.progress;
              console.log(`Fallback model download progress: ${progressPercent.toFixed(0)}%`);

              self.postMessage({
                status: "load",
                response: {
                  progress: progressPercent, // Convert to percentage
                  message: `Loading fallback model... ${progressPercent.toFixed(0)}%`,
                  fallback: true
                }
              });
            }
          }
        },
      };

      generator = await pipeline(
        "text-generation",
        fallbackModel,
        fallbackOptions
      );
    } catch (fallbackError) {
      const errorStr = String(fallbackError);
      const isMemoryError = 
        errorStr.includes('memory') || 
        errorStr.includes('allocation') || 
        /^\d+$/.test(errorStr) || 
        errorStr.includes('WebAssembly');
      
      let criticalError = "";
      
      if (isMemoryError) {
        criticalError = `Critical error: Not enough memory to load even the smallest model. Please try on a device with more RAM or close other browser tabs.`;
      } else {
        criticalError = `Critical error: Failed to load model: ${errorStr}`;
      }
      
      self.postMessage({
        status: "load",
        response: { 
          error: criticalError, 
          critical: true,
          isMemoryError: isMemoryError
        }
      });
      
      self.postMessage({ status: "stream", response: criticalError });
      console.error(criticalError);
    }
  }
  return generator;
}

interface MessageData {
  action: string;
  input?: string;
  modelSelection?: {
    model: string;
    dtype: "fp32" | "fp16" | "q4";
  };
}

self.addEventListener("message", async (event: MessageEvent<MessageData>) => {
  const { action, input, modelSelection } = event.data;

  // Handle initialization with model selection
  if (action === "init" && modelSelection) {
    console.log(`Setting model to ${modelSelection.model} with ${modelSelection.dtype} precision`);
    if (modelSelection.dtype === "fp32" || modelSelection.dtype === "q4") {
      MODEL_SELECTION.model = modelSelection.model;
      MODEL_SELECTION.dtype = modelSelection.dtype;
    }
    return;
  }

  /* 
    NOTE: Loads the generator for the first time, downloading and caching the model
          for quicker turnaround upon the first, and follow-up, chat requests.
  */
  if (action === "load") {
    try {
      console.log("Worker received load action");
      self.postMessage({
        status: "load",
        response: { message: "Starting model initialization" }
      });

      // Try loading with progressive fallbacks if needed
      let modelGenerator = null;
      let attempts = 0;
      const maxAttempts = 2;
      // Track what models we've tried
      const triedModels = new Set();
      while (!modelGenerator && attempts < maxAttempts) {
        attempts++;
        try {
          if (attempts > 1) {
            console.log(`Attempt ${attempts} to load model`);
            // On second attempt, always use small model
            if (attempts === 2) {
              MODEL_SELECTION.model = MODEL_OPTIONS.SMALL;
              self.postMessage({
                status: "load",
                response: { message: `Trying smallest model as final attempt...` }
              });
            } else {
              self.postMessage({
                status: "load",
                response: { message: `Retry attempt ${attempts}...` }
              });
            }
          }
          // Track models we've tried to avoid duplicates
          triedModels.add(MODEL_SELECTION.model);
          modelGenerator = await loadGenerator();
        } catch (attemptError) {
          console.error(`Load attempt ${attempts} failed:`, attemptError);
          const error = String(attemptError);
          const isMemoryError = error.includes('memory') || error.match(/^[\d]+$/) || error.includes('allocation');
          // If it's a memory error and we haven't tried smaller models, continue to next attempt
          if (attempts < maxAttempts && isMemoryError) {
            continue;
          }
          // For non-memory errors on final attempt, give up
          if (attempts >= maxAttempts) {
            throw attemptError;
          }
        }
      }

      if (modelGenerator) {
        console.log("Model loaded successfully");
        self.postMessage({
          status: "load",
          response: { progress: 100, message: "Model loaded successfully" }
        });
      } else {
        console.error("Failed to initialize model after multiple attempts");
        self.postMessage({
          status: "load",
          response: { error: "Failed to initialize model after multiple attempts" }
        });
      }

      self.postMessage({ status: "done" });
    } catch (error) {
      console.error("Critical error during model loading:", error);
      self.postMessage({
        status: "load",
        response: {
          error: String(error).includes('window') ?
            "Browser compatibility issue detected" :
            String(error),
          critical: true
        }
      });
      self.postMessage({ status: "done" });
    }
    return;
  }

  const cleanedInput = cleanInput(input);

  if (cleanedInput.length > 0) {
    self.postMessage({ status: "initiate" });

    const messages = generateConversationMessages(cleanedInput);

    if (!generator) {
      self.postMessage({ status: "stream", response: "Error: Model not loaded" });
      self.postMessage({ status: "done" });
      return;
    }

    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        self.postMessage({
          status: "stream",
          response: text,
        });
      },
    });

    try {
      await generator(messages, {
        temperature: 0.0,
        max_new_tokens: 128,
        early_stopping: true,
        streamer,
      });
    } catch (e) {
      const error = `Error generating answer: ${e}`;
      self.postMessage({ status: "stream", response: error });
      console.error(error);
    } finally {
      self.postMessage({ status: "done" });
    }
  }
});

// Remove modelLoadFailed from self and use a local variable instead
let modelLoadFailed = false;

