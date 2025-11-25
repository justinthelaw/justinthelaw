/**
 * Model Selection
 * Device capability detection and model size selection logic
 */

import { ModelSize, type DeviceCapabilities } from '@/types';
import { DEFAULT_MODEL_SIZE, DEVICE_THRESHOLDS } from '@/config/models';

/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return {
      memory: 4 * 1024, // Default to 4GB
      cores: 4,
      isMobile: false,
    };
  }

  const deviceMemory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  return {
    memory: deviceMemory * 1024, // Convert GB to MB
    cores,
    isMobile,
  };
}

/**
 * Select an appropriate model based on device capabilities
 */
export function selectModelForDevice(
  capabilities: DeviceCapabilities = detectDeviceCapabilities()
): ModelSize {
  const { memory, cores, isMobile } = capabilities;

  // Mobile devices default to medium model
  if (isMobile) {
    return ModelSize.MEDIUM;
  }

  // Desktop device selection based on specs
  if (
    memory >= DEVICE_THRESHOLDS.LARGE.memory &&
    cores >= DEVICE_THRESHOLDS.LARGE.cores
  ) {
    return ModelSize.LARGE;
  }

  if (
    memory >= DEVICE_THRESHOLDS.MEDIUM.memory &&
    cores >= DEVICE_THRESHOLDS.MEDIUM.cores
  ) {
    return ModelSize.MEDIUM;
  }

  return DEFAULT_MODEL_SIZE;
}

/**
 * Get recommended model size based on device (considers user preference from store)
 */
export function getRecommendedModelSize(
  preferredSize?: ModelSize
): ModelSize {
  // If user has a preference, use it
  if (preferredSize) {
    return preferredSize;
  }

  // Otherwise, auto-detect based on device
  return selectModelForDevice();
}
