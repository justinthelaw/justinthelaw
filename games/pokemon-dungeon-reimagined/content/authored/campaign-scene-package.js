/**
 * Unselected authored scene graph. These types add no canonical state/schema.
 * Native conditions are requirements for a future proven caller, never fallback
 * values or executable script commands. A terminal stage hands back to its exact
 * caller; scene acknowledgment alone cannot perform the listed return owner.
 *
 * @typedef {{role:string,x:number,z:number,facing:'n'|'s',pose:'idle'|'wake'|'withdraw'|'relieved'|'fallen'|'hover'|'nervous',actorSource:'authenticated-session'|'profile'|'ground-role'}} CampaignScenePlacement
 * @typedef {{id:string,label:string,next:string}} CampaignSceneChoice
 * @typedef {{id:string,text:string,placements:CampaignScenePlacement[],cue:'dialogue'|'lightning',reducedMotion:'same-pose'|'static-lighting',next:string|null,choices:CampaignSceneChoice[]}} CampaignSceneStage
 * @typedef {{owner:string,mainChapter:number|null,mainStepMinimum:number|null,mainStepMaximum:number|null,requiredReceipts:string[]}} CampaignSceneEntry
 * @typedef {{id:string,mapId:string,sourceId:string,entry:CampaignSceneEntry,repeat:string,returnOwner:string,firstStage:string,stages:CampaignSceneStage[]}} CampaignSceneDefinition
 * @typedef {{schemaVersion:1,activation:'unselected',edition:'blue-rescue-team',comparison:{edition:'red-rescue-team',commit:string,instructionParity:false},stagingId:string,resourceMutation:'caller-owned-only',campaignEnding:false,packageId:string,catalogRefs:string[],scenes:CampaignSceneDefinition[]}} CampaignScenePackage
 * @typedef {{id:string,biome:string,width:number,height:number,tiles:string[],legend:{'#':'wall','.':'walkable','~':'chasm'},geometry:'original-browser-staging',navigation:'scene-only'}} CampaignSceneField
 * @typedef {{id:string,roles:{id:string,speciesId:string|null,binding:'profile-hero'|'profile-partner'|'story-only'}[],fields:CampaignSceneField[],existingGround:{id:string,sourceModule:string,exportName:string,mapKey:string}[]}} CampaignSceneStaging
 */

/** Original authored blocking fields. Scene actors are presentation roles;
 * combat identities/positions remain in the authenticated session. The 13×13
 * arena honors the source room dimensions without reproducing native geometry.
 * Selected roster members/held items are never cleared by ground staging.
 * @type {CampaignSceneStaging} */
export const CAMPAIGN_SCENE_STAGING = {
  "id": "browser-early-campaign-staging-v1",
  "roles": [
    {"id": "hero", "speciesId": null, "binding": "profile-hero"},
    {"id": "partner", "speciesId": null, "binding": "profile-partner"},
    {"id": "gengar", "speciesId": "pokemon-094", "binding": "story-only"},
    {"id": "ekans", "speciesId": "pokemon-023", "binding": "story-only"},
    {"id": "medicham", "speciesId": "pokemon-308", "binding": "story-only"},
    {"id": "metapod", "speciesId": "pokemon-011", "binding": "story-only"},
    {"id": "caterpie", "speciesId": "pokemon-010", "binding": "story-only"},
    {"id": "jumpluff-requester", "speciesId": "pokemon-189", "binding": "story-only"},
    {"id": "jumpluff-rescued", "speciesId": "pokemon-189", "binding": "story-only"},
    {"id": "shiftry", "speciesId": "pokemon-275", "binding": "story-only"},
    {"id": "zapdos", "speciesId": "pokemon-145", "binding": "story-only"},
    {"id": "alakazam", "speciesId": "pokemon-065", "binding": "story-only"},
    {"id": "charizard", "speciesId": "pokemon-006", "binding": "story-only"},
    {"id": "tyranitar", "speciesId": "pokemon-248", "binding": "story-only"}
  ],
  "fields": [
    {
      "id": "browser-sinister-entry",
      "biome": "forest",
      "width": 13,
      "height": 11,
      "tiles": ["#############", "#...........#", "###.........#", "#...........#", "#...........#", "#...........#", "###.........#", "#.........###", "#...........#", "#...........#", "#############"],
      "legend": {"#": "wall", ".": "walkable", "~": "chasm"},
      "geometry": "original-browser-staging",
      "navigation": "scene-only"
    },
    {
      "id": "browser-sinister-arena",
      "biome": "forest",
      "width": 13,
      "height": 13,
      "tiles": ["#############", "#...........#", "###.........#", "#...........#", "#...........#", "#...........#", "###.........#", "#.........###", "#...........#", "#...........#", "#...........#", "#...........#", "#############"],
      "legend": {"#": "wall", ".": "walkable", "~": "chasm"},
      "geometry": "original-browser-staging",
      "navigation": "scene-only"
    },
    {
      "id": "browser-sinister-rescue",
      "biome": "forest",
      "width": 13,
      "height": 11,
      "tiles": ["#############", "#...........#", "###.........#", "#...........#", "#...........#", "#...........#", "###.........#", "#.........###", "#...........#", "#...........#", "#############"],
      "legend": {"#": "wall", ".": "walkable", "~": "chasm"},
      "geometry": "original-browser-staging",
      "navigation": "scene-only"
    },
    {
      "id": "browser-silent-cliff",
      "biome": "cliff",
      "width": 15,
      "height": 13,
      "tiles": ["###############", "#.............#", "#.............#", "#..........~~~#", "#..........~~~#", "#.............#", "#.............#", "#.............#", "#.............#", "#.............#", "#.............#", "#.............#", "###############"],
      "legend": {"#": "wall", ".": "walkable", "~": "chasm"},
      "geometry": "original-browser-staging",
      "navigation": "scene-only"
    },
    {
      "id": "browser-silent-depths",
      "biome": "canyon",
      "width": 15,
      "height": 13,
      "tiles": ["###############", "#.............#", "#.#...........#", "#.#...........#", "#.............#", "#.............#", "#.............#", "#.............#", "#...........#.#", "#...........#.#", "#..#..........#", "#.............#", "###############"],
      "legend": {"#": "wall", ".": "walkable", "~": "chasm"},
      "geometry": "original-browser-staging",
      "navigation": "scene-only"
    }
  ],
  "existingGround": [
    {"id": "browser-team-base-exterior", "sourceModule": "./team-formation.js", "exportName": "TEAM", "mapKey": "map"},
    {"id": "browser-team-base-interior", "sourceModule": "./first-morning.js", "exportName": "MORNING", "mapKey": "interior"},
    {"id": "browser-pokemon-square", "sourceModule": "./town.js", "exportName": "TOWN", "mapKey": "square"}
  ]
};
