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
  
  // Add warning flag for large model selection
  if (size === 'LARGE') {
    window.localStorage.setItem('largeModelWarningShown', 'true');
  }
  
  window.localStorage.setItem('preferredModelSize', size);
}

/**
 * Checks if user has been warned about large model limitations
 */
export function hasLargeModelWarningBeenShown(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return window.localStorage.getItem('largeModelWarningShown') === 'true';
}

/**
 * Records that the large model failed to load to influence future auto-selection
 */
export function recordLargeModelFailure(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem('largeModelFailed', 'true');
  // Also remove any manual preference for large model
  const current = window.localStorage.getItem('preferredModelSize');
  if (current === 'LARGE') {
    window.localStorage.removeItem('preferredModelSize');
  }
}

/**
 * Checks if large model has previously failed on this device
 */
export function hasLargeModelPreviouslyFailed(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return window.localStorage.getItem('largeModelFailed') === 'true';
}

/**
 * Clears any saved model size preference
 */
export function clearModelPreference(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem('preferredModelSize');
}
