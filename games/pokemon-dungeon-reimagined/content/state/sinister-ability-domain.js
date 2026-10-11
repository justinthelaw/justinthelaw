import { SINISTER_ABILITY_DOMAIN_FACTS as FACTS } from '../authored/sinister-ability-domain-facts.js';
import { SINISTER_WORK_REVISION } from '../../src/domain/state/sinister-work-revision.js';
import { checkSinisterRosterDomain } from './sinister-roster-domain.js';
import { diagnostics, sameForm } from './pokemon-rules.js';
import { steelAppend as append } from './steel-progress.js';
/** No ability or identity-changing effect belongs to this scoped source domain.
 * Complete successor admission still independently proves each actual cache,
 * allocation, actor, history, resource and native PC before using this fact.
 * @typedef {import('../../src/contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('./campaign.js').CampaignCatalogs} Catalogs */
/** This conditional domain excludes Synchronize propagation, not contact
 * reactions: Static, Cute Charm and Effect Spore remain real source abilities.
 * It neither silences those effects nor certifies a final composed event bound.
 * @param {Snapshot} state @param {Catalogs} catalogs */
export function checkSinisterAbilityDomain(state,catalogs) {
  const r = diagnostics();
  append(r,checkSinisterRosterDomain(state,catalogs));
  r.check(state.contentRevision === SINISTER_WORK_REVISION,'/contentRevision','Only the actual Sinister source successor may use this finite effective-ability domain.');
  const synchronize = catalogs.species.identities.abilities.find(row => row.name === 'Synchronize');
  r.check(synchronize?.originalId === FACTS.synchronizeNativeAbilityId && !FACTS.nativeAbilityIds.includes(FACTS.synchronizeNativeAbilityId),'/abilities','The source ability crosswalk and complete scoped native ability union exclude Synchronize.');
  for (const record of Object.values(state.roster)) {
    const profile = catalogs.species.getProfile(record.identity.speciesId,record.identity.formId);
    r.check(record.identity.formId === null && (FACTS.starterProfiles.includes(profile.id) || profile.id === FACTS.giftProfile) && profile.abilityIds.every(id => id === null || FACTS.nativeAbilityIds.includes(id)),'/roster','Every permanent individual retains an exact original-domain profile and sourced dual abilities.');
  }
  const session = state.session;
  if (!session) return r.result();
  r.check(session.dungeonId === 'sinister-woods' && session.purpose.kind === 'story' && !session.escortGuest,'/session','This finite bound applies only to the actual nonguest Sinister story expedition.');
  const boss = catalogs.campaign.getBoss(FACTS.boss.id),bossFloor = catalogs.dungeons.getFloorById(FACTS.boss.floorId);
  r.check(boss.id === FACTS.boss.id && bossFloor.dungeonId === 'sinister-woods' && bossFloor.localFloor === 13 && bossFloor.fixedRoomId === boss.fixedRoomId && (/** @type {const} */ (['fixedRoomId','firstSceneId','retrySceneId','revisitSceneId','reachedFlagId','completeFlagId'])).every(key => boss[key] === FACTS.boss[key]),'/session/actors/binding','The fixed hostile source is the exact canonical Team Meanies boss, floor and first/retry/revisit/flag metadata.');
  for (const actor of Object.values(session.actors)) {
    const profile = catalogs.species.getProfile(actor.identity.speciesId,actor.identity.formId);
    r.check(actor.identity.formId === null && actor.overrides.types === null && actor.overrides.abilities === null && actor.overrides.form === null && !Object.values(actor.conditions).some(condition => condition?.statusId === 'transformed'),'/session/actors','Effective species, types and abilities retain the sourced untransformed profile; generated Hidden Power has its separate actual construction owner.');
    r.check(profile.abilityIds.every(id => id === null || FACTS.nativeAbilityIds.includes(id)) && !profile.abilityIds.includes(FACTS.synchronizeNativeAbilityId),'/session/actors/abilities','Every actual actor retains only the complete finite sourced ability universe.');
    if (actor.binding.kind === 'roster') {
      const record = state.roster[actor.binding.pokemonId];
      r.check(actor.affiliation === 'team' && record && state.selectedPartyIds.includes(record.pokemonId) && sameForm(actor.identity,record.identity),'/session/actors/binding','A team generation must remain its actual selected original roster individual.');
    } else if (actor.binding.kind === 'wild') {
      r.check(actor.affiliation === 'hostile' && FACTS.wildProfiles.includes(profile.id),'/session/actors/binding','Ordinary wild generations remain the complete fifteen positive-weight Sinister species.');
    } else if (actor.binding.kind === 'boss') {
      r.check(actor.affiliation === 'hostile' && actor.binding.encounterId === boss.id && FACTS.bossProfiles.includes(profile.id),'/session/actors/binding','Fixed hostile generations remain the canonical Team Meanies encounter and its real three source identities.');
    } else r.check(false,'/session/actors/binding','No unrelated guest, client or other actor source may borrow this finite ability bound.');
  }
  return r.result();
}
