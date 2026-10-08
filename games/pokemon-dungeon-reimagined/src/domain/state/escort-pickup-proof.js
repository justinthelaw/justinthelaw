import { escortDungeonRandomInteger } from '../escort-dungeon-rng.js';
import { nativeGeneralRandomRange } from '../native-general-rng.js';
import { nativePickupItem } from '../gameplay/escort-pickup.js';
import { ability } from '../gameplay/support.js';
import { fingerprint } from './relations.js';
/** Replay actual conditional category/item and thrown-quantity calls, preserve
 * whole canonical lots, and close this entry's general tail without phantom
 * consumption. Past browser stream positions remain explicitly saved source
 * witnesses, not invented reconstruction of historical DungeonRand bytes.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('../gameplay/support.js').Catalogs} catalogs @param {number} revision
 * @returns {string|null} */
export function escortPickupProblem(state,catalogs,revision) {
  const session = state.session,conversion = session?.entry.nativeEscort,runtime = state.escortRuntime;
  if (!session || !conversion || !runtime) return null;
  if (conversion.pickup.length > session.visitedFloorIds.length*4) return 'Floor Pickup exceeds the actual four-slot/source-floor traversal.';
  let general = conversion.result.generalRandom,lastFloor = -1,lastRank = -1,lastDungeon = null;
  const seen = new Set(),items = new Set();
  for (const receipt of conversion.pickup) {
    const actor = session.actors[receipt.actorId],floor = catalogs.dungeons.getFloorById(receipt.floorId),index = session.visitedFloorIds.indexOf(receipt.floorId);
    const rank = actor?.actorId === session.leaderActorId ? 0 : actor?.binding.kind === 'roster' && actor.binding.pokemonId === state.profile.partnerId ? 1 : receipt.slot+2;
    if (!actor || actor.affiliation !== 'team' || !ability(actor,catalogs,'Pickup') || actor.binding.kind === 'escort-guest' && receipt.slot !== session.escortGuest?.entry.slot || actor.binding.kind === 'roster' && session.entry.selectedPartyIds[receipt.slot] !== actor.binding.pokemonId || receipt.slot < 0 || receipt.slot >= 4 || floor.dungeonId !== session.dungeonId || index < 0 || index < lastFloor || index === lastFloor && rank <= lastRank || receipt.revision < session.entry.entryRevision || receipt.revision > revision || session.dungeonId === 'tiny-woods' || catalogs.navigation.fixed(catalogs.dungeons.getGeneration(floor.generationId).parameters.fixedRoomNumber).kind === 'floorwide' || fingerprint(receipt.beforeGeneralRandom) !== fingerprint(general) || seen.has(`${receipt.floorId}:${receipt.actorId}`)) return 'Pickup must belong to actual source ability/native spawn order/empty opportunity/floor/revision and unbroken general sequence.';
    if (receipt.floorId === ('address' in session.floor.location ? session.floor.location.address.floorId : null)) { if (receipt.mapId !== session.floor.mapId) return 'Current-floor Pickup must own the actual generated map.'; }
    if (index === lastFloor && fingerprint(receipt.beforeDungeonRandom) !== fingerprint(lastDungeon)) return 'Actual team floor Pickup calls form one uninterrupted saved dungeon sequence.';
    let dungeon = receipt.beforeDungeonRandom,itemId,quantity = 1;
    try {
      itemId = nativePickupItem(catalogs,floor.itemPoolIds.floor,upper => { const sample = escortDungeonRandomInteger(dungeon,upper); dungeon = sample.state; return sample.value; });
      if (fingerprint(dungeon) !== fingerprint(receipt.afterDungeonRandom) || itemId !== receipt.itemId) return 'Saved Pickup must retain the actual one/two source10000 samples and inclusive native item/category outcome.';
      if (itemId !== 'item-poke') {
        const source = catalogs.effects.getItem(itemId);
        if (source.category === 'thrown_line' || source.category === 'thrown_arc') {
          const range = source.spawnStackRange; if (!range || range[0] === undefined || range[1] === undefined) return 'Actual thrown Pickup needs its native quantity range.';
          const sample = nativeGeneralRandomRange(general,range[0],range[1]); quantity = sample.value; general = sample.state;
        }
      }
    } catch { return 'Invalid saved source floor Pickup RNG/item/quantity witness.'; }
    if (fingerprint(general) !== fingerprint(receipt.afterGeneralRandom)) return 'Only the actual thrown Pickup quantity may advance the retained general owner.';
    if (itemId === 'item-poke') { if (receipt.item !== null) return 'Poke fallback cannot manufacture a held lot or quantity draw.'; }
    else {
      const item = receipt.item;
      if (!item || item.quantity !== quantity || item.shopLotId !== null || fingerprint(item.template) !== fingerprint({ itemId,sticky: false,payload: { kind: 'none' } }) || items.has(item.itemInstanceId)) return 'Actual Pickup owns one unique complete clean canonical native lot, including otherwise inert Gummi/orb possession.';
      items.add(item.itemInstanceId);
    }
    seen.add(`${receipt.floorId}:${receipt.actorId}`); lastFloor = index; lastRank = rank; lastDungeon = receipt.afterDungeonRandom;
  }
  if (fingerprint(general) !== fingerprint(runtime.generalRandom)) return 'The exact new entry/Pickup general tail cannot contain unsupported phantom transitions.';
  const guest = session.escortGuest;
  if (guest) {
    const own = conversion.pickup.filter(row => row.actorId === guest.entry.actorId),firstLot = own.find(row => row.item !== null),actor = session.actors[guest.entry.actorId],held = actor ? state.containers[actor.heldContainerId] : null;
    if (firstLot && own.some(row => row !== firstLot && session.visitedFloorIds.indexOf(row.floorId) > session.visitedFloorIds.indexOf(firstLot.floorId))) return 'A client carrying its real Pickup lot cannot draw again on later floors.';
    if (guest.lifecycle.kind === 'live') {
      if (fingerprint(held?.itemIds) !== fingerprint(firstLot?.item ? [firstLot.item.itemInstanceId] : []) || firstLot?.item && fingerprint(state.items[firstLot.item.itemInstanceId]) !== fingerprint(firstLot.item)) return 'Live client retains its exact generated Pickup lot; catch/ground/held transfer cannot invent another source.';
      if (actor && ability(actor,catalogs,'Pickup')) for (const floorId of session.visitedFloorIds) {
        const floor = catalogs.dungeons.getFloorById(floorId),fixed = catalogs.navigation.fixed(catalogs.dungeons.getGeneration(floor.generationId).parameters.fixedRoomNumber).kind === 'floorwide';
        if (session.dungeonId !== 'tiny-woods' && !fixed && (!firstLot || session.visitedFloorIds.indexOf(floorId) <= session.visitedFloorIds.indexOf(firstLot.floorId)) && !seen.has(`${floorId}:${guest.entry.actorId}`)) return 'Every genuinely empty client floor entry needs its actual ability Pickup call, including Poke outcomes.';
      }
    }
  }
  return null;
}
