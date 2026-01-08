/**
 * Device Detection Utility
 * Detects if the user is on a mobile device using browser APIs
 */

/**
 * Determines if the current device is a mobile device
 * Uses multiple browser APIs for accurate detection
 * @returns true if mobile device, false for laptop/desktop
 */
export function isMobileDevice(): boolean {
  // Check if running in browser
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check userAgentData API (modern browsers)
  if ('userAgentData' in navigator) {
    const uaData = (navigator as unknown as { userAgentData?: { mobile?: boolean } }).userAgentData;
    if (uaData?.mobile !== undefined) {
      return uaData.mobile;
    }
  }

  // Fallback to screen width detection (common mobile breakpoint)
  // Combined with touch capability detection
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const narrowScreen = window.innerWidth <= 768;

  // Consider it mobile if it has touch AND a narrow screen
  return hasTouch && narrowScreen;
}
