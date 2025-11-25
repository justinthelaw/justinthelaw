/**
 * Model Loader
 * Handles loading text generation models with progressive fallback on failure
 */

import {
  pipeline,
  env,
  type TextGenerationPipeline,
} from '@huggingface/transformers';
import { ModelSize } from '@/types';
import { MODEL_IDS, MODEL_DTYPE, MODEL_SIZES } from '@/config/models';

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = 'https://huggingface.co';

export interface LoaderCallbacks {
  onProgress?: (progress: number, message: string) => void;
  onFallback?: (newModel: ModelSize) => void;
  onError?: (message: string) => void;
}

/**
 * Get the next smaller model size for fallback
 */
export function getNextSmallerModel(currentSize: ModelSize): ModelSize | null {
  if (currentSize === ModelSize.LARGE) return ModelSize.MEDIUM;
  return null; // Already at smallest (MEDIUM)
}

/**
 * Loads a text generation model with progressive fallback on failure
 */
export async function loadModelWithFallback(
  modelSize: ModelSize,
  callbacks: LoaderCallbacks = {}
): Promise<TextGenerationPipeline | null> {
  let currentSize = modelSize;
  let generator: TextGenerationPipeline | null = null;
  let attempts = 0;
  const maxAttempts = MODEL_SIZES.length;

  while (!generator && attempts < maxAttempts) {
    attempts++;
    try {
      const modelId = MODEL_IDS[currentSize];
      
      // Track if we're in download phase (first time seeing progress)
      let isDownloading = true;
      
      // Load pipeline with progress tracking
      const pipelineResult = await pipeline('text-generation', modelId, {
        dtype: MODEL_DTYPE,
        progress_callback: (progressData: unknown) => {
          if (typeof progressData === 'object' && progressData !== null) {
            const data = progressData as { progress?: number; status?: string };
            if (data.progress !== undefined && callbacks.onProgress) {
              const progress = Math.round(data.progress);
              
              // Differentiate between download and loading into memory
              let message: string;
              if (data.status === 'progress') {
                message = `Downloading model... ${progress}%`;
                isDownloading = true;
              } else if (data.status === 'done' || progress === 100) {
                message = `Loading into memory... ${progress}%`;
                isDownloading = false;
              } else {
                message = isDownloading 
                  ? `Downloading model... ${progress}%`
                  : `Loading into memory... ${progress}%`;
              }
              
              callbacks.onProgress(progress, message);
            }
          }
        },
      });
      
      generator = pipelineResult as TextGenerationPipeline;
      return generator;
    } catch (e) {
      const errorStr = String(e);
      console.error(`Model loading attempt ${attempts} failed:`, errorStr);

      // If LARGE model fails, immediately provide error message and recommend MEDIUM
      if (currentSize === ModelSize.LARGE) {
        if (callbacks.onError) {
          callbacks.onError(
            'Large model failed to load. We recommend using the Medium model for better compatibility with your device.'
          );
        }
        
        const nextSize = getNextSmallerModel(currentSize);
        if (nextSize) {
          currentSize = nextSize;
          if (callbacks.onFallback) {
            callbacks.onFallback(nextSize);
          }
          console.log(`Large model failed, falling back to: ${MODEL_IDS[nextSize]}`);
        } else {
          break;
        }
      } else {
        const isMemoryError =
          errorStr.includes('memory') || errorStr.includes('allocation');

        if (isMemoryError) {
          const nextSize = getNextSmallerModel(currentSize);
          
          if (!nextSize) {
            console.error('Already at Medium model, cannot fallback further');
            break;
          }
          
          currentSize = nextSize;
          if (callbacks.onFallback) {
            callbacks.onFallback(nextSize);
          }
          console.log(`Memory error, falling back to: ${MODEL_IDS[nextSize]}`);
        } else {
          // Non-memory errors or network issues should stop attempts
          break;
        }
      }
    }
  }

  return null;
}
