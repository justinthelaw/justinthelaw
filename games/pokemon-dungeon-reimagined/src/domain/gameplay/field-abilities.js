import { activeActors } from './move-targets.js';
import { ability } from './support.js';
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** Native engine refresh chooses the LAST live activePokemon with Lightningrod
 * at the base-speed prephase, after spawn. It is a cached reference, not a new
 * search per electric attack. Actor IDs cannot alias a reused native slot.
 * @param {import('../../contracts/campaign.js').CampaignState} state @param {Catalogs} catalogs */
export function refreshFieldAbilities(state, catalogs) {
  const session = state.session;
  state.moveState = session ? { sessionId: session.sessionId, mapId: session.floor.mapId, lightningRodActorId: activeActors(session).filter(actor => ability(actor, catalogs, 'Lightningrod')).at(-1)?.actorId ?? null } : null;
}
/** @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('../../contracts/campaign.js').SessionActor} user
 * @param {import('../../contracts/campaign.js').SessionActor} target */
export function lightningRodTarget(state, user, target) {
  const session = state.session, field = state.moveState;
  if (!session || !field || field.sessionId !== session.sessionId || field.mapId !== session.floor.mapId || !field.lightningRodActorId) return { target, redirected: false };
  const rod = session.actors[field.lightningRodActorId];
  // All admitted combat actors have ordinary elevation; clients are ignored by
  // the native treatment owner, and an allied cached rod does not redirect.
  return rod?.placement.kind === 'map' && rod.resources.hp > 0 && rod.affiliation !== 'neutral' && user.affiliation !== 'neutral' && rod.affiliation !== user.affiliation ? { target: rod, redirected: true } : { target, redirected: false };
}
