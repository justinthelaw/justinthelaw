import { IQ_SKILLS, TACTICS } from './pokemon-rules.js';

/** @typedef {import('../../src/contracts.js').CatalogKind} CatalogKind */
/** @typedef {import('../../src/contracts/campaign.js').RuleCheck} RuleCheck */
/** @typedef {import('../species.js').SpeciesCatalog} SpeciesCatalog */
/** @typedef {Awaited<ReturnType<typeof import('../dungeons.js').loadDungeonCatalog>>} DungeonCatalog */
/** @typedef {Awaited<ReturnType<typeof import('../effects.js').loadEffectCatalog>>} EffectCatalog */

/** Only an absent catalog row is a negative membership result. Disposal and
 * other failures must propagate, so callers cannot mistake unavailable data
 * for an invalid save identity.
 * @param {()=>unknown} lookup @returns {boolean}
 */
function contains(lookup) {
  try { lookup(); return true; }
  catch (error) { if (error instanceof RangeError) return false; throw error; }
}

/** @param {string} message @returns {RuleCheck} */
function invalid(message) {
  return { ok: false, kind: 'invalid', issues: [{ code: 'relationship', path: '', message }] };
}

/** These joins establish catalog identity only, never availability or behavior.
 * Unsupported namespaces throw instead of treating every ID as absent or valid.
 * @param {{species:SpeciesCatalog,dungeons:DungeonCatalog,effects:EffectCatalog}} catalogs
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignIdentityLookup>}
 */
export function createCatalogIdentityJoins({ species, dungeons, effects }) {
  return Object.freeze({
    /** @param {CatalogKind} kind @param {string} id */
    has(kind, id) {
      switch (kind) {
        case 'iq-skill': return IQ_SKILLS.some(row => row.id === id);
        case 'tactic': return TACTICS.some(row => row.id === id);
        case 'species': return contains(() => species.getSpecies(id));
        case 'form': {
          if (!contains(() => species.getProfileById(id))) return false;
          return species.getProfileById(id).formId === id;
        }
        case 'move': return contains(() => effects.getMove(id));
        case 'item': return contains(() => effects.getItem(id));
        case 'dungeon': return contains(() => dungeons.getDungeon(id));
        case 'section': return contains(() => dungeons.getSection(id));
        case 'floor': return contains(() => dungeons.getFloorById(id));
        case 'friend-area':
          // Access a live method before using the catalog's retained frozen list.
          species.getSpecies('pokemon-001');
          return species.identities.friendAreas.some(row => row.id === id);
        case 'ability':
          species.getSpecies('pokemon-001');
          return species.identities.abilities.some(row => row.id === id);
        default: throw new Error(`Unresolved campaign identity namespace: ${kind}`);
      }
    },
    /** @param {import('../../src/contracts/campaign.js').SpeciesForm} identity
     * @param {'persistent'|'session'} context @returns {RuleCheck} */
    permitsForm(identity, context) {
      if (context !== 'persistent' && context !== 'session') return invalid('Unknown species/form context.');
      if (!contains(() => species.getProfile(identity.speciesId, identity.formId))) return invalid('Species/form pair is absent from the species catalog.');
      const profile = species.getProfile(identity.speciesId, identity.formId);
      // A default profile lookup is not permission to omit its explicit form.
      if (profile.formId !== identity.formId) return invalid('Species requires its explicit canonical form identity.');
      if (context === 'persistent' && profile.persistence !== 'persistent') return invalid('Temporary form cannot be stored as a persistent species identity.');
      return { ok: true };
    },
    /** @param {import('../../src/contracts/campaign.js').FloorAddress} address @returns {RuleCheck} */
    permitsFloor(address) {
      if (!contains(() => dungeons.getDungeon(address.dungeonId)) || !contains(() => dungeons.getSection(address.sectionId)) || !contains(() => dungeons.getFloorById(address.floorId))) return invalid('Floor address contains an unknown catalog identity.');
      const dungeon = dungeons.getDungeon(address.dungeonId);
      const section = dungeons.getSection(address.sectionId);
      const floor = dungeons.getFloorById(address.floorId);
      return section.dungeonId === dungeon.id && dungeon.sectionIds.includes(section.id) && floor.dungeonId === dungeon.id && floor.sectionId === section.id && section.variants.some(variant => variant.floorIds.includes(floor.id))
        ? { ok: true } : invalid('Floor, section and dungeon do not form a catalog relationship.');
    },
    /** @param {import('../../src/contracts.js').DungeonId} dungeonId
     * @param {import('../../src/contracts/campaign.js').SectionId} sectionId @returns {RuleCheck} */
    permitsSection(dungeonId, sectionId) {
      if (!contains(() => dungeons.getDungeon(dungeonId)) || !contains(() => dungeons.getSection(sectionId))) return invalid('Section address contains an unknown catalog identity.');
      return dungeons.getSection(sectionId).dungeonId === dungeonId && dungeons.getDungeon(dungeonId).sectionIds.includes(sectionId)
        ? { ok: true } : invalid('Section does not belong to this dungeon.');
    },
  });
}
