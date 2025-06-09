/**
 * This file handles the selection of appropriate SmolLM2 models based on device capabilities.
 * 
 * Model Memory Requirements for full-precision models (approximate):
 * - SmolLM2-1.7B-Instruct: ~3.4GB
 * - SmolLM2-360M-Instruct: ~723MB
 * - SmolLM2-135M-Instruct: ~269MB
 * 
 * The model selection algorithm:
 * 1. Checks for manual override in localStorage (if available)
 * 2. Detects device capabilities (memory, cores, mobile/desktop)
 * 3. Runs a quick performance benchmark
 * 4. Selects the optimal model size based on available CPU resources
 * 5. Uses a safety factor to ensure the app remains responsive
 */

// Model size options (using full precision only)
export const MODEL_OPTIONS = {
  LARGE: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
  MEDIUM: "HuggingFaceTB/SmolLM2-360M-Instruct",
  SMALL: "HuggingFaceTB/SmolLM2-135M-Instruct"
};

// Model size names for user-friendly display
export const MODEL_SIZE_NAMES = {
  LARGE: "Large (1.7B parameters)",
  MEDIUM: "Medium (360M parameters)",
  SMALL: "Small (135M parameters)"
};

// Approximate memory requirements in MB for full-precision models
export const MODEL_MEMORY_REQUIREMENTS = {
  LARGE: 3500,  // ~3.4GB
  MEDIUM: 750,  // ~723MB
  SMALL: 280    // ~269MB
};

// Type for model selection result
export interface ModelSelection {
  model: string;
  dtype?: "fp32"; // Only using full precision
}

// Function to detect device capabilities and select appropriate model
export function selectModelBasedOnDevice(): ModelSelection {
  // Check for a manual override in localStorage
  if (typeof window !== "undefined" && window.localStorage) {
    const manualOverride = window.localStorage.getItem('preferredModelSize');
    if (manualOverride) {
      console.log(`Using manually selected model size: ${manualOverride}`);
      if (manualOverride === 'LARGE') {
        return { model: MODEL_OPTIONS.LARGE, dtype: "fp32" };
      } else if (manualOverride === 'MEDIUM') {
        return { model: MODEL_OPTIONS.MEDIUM, dtype: "fp32" };
      } else if (manualOverride === 'SMALL') {
        return { model: MODEL_OPTIONS.SMALL, dtype: "fp32" };
      }
    }
  }

  if (typeof navigator === "undefined" || typeof window === "undefined") {
    // Default to medium model if not in browser environment
    return { model: MODEL_OPTIONS.MEDIUM, dtype: "fp32" };
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
      let benchmarkResult = 0;
      for (let i = 0; i < 1000000; i++) {
        benchmarkResult += Math.sqrt(i);
      }
      const endTime = performance.now();
      const perfScore = 1000000 / (endTime - startTime); // Higher is better

      // Use performance to estimate available memory
      if (perfScore > 100000) {
        estimatedMemoryInGB = 8; // Very fast machine, likely has plenty of memory
      } else if (perfScore > 50000) {
        estimatedMemoryInGB = 6; // Fast machine
      } else if (perfScore > 10000) {
        estimatedMemoryInGB = 4; // Decent machine
      } else {
        estimatedMemoryInGB = 2; // Slower machine
      }
    }
    
    // Default to a more generous estimate for machines that might have browser limitations
    const memoryInMB = Math.max(estimatedMemoryInGB, 4) * 1024; // Minimum 4GB estimate
    
    // Factor of safety - we don't want to use more than 40% of available memory
    // This leaves room for the rest of the application and other browser tabs/processes
    const safeMemory = memoryInMB * 0.4;

    // Check logical processors
    const logicalProcessors = navigator.hardwareConcurrency || 4; // Default to 4 cores if not available

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
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

    console.log(`Device specs: Memory: ${estimatedMemoryInGB}GB (Safe: ${Math.round(safeMemory)}MB), Cores: ${logicalProcessors}, Mobile: ${isMobile}, Performance score: ${perfScore.toFixed(2)}`);

    // Select model based on device capabilities
    let selectedModel: ModelSelection;

    // High-end devices - relaxed requirements to prefer larger models
    if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.LARGE * 0.7 || // Lower memory requirement by 30%
        (perfScore > 300 && logicalProcessors >= 4)) {        // Good performance is also a valid criterion
      selectedModel = { model: MODEL_OPTIONS.LARGE, dtype: "fp32" };
      console.log("Using large model (1.7B) with full precision based on device capabilities");
    }
    // Mid-range devices - relaxed requirements
    else if (safeMemory >= MODEL_MEMORY_REQUIREMENTS.MEDIUM * 0.7 || // Lower memory requirement by 30%
            (perfScore > 150 && logicalProcessors >= 2)) {          // More relaxed cpu/performance requirements
      selectedModel = { model: MODEL_OPTIONS.MEDIUM, dtype: "fp32" };
      console.log("Using medium model (360M) with full precision based on device capabilities");
    }
    // Low-end devices
    else {
      selectedModel = { model: MODEL_OPTIONS.SMALL, dtype: "fp32" };
      console.log("Using small model (135M) with full precision based on device capabilities");
    }
    
    return selectedModel;
  } catch (error) {
    console.error("Error detecting device capabilities:", error);
    // Fallback to small model for safety
    return { model: MODEL_OPTIONS.SMALL, dtype: "fp32" };
  }
}

// Export a singleton instance of the model selection
export const MODEL_SELECTION = selectModelBasedOnDevice();
