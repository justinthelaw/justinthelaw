// Simplified model options and selection logic for text generation models
// Using ONNX-compatible SmolLM2 variants

export const MODEL_SIZES = ["SMALL", "MEDIUM", "LARGE"] as const;
export type ModelSizeKey = typeof MODEL_SIZES[number];

export interface ModelSelection {
  model: string;
  dtype: "auto" | "fp32" | "int8" | "uint8" | "q8" | "q4";
}

export const MODEL_OPTIONS: Record<ModelSizeKey, string> = {
  SMALL: "HuggingFaceTB/SmolLM2-135M-Instruct",
  MEDIUM: "HuggingFaceTB/SmolLM2-360M-Instruct",
  LARGE: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
};

// Model size names for user-friendly display
export const MODEL_SIZE_NAMES: Record<ModelSizeKey, string> = {
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
};

export const MODEL_DTYPES: Record<ModelSizeKey, "auto" | "fp32" | "int8" | "uint8" | "q8" | "q4"> = {
  SMALL: "auto",
  MEDIUM: "auto",
  LARGE: "q8", // Use 8-bit quantization for large model to reduce memory usage
};

// Approximate memory requirements in MB
export const MODEL_MEMORY_REQUIREMENTS: Record<ModelSizeKey, number> = {
  SMALL: 300,
  MEDIUM: 800,
  LARGE: 1750, // Reduced from 3500MB due to q8 quantization (~50% reduction)
};

// Small model is the default and smallest option
const DEFAULT_SELECTION: ModelSelection = {
  model: MODEL_OPTIONS.SMALL,
  dtype: MODEL_DTYPES.SMALL,
};

export function getModelSizeFromSelection(
  selection: ModelSelection
): ModelSizeKey {
  const entry = (Object.entries(MODEL_OPTIONS) as [ModelSizeKey, string][]).find(
    ([, model]) => model === selection.model
  );
  return entry ? entry[0] : "SMALL";
}

export function getModelSelectionFromSizeKey(
  sizeKey: ModelSizeKey
): ModelSelection {
  return { model: MODEL_OPTIONS[sizeKey], dtype: MODEL_DTYPES[sizeKey] };
}

/**
 * Detect device capabilities and select an appropriate model.
 * A manual override stored in localStorage takes precedence.
 */
export function selectModelBasedOnDevice(): ModelSelection {
  if (typeof window !== "undefined" && window.localStorage) {
    // Check if large model has previously failed on this device
    const hasLargeModelFailed = window.localStorage.getItem('largeModelFailed') === 'true';
    
    const override = window.localStorage.getItem(
      "preferredModelSize"
    ) as ModelSizeKey | null;
    if (override && MODEL_SIZES.includes(override)) {
      // If user manually selected large model but it failed before, warn them
      if (override === 'LARGE' && hasLargeModelFailed) {
        console.warn('Large model previously failed on this device, but user manually selected it');
      }
      return getModelSelectionFromSizeKey(override);
    }
    
    // If large model failed before, avoid auto-selecting it
    if (hasLargeModelFailed) {
      console.log('Large model previously failed, avoiding auto-selection');
    }
  }

  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return DEFAULT_SELECTION;
  }

  const deviceMemory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Check if large model has previously failed on this device
  const hasLargeModelFailed = typeof window !== "undefined" && 
    window.localStorage?.getItem('largeModelFailed') === 'true';

  // Be more conservative with large model selection due to browser memory constraints
  // Only select large model for very powerful devices with confirmed high memory
  // and if it hasn't failed before
  if (!isMobile && !hasLargeModelFailed && deviceMemory >= 16 && cores >= 8) {
    return getModelSelectionFromSizeKey("LARGE");
  }
  if (!isMobile && deviceMemory >= 6 && cores >= 4) {
    return getModelSelectionFromSizeKey("MEDIUM");
  }
  return DEFAULT_SELECTION;
}

export function getInitialModelSelection(): ModelSelection {
  return DEFAULT_SELECTION;
}

export function getNextModelSelection(
  current: ModelSelection
): ModelSelection {
  const currentSize = getModelSizeFromSelection(current);
  if (currentSize === "LARGE") return getModelSelectionFromSizeKey("MEDIUM");
  if (currentSize === "MEDIUM")
    return getModelSelectionFromSizeKey("SMALL");
  return current;
}

