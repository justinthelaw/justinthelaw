// Model options and selection logic for text generation models
export const MODEL_OPTIONS = {
  LARGE: "Mozilla/Qwen2.5-0.5B-Instruct",
  MEDIUM: "HuggingFaceTB/SmolLM2-360M-Instruct",
  SMALL: "HuggingFaceTB/SmolLM2-360M-Instruct"
} as const;

// Model size names for user-friendly display
export const MODEL_SIZE_NAMES = {
  LARGE: "Large",
  MEDIUM: "Medium",
  SMALL: "Small"
};

// Data types for each model
export const MODEL_DTYPES = {
  LARGE: "fp32" as const,
  MEDIUM: "fp32" as const,
  SMALL: "q4" as const
};

// Approximate memory requirements in MB, based on parameters and data types
export const MODEL_MEMORY_REQUIREMENTS = {
  LARGE: 1300,  // ~1.3GB for large model
  MEDIUM: 800,  // ~0.8GB for medium model 
  SMALL: 400    // ~0.4GB for small model
};

// All defaults should fall back on the smallest model
const DEFAULT_SELECTION = { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL }

// Type for model selection result
export type ModelSizeKey = 'LARGE' | 'MEDIUM' | 'SMALL';

export type ModelDType = "fp32" | "fp16" | "q4";

export interface ModelSelection {
  model: string;
  dtype: ModelDType;
}

// Helper functions to convert between model names and size keys
export function getModelSizeFromModelName(modelName: string): ModelSizeKey {
  if (modelName === MODEL_OPTIONS.LARGE) return 'LARGE';
  if (modelName === MODEL_OPTIONS.MEDIUM) return 'MEDIUM';
  return 'SMALL';
}

// Enhanced function that considers both model name and dtype
export function getModelSizeFromSelection(selection: ModelSelection): ModelSizeKey {
  if (selection.model === MODEL_OPTIONS.LARGE) return 'LARGE';
  
  // Handle case where MEDIUM and SMALL use the same model but different dtypes
  if (selection.model === MODEL_OPTIONS.MEDIUM || selection.model === MODEL_OPTIONS.SMALL) {
    if (selection.dtype === MODEL_DTYPES.MEDIUM) return 'MEDIUM';
    if (selection.dtype === MODEL_DTYPES.SMALL) return 'SMALL';
  }
  
  return 'SMALL'; // Default fallback
}

export function getModelSelectionFromSizeKey(sizeKey: ModelSizeKey): ModelSelection {
  switch (sizeKey) {
    case 'LARGE':
      return { model: MODEL_OPTIONS.LARGE, dtype: MODEL_DTYPES.LARGE };
    case 'MEDIUM':
      return { model: MODEL_OPTIONS.MEDIUM, dtype: MODEL_DTYPES.MEDIUM };
    case 'SMALL':
    default:
      return { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL };
  }
}

// Function to detect device capabilities and select appropriate model
export function selectModelBasedOnDevice(): ModelSelection {
  // Check for a manual override in localStorage
  if (typeof window !== "undefined" && window.localStorage) {
    const manualOverride = window.localStorage.getItem('preferredModelSize');
    if (manualOverride) {
      if (manualOverride === 'LARGE' || manualOverride === 'MEDIUM' || manualOverride === 'SMALL') {
        return getModelSelectionFromSizeKey(manualOverride as ModelSizeKey);
      }
    }
  }

  if (typeof navigator === "undefined" || typeof window === "undefined") {
    // Default to small model if not in browser environment
    return DEFAULT_SELECTION;
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
      if (perfScore > 10000) {
        estimatedMemoryInGB = 4; // Fast machine, likely has decent memory
      } else {
        estimatedMemoryInGB = 2; // Slower machine
      }
    }

    // Estimate for machines that might have browser limitations
    const memoryInMB = Math.max(estimatedMemoryInGB, 2) * 1024;

    // Use up to 70% of available memory
    const safeMemory = memoryInMB * 0.7;

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
    if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE * 0.8 &&  // Only need 80% of memory requirement
      (perfScore > 100 && logicalProcessors >= 4)) {
      selectedModel = getModelSelectionFromSizeKey('LARGE');
      console.log("Using large model with full precision based on device capabilities");
    }
    // Mid-range devices
    else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM * 0.8 ||  // Only need 80% of memory requirement
      (perfScore > 50 && logicalProcessors >= 2)) {
      selectedModel = getModelSelectionFromSizeKey('MEDIUM');
      console.log("Using medium model with full precision based on device capabilities");
    }
    // Low-end devices and mobile - use small model (optimized for mobile)
    else {
      selectedModel = DEFAULT_SELECTION;
      console.log("Using small model optimized for mobile/low-end devices");
    }

    return selectedModel;
  } catch (error) {
    console.error("Error detecting device capabilities:", error);
    // Fallback to small model for safety
    return DEFAULT_SELECTION;
  }
}

// Initial model selection for new users or reset state
export function getInitialModelSelection(): ModelSelection {
  return DEFAULT_SELECTION
}

// Get the next model selection based on current, for cycling through models or fallback
export function getNextModelSelection(current: ModelSelection): ModelSelection {
  const currentSize = getModelSizeFromSelection(current);
  if (currentSize === 'LARGE') {
    return getModelSelectionFromSizeKey('MEDIUM');
  } else if (currentSize === 'MEDIUM') {
    return DEFAULT_SELECTION;
  }
  // Already at smallest
  return current;
}
