/** Conservative fixed tiers; no unmeasured automatic performance promise. */
export const QUALITY = Object.freeze({ mobile: Object.freeze({ maxDpr: 1.5, maxPixels: 1600000, effectLimit: 16, antialias: false }), desktop: Object.freeze({ maxDpr: 2, maxPixels: 3600000, effectLimit: 32, antialias: false }) });
/** @typedef {keyof typeof QUALITY} QualityTier */

/** The startup canvas is hidden until rendering is ready. Prefer its measured
 * width when visible, otherwise use its own document's viewport, including when
 * embedded in the website's iframe. No available layout keeps the smaller tier.
 * @param {HTMLCanvasElement} canvas @returns {QualityTier}
 */
export function initialQuality(canvas) {
  const width = canvas.clientWidth || canvas.ownerDocument.documentElement.clientWidth || canvas.ownerDocument.defaultView?.innerWidth || 0;
  return width < 768 ? 'mobile' : 'desktop';
}
