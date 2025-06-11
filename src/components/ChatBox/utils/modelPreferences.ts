/**
 * This file provides utilities to manage user preferences for model selection.
 * It allows users to manually override automatic model selection for better performance
 * on their specific device.
 */

import { MODEL_SIZE_NAMES, selectModelBasedOnDevice, MODEL_OPTIONS } from './modelSelection';

export type ModelSizeKey = 'MEDIUM' | 'SMALL';

/**
 * Gets the auto-detected model size based on device capabilities
 * @returns The auto-detected model size
 */
export function getAutoDetectedModelSize(): ModelSizeKey {
  const autoSelection = selectModelBasedOnDevice();
  return autoSelection.model === MODEL_OPTIONS.MEDIUM ? 'MEDIUM' : 'SMALL';
}

/**
 * Sets the preferred model size in localStorage
 * @param size The size of model to use (MEDIUM, SMALL)
 */
export function setPreferredModelSize(size: ModelSizeKey): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  window.localStorage.setItem('preferredModelSize', size);
  console.log(`Model preference set to: ${MODEL_SIZE_NAMES[size]}`);
}

/**
 * Gets the currently preferred model size from localStorage
 * @returns The current model size preference or null if not set
 */
export function getPreferredModelSize(): ModelSizeKey | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  
  const preference = window.localStorage.getItem('preferredModelSize') as ModelSizeKey;
  if (preference && ['MEDIUM', 'SMALL'].includes(preference)) {
    return preference;
  }
  return null;
}

/**
 * Clears any saved model size preference
 */
export function clearModelPreference(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  window.localStorage.removeItem('preferredModelSize');
  console.log('Model preference cleared. Will use auto-detection on next page load.');
}
