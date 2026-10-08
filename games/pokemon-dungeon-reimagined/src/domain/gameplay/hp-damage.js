/** Shared nominal damage accumulation precedes HP subtraction. Native Bide
 * stores damage up to999, including residual damage, not HP actually lost.
 * No random draw or faint/revival decisions occur in this narrow owner.
 * @param {import('../../contracts/campaign.js').SessionActor} target @param {number} amount */
export function damageHp(target, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError('Invalid HP damage.');
  const bide = target.conditions.bide;
  if (bide?.statusId === 'bide' && bide.payload.kind === 'charge') bide.payload.storedDamage = Math.min(999, bide.payload.storedDamage + amount);
  target.resources.hp = Math.max(0, target.resources.hp - amount);
}
