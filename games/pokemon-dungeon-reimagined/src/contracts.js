/**
 * Shared identities and command primitives; complete campaign types are re-exported below.
 * Persistent individuals, session actors and content keys are different types.
 * Brands exist only during static checking; serialized IDs remain strings.
 * @template {string} Kind
 * @typedef {string & { readonly __idKind: Kind }} Id
 */

/** @typedef {Id<'species'>} SpeciesId */
/** @typedef {Id<'form'>} FormId */
/** @typedef {Id<'pokemon'>} PokemonId */
/** @typedef {Id<'actor'>} ActorId */
/** @typedef {Id<'item-instance'>} ItemInstanceId */
/** @typedef {Id<'move-slot'>} MoveSlotId */
/** @typedef {Id<'session'>} SessionId */
/** @typedef {Id<'job'>} JobId */
/** @typedef {Id<'transaction'>} TransactionId */
/** @typedef {Id<'move'>} MoveId */
/** @typedef {Id<'item'>} ItemId */
/** @typedef {Id<'dungeon'>} DungeonId */
/** @typedef {Id<'scene'>} SceneId */
/** @typedef {Id<'friend-area'>} FriendAreaId */

/** @typedef {{[key: string]: JsonValue}} JsonObject */
/** @typedef {Array<JsonValue>} JsonArray */
/** @typedef {null | boolean | number | string | JsonArray | JsonObject} JsonValue */
/** @typedef {{readonly [key: string]: ReadonlyJson}} ReadonlyJsonObject */
/** @typedef {ReadonlyArray<ReadonlyJson>} ReadonlyJsonArray */
/** @typedef {null | boolean | number | string | ReadonlyJsonArray | ReadonlyJsonObject} ReadonlyJson */

/** @typedef {'pokemon' | 'actor' | 'move-slot' | 'item-instance' | 'session' | 'job' | 'transaction' | 'map' | 'room' | 'container' | 'trap' | 'exit' | 'scene-instance' | 'result' | 'shop' | 'shop-lot' | 'rescue-request' | 'imported-team'} InstanceKind */
/** @typedef {'species' | 'form' | 'move' | 'item' | 'dungeon' | 'scene' | 'friend-area' | 'section' | 'floor' | 'map-definition' | 'terrain' | 'trap-kind' | 'weather' | 'type' | 'ability' | 'iq-skill' | 'tactic' | 'story-node' | 'story-branch' | 'milestone' | 'grant' | 'scene-role' | 'scene-choice' | 'scene-option' | 'story-actor' | 'encounter' | 'policy' | 'effect-program' | 'item-variant'} CatalogKind */
/** @typedef {{readonly next: number}} IdSequence */
/** @typedef {-1 | 0 | 1} DirectionDelta */
/** @typedef {{readonly x: number, readonly z: number}} GridPosition */

/** Input shapes do not establish action costs, legality or scheduling.
 * @typedef {(
 * {readonly type: 'move' | 'face', readonly dx: DirectionDelta, readonly dz: DirectionDelta} |
 * {readonly type: 'attack', readonly targetId?: ActorId} |
 * {readonly type: 'wait'} |
 * {readonly type: 'useMove' | 'setMove', readonly actorId: ActorId, readonly moveSlotId: MoveSlotId} |
 * {readonly type: 'useStairs' | 'escape' | 'giveUp', readonly sessionId: SessionId} |
 * {readonly type: 'ackResult', readonly resultId: ResultId, readonly cursor: number, readonly revision: number} |
 * {readonly type: 'ackScene', readonly sceneId: SceneId, readonly cursor: number, readonly revision: number}
 * )} CoreCommand
 */

/** @typedef {'message' | 'actorMoved' | 'attackResolved' | 'conditionChanged' | 'itemChanged' | 'floorChanged' | 'sceneRequested' | 'objectiveChanged' | 'recruitOffered' | 'expeditionEnded' | 'rankChanged'} DomainEventType */
/** Event payloads belong to their producing systems; no persistent event log.
 * @typedef {{readonly eventId: number, readonly revision: number, readonly type: DomainEventType}} DomainEventEnvelope
 */
/**
 * @template {DomainEventEnvelope} Event
 * @typedef {(
 * {readonly accepted: true, readonly events: readonly Event[], readonly revision: number} |
 * {readonly accepted: false, readonly reason: string, readonly events: readonly [], readonly revision: number}
 * )} DispatchResult
 */

/** @typedef {readonly [number, number, number, number]} RandomWords */
/** @typedef {{readonly algorithm: 'xoshiro128ss-v1', readonly words: RandomWords, readonly draws: number}} RandomState */
/** @typedef {'layout' | 'encountersItems' | 'combatRecruitment'} DomainStreamName */
/** @typedef {{readonly layout: RandomState, readonly encountersItems: RandomState, readonly combatRecruitment: RandomState}} DomainRandomStreams */

export {};

/** @typedef {import('./contracts/campaign.js').MapId} MapId */
/** @typedef {import('./contracts/campaign.js').RoomId} RoomId */
/** @typedef {import('./contracts/campaign.js').ContainerId} ContainerId */
/** @typedef {import('./contracts/campaign.js').TrapId} TrapId */
/** @typedef {import('./contracts/campaign.js').ExitId} ExitId */
/** @typedef {import('./contracts/campaign.js').SceneInstanceId} SceneInstanceId */
/** @typedef {import('./contracts/campaign.js').ResultId} ResultId */
/** @typedef {import('./contracts/campaign.js').ShopId} ShopId */
/** @typedef {import('./contracts/campaign.js').ShopLotId} ShopLotId */
/** @typedef {import('./contracts/campaign.js').RescueRequestId} RescueRequestId */
/** @typedef {import('./contracts/campaign.js').ImportedTeamId} ImportedTeamId */
/** @typedef {import('./contracts/campaign.js').SectionId} SectionId */
/** @typedef {import('./contracts/campaign.js').FloorId} FloorId */
/** @typedef {import('./contracts/campaign.js').MapDefinitionId} MapDefinitionId */
/** @typedef {import('./contracts/campaign.js').TerrainId} TerrainId */
/** @typedef {import('./contracts/campaign.js').TrapKindId} TrapKindId */
/** @typedef {import('./contracts/campaign.js').WeatherId} WeatherId */
/** @typedef {import('./contracts/campaign.js').TypeId} TypeId */
/** @typedef {import('./contracts/campaign.js').AbilityId} AbilityId */
/** @typedef {import('./contracts/campaign.js').IqSkillId} IqSkillId */
/** @typedef {import('./contracts/campaign.js').TacticId} TacticId */
/** @typedef {import('./contracts/campaign.js').StoryNodeId} StoryNodeId */
/** @typedef {import('./contracts/campaign.js').StoryBranchId} StoryBranchId */
/** @typedef {import('./contracts/campaign.js').MilestoneId} MilestoneId */
/** @typedef {import('./contracts/campaign.js').GrantId} GrantId */
/** @typedef {import('./contracts/campaign.js').SceneRoleId} SceneRoleId */
/** @typedef {import('./contracts/campaign.js').SceneChoiceId} SceneChoiceId */
/** @typedef {import('./contracts/campaign.js').SceneOptionId} SceneOptionId */
/** @typedef {import('./contracts/campaign.js').StoryActorId} StoryActorId */
/** @typedef {import('./contracts/campaign.js').EncounterId} EncounterId */
/** @typedef {import('./contracts/campaign.js').PolicyId} PolicyId */
/** @typedef {import('./contracts/campaign.js').EffectProgramId} EffectProgramId */
/** @typedef {import('./contracts/campaign.js').ItemVariantId} ItemVariantId */
/** @typedef {import('./contracts/campaign.js').CampaignState} CampaignState */
/** @typedef {import('./contracts/campaign.js').CampaignSnapshot} CampaignSnapshot */
/** @typedef {import('./contracts/campaign.js').CampaignContent} CampaignContent */
/** @typedef {import('./contracts/campaign.js').CampaignValidation} CampaignValidation */
/** @typedef {import('./contracts/campaign.js').CampaignStatePolicies} CampaignStatePolicies */
/** @typedef {import('./contracts/campaign.js').CampaignOptions} CampaignOptions */
/** @typedef {import('./contracts/campaign.js').StateIssue} StateIssue */
/** @typedef {import('./contracts/campaign.js').RuleCheck} RuleCheck */
/** @typedef {import('./contracts/campaign.js').ValidationScope} ValidationScope */
/** @typedef {import('./contracts/campaign.js').ConfirmedNewGameInput} ConfirmedNewGameInput */
/** @typedef {import('./contracts/campaign.js').ConfirmedBlueSelection} ConfirmedBlueSelection */
/** @typedef {import('./contracts/campaign.js').CampaignRandomStreams} CampaignRandomStreams */
/** @typedef {import('./contracts/campaign.js').CommandContext} CommandContext */
/** @typedef {CoreCommand & CommandContext} DomainCommand */
/** @typedef {'layout'|'encountersItems'|'combatRecruitment'|'jobsRewards'} CampaignStreamName */
