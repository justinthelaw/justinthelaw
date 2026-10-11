/** Finite source domain for the original pair, surviving Magnemite and all
 * positive-weight Sinister wild/fixed identities. Source/data audit rederives
 * every member and native ability from the qualified immutable catalogs. */
export const SINISTER_ABILITY_DOMAIN_FACTS = Object.freeze({
  id: 'sinister-original-source-ability-domain-v1',
  qualification: 'qualified-blue-profiles-and-pinned-red-comparative-floor-facts',
  starterProfiles: Object.freeze(['pokemon-001','pokemon-004','pokemon-007','pokemon-025','pokemon-052','pokemon-054','pokemon-066','pokemon-104','pokemon-133','pokemon-152','pokemon-155','pokemon-158','pokemon-252','pokemon-255','pokemon-258','pokemon-300']),
  giftProfile: 'pokemon-081',
  wildProfiles: Object.freeze(['pokemon-043','pokemon-103','pokemon-123','pokemon-161','pokemon-163','pokemon-165','pokemon-185','pokemon-192','pokemon-194','pokemon-220','pokemon-264','pokemon-266','pokemon-268','pokemon-285','pokemon-287']),
  bossProfiles: Object.freeze(['pokemon-023','pokemon-094','pokemon-308']),
  boss: Object.freeze({
    id: 'campaign-boss-sinister-woods-team-meanies',
    floorId: 'sinister-woods-floor-13',
    fixedRoomId: 'sinister-woods-team-meanies-floor',
    firstSceneId: 'campaign-scene-cutscene-sinister-woods-attempt1',
    retrySceneId: 'campaign-scene-cutscene-sinister-woods-attempt2',
    revisitSceneId: 'campaign-scene-cutscene-sinister-woods-poststory',
    reachedFlagId: 'campaign-flag-cutscene-flag-sinister-woods-reached',
    completeFlagId: 'campaign-flag-cutscene-flag-sinister-woods-complete',
  }),
  nativeAbilityIds: Object.freeze([6,7,13,16,17,21,23,26,30,32,33,36,41,42,43,45,47,50,54,55,61,67,68,70,71,74,75]),
  excludedZeroWeightNativeSpeciesIds: Object.freeze([380,421]),
  synchronizeNativeAbilityId: 25,
});
