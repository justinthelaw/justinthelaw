/** Application preferences, not original-game numerical mechanics. The zoom
 * range follows RENDERER-CONTRACT.md. Values are rejected, never clamped on load.
 */
export const OPTION_BOUNDS = Object.freeze({
  volume: Object.freeze({ minimum: 0, maximum: 1 }),
  sensitivity: Object.freeze({ minimum: 0.1, maximum: 4 }),
  zoom: Object.freeze({ minimum: 4.5, maximum: 12 }),
  textScale: Object.freeze({ minimum: 0.75, maximum: 2 }),
});

/** Semantic companion to the exact CampaignOptions structural schema.
 * @param {import('../../src/contracts/campaign.js').CampaignOptions} options
 * @returns {import('../../src/contracts/campaign.js').RuleCheck}
 */
export function validateCampaignOptions(options) {
  /** @type {import('../../src/contracts/campaign.js').StateIssue[]} */
  const issues = [];
  /** @param {number} value @param {{minimum:number,maximum:number}} bounds @param {string} path */
  function within(value, bounds, path) {
    if (!Number.isFinite(value) || value < bounds.minimum || value > bounds.maximum) issues.push({ code: 'range', path, message: `Preference must be between ${bounds.minimum} and ${bounds.maximum}.` });
  }
  for (const key of /** @type {const} */ (['master', 'music', 'effects'])) within(options.audio[key], OPTION_BOUNDS.volume, `/audio/${key}`);
  within(options.camera.sensitivity, OPTION_BOUNDS.sensitivity, '/camera/sensitivity');
  within(options.camera.zoom, OPTION_BOUNDS.zoom, '/camera/zoom');
  within(options.accessibility.textScale, OPTION_BOUNDS.textScale, '/accessibility/textScale');
  return issues.length ? { ok: false, kind: 'invalid', issues } : { ok: true };
}
