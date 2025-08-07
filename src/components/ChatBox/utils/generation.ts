import {
  TextStreamer,
  env,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { generateConversationMessages, cleanInput, getGenerationParameters, validateResponse } from "./contextProvider";
import {
  getInitialModelSelection,
  getModelSizeFromSelection,
  type ModelSelection,
} from "./modelSelection";
import type { MessageData } from "./types";
import { loadModelWithFallback } from "./modelLoader";

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

// Model selection and generator states
let MODEL_SELECTION: ModelSelection = getInitialModelSelection();
let generator: TextGenerationPipeline | null = null;

self.addEventListener("message", async (event: MessageEvent<MessageData>) => {
  const { action, input, modelSelection } = event.data;

  if (action === "init" && modelSelection) {
    MODEL_SELECTION = modelSelection;
    return;
  }

  if (action === "load") {
    try {
      generator = await loadModelWithFallback(
        MODEL_SELECTION,
        (newSelection: ModelSelection) => {
          MODEL_SELECTION = newSelection;
          // Notify about fallback model selection
          self.postMessage({
            status: "fallback-model",
            response: { model: newSelection.model, dtype: newSelection.dtype }
          });
        }
      );
      
      if (generator) {
        self.postMessage({ 
          status: "load", 
          response: { message: "Model loaded successfully!" } 
        });
      } else {
        self.postMessage({ 
          status: "load", 
          response: { 
            error: "Failed to load model. All fallback attempts failed.",
            message: "Model loading failed. Please refresh the page to try again."
          } 
        });
      }
    } catch (error) {
      self.postMessage({ 
        status: "load", 
        response: { 
          error: String(error),
          message: "Model loading failed. Please refresh the page to try again."
        } 
      });
    }
    self.postMessage({ status: "done" });
    return;
  }

  const cleanedInput = cleanInput(input);
  if (cleanedInput.length > 0) {
    // Check if model is loaded before proceeding
    if (!generator) {
      self.postMessage({
        status: "stream",
        response: "Model not loaded yet. Please wait for the model to finish loading before sending messages.",
      });
      self.postMessage({ status: "done" });
      return;
    }

    // Ensure tokenizer is available
    if (!generator.tokenizer) {
      self.postMessage({
        status: "stream",
        response: "Model tokenizer not available. Please try reloading the page.",
      });
      self.postMessage({ status: "done" });
      return;
    }

    self.postMessage({ status: "initiate" });
    
    // Generate conversation messages with model-specific optimization
    const messages = generateConversationMessages(cleanedInput, MODEL_SELECTION);
    
    // Get model-specific generation parameters for optimal SmolLM2 performance
    const modelSize = getModelSizeFromSelection(MODEL_SELECTION);
    const generationParams = getGenerationParameters(modelSize);
    
    let fullResponse = "";
    let isResponseValid = false;
    let retryCount = 0;
    const maxRetries = modelSize === 'SMALL' ? 2 : 1; // More retries for small model

    try {
      while (!isResponseValid && retryCount <= maxRetries) {
        fullResponse = "";
        
        // Handle real pipeline with streamer
        const streamer = new TextStreamer(generator.tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (text: string) => {
            fullResponse += text;
            self.postMessage({ status: "stream", response: text });
          },
        });

        // Use model-optimized parameters for better SmolLM2 performance
        await generator(messages, {
          ...generationParams,
          streamer,
        });
        
        // Validate response quality for SmolLM2
        const validation = validateResponse(fullResponse.trim(), modelSize);
        isResponseValid = validation.isValid;
        
        if (!isResponseValid && retryCount < maxRetries) {
          retryCount++;
          self.postMessage({ 
            status: "stream", 
            response: `\n[Improving response quality... attempt ${retryCount + 1}]\n` 
          });
          
          // Add slight variation to generation params for retry
          generationParams.temperature = Math.min(generationParams.temperature * 1.2, 0.3);
          generationParams.repetition_penalty = Math.min(generationParams.repetition_penalty * 1.1, 1.5);
        } else if (!isResponseValid && validation.issues.length > 0) {
          // Log validation issues for debugging
          console.warn(`Response validation failed for ${modelSize} model:`, validation.issues);
        }
      }
    } catch (e) {
      self.postMessage({
        status: "stream",
        response: `Error generating answer: ${e}`,
      });
    } finally {
      self.postMessage({ status: "done" });
    }
  }
});
