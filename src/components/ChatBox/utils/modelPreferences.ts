import { selectModelBasedOnDevice, MODEL_OPTIONS } from './modelSelection';

export type ModelSizeKey = 'LARGE' | 'MEDIUM' | 'SMALL' | 'TINY';

/**
 * Gets the auto-detected model size based on device capabilities or fallback state.
 * Optionally accepts a ModelSelection to reflect the current fallback.
 */
export function getAutoDetectedModelSize(currentSelection?: { model: string; dtype: string }): ModelSizeKey {
  // Only use device detection, no manual override logic
  let autoSelection;
  if (currentSelection) {
    if (currentSelection.model === MODEL_OPTIONS.LARGE) return 'LARGE';
    if (currentSelection.model === MODEL_OPTIONS.MEDIUM) return 'MEDIUM';
    if (currentSelection.model === MODEL_OPTIONS.SMALL) return 'SMALL';
    return 'TINY';
  } else {
    autoSelection = selectModelBasedOnDevice();
    if (autoSelection.model === MODEL_OPTIONS.LARGE) return 'LARGE';
    if (autoSelection.model === MODEL_OPTIONS.MEDIUM) return 'MEDIUM';
    if (autoSelection.model === MODEL_OPTIONS.SMALL) return 'SMALL';
    return 'TINY';
  }
}

/**
 * Sets the preferred model size in localStorage
 * @param size The size of model to use (MEDIUM, SMALL)
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
