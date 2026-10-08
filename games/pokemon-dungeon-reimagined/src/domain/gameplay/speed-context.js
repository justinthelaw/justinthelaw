import { profile } from './support.js';
/** Shared physical context for the admitted opening turn-speed owner. Current
 * policies exclude effective weather/type/form overrides, Deoxys and hostile
 * Kecleon contexts requiring the broader native speed owner.
 * @param {import('../../contracts/campaign.js').SessionActor} actor
 * @param {import('./support.js').Catalogs} catalogs
 * @returns {import('../rules/speed.js').SpeedContext} */
export function currentSpeedContext(actor, catalogs) {
  const p = profile(actor.identity, catalogs);
  return { baseMovementSpeed: p.baseMovementSpeed, positiveTimers: actor.speed.positiveTimers, negativeTimers: actor.speed.negativeTimers, paralyzed: actor.conditions.burn?.statusId === 'paralysis', iceType: p.typeIds.includes(6), snow: false, deoxysSpeedForm: false, wildKecleonInTheftMode: false };
}
