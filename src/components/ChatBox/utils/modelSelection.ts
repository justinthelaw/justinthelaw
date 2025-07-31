// Model options and selection logic for text generation models
// Using SmolLM2 variants - efficient browser-compatible models
export const MODEL_OPTIONS = {
  LARGE: "Xenova/SmolLM2-1.7B",
  MEDIUM: "Xenova/SmolLM2-360M", 
  SMALL: "Xenova/SmolLM2-360M",
  TINY: "Xenova/SmolLM2-135M"
} as const;

// Model size names for user-friendly display
export const MODEL_SIZE_NAMES = {
  LARGE: "SmolLM2-1.7B (Large)",
  MEDIUM: "SmolLM2-360M",
  SMALL: "SmolLM2-360M",
  TINY: "SmolLM2-135M (Optimized)"
};

// Data types for each model - using auto (let the library decide)
export const MODEL_DTYPES = {
  LARGE: "auto" as const,  // Let library choose the best dtype
  MEDIUM: "auto" as const, // Let library choose the best dtype  
  SMALL: "auto" as const,  // Let library choose the best dtype
  TINY: "auto" as const    // Let library choose the best dtype
};

// Approximate memory requirements in MB, based on model parameters and data types
export const MODEL_MEMORY_REQUIREMENTS = {
  LARGE: 2000,  // ~2GB for SmolLM2-1.7B with fp16
  MEDIUM: 450,  // ~450MB for SmolLM2-360M with fp16
  SMALL: 450,   // ~450MB for SmolLM2-360M with fp16
  TINY: 180     // ~180MB for SmolLM2-135M with fp16
};

// All defaults should fall back on the smallest model
const DEFAULT_SELECTION = { model: MODEL_OPTIONS.TINY, dtype: MODEL_DTYPES.TINY }

// Type for model selection result
export type ModelSizeKey = 'LARGE' | 'MEDIUM' | 'SMALL' | 'TINY';

export type ModelDType = "auto";

export interface ModelSelection {
  model: string;
  dtype: ModelDType;
}

// Helper functions to convert between model names and size keys
export function getModelSizeFromModelName(modelName: string): ModelSizeKey {
  if (modelName === MODEL_OPTIONS.LARGE) return 'LARGE';
  if (modelName === MODEL_OPTIONS.MEDIUM) return 'MEDIUM';
  if (modelName === MODEL_OPTIONS.SMALL) return 'SMALL';
  return 'TINY';
}

// Enhanced function that considers both model name and dtype
export function getModelSizeFromSelection(selection: ModelSelection): ModelSizeKey {
  if (selection.model === MODEL_OPTIONS.LARGE) return 'LARGE';
  if (selection.model === MODEL_OPTIONS.MEDIUM) return 'MEDIUM';
  if (selection.model === MODEL_OPTIONS.SMALL) return 'SMALL';
  if (selection.model === MODEL_OPTIONS.TINY) return 'TINY';
  
  return 'TINY'; // Default fallback
}

export function getModelSelectionFromSizeKey(sizeKey: ModelSizeKey): ModelSelection {
  switch (sizeKey) {
    case 'LARGE':
      return { model: MODEL_OPTIONS.LARGE, dtype: MODEL_DTYPES.LARGE };
    case 'MEDIUM':
      return { model: MODEL_OPTIONS.MEDIUM, dtype: MODEL_DTYPES.MEDIUM };
    case 'SMALL':
      return { model: MODEL_OPTIONS.SMALL, dtype: MODEL_DTYPES.SMALL };
    case 'TINY':
    default:
      return { model: MODEL_OPTIONS.TINY, dtype: MODEL_DTYPES.TINY };
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

      // Use performance to estimate available memory with conservative criteria
      if (perfScore > 15000) {
        estimatedMemoryInGB = 4; // Very fast machine, likely has decent memory
      } else if (perfScore > 8000) {
        estimatedMemoryInGB = 2; // Decent machine
      } else {
        estimatedMemoryInGB = 1; // Slower machine, likely mobile or old device
      }
    }

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Check for very old mobile devices (like Samsung Galaxy S3)
    const isVeryOldMobile = /Android [1-4]\.|iPhone OS [1-8]_|iPad.*OS [1-8]_|BlackBerry|Windows Phone|webOS/i.test(
      navigator.userAgent
    );

    // Estimate for machines that might have browser limitations
    const memoryInMB = Math.max(estimatedMemoryInGB, 1) * 1024;

    // Use more conservative memory allocation for mobile devices
    const memoryMultiplier = isMobile ? 0.4 : 0.7; // Mobile devices get much less memory allocation
    const safeMemory = memoryInMB * memoryMultiplier;

    // Check logical processors
    const logicalProcessors = navigator.hardwareConcurrency || 4; // Default to 4 cores if not available

    // Run a quick performance test
    const startTime = performance.now();
    for (let i = 0; i < 1000000; i++) {
      Math.sqrt(i);
    }
    const endTime = performance.now();
    const perfScore = 1000000 / (endTime - startTime); // Higher is better

    console.log(`Device specs: Memory: ${estimatedMemoryInGB}GB (Safe: ${Math.round(safeMemory)}MB), Cores: ${logicalProcessors}, Mobile: ${isMobile}, Very old mobile: ${isVeryOldMobile}, Performance score: ${perfScore.toFixed(2)}`);

    // Select model based on device capabilities with more stringent requirements
    let selectedModel: ModelSelection;

    // Force very old mobile devices to use tiny model
    if (isVeryOldMobile || (isMobile && estimatedMemoryInGB <= 1)) {
      selectedModel = DEFAULT_SELECTION;
      console.log("Using tiny model for very old or low-memory mobile device");
    }
    // Force all mobile devices to use small or medium model at most
    else if (isMobile) {
      if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM && 
          perfScore > 80 && 
          logicalProcessors >= 4 && 
          estimatedMemoryInGB >= 3) {
        selectedModel = getModelSelectionFromSizeKey('MEDIUM');
        console.log("Using medium model for high-end mobile device");
      } else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.SMALL &&
                 perfScore > 40 &&
                 estimatedMemoryInGB >= 2) {
        selectedModel = getModelSelectionFromSizeKey('SMALL');
        console.log("Using small model for mid-range mobile device");
      } else {
        selectedModel = DEFAULT_SELECTION;
        console.log("Using tiny model for low-end mobile device");
      }
    }
    // Desktop/laptop devices with more stringent requirements
    else {
      // High-end devices - require full memory and strong performance
      if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE &&
          perfScore > 120 && 
          logicalProcessors >= 6 && 
          estimatedMemoryInGB >= 4) {
        selectedModel = getModelSelectionFromSizeKey('LARGE');
        console.log("Using large model for high-end desktop device");
      }
      // Mid-range devices - require both memory AND performance
      else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM &&
               perfScore > 80 && 
               logicalProcessors >= 4 && 
               estimatedMemoryInGB >= 2) {
        selectedModel = getModelSelectionFromSizeKey('MEDIUM');
        console.log("Using medium model for mid-range desktop device");
      }
      // Low-end devices - use small model
      else {
        selectedModel = getModelSelectionFromSizeKey('SMALL');
        console.log("Using small model for low-end desktop device");
      }
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
    return getModelSelectionFromSizeKey('SMALL');
  } else if (currentSize === 'SMALL') {
    return DEFAULT_SELECTION;
  }
  // Already at smallest
  return current;
}
