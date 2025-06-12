/**
 * This file handles the selection of appropriate SmolLM2 models based on device capabilities.
 * 
 * Model Memory Requirements (approximate):
 * - SmolLM2-1.7B-Instruct (fp32): ~3.4GB
 * - SmolLM2-360M-Instruct (fp32): ~723MB
 * - SmolLM2-135M-Instruct (fp32): ~269MB
 * - SmolLM2-135M-Instruct (fp16): ~135MB (half precision for mobile)
 * 
 * The model selection algorithm:
 * 1. Checks for manual override in localStorage (if available)
 * 2. Detects device capabilities (memory, cores, mobile/desktop)
 * 3. Runs a quick performance benchmark
 * 4. Selects the optimal model size based on available CPU resources
 * 5. Prioritizes TINY (fp16) model for mobile devices
 * 6. Uses relaxed safety factors for better performance
 */

// Model options and selection logic for text generation models
export const MODEL_OPTIONS = {
  LARGE: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
  MEDIUM: "HuggingFaceTB/SmolLM2-360M-Instruct",
  SMALL: "HuggingFaceTB/SmolLM2-135M-Instruct",
  TINY: "HuggingFaceTB/SmolLM2-135M-Instruct"
} as const;

// Model size names for user-friendly display
export const MODEL_SIZE_NAMES = {
  LARGE: "Large",
  MEDIUM: "Medium",
  SMALL: "Small",
  TINY: "Tiny"
};

// Approximate memory requirements in MB
export const MODEL_MEMORY_REQUIREMENTS = {
  LARGE: 3400,  // ~3.4GB for 1.7B model (fp32)
  MEDIUM: 750,  // ~723MB (fp32)
  SMALL: 280,   // ~269MB (fp32)
  TINY: 135     // ~135MB (fp16 half precision)
};

// Data types for each model
export const MODEL_DTYPES = {
  LARGE: "fp32" as const,
  MEDIUM: "fp32" as const,
  SMALL: "fp32" as const,
  TINY: "q4" as const // Always use q4 for Tiny
};

// Type for model selection result
export type ModelSizeKey = 'LARGE' | 'MEDIUM' | 'SMALL' | 'TINY';

export type ModelDType = "fp32" | "fp16" | "q4";

export interface ModelSelection {
  model: string;
  dtype: ModelDType;
}

// Function to detect device capabilities and select appropriate model
export function selectModelBasedOnDevice(): ModelSelection {
  // Check for a manual override in localStorage
  if (typeof window !== "undefined" && window.localStorage) {
    const manualOverride = window.localStorage.getItem('preferredModelSize');
    if (manualOverride) {
      console.log(`Using manually selected model size: ${manualOverride}`);
      if (manualOverride === 'LARGE') {
        return { model: MODEL_OPTIONS.LARGE, dtype: MODEL_DTYPES.LARGE };
      } else if (manualOverride === 'MEDIUM') {
        return { model: MODEL_OPTIONS.MEDIUM, dtype: MODEL_DTYPES.MEDIUM };
      } else if (manualOverride === 'SMALL') {
        return { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL };
      } else if (manualOverride === 'TINY') {
        return { model: MODEL_OPTIONS.TINY, dtype: MODEL_DTYPES.TINY };
      }
    }
  }

  if (typeof navigator === "undefined" || typeof window === "undefined") {
    // Default to medium model if not in browser environment
    return { model: MODEL_OPTIONS.MEDIUM, dtype: MODEL_DTYPES.MEDIUM };
  }

  try {
    // Try to get a more accurate memory assessment
    // First, attempt to use the deviceMemory API
    let estimatedMemoryInGB: number;
    const deviceMemoryAPI = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    
    if (deviceMemoryAPI) {
      estimatedMemoryInGB = deviceMemoryAPI;
    } else {
      // If deviceMemory isn't available, make an educated guess based on performance
      const startTime = performance.now();
      for (let i = 0; i < 1000000; i++) {
        Math.sqrt(i);
      }
      const endTime = performance.now();
      const perfScore = 1000000 / (endTime - startTime); // Higher is better

      // Use performance to estimate available memory with relaxed criteria
      if (perfScore > 5000) {        // Reduced from 10000
        estimatedMemoryInGB = 4; // Fast machine, likely has decent memory
      } else {
        estimatedMemoryInGB = 2; // Slower machine
      }
    }
    
    // Default to a more generous estimate for machines that might have browser limitations
    const memoryInMB = Math.max(estimatedMemoryInGB, 2) * 1024; // Minimum 2GB estimate (reduced from 4GB)
    
    // Relaxed safety factor - we can use up to 90% of available memory
    // This is much more aggressive than the previous 40-75% to maximize model capabilities
    const safeMemory = memoryInMB * 0.9;

    // Check logical processors
    const logicalProcessors = navigator.hardwareConcurrency || 4; // Default to 4 cores if not available

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Run a quick performance test
    const startTime = performance.now();
    for (let i = 0; i < 1000000; i++) {
      Math.sqrt(i);
    }
    const endTime = performance.now();
    const perfScore = 1000000 / (endTime - startTime); // Higher is better

    console.log(`Device specs: Memory: ${estimatedMemoryInGB}GB (Safe: ${Math.round(safeMemory)}MB), Cores: ${logicalProcessors}, Mobile: ${isMobile}, Performance score: ${perfScore.toFixed(2)}`);

    // Select model based on device capabilities with relaxed requirements
    let selectedModel: ModelSelection;

    // Very high-end devices - try the largest model first
    if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE * 0.8 && // Only need 80% of memory requirement
        (perfScore > 100 && logicalProcessors >= 4)) {         // Relaxed CPU requirements
      selectedModel = { model: MODEL_OPTIONS.LARGE, dtype: MODEL_DTYPES.LARGE };
      console.log("Using large model (1.7B) with full precision based on device capabilities");
    }
    // High-end devices - relaxed requirements for medium model
    else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM * 0.5 || // Only need 50% of memory requirement
        (perfScore > 50 && logicalProcessors >= 2)) {               // Much more relaxed requirements
      selectedModel = { model: MODEL_OPTIONS.MEDIUM, dtype: MODEL_DTYPES.MEDIUM };
      console.log("Using medium model (360M) with full precision based on device capabilities");
    }
    // Mid-range devices - relaxed requirements for small model
    else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.SMALL * 0.5 || // Only need 50% of memory requirement
        perfScore > 25) {                                           // Very relaxed performance requirement
      selectedModel = { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL };
      console.log("Using small model (135M) with full precision based on device capabilities");
    }
    // Low-end devices and mobile - use half precision tiny model
    else {
      selectedModel = { model: MODEL_OPTIONS.TINY, dtype: MODEL_DTYPES.TINY };
      console.log("Using tiny model (135M half precision) for low-end/mobile device");
    }
    
    return selectedModel;
  } catch (error) {
    console.error("Error detecting device capabilities:", error);
    // Fallback to tiny model for safety
    return { model: MODEL_OPTIONS.TINY, dtype: MODEL_DTYPES.TINY };
  }
}

// Initial model selection for new users or reset state
export function getInitialModelSelection(): ModelSelection {
  return {
    model: MODEL_OPTIONS.MEDIUM,
    dtype: "fp32"
  };
}

// Get the next model selection based on current, for cycling through models or fallback
// In getNextModelSelection, always use q4 for Tiny
export function getNextModelSelection(current: ModelSelection): ModelSelection {
  if (current.model === MODEL_OPTIONS.LARGE) {
    return { model: MODEL_OPTIONS.MEDIUM, dtype: MODEL_DTYPES.MEDIUM };
  } else if (current.model === MODEL_OPTIONS.MEDIUM) {
    return { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL };
  } else if (current.model === MODEL_OPTIONS.SMALL && current.dtype === "fp32") {
    return { model: MODEL_OPTIONS.TINY, dtype: MODEL_DTYPES.TINY };
  }
  // Already at smallest
  return current;
}
