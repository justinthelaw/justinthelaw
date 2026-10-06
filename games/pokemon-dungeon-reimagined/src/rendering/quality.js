/** Conservative fixed tiers; no unmeasured automatic performance promise. */
export const QUALITY = Object.freeze({ mobile: Object.freeze({ maxDpr: 1.5, maxPixels: 1600000, effectLimit: 16, antialias: false }), desktop: Object.freeze({ maxDpr: 2, maxPixels: 3600000, effectLimit: 32, antialias: false }) });
/** @typedef {keyof typeof QUALITY} QualityTier */
