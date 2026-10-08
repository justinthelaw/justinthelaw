import { ESCORT_SPATIAL_FACTS as FACTS } from '../../../content/authored/escort-spatial-facts.js';
import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { escortDungeonRandomInteger } from '../escort-dungeon-rng.js';
import { nativeGeneralRandomRange } from '../native-general-rng.js';
import { allocate, ability, blocked, clone } from './support.js';
/** Source GetRandomFloorItem(0) uses two conditional DungeonRandInt(10000)
 * draws. Category failure consumes only one. Zero thresholds never match;
 * native numeric order and inclusive >= thresholds retain the source bias.
 * @param {import('./support.js').Catalogs} catalogs @param {string} poolId
 * @param {(upper:number)=>number} sample @returns {string} */
export function nativePickupItem(catalogs,poolId,sample) {
  const pool = catalogs.dungeons.getItemPool(poolId),roll = sample(FACTS.pickupDrawCap);
  const category = [...pool.categories].sort((a,b) => a.order-b.order).find(row => row.selectionThreshold !== 0 && row.selectionThreshold >= roll);
  if (!category) return 'item-poke';
  const itemRoll = sample(FACTS.pickupDrawCap);
  return [...category.items].sort((a,b) => catalogs.effects.getItem(a.itemId).internalId-catalogs.effects.getItem(b.itemId).internalId).find(row => row.selectionThreshold !== 0 && row.selectionThreshold >= itemRoll)?.itemId ?? 'item-poke';
}
/** Real floor-entry ability Pickup, including XP-locked guest. Poke has no held
 * lot; thrown quantity consumes the retained prospective general owner. No
 * USABLE_ITEMS filter changes native category/item outcomes. This saves actual
 * per-floor source draws and construction identities before presentation.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('./support.js').Catalogs} catalogs */
export function spawnNativeTeamPickup(context,catalogs) {
  const state = context.state,session = state.session,runtime = state.escortRuntime,conversion = session?.entry.nativeEscort;
  if (state.contentRevision !== ESCORT_WORK_REVISION || !session || !runtime || !conversion || !('address' in session.floor.location)) return blocked('escort-pickup-floor-owner');
  const floor = catalogs.dungeons.getFloorById(session.floor.location.address.floorId),fixed = catalogs.dungeons.getGeneration(floor.generationId).parameters.fixedRoomNumber;
  if (session.dungeonId === 'tiny-woods' || catalogs.navigation.fixed(fixed).kind === 'floorwide') return;
  const rank = (/** @type {import('../../contracts/campaign.js').SessionActor|undefined} */ actor) => actor?.actorId === session.leaderActorId ? 0 : actor?.binding.kind === 'roster' && actor.binding.pokemonId === state.profile.partnerId ? 1 : 2;
  const spawnOrder = session.scheduler.teamSlots.map((id,slot) => ({ id,slot })).filter(row => row.id !== null).sort((a,b) => rank(a.id ? session.actors[a.id] : undefined)-rank(b.id ? session.actors[b.id] : undefined) || a.slot-b.slot);
  for (const {slot,id} of spawnOrder) {
    const actor = id ? session.actors[id] : null;
    if (!actor || actor.placement.kind !== 'map' || !ability(actor,catalogs,'Pickup')) continue;
    const held = state.containers[actor.heldContainerId];
    if (!held || held.owner.kind !== 'actor-held' || held.owner.actorId !== actor.actorId || held.owner.sessionId !== session.sessionId) return blocked('escort-pickup-held-owner');
    if (held.itemIds.length) continue;
    const beforeDungeonRandom = clone(state.random.encountersItems),beforeGeneralRandom = clone(runtime.generalRandom);
    const itemId = nativePickupItem(catalogs,floor.itemPoolIds.floor,upper => { const result = escortDungeonRandomInteger(state.random.encountersItems,upper); state.random.encountersItems = result.state; return result.value; });
    let item = null;
    if (itemId !== 'item-poke') {
      const source = catalogs.effects.getItem(itemId);
      let quantity = 1;
      if (source.category === 'thrown_line' || source.category === 'thrown_arc') {
        const range = source.spawnStackRange; if (!range || range.length !== 2 || range[0] === undefined || range[1] === undefined) return blocked('escort-pickup-thrown-quantity-source');
        const result = nativeGeneralRandomRange(runtime.generalRandom,range[0],range[1]);
        quantity = result.value; runtime.generalRandom = clone(result.state);
      }
      const itemInstanceId = allocate(state,'item-instance');
      item = { itemInstanceId,template: { itemId: /** @type {import('../../contracts.js').ItemId} */ (itemId),sticky: false,payload: { kind: /** @type {const} */ ('none') } },quantity,shopLotId: null };
      state.items[itemInstanceId] = item; held.itemIds.push(itemInstanceId);
      context.emit({ type: 'itemChanged',itemInstanceId });
    }
    conversion.pickup.push({ actorId: actor.actorId,slot,mapId: session.floor.mapId,floorId: session.floor.location.address.floorId,revision: state.revision+1,beforeDungeonRandom,afterDungeonRandom: clone(state.random.encountersItems),beforeGeneralRandom,afterGeneralRandom: clone(runtime.generalRandom),itemId: /** @type {import('../../contracts.js').ItemId} */ (itemId),item: clone(item) });
  }
}
