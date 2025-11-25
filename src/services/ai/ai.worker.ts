/**
 * AI Worker
 * Web Worker for AI text generation using HuggingFace Transformers
 */

import {
  TextStreamer,
  env,
  type TextGenerationPipeline,
} from '@huggingface/transformers';
import { WorkerAction, WorkerStatus, type WorkerRequest } from '@/types/worker';
import { ModelSize } from '@/types';
import { GENERATION_PARAMS } from '@/config/prompts';
import {
  generateConversationMessages,
  cleanInput,
  validateResponse,
} from './contextProvider';
import { loadModelWithFallback } from './modelLoader';

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = 'https://huggingface.co';

// Worker state
let modelSize: ModelSize = ModelSize.MEDIUM;
let generator: TextGenerationPipeline | null = null;

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { action, input, modelSelection } = event.data;

  // Initialize model selection
  if (action === WorkerAction.INIT && modelSelection) {
    modelSize = modelSelection as ModelSize;
    return;
  }

  // Load the model
  if (action === WorkerAction.LOAD) {
    try {
      generator = await loadModelWithFallback(modelSize, {
        onProgress: (progress, message) => {
          self.postMessage({
            status: WorkerStatus.LOAD,
            message,
            progress,
          });
        },
        onFallback: (newSize) => {
          modelSize = newSize;
          self.postMessage({
            status: WorkerStatus.FALLBACK_MODEL,
            fallbackModel: newSize,
          });
        },
        onError: (message) => {
          self.postMessage({
            status: WorkerStatus.ERROR,
            error: message,
          });
        },
      });

      if (generator) {
        self.postMessage({
          status: WorkerStatus.LOAD,
          message: 'Model loaded successfully!',
        });
      } else {
        self.postMessage({
          status: WorkerStatus.ERROR,
          error: 'Failed to load model. All fallback attempts failed.',
          message:
            'Model loading failed. Please refresh the page to try again.',
        });
      }
    } catch (error) {
      self.postMessage({
        status: WorkerStatus.ERROR,
        error: String(error),
        message: 'Model loading failed. Please refresh the page to try again.',
      });
    }
    self.postMessage({ status: WorkerStatus.DONE });
    return;
  }

  // Generate text
  if (action === WorkerAction.GENERATE) {
    const cleanedInput = cleanInput(input);
    
    if (cleanedInput.length === 0) {
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    // Check if model is loaded
    if (!generator) {
      self.postMessage({
        status: WorkerStatus.STREAM,
        response:
          'Model not loaded yet. Please wait for the model to finish loading before sending messages.',
      });
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    // Ensure tokenizer is available
    if (!generator.tokenizer) {
      self.postMessage({
        status: WorkerStatus.STREAM,
        response:
          'Model tokenizer not available. Please try reloading the page.',
      });
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    self.postMessage({ status: WorkerStatus.INITIATE });

    // Generate conversation messages with model-specific optimization
    const messages = generateConversationMessages(cleanedInput, modelSize);

    // Get model-specific generation parameters
    const generationParams = { ...GENERATION_PARAMS[modelSize] };

    let fullResponse = '';
    let isResponseValid = false;
    let retryCount = 0;
    const maxRetries = 0; // Disable retries - just accept the first response

    try {
      while (!isResponseValid && retryCount <= maxRetries) {
        fullResponse = '';

        // Create streamer for real-time output
        const streamer = new TextStreamer(generator.tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (text: string) => {
            fullResponse += text;
            self.postMessage({ status: WorkerStatus.STREAM, response: text });
          },
        });

        // Generate with model-optimized parameters
        await generator(messages, {
          temperature: generationParams.temperature,
          max_new_tokens: generationParams.maxTokens,
          do_sample: false,
          repetition_penalty: generationParams.repetitionPenalty,
          top_k: generationParams.topK,
          early_stopping: true,
          streamer,
        });

        // Validate response quality (but be lenient)
        const validation = validateResponse(fullResponse.trim(), modelSize);
        isResponseValid = validation.isValid;

        // If we've hit max retries, accept the response anyway
        if (retryCount >= maxRetries) {
          isResponseValid = true;
          if (validation.issues.length > 0) {
            console.log(
              `Accepting response with validation warnings for ${modelSize} model:`,
              validation.issues
            );
          }
        } else if (!isResponseValid && retryCount < maxRetries) {
          retryCount++;
          self.postMessage({
            status: WorkerStatus.STREAM,
            response: `\n[Improving response quality... attempt ${retryCount + 1}]\n`,
          });

          // Adjust params for retry
          generationParams.temperature = Math.min(
            generationParams.temperature * 1.2,
            0.3
          );
          generationParams.repetitionPenalty = Math.min(
            generationParams.repetitionPenalty * 1.1,
            1.5
          );
        }
      }
    } catch (e) {
      self.postMessage({
        status: WorkerStatus.STREAM,
        response: `Error generating answer: ${e}`,
      });
    } finally {
      self.postMessage({ status: WorkerStatus.DONE });
    }
  }
});
