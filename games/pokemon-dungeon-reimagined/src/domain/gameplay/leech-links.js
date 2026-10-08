/** Native source sprite invalidation on revival/removal also clears all links
 * to that actor. The retained historical faint record must not own a live seed.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts/campaign.js').SessionActor} actor */
export function clearLeechSeedLinks(context, actor) {
  for (const other of Object.values(context.state.session?.actors ?? {})) {
    const c = other.conditions.leechSeed;
    if (c?.statusId === 'leech-seed' && (other.actorId === actor.actorId || c.payload.kind === 'actor-link' && c.payload.actorId === actor.actorId)) {
      other.conditions.leechSeed = null;
      context.emit({ type: 'conditionChanged', actorId: other.actorId });
    }
  }
}
