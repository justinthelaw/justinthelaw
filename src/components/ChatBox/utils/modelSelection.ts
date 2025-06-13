// Model options and selection logic for text generation models
export const MODEL_OPTIONS = {
  LARGE: "Mozilla/Qwen2.5-0.5B-Instruct",
  MEDIUM: "HuggingFaceTB/SmolLM2-360M-Instruct",
  SMALL: "HuggingFaceTB/SmolLM2-135M-Instruct"
} as const;

// Model size names for user-friendly display
export const MODEL_SIZE_NAMES = {
  LARGE: "Large",
  MEDIUM: "Medium",
  SMALL: "Small"
};

// Approximate memory requirements in MB
export const MODEL_MEMORY_REQUIREMENTS = {
  LARGE: 2500,  // ~2.5GB for 0.5B model (fp32)
  MEDIUM: 1500, // ~1.5GB for 360M model (fp32) 
  SMALL: 600    // ~600MB for 135M model (fp32)
};

// Data types for each model - all fp32 now
export const MODEL_DTYPES = {
  LARGE: "fp32" as const,
  MEDIUM: "fp32" as const,
  SMALL: "fp32" as const
};

// Type for model selection result
export type ModelSizeKey = 'LARGE' | 'MEDIUM' | 'SMALL';

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

    // High-end devices - try the largest model first
    if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE * 0.8 && // Only need 80% of memory requirement
        (perfScore > 100 && logicalProcessors >= 4)) {         // Relaxed CPU requirements
      selectedModel = { model: MODEL_OPTIONS.LARGE, dtype: MODEL_DTYPES.LARGE };
      console.log("Using large model (Mozilla Qwen 0.5B) with full precision based on device capabilities");
    }
    // Mid-range devices - relaxed requirements for medium model
    else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM * 0.5 || // Only need 50% of memory requirement
        (perfScore > 50 && logicalProcessors >= 2)) {               // Much more relaxed requirements
      selectedModel = { model: MODEL_OPTIONS.MEDIUM, dtype: MODEL_DTYPES.MEDIUM };
      console.log("Using medium model (SmolLM2 360M) with full precision based on device capabilities");
    }
    // Low-end devices and mobile - use small model (optimized for mobile)
    else {
      selectedModel = { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL };
      console.log("Using small model (SmolLM2 135M) optimized for mobile/low-end devices");
    }
    
    return selectedModel;
  } catch (error) {
    console.error("Error detecting device capabilities:", error);
    // Fallback to small model for safety
    return { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL };
  }
}

// Initial model selection for new users or reset state
export function getInitialModelSelection(): ModelSelection {
  return {
    model: MODEL_OPTIONS.SMALL, // Default to smallest model
    dtype: "fp32"
  };
}

// Get the next model selection based on current, for cycling through models or fallback
export function getNextModelSelection(current: ModelSelection): ModelSelection {
  if (current.model === MODEL_OPTIONS.LARGE) {
    return { model: MODEL_OPTIONS.MEDIUM, dtype: MODEL_DTYPES.MEDIUM };
  } else if (current.model === MODEL_OPTIONS.MEDIUM) {
    return { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL };
  }
  // Already at smallest
  return current;
}
