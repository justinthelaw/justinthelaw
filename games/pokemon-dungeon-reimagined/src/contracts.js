/**
 * Shared P07-A primitives only. This is not a complete campaign/save schema.
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

/** @typedef {'pokemon' | 'actor' | 'item-instance' | 'move-slot' | 'session' | 'job' | 'transaction'} InstanceKind */
/** @typedef {'species' | 'form' | 'move' | 'item' | 'dungeon' | 'scene' | 'friend-area'} CatalogKind */
/** @typedef {{readonly next: number}} IdSequence */
/** @typedef {-1 | 0 | 1} DirectionDelta */
/** @typedef {{readonly x: number, readonly z: number}} GridPosition */

/** Input shapes do not establish action costs, legality or scheduling.
 * @typedef {(
 * {readonly type: 'move' | 'face', readonly dx: DirectionDelta, readonly dz: DirectionDelta} |
 * {readonly type: 'attack', readonly targetId?: ActorId} |
 * {readonly type: 'wait'} |
 * {readonly type: 'useMove', readonly actorId: ActorId, readonly moveSlotId: MoveSlotId} |
 * {readonly type: 'useStairs' | 'escape' | 'giveUp', readonly sessionId: SessionId} |
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
