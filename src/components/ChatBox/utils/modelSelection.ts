/**
 * This file handles the selection of appropriate SmolLM2 models based on device capabilities.
 * 
 * Model Memory Requirements (approximate):
 * - SmolLM2-1.7B-Instruct: ~3.4GB in BF16, ~1.7GB in FP16, ~900MB in INT8, ~450MB in 4-bit
 * - SmolLM2-360M-Instruct: ~723MB in BF16, ~380MB in FP16, ~190MB in INT8, ~95MB in 4-bit
 * - SmolLM2-135M-Instruct: ~269MB in BF16, ~140MB in FP16, ~70MB in INT8, ~35MB in 4-bit
 * 
 * The model selection algorithm:
 * 1. Detects device capabilities (memory, cores, mobile/desktop, WebGPU support)
 * 2. Runs a quick performance benchmark
 * 3. Selects the optimal model size and quantization based on available resources
 * 4. Uses a safety factor to ensure the app remains responsive
 */

// Valid dtype options for the HuggingFace transformer pipeline
type DType = "fp32" | "int8" | "auto" | "fp16" | "q8" | "uint8" | "q4" | "bnb4" | "q4f16";

// Model size and quantization options
export const MODEL_OPTIONS = {
  LARGE: {
    DEFAULT: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
    FP16: { model: "HuggingFaceTB/SmolLM2-1.7B-Instruct", dtype: "fp16" as DType },
    INT8: { model: "HuggingFaceTB/SmolLM2-1.7B-Instruct", dtype: "int8" as DType },
    Q4: { model: "HuggingFaceTB/SmolLM2-1.7B-Instruct", dtype: "q4" as DType }
  },
  MEDIUM: {
    DEFAULT: "HuggingFaceTB/SmolLM2-360M-Instruct",
    FP16: { model: "HuggingFaceTB/SmolLM2-360M-Instruct", dtype: "fp16" as DType },
    INT8: { model: "HuggingFaceTB/SmolLM2-360M-Instruct", dtype: "int8" as DType },
    Q4: { model: "HuggingFaceTB/SmolLM2-360M-Instruct", dtype: "q4" as DType }
  },
  SMALL: {
    DEFAULT: "HuggingFaceTB/SmolLM2-135M-Instruct",
    FP16: { model: "HuggingFaceTB/SmolLM2-135M-Instruct", dtype: "fp16" as DType },
    INT8: { model: "HuggingFaceTB/SmolLM2-135M-Instruct", dtype: "int8" as DType },
    Q4: { model: "HuggingFaceTB/SmolLM2-135M-Instruct", dtype: "q4" as DType }
  }
};

// Approximate memory requirements in MB for different model sizes and quantizations
// These are estimates for loading the model and runtime needs with buffer
export const MODEL_MEMORY_REQUIREMENTS = {
  LARGE: {
    DEFAULT: 3500, // BF16 format (~3.4GB)
    FP16: 1800,    // Half precision (~1.7GB) 
    INT8: 900,     // 8-bit quantized (~900MB)
    Q4: 450        // 4-bit quantized (~450MB)
  },
  MEDIUM: {
    DEFAULT: 750,  // BF16 format (~723MB)
    FP16: 380,     // Half precision (~380MB)
    INT8: 190,     // 8-bit quantized (~190MB)
    Q4: 95         // 4-bit quantized (~95MB)
  },
  SMALL: {
    DEFAULT: 280,  // BF16 format (~269MB)
    FP16: 140,     // Half precision (~140MB)
    INT8: 70,      // 8-bit quantized (~70MB)
    Q4: 35         // 4-bit quantized (~35MB)
  }
};

// Type for model selection result
export interface ModelSelection {
  model: string;
  dtype?: "fp32" | "int8" | "auto" | "fp16" | "q8" | "uint8" | "q4" | "bnb4" | "q4f16";
}

// Function to check if WebGPU is available
export function isWebGPUAvailable(): boolean {
  return typeof navigator !== "undefined" && 
         "gpu" in navigator && 
         typeof (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu?.requestAdapter === "function";
}

// Function to detect device capabilities and select appropriate model with quantization
export function selectModelBasedOnDevice(): ModelSelection {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    // Default to medium model with FP16 quantization if not in browser environment
    return MODEL_OPTIONS.MEDIUM.FP16;
  }

  try {
    // Check device memory (in GB)
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4; // Default to 4GB if not available
    const memoryInMB = deviceMemory * 1024;
    
    // Factor of safety - we don't want to use more than 60% of available memory
    // This leaves room for the rest of the application and other browser tabs/processes
    const safeMemory = memoryInMB * 0.6;

    // Check logical processors
    const logicalProcessors = navigator.hardwareConcurrency || 4; // Default to 4 cores if not available

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Check for WebGPU support (could allow for better performance)
    const hasWebGPU = isWebGPUAvailable();

    // Run a quick performance test
    const startTime = performance.now();
    let benchmarkResult = 0;
    for (let i = 0; i < 1000000; i++) {
      benchmarkResult += Math.sqrt(i);
    }
    const endTime = performance.now();
    
    // This is just to ensure the loop isn't optimized away by the JS engine
    if (benchmarkResult < 0) console.log("This should never happen:", benchmarkResult);
    const perfScore = 1000000 / (endTime - startTime); // Higher is better

    console.log(`Device specs: Memory: ${deviceMemory}GB (Safe: ${Math.round(safeMemory)}MB), Cores: ${logicalProcessors}, Mobile: ${isMobile}, WebGPU: ${hasWebGPU}, Performance score: ${perfScore.toFixed(2)}`);

    // Select model and quantization based on device capabilities
    let selectedModel: ModelSelection;

    // High-end devices with WebGPU support can use larger models
    if (hasWebGPU && safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE.FP16 && 
        logicalProcessors >= 6 && 
        perfScore > 400) {
      if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE.DEFAULT * 0.8) { // WebGPU can be more efficient
        selectedModel = { model: MODEL_OPTIONS.LARGE.DEFAULT };
        console.log("Using large model (1.7B) with default precision and WebGPU acceleration");
      } else {
        selectedModel = MODEL_OPTIONS.LARGE.FP16;
        console.log("Using large model (1.7B) with FP16 quantization and WebGPU acceleration");
      }
    }
    // High-end devices without WebGPU
    else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE.FP16 && 
        logicalProcessors >= 8 && 
        !isMobile && 
        perfScore > 500) {
      if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE.DEFAULT) {
        selectedModel = { model: MODEL_OPTIONS.LARGE.DEFAULT };
        console.log("Using large model (1.7B) with default precision based on device capabilities");
      } else {
        selectedModel = MODEL_OPTIONS.LARGE.FP16;
        console.log("Using large model (1.7B) with FP16 quantization based on device capabilities");
      }
    }
    // Mid-range devices with WebGPU can use larger models with quantization
    else if (hasWebGPU && 
             safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM.DEFAULT && 
             logicalProcessors >= 4) {
      selectedModel = MODEL_OPTIONS.LARGE.INT8; // WebGPU with INT8 quantization works well
      console.log("Using large model (1.7B) with INT8 quantization and WebGPU acceleration");
    }
    // Mid-range devices
    else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM.FP16 && 
            logicalProcessors >= 4 && 
            perfScore > 200) {
      if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE.Q4) {
        selectedModel = MODEL_OPTIONS.LARGE.Q4;
        console.log("Using large model (1.7B) with 4-bit quantization based on device capabilities");
      } else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM.DEFAULT) {
        selectedModel = { model: MODEL_OPTIONS.MEDIUM.DEFAULT };
        console.log("Using medium model (360M) with default precision based on device capabilities");
      } else {
        selectedModel = MODEL_OPTIONS.MEDIUM.FP16;
        console.log("Using medium model (360M) with FP16 quantization based on device capabilities");
      }
    }
    // Low-end devices with WebGPU can use medium model with higher quantization
    else if (hasWebGPU && safeMemory >= MODEL_MEMORY_REQUIREMENTS.SMALL.DEFAULT) {
      selectedModel = MODEL_OPTIONS.MEDIUM.INT8;
      console.log("Using medium model (360M) with INT8 quantization and WebGPU acceleration");
    }
    // Low-end devices
    else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.SMALL.FP16) {
      if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM.Q4) {
        selectedModel = MODEL_OPTIONS.MEDIUM.Q4;
        console.log("Using medium model (360M) with 4-bit quantization based on device capabilities");
      } else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.SMALL.DEFAULT) {
        selectedModel = { model: MODEL_OPTIONS.SMALL.DEFAULT };
        console.log("Using small model (135M) with default precision based on device capabilities");
      } else {
        selectedModel = MODEL_OPTIONS.SMALL.FP16;
        console.log("Using small model (135M) with FP16 quantization based on device capabilities");
      }
    }
    // Very low-end devices
    else {
      selectedModel = MODEL_OPTIONS.SMALL.Q4;
      console.log("Using small model (135M) with 4-bit quantization based on device capabilities");
    }
    
    return selectedModel;
  } catch (error) {
    console.error("Error detecting device capabilities:", error);
    // Fallback to small model with 4-bit quantization for safety
    return MODEL_OPTIONS.SMALL.Q4;
  }
}

// Export a singleton instance of the model selection
export const MODEL_SELECTION = selectModelBasedOnDevice();
