import {
  selectModelBasedOnDevice,
  getModelSizeFromSelection,
  type ModelSelection,
  type ModelSizeKey,
} from "./modelSelection";

export type { ModelSizeKey };

/**
 * Gets the auto-detected model size based on device capabilities or fallback state.
 * Optionally accepts a ModelSelection to reflect the current fallback.
 */
export function getAutoDetectedModelSize(
  currentSelection?: ModelSelection
): ModelSizeKey {
  return currentSelection
    ? getModelSizeFromSelection(currentSelection)
    : getModelSizeFromSelection(selectModelBasedOnDevice());
}

/**
 * Sets the preferred model size in localStorage
 * @param size The size of model to use (LARGE, MEDIUM, SMALL)
 */
export function setPreferredModelSize(size: ModelSizeKey): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem('preferredModelSize', size);
}

/**
 * Clears any saved model size preference
 */
export function clearModelPreference(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem('preferredModelSize');
}
