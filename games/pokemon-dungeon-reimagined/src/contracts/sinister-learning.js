/** New source evidence exists only on actual prospective v25 awards. Historical
 * envelopes keep their original pending award records unchanged.
 * @typedef {{kind:'impact';actor:import('./campaign.js').ActorSlotRef;move:import('./sinister-work.js').SinisterMoveReceipt;sequence:import('../domain/gameplay/sinister-combat.js').SinisterMoveSequence;}|{kind:'action'|'end';actor:import('./campaign.js').ActorSlotRef;}} SinisterAwardSource
 */
export {};
