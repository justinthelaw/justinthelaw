// Simplified model options and selection logic for text generation models
// Using ONNX-compatible SmolLM2 variants

export const MODEL_SIZES = ["SMALL", "MEDIUM", "LARGE"] as const;
export type ModelSizeKey = typeof MODEL_SIZES[number];

export interface ModelSelection {
  model: string;
  dtype: "auto";
}

export const MODEL_OPTIONS: Record<ModelSizeKey, string> = {
  SMALL: "onnx-community/SmolLM2-135M-Instruct-ONNX",
  MEDIUM: "onnx-community/SmolLM2-360M-Instruct-ONNX",
  LARGE: "sledgedev/SmolLM2-1.7B-Instruct-ONNX-ARM64",
};

// Model size names for user-friendly display
export const MODEL_SIZE_NAMES: Record<ModelSizeKey, string> = {
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
};

export const MODEL_DTYPES: Record<ModelSizeKey, "auto"> = {
  SMALL: "auto",
  MEDIUM: "auto",
  LARGE: "auto",
};

// Approximate memory requirements in MB
export const MODEL_MEMORY_REQUIREMENTS: Record<ModelSizeKey, number> = {
  SMALL: 300,
  MEDIUM: 800,
  LARGE: 3500,
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
    const override = window.localStorage.getItem(
      "preferredModelSize"
    ) as ModelSizeKey | null;
    if (override && MODEL_SIZES.includes(override)) {
      return getModelSelectionFromSizeKey(override);
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

  if (!isMobile && deviceMemory >= 8 && cores >= 6) {
    return getModelSelectionFromSizeKey("LARGE");
  }
  if (deviceMemory >= 4 && cores >= 4) {
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

