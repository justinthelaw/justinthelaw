import { loadSpeciesCatalog } from '../../content/species.js';
import { loadOnboardingCatalog } from '../../content/onboarding.js';
import { loadDungeonCatalog } from '../../content/dungeons.js';
import { loadEffectCatalog } from '../../content/effects.js';
import { loadCampaignCatalog } from '../../content/campaign.js';
import { loadNavigationCatalog } from '../../content/navigation.js';
import { EFFECT_INDEX_SHA256 } from '../../content/effects-integrity.js';
import { readLocalBytes, sha256 } from '../rendering/assets.js';

/** Only unknown identity is absence; loader/disposal failures stay visible.
 * @param {()=>unknown} lookup */
function contains(lookup) { try { lookup(); return true; } catch (error) { if (error instanceof RangeError) return false; throw error; } }

/** Dependency-ordered local catalogs. The independent item namespace is read
 * from the authenticated effect item shards before either consuming loader.
 * @param {AbortSignal} signal @param {(message:string)=>void} status */
export async function loadCatalogs(signal, status) {
  /** @type {(()=>void)[]} */ const cleanup = [];
  try {
    status('Loading species and onboarding…');
    const species = await loadSpeciesCatalog({ signal }); cleanup.push(() => species.dispose());
    const onboarding = await loadOnboardingCatalog({ signal }); cleanup.push(() => onboarding.dispose());
    const base = new URL('../../content/effects/', import.meta.url);
    const bytes = await readLocalBytes(new URL('index.json', base), 1048576, signal);
    if (await sha256(bytes) !== EFFECT_INDEX_SHA256) throw new Error('Effect index integrity mismatch.');
    /** @type {{resources:{file:string,sha256:string}[]}} */ const index = JSON.parse(new TextDecoder().decode(bytes));
    const items = new Set();
    for (const resource of index.resources.filter(row => /^items-[0-9]{2}\.json$/.test(row.file))) {
      const itemBytes = await readLocalBytes(new URL(resource.file, base), 1048576, signal);
      if (await sha256(itemBytes) !== resource.sha256) throw new Error('Item identity integrity mismatch.');
      /** @type {{records:{id:string}[]}} */ const identities = JSON.parse(new TextDecoder().decode(itemBytes));
      for (const row of identities.records) items.add(row.id);
    }
    if (items.size !== 240) throw new Error('Incomplete original item identity namespace.');
    const moves = new Set(species.identities.moves.map(row => row.id));
    const isItemId = (/** @type {string} */ id) => items.has(id);
    const isSpeciesForm = (/** @type {string} */ id, /** @type {string|null} */ form) => contains(() => species.getProfile(id, form)) && species.getProfile(id, form).formId === form;
    /** @type {typeof fetch} */ const fetchResource = (url, options) => fetch(url, { ...options, redirect: 'error', credentials: 'same-origin', signal: options?.signal ? AbortSignal.any([signal, options.signal]) : signal });
    status('Loading dungeon rules and actions…');
    const dungeons = await loadDungeonCatalog({ isSpeciesForm, isItemId, fetchResource });
    const effects = await loadEffectCatalog({ isSpeciesForm, isItemId, isMoveId: id => moves.has(id), signal, fetchResource }); cleanup.push(() => effects.dispose());
    const navigation = await loadNavigationCatalog({ isSpeciesForm, isItemId }, { signal }); cleanup.push(() => navigation.dispose());
    const campaign = await loadCampaignCatalog({ isSpeciesForm, isItemId,
      isDungeonId: id => contains(() => dungeons.getDungeon(id)),
      isSection: (id, section) => contains(() => dungeons.getSection(section)) && dungeons.getSection(section).dungeonId === id,
      isFixedRoomId: id => contains(() => dungeons.getFixedRoom(id)),
      isFriendAreaId: id => species.identities.friendAreas.some(area => area.id === id),
    }, { signal }); cleanup.push(() => campaign.dispose());
    signal.throwIfAborted();
    return { catalogs: { species, onboarding, dungeons, effects, navigation, campaign }, dispose: () => cleanup.reverse().forEach(dispose => dispose()) };
  } catch (error) { cleanup.reverse().forEach(dispose => dispose()); throw error; }
}
