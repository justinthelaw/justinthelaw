/** Complete canonical campaign records. See plan/CAMPAIGN-STATE.md. */
/** @typedef {import('../contracts.js').SpeciesId} SpeciesId */
/** @typedef {import('../contracts.js').FormId} FormId */
/** @typedef {import('../contracts.js').PokemonId} PokemonId */
/** @typedef {import('../contracts.js').ActorId} ActorId */
/** @typedef {import('../contracts.js').MoveSlotId} MoveSlotId */
/** @typedef {import('../contracts.js').ItemInstanceId} ItemInstanceId */
/** @typedef {import('../contracts.js').SessionId} SessionId */
/** @typedef {import('../contracts.js').JobId} JobId */
/** @typedef {import('../contracts.js').TransactionId} TransactionId */
/** @typedef {import('../contracts.js').MoveId} MoveId */
/** @typedef {import('../contracts.js').ItemId} ItemId */
/** @typedef {import('../contracts.js').DungeonId} DungeonId */
/** @typedef {import('../contracts.js').SceneId} SceneId */
/** @typedef {import('../contracts.js').FriendAreaId} FriendAreaId */
/** @typedef {import('../contracts.js').IdSequence} IdSequence */
/** @typedef {import('../contracts.js').RandomState} RandomState */
/** @typedef {import('../contracts.js').RandomWords} RandomWords */
/** @typedef {import('../contracts.js').CatalogKind} CatalogKind */
/** @typedef {import('../contracts.js').CoreCommand} CoreCommand */
/** @typedef {import('../contracts.js').DomainEventEnvelope} DomainEventEnvelope */
/** @template {string} K @typedef {import('../contracts.js').Id<K>} Id */

/** @typedef {Id<'map'>} MapId */

/** @typedef {Id<'room'>} RoomId */

/** @typedef {Id<'container'>} ContainerId */

/** @typedef {Id<'trap'>} TrapId */

/** @typedef {Id<'exit'>} ExitId */

/** @typedef {Id<'scene-instance'>} SceneInstanceId */

/** @typedef {Id<'result'>} ResultId */

/** @typedef {Id<'shop'>} ShopId */

/** @typedef {Id<'shop-lot'>} ShopLotId */

/** @typedef {Id<'rescue-request'>} RescueRequestId */

/** @typedef {Id<'imported-team'>} ImportedTeamId */

/** @typedef {Id<'section'>} SectionId */

/** @typedef {Id<'floor'>} FloorId */

/** @typedef {Id<'map-definition'>} MapDefinitionId */

/** @typedef {Id<'terrain'>} TerrainId */

/** @typedef {Id<'trap-kind'>} TrapKindId */

/** @typedef {Id<'weather'>} WeatherId */

/** @typedef {Id<'type'>} TypeId */

/** @typedef {Id<'ability'>} AbilityId */

/** @typedef {Id<'iq-skill'>} IqSkillId */

/** @typedef {Id<'tactic'>} TacticId */

/** @typedef {Id<'story-node'>} StoryNodeId */

/** @typedef {Id<'story-branch'>} StoryBranchId */

/** @typedef {Id<'milestone'>} MilestoneId */

/** @typedef {Id<'grant'>} GrantId */

/** @typedef {Id<'scene-role'>} SceneRoleId */

/** @typedef {Id<'scene-choice'>} SceneChoiceId */

/** @typedef {Id<'scene-option'>} SceneOptionId */

/** @typedef {Id<'story-actor'>} StoryActorId */

/** @typedef {Id<'encounter'>} EncounterId */

/** @typedef {Id<'policy'>} PolicyId */

/** @typedef {Id<'effect-program'>} EffectProgramId */

/** @typedef {Id<'item-variant'>} ItemVariantId */

/** @typedef {string} ContentRevision */

/** @typedef {number} Int */

/** @typedef {{ numerator: Int; denominator: Int; }} Quantity */

/** @typedef {{ x: Int; z: Int; }} GridPosition */

/** @typedef {'n'|'ne'|'e'|'se'|'s'|'sw'|'w'|'nw'} Facing */

/** @typedef {{ hp: Int; attack: Int; defense: Int; specialAttack: Int; specialDefense: Int; }} StatBlock */

/** @typedef {keyof StatBlock} StatId */

/** @typedef {{ speciesId: SpeciesId; formId: FormId|null; }} SpeciesForm */

/** @typedef {{ dungeonId: DungeonId; sectionId: SectionId; floorId: FloorId; }} FloorAddress */

/** @typedef {{ sessionId: SessionId; mapId: MapId; actorId: ActorId; identity: SpeciesForm; }} HistoricalActorRef */

/** @typedef {{ layout: RandomState; encountersItems: RandomState; combatRecruitment: RandomState; jobsRewards: RandomState; }} CampaignRandomStreams */

/**
 * @typedef {{
 *     referenceEdition: 'blue-rescue-team';
 *     heroId: PokemonId;
 *     partnerId: PokemonId;
 *     originalHeroIdentity: SpeciesForm;
 *     originalPartnerIdentity: SpeciesForm;
 *     teamName: string;
 *     createdAt: string;
 *     selection: {
 *         quizRevision: string;
 *         outcomeId: string;
 *     };
 * }} CampaignProfile
 */

/**
 * @typedef {{
 *     audio: {
 *         master: number;
 *         music: number;
 *         effects: number;
 *         muted: boolean;
 *     };
 *     reducedMotion: 'system' | 'on' | 'off';
 *     camera: {
 *         invertOrbitX: boolean;
 *         invertOrbitY: boolean;
 *         sensitivity: number;
 *         zoom: number;
 *     };
 *     controls: {
 *         overlay: 'auto' | 'shown' | 'hidden';
 *     };
 *     map: {
 *         showExplored: boolean;
 *         showMoveRange: boolean;
 *     };
 *     accessibility: {
 *         textScale: number;
 *         highContrast: boolean;
 *         colorIndependentIndicators: boolean;
 *     };
 * }} CampaignOptions
 */

/** @typedef {{ moveSlotId: MoveSlotId; moveId: MoveId; enabled: boolean; powerBoost: Int; ppCapacityBonus: Int; }} MoveSlot */

/** @typedef {[MoveSlot|null, MoveSlot|null, MoveSlot|null, MoveSlot|null]} FourMoves */

/** @typedef {{ slots: FourMoves; links: MoveSlotId[][]; setMoveSlotId: MoveSlotId|null; }} MoveSet */

/** @typedef {{ level: Int; totalExperience: Quantity; naturalStats: StatBlock; permanentStatBonuses: StatBlock; iqPoints: Int; }} PokemonGrowth */

/**
 * @typedef {{
 *     kind: 'starter';
 *     role: 'hero' | 'partner';
 *     selectionOutcomeId: string;
 * } | {
 *     kind: 'recruited';
 *     location: FloorAddress;
 *     metLevel: Int;
 *     sessionId: SessionId;
 *     actor: HistoricalActorRef;
 * } | {
 *     kind: 'scripted';
 *     grantId: GrantId;
 *     metLevel: Int;
 * } | {
 *     kind: 'evolution-extra';
 *     sourcePokemonId: PokemonId;
 *     evolutionPolicyId: PolicyId;
 *     createdRevision: Int;
 * }} PokemonOrigin
 */

/**
 * @typedef {{
 *     pokemonId: PokemonId;
 *     identity: SpeciesForm;
 *     nickname: string;
 *     growth: PokemonGrowth;
 *     moves: MoveSet;
 *     enabledIqSkillIds: IqSkillId[];
 *     tacticId: TacticId;
 *     friendAreaId: FriendAreaId;
 *     heldContainerId: ContainerId;
 *     origin: PokemonOrigin;
 *     evolutionHistory: {
 *         from: SpeciesForm;
 *         to: SpeciesForm;
 *         level: Int;
 *         policyId: PolicyId;
 *     }[];
 * }} PokemonRecord
 */

/**
 * @typedef {{
 *     schemaVersion: 1;
 *     speciesSeen?: SpeciesSeenHistory;
 *     earlyWork?: import('./early-work.js').EarlyWorkState|null;
 *     contentRevision: ContentRevision;
 *     revision: Int;
 *     idSequence: IdSequence;
 *     random: CampaignRandomStreams;
 *     profile: CampaignProfile;
 *     roster: Record<string, PokemonRecord>;
 *     selectedPartyIds: PokemonId[];
 *     items: Record<string, ItemInstance>;
 *     containers: Record<string, ItemContainer>;
 *     economy: EconomyState;
 *     progress: ProgressState;
 *     town: TownState;
 *     mode: 'town' | 'scene' | 'dungeon' | 'awaitingRescue' | 'defeat';
 *     session: ExpeditionState | null;
 *     pendingScene: PendingScene | null;
 *     pendingResult: PendingResult | null;
 *     rescue: RescueState;
 *     options: CampaignOptions;
 * }} CampaignState
 */

/**
 * @typedef {{
 *     kind: 'none';
 * } | {
 *     kind: 'machine';
 *     moveId: MoveId;
 *     state: 'unused' | 'used';
 * } | {
 *     kind: 'charges';
 *     remaining: Int;
 * } | {
 *     kind: 'story';
 *     variantId: ItemVariantId;
 * }} ItemPayload
 */

/** @typedef {{ itemId: ItemId; sticky: boolean; payload: ItemPayload; }} ItemTemplate */

/** @typedef {{ itemInstanceId: ItemInstanceId; template: ItemTemplate; quantity: Int; shopLotId: ShopLotId|null; }} ItemInstance */

/**
 * @typedef {{
 *     kind: 'campaign-toolbox';
 * } | {
 *     kind: 'pokemon-held';
 *     pokemonId: PokemonId;
 * } | {
 *     kind: 'session-toolbox';
 *     sessionId: SessionId;
 * } | {
 *     kind: 'actor-held';
 *     sessionId: SessionId;
 *     actorId: ActorId;
 * } | {
 *     kind: 'floor';
 *     sessionId: SessionId;
 *     mapId: MapId;
 *     position: GridPosition;
 *     placement: 'ground' | 'buried';
 * } | {
 *     kind: 'result-escrow';
 *     resultId: ResultId;
 * }} ContainerOwner
 */

/** @typedef {{ containerId:ContainerId; owner:ContainerOwner; itemIds:ItemInstanceId[]; }} ItemContainer */

/** @typedef {{ template:ItemTemplate; count:Int; }} StoredStack */

/** @typedef {{ carriedMoney:Int; bankedMoney:Int; toolbox:ContainerId; storedItems:StoredStack[]; ownedFriendAreaIds:FriendAreaId[]; }} EconomyState */

/**
 * @typedef {{
 *     shopLotId: ShopLotId;
 *     template: ItemTemplate;
 *     unitPurchasePrice: Int;
 *     unitSalePrice: Int;
 *     quantityTaken: Int;
 *     quantityReturned: Int;
 *     quantityPaid: Int;
 *     quantitySoldToShop: Int;
 * }} ShopLot
 */

/**
 * @typedef {{
 *     shopId: ShopId;
 *     mapId: MapId;
 *     lifecycle: 'active' | 'closed';
 *     keeperActorIds: ActorId[];
 *     lotById: Record<string, ShopLot>;
 *     moneyPaid: Int;
 *     saleCredit: Int;
 *     pursuit: 'none' | 'accused' | 'thief';
 * }} ShopState
 */

/** @typedef {{ moveSlotId:MoveSlotId; currentPp:Int; sealed:boolean; usedForExperience:boolean; }} BattleMove */

/** @typedef {{ slots:BattleMove[]; }} BattleMoves */

/** @typedef {{ attack:Int; defense:Int; specialAttack:Int; specialDefense:Int; accuracy:Int; evasion:Int; }} StatStages */

/** @typedef {{ attack:Quantity; defense:Quantity; specialAttack:Quantity; specialDefense:Quantity; }} StatMultipliers */

/** @typedef {{ hp:Int; belly:Quantity; maxBelly:Quantity; hpRegenerationAccumulator:Quantity; }} ActorResources */

/**
 * @typedef {{
 *     kind: 'counter';
 *     policyId: PolicyId;
 *     remaining: Int;
 * } | {
 *     kind: 'indefinite';
 *     policyId: PolicyId;
 * } | {
 *     kind: 'floor';
 *     policyId: PolicyId;
 * } | {
 *     kind: 'until-action';
 *     policyId: PolicyId;
 * }} Duration
 */

/**
 * @typedef {{
 *     kind: 'actor';
 *     actor: HistoricalActorRef;
 *     moveId: MoveId | null;
 * } | {
 *     kind: 'item';
 *     itemId: ItemId;
 *     user: HistoricalActorRef | null;
 * } | {
 *     kind: 'trap';
 *     mapId: MapId;
 *     trapId: TrapId;
 *     trapKindId: TrapKindId;
 * } | {
 *     kind: 'ability';
 *     actor: HistoricalActorRef;
 *     abilityId: AbilityId;
 * } | {
 *     kind: 'weather';
 *     weatherId: WeatherId;
 * } | {
 *     kind: 'script';
 *     grantId: GrantId;
 * }} EffectSource
 */

/**
 * @typedef {{
 *     kind: 'self';
 * } | {
 *     kind: 'actor';
 *     actorId: ActorId;
 * } | {
 *     kind: 'tile';
 *     mapId: MapId;
 *     position: GridPosition;
 * } | {
 *     kind: 'facing';
 * } | {
 *     kind: 'room';
 *     roomId: RoomId;
 * } | {
 *     kind: 'floor';
 * }} TargetSelector
 */

/**
 * @typedef {{
 *     identity: SpeciesForm;
 *     types: TypeId[] | null;
 *     abilities: AbilityId[] | null;
 *     stats: StatBlock | null;
 *     moves: MoveSet | null;
 *     movePp: BattleMoves | null;
 * }} CopiedCombatProjection
 */

/**
 * @typedef {{
 *     kind: 'none';
 * } | {
 *     kind: 'actor-link';
 *     actorId: ActorId | null;
 * } | {
 *     kind: 'move-lock';
 *     moveSlotId: MoveSlotId;
 *     moveId: MoveId;
 * } | {
 *     kind: 'charge';
 *     moveSlotId: MoveSlotId;
 *     moveId: MoveId;
 *     target: TargetSelector;
 *     storedDamage: Int;
 * } | {
 *     kind: 'bide';
 *     storedDamage: Int;
 *     lastAttackerId: ActorId | null;
 * } | {
 *     kind: 'copied-combat';
 *     projection: CopiedCombatProjection;
 * }} ConditionPayload
 */

/** @typedef {{ statusId:StatusId; source:EffectSource; duration:Duration; periodicCountdown:Int|null; payload:ConditionPayload; }} ConditionState */

/**
 * @typedef {'sleep' | 'sleepless' | 'nightmare' | 'yawning' | 'napping' | 'burn' | 'poisoned' | 'badly-poisoned' | 'paralysis' | 'frozen' | 'shadow-hold' | 'wrap' | 'wrapped' | 'ingrain' | 'petrified' | 'constriction' | 'cringe' | 'confused' | 'paused' | 'cowering' | 'taunted' | 'encore' | 'infatuated' | 'bide' | 'solarbeam' | 'sky-attack' | 'razor-wind' | 'focus-punch' | 'skull-bash' | 'flying' | 'bouncing' | 'diving' | 'digging' | 'charging' | 'enraged' | 'reflect' | 'safeguard' | 'light-screen' | 'counter' | 'magic-coat' | 'wish' | 'protect' | 'mirror-coat' | 'enduring' | 'mini-counter' | 'mirror-move' | 'conversion2' | 'vital-throw' | 'mist' | 'cursed' | 'decoy' | 'snatch' | 'leech-seed' | 'destiny-bond' | 'sure-shot' | 'whiffer' | 'set-damage' | 'focus-energy' | 'long-toss' | 'pierce' | 'invisible' | 'transformed' | 'mobile' | 'blinker' | 'cross-eyed' | 'eyedrops'} StatusId
 */

/**
 * @typedef {{
 *     sleep: ConditionState | null;
 *     burn: ConditionState | null;
 *     frozen: ConditionState | null;
 *     cringe: ConditionState | null;
 *     bide: ConditionState | null;
 *     reflect: ConditionState | null;
 *     curse: ConditionState | null;
 *     leechSeed: ConditionState | null;
 *     sureShot: ConditionState | null;
 *     longToss: ConditionState | null;
 *     invisible: ConditionState | null;
 *     blinker: ConditionState | null;
 * }} ActorConditions
 */

/** @typedef {{ source:EffectSource; duration:Duration; }} AuxiliaryCondition */

/**
 * @typedef {{
 *     perishSong: AuxiliaryCondition | null;
 *     muzzled: AuxiliaryCondition | null;
 *     grudge: AuxiliaryCondition | null;
 *     exposed: AuxiliaryCondition | null;
 * }} ActorAuxiliaryConditions
 */

/** Native timer arrays are five counters per sign; ActorId supplies slot generation. */
/**
 * @typedef {{
 *     positiveTimers: Int[];
 *     negativeTimers: Int[];
 *     cachedStage: Int;
 *     speedBoostCounter: Int;
 *     attackLocked: boolean;
 *     speedRaisedThisAction: boolean;
 *     movementPending: boolean;
 *     endEffectsPending: boolean;
 *     deferred: boolean;
 *     swapSkip: boolean;
 *     petrifiedSwap: boolean;
 *     replan: boolean;
 * }} ActorSpeedState
 */

/**
 * @typedef {{
 *     lastUsedMove: {
 *         moveId: MoveId;
 *         moveSlotId: MoveSlotId | null;
 *     } | null;
 *     lastIncomingMove: {
 *         moveId: MoveId;
 *         from: HistoricalActorRef;
 *     } | null;
 *     lastDamage: {
 *         amount: Int;
 *         category: 'physical' | 'special' | 'other';
 *         from: HistoricalActorRef | null;
 *     } | null;
 *     furyCutterCount: Int;
 *     protectCount: Int;
 *     stockpileCount: Int;
 *     attackedThisOpportunity: boolean;
 *     movedThisOpportunity: boolean;
 *     experienceContributors: ActorId[];
 * }} ActorMemory
 */

/**
 * @typedef {{
 *     types: TypeId[] | null;
 *     abilities: AbilityId[] | null;
 *     form: {
 *         formId: FormId;
 *         policyId: PolicyId;
 *     } | null;
 *     hiddenPower: {
 *         typeId: TypeId;
 *         power: Int;
 *     } | null;
 * }} ActorOverrides
 */

/** @typedef {{ experience:Quantity; statItems:StatBlock; iq:Int; maxBelly:Quantity; moveBoosts:{moveSlotId:MoveSlotId; amount:Int;}[]; }} RunGains */

/**
 * @typedef {{
 *     kind: 'roster';
 *     pokemonId: PokemonId;
 * } | {
 *     kind: 'wild';
 *     encounterId: EncounterId;
 *     spawnedAt: FloorAddress;
 * } | {
 *     kind: 'boss';
 *     encounterId: EncounterId;
 * } | {
 *     kind: 'guest';
 *     storyActorId: StoryActorId;
 * } | {
 *     kind: 'job-client';
 *     jobId: JobId;
 * } | {
 *     kind: 'temporary-recruit';
 *     origin: PokemonOrigin;
 *     nickname: string;
 *     recruitPolicyId: PolicyId;
 * } | {
 *     kind: 'imported-team';
 *     teamId: ImportedTeamId;
 *     memberKey: string;
 * }} ActorBinding
 */

/** @typedef {| {kind:'map'; mapId:MapId; position:GridPosition;} | {kind:'off-map'; reason:'fainted'|'dismissed'|'rescued'|'staged';}} ActorPlacement */

/**
 * @typedef {{
 *     actorId: ActorId;
 *     binding: ActorBinding;
 *     affiliation: 'team' | 'hostile' | 'neutral';
 *     identity: SpeciesForm;
 *     growth: PokemonGrowth;
 *     moves: MoveSet;
 *     enabledIqSkillIds: IqSkillId[];
 *     tacticId: TacticId;
 *     battleMoves: BattleMoves;
 *     resources: ActorResources;
 *     placement: ActorPlacement;
 *     facing: Facing;
 *     conditions: ActorConditions;
 *     auxiliaryConditions: ActorAuxiliaryConditions;
 *     stages: StatStages;
 *     multipliers: StatMultipliers;
 *     speed: ActorSpeedState;
 *     memory: ActorMemory;
 *     overrides: ActorOverrides;
 *     heldContainerId: ContainerId;
 *     gains: RunGains;
 *     ai: {
 *         target: TargetSelector | null;
 *         destination: GridPosition | null;
 *         waitingForLeader: boolean;
 *     };
 * }} SessionActor
 */

/**
 * @typedef {{
 *     kind: 'exploration';
 *     address: FloorAddress;
 * } | {
 *     kind: 'boss';
 *     address: FloorAddress;
 *     encounterId: EncounterId;
 * } | {
 *     kind: 'rest';
 *     dungeonId: DungeonId;
 *     sectionId: SectionId;
 *     mapDefinitionId: MapDefinitionId;
 * } | {
 *     kind: 'terminal';
 *     dungeonId: DungeonId;
 *     sceneId: SceneId;
 *     mapDefinitionId: MapDefinitionId;
 * }} FloorLocation
 */

/** @typedef {{ terrainId:TerrainId; roomId:RoomId|null; unbreakable:boolean; junction:boolean; shopId:ShopId|null; }} TileState */

/**
 * @typedef {{
 *     roomId: RoomId;
 *     kind: 'ordinary' | 'monster-house' | 'shop' | 'reward-chamber';
 *     bounds: {
 *         x: Int;
 *         z: Int;
 *         width: Int;
 *         height: Int;
 *     };
 *     monsterHouse: 'none' | 'armed' | 'triggered' | 'cleared';
 *     initiallyHidden: boolean;
 * }} RoomState
 */

/**
 * @typedef {{
 *     trapId: TrapId;
 *     trapKindId: TrapKindId;
 *     position: GridPosition;
 *     revealed: boolean;
 *     affiliation: 'team' | 'hostile' | 'neutral';
 *     activation: 'armed' | 'spent' | 'disabled';
 * }} TrapState
 */

/**
 * @typedef {{
 *     kind: 'floor';
 *     address: FloorAddress;
 *     entryId: string;
 * } | {
 *     kind: 'rest';
 *     dungeonId: DungeonId;
 *     sectionId: SectionId;
 *     mapDefinitionId: MapDefinitionId;
 *     entryId: string;
 * } | {
 *     kind: 'scene';
 *     sceneId: SceneId;
 * } | {
 *     kind: 'town';
 *     mapDefinitionId: MapDefinitionId;
 *     entryId: string;
 * } | {
 *     kind: 'end-expedition';
 *     outcome: FinalOutcome;
 *     policyId: PolicyId;
 * }} Destination
 */

/**
 * @typedef {{
 *     exitId: ExitId;
 *     position: GridPosition;
 *     kind: 'stairs-up' | 'stairs-down' | 'warp' | 'boundary' | 'rescue-spot';
 *     destination: Destination;
 *     lock: {
 *         kind: 'open';
 *     } | {
 *         kind: 'condition';
 *         policyId: PolicyId;
 *     };
 * }} ExitState
 */

/** @typedef {{ natural:WeatherId[]; contributions:{weatherId:WeatherId; source:EffectSource; duration:Duration;}[]; damageCounter:Int; }} WeatherState */

/**
 * @typedef {{
 *     explored: boolean[][];
 *     layoutRevealed: boolean;
 *     stairsRevealed: boolean;
 *     itemSense: boolean;
 *     actorSense: boolean;
 *     itemHoldersIdentified: boolean;
 * }} FloorKnowledge
 */

/** @typedef {{ mudSport:AuxiliaryCondition|null; waterSport:AuxiliaryCondition|null; }} FloorEffects */

/**
 * @typedef {{
 *     mapId: MapId;
 *     location: FloorLocation;
 *     definitionId: MapDefinitionId;
 *     width: Int;
 *     height: Int;
 *     tiles: TileState[][];
 *     rooms: Record<string, RoomState>;
 *     traps: Record<string, TrapState>;
 *     exits: Record<string, ExitState>;
 *     knowledge: FloorKnowledge;
 *     effects: FloorEffects;
 *     weather: WeatherState;
 *     turnCounter: Int;
 *     arrivalCounter: Int;
 *     windCounter: Int;
 *     triggeredEventIds: GrantId[];
 * }} FloorState
 */

/**
 * @typedef {{
 *     kind: 'move';
 *     actorId: ActorId;
 *     destination: GridPosition;
 * } | {
 *     kind: 'face';
 *     actorId: ActorId;
 *     facing: Facing;
 * } | {
 *     kind: 'attack';
 *     actorId: ActorId;
 *     target: TargetSelector;
 * } | {
 *     kind: 'move-use';
 *     actorId: ActorId;
 *     moveSlotId: MoveSlotId;
 *     moveId: MoveId;
 *     target: TargetSelector;
 * } | {
 *     kind: 'item';
 *     actorId: ActorId;
 *     itemInstanceId: ItemInstanceId;
 *     operation: 'use' | 'throw' | 'equip' | 'place' | 'swap';
 *     target: TargetSelector;
 * } | {
 *     kind: 'wait';
 *     actorId: ActorId;
 * } | {
 *     kind: 'exit';
 *     actorId: ActorId;
 *     exitId: ExitId;
 * } | {
 *     kind: 'escape';
 *     policyId: PolicyId;
 * } | {
 *     kind: 'give-up';
 * }} ResolvedAction
 */

/**
 * @typedef {{
 *     programId: EffectProgramId;
 *     instructionIndex: Int;
 *     action: ResolvedAction;
 *     targetOrder: ActorSlotRef[];
 *     linkedMoves: {moveSlotId:MoveSlotId; moveId:MoveId;}[];
 *     linkIndex: Int;
 *     reactionStack: {programId:EffectProgramId; instructionIndex:Int; source:ActorSlotRef; target:ActorSlotRef|null;}[];
 *     targetIndex: Int;
 *     hitIndex: Int;
 *     hitCount: Int;
 *     accumulatedDamage: Int;
 *     selectedMoveId: MoveId | null;
 *     selectedMagnitude: Int | null;
 * }} EffectCursor
 */

/** @typedef {{side:'team'|'wild'; slot:Int; actorId:ActorId;}} ActorSlotRef */
/** @typedef {'prephase'|'leader'|'team'|'followers'|'follower-end'|'wild'|'boundary'|'phase-end'} TurnPass */
/** @typedef {'select'|'begin'|'experience'|'decision'|'effect'|'after'|'refresh'} OpportunityStage */
/** @typedef {'none'|'floor-transition'|'dungeon-exit'|'rescue-pending'|'failure'} TurnTerminal */
/**
 * @typedef {{
 *     phase: Int;
 *     pass: TurnPass;
 *     step: Int;
 *     slotIndex: Int;
 *     followerRound: Int;
 *     followerOrder: ActorSlotRef[];
 *     followerIndex: Int;
 *     active: ActorSlotRef | null;
 *     stage: OpportunityStage;
 *     beginningRan: boolean;
 *     skipBeginning: boolean;
 *     replanCount: Int;
 *     action: ResolvedAction | null;
 *     activeEffect: EffectCursor | null;
 *     actionStop: 'none'|'recruited'|'effect-stop';
 *     leaderChanged: boolean;
 *     terminal: TurnTerminal;
 *     petrifiedSwapPending: boolean;
 *     special: {leader:ActorSlotRef; leaderChanged:boolean; index:Int;} | null;
 *     flushing: {order:ActorSlotRef[]; index:Int; step:Int;} | null;
 * }} TurnContinuation
 */
/**
 * @typedef {{
 *     roundNumber: Int;
 *     schedulePolicyId: PolicyId;
 *     teamSlots: (ActorId|null)[];
 *     wildSlots: (ActorId|null)[];
 *     continuation: TurnContinuation;
 * }} SchedulerBase
 */
/** @typedef {SchedulerBase & ({kind:'ready';}|{kind:'choice-paused';resultId:ResultId;}|{kind:'scene-paused';sceneInstanceId:SceneInstanceId;})} SchedulerState */

/** @typedef {{ items:Record<string,ItemInstance>; containers:Record<string,ItemContainer>; }} ItemArchive */

/**
 * @typedef {{
 *     pokemon: PokemonRecord;
 *     projectedGrowth: PokemonGrowth;
 *     projectedMoves: MoveSet;
 *     projectedIqSkillIds: IqSkillId[];
 *     projectedResources: ActorResources;
 *     projectedPp: BattleMoves;
 *     projectedTacticId: TacticId;
 *     projectedHiddenPower: {
 *         typeId: TypeId;
 *         power: Int;
 *     } | null;
 * }} EntrantBaseline
 */

/**
 * @typedef {{
 *     sessionId: SessionId;
 *     entryRevision: Int;
 *     entryPolicyId: PolicyId;
 *     outcomePolicySetId: PolicyId;
 *     entrants: Record<string, EntrantBaseline>;
 *     selectedPartyIds: PokemonId[];
 *     carriedMoney: Int;
 *     toolboxContainerId: ContainerId;
 *     itemArchive: ItemArchive;
 * }} ExpeditionEntryBaseline
 */

/**
 * @typedef {{
 *     jobId: JobId | null;
 *     definitionId: PolicyId;
 *     state: {
 *         kind: 'pending';
 *     } | {
 *         kind: 'actor-target';
 *         actorId: ActorId;
 *         complete: boolean;
 *     } | {
 *         kind: 'item-target';
 *         itemId: ItemId;
 *         required: Int;
 *         collected: Int;
 *     } | {
 *         kind: 'location';
 *         destination: FloorAddress;
 *         reached: boolean;
 *     } | {
 *         kind: 'complete';
 *         completedRevision: Int;
 *     };
 * }} SessionObjective
 */

/**
 * @typedef {{
 *     actorId: ActorId;
 *     pokemonId: PokemonId | null;
 *     policyId: PolicyId;
 *     revision: Int;
 *     outcome: 'returned-to-roster' | 'removed-from-team' | 'discarded-temporary';
 * }} ParticipantSettlement
 */

/**
 * @typedef {{
 *     sessionId: SessionId;
 *     dungeonId: DungeonId;
 *     purpose: {
 *         kind: 'ordinary';
 *     } | {
 *         kind: 'story';
 *         storyNodeId: StoryNodeId;
 *     } | {
 *         kind: 'dojo';
 *         mazeId: DungeonId;
 *     } | {
 *         kind: 'friend-rescue';
 *         requestId: RescueRequestId;
 *     } | {
 *         kind: 'imported-maze';
 *         teamId: ImportedTeamId;
 *     };
 *     status: 'active' | 'suspended';
 *     leaderActorId: ActorId;
 *     teamOrder: ActorId[];
 *     actors: Record<string, SessionActor>;
 *     floor: FloorState;
 *     inventory: ContainerId;
 *     carriedMoney: Int;
 *     shops: Record<string, ShopState>;
 *     objectives: SessionObjective[];
 *     scheduler: SchedulerState;
 *     entry: ExpeditionEntryBaseline;
 *     visitedFloorIds: FloorId[];
 *     completedEventIds: GrantId[];
 *     participantSettlements: ParticipantSettlement[];
 * }} ExpeditionState
 */

/** @typedef {| 'success'|'mission-escape'|'escape-orb'|'give-up' | 'fainting'|'wind-expulsion'|'rescue-abandoned'|'story-exit'} FinalOutcome */

/** @typedef {'rescue-pending'|'rescue-resumed'} RescueTransition */

/** @typedef {| {kind:'entry';} | {kind:'session';} | {kind:'entry-plus-run-gains'; ruleId:PolicyId;}} GrowthRetention */

/** @typedef {| {kind:'entry';} | {kind:'session';} | {kind:'select'; ruleId:PolicyId;}} ItemRetention */

/**
 * @typedef {{
 *     policyId: PolicyId;
 *     outcome: FinalOutcome | RescueTransition;
 *     level: GrowthRetention;
 *     experience: GrowthRetention;
 *     naturalStats: GrowthRetention;
 *     statItemBonuses: GrowthRetention;
 *     moves: GrowthRetention;
 *     movePp: GrowthRetention;
 *     moveLinks: GrowthRetention;
 *     moveBoosts: GrowthRetention;
 *     moveEnabled: GrowthRetention;
 *     iqPoints: GrowthRetention;
 *     iqEnabled: GrowthRetention;
 *     tactic: GrowthRetention;
 *     currentHp: GrowthRetention;
 *     belly: GrowthRetention;
 *     maxBelly: GrowthRetention;
 *     toolbox: ItemRetention;
 *     heldItems: ItemRetention;
 *     money: ItemRetention;
 *     recruits: {
 *         ruleId: PolicyId;
 *     };
 *     jobs: {
 *         ruleId: PolicyId;
 *     };
 *     day: {
 *         ruleId: PolicyId;
 *     };
 *     destination: Destination;
 * }} ExpeditionOutcomePolicy
 */

/**
 * @typedef {{
 *     reference: {
 *         kind: 'pokemon';
 *         pokemonId: PokemonId;
 *     } | {
 *         kind: 'story-actor';
 *         storyActorId: StoryActorId;
 *     };
 *     position: GridPosition;
 *     facing: Facing;
 * }} TownPlacement
 */

/**
 * @typedef {{
 *     mapDefinitionId: MapDefinitionId;
 *     placements: TownPlacement[];
 *     day: Int;
 *     serviceStock: {
 *         serviceId: string;
 *         stockRevision: Int;
 *         items: StoredStack[];
 *     }[] | {
 *         kind: 'lots';
 *         serviceId: string;
 *         stockRevision: Int;
 *         lots: ItemGrant[];
 *     }[];
 * }} TownState
 */

/** @typedef {{ identity:SpeciesForm; nickname:string|null; }} JobClient */

/**
 * @typedef {{
 *     kind: 'rescue';
 *     client: JobClient;
 *     destination: FloorAddress;
 * } | {
 *     kind: 'escort';
 *     client: JobClient;
 *     destination: FloorAddress;
 *     recipient: JobClient;
 * } | {
 *     kind: 'deliver-item';
 *     client: JobClient;
 *     destination: FloorAddress;
 *     itemId: ItemId;
 *     quantity: Int;
 * } | {
 *     kind: 'retrieve-item';
 *     client: JobClient;
 *     destination: FloorAddress;
 *     itemId: ItemId;
 *     quantity: Int;
 * } | {
 *     kind: 'find-pokemon';
 *     client: JobClient;
 *     destination: FloorAddress;
 *     target: JobClient;
 * }} JobGoal
 */

/** @typedef {{ template:ItemTemplate; quantity:Int; }} ItemGrant */

/** @typedef {{ money:Int; rankPoints:Int; items:ItemGrant[]; friendAreaIds:FriendAreaId[]; recruitGrantIds:GrantId[]; }} RewardBundle */

/**
 * @typedef {{
 *     kind: 'offered';
 *     offeredDay: Int;
 *     expiryDay: Int | null;
 * } | {
 *     kind: 'suspended';
 *     acceptedRevision: Int;
 * } | {
 *     kind: 'accepted';
 *     acceptedRevision: Int;
 * } | {
 *     kind: 'active';
 *     sessionId: SessionId;
 *     objectiveIndex: Int;
 * } | {
 *     kind: 'objective-complete';
 *     sessionId: SessionId;
 *     completedRevision: Int;
 * } | {
 *     kind: 'reward-ready';
 *     completedRevision: Int;
 * } | {
 *     kind: 'claimed';
 *     claimedRevision: Int;
 * } | {
 *     kind: 'failed';
 *     reasonId: PolicyId;
 *     failedRevision: Int;
 * }} JobPhase
 */

/**
 * @typedef {{
 *     jobId: JobId;
 *     source: {
 *         kind: 'generated';
 *         generationPolicyId: PolicyId;
 *         posting: 'board'|'mailbox';
 *         generatedDay: Int;
 *         seed: Int;
 *         missionType: 0|1|3|4;
 *         targetItem: ItemId;
 *         itemReward: ItemId;
 *         rewardType: 0|1|2|3|4|5|6|7;
 *     } | {
 *         kind: 'generated';
 *         generationPolicyId: PolicyId;
 *         generatedDay: Int;
 *     } | {
 *         kind: 'mail';
 *         digest: string;
 *         formatId: string;
 *     } | {
 *         kind: 'authored';
 *         grantId: GrantId;
 *     };
 *     goal: JobGoal;
 *     difficultyId: string;
 *     reward: RewardBundle;
 *     phase: JobPhase;
 * }} JobRecord
 */

/**
 * @typedef {{
 *     dungeonId: DungeonId;
 *     firstClearRevision: Int;
 *     lastClearRevision: Int;
 *     firstClearDay: Int;
 *     lastClearDay: Int;
 *     clearCount: Int;
 *     reachedFloorIds: FloorId[];
 * }} DungeonClearRecord
 */

/** @typedef {{ milestoneId:MilestoneId; acquiredRevision:Int; acquiredDay:Int; }} MilestoneRecord */

/** @typedef {{ sceneId:SceneId; count:Int; firstRevision:Int; lastRevision:Int; firstDay:Int; lastDay:Int; }} SceneVisit */

/** @typedef {{ branchId:StoryBranchId; nodeId:StoryNodeId; enteredRevision:Int; enteredDay:Int; }} BranchProgress */

/** @typedef {'MAIN'|'SUB1'|'SUB2'|'SUB3'|'SUB4'|'SUB5'|'SUB6'|'SUB7'|'SUB8'|'SUB9'|'SELECT'} NativeScenarioId */
/** @typedef {{chapter:number; step:number;}} NativeScenarioPair */
/** Native storage, not authored scene/map IDs or an inferred new-game profile.
 * Array lengths and sourced numerical bounds are validated independently.
 * @typedef {{
 *   scenarios: Record<NativeScenarioId,NativeScenarioPair>;
 *   clearCount: number;
 *   entryFrequency: number;
 *   flags: {persistent:boolean[]; pending:boolean[];};
 *   eventS07E01: boolean[];
 *   eventGonbe: [number,number,number,number];
 *   scalars: {
 *     baseLevel:number; scriptMode:boolean; warpLock:number; previousMap:number;
 *     eventLocal:number; dungeonEnter:number; dungeonEnterIndex:number;
 *     flagKind:number; flagKindChangeRequest:number; partner1Kind:number; partner2Kind:number;
 *   };
 * }} NativeProgressState
 */

/**
 * @typedef {{
 *     storyNodeId: StoryNodeId;
 *     native: NativeProgressState;
 *     branches: Record<string, BranchProgress>;
 *     milestones: Record<string, MilestoneRecord>;
 *     clears: Record<string, DungeonClearRecord>;
 *     recruitedHistory: SpeciesForm[];
 *     seenScenes: Record<string, SceneVisit>;
 *     rankPoints: Int;
 *     jobs: Record<string, JobRecord>;
 *     acceptedJobIds: JobId[];
 *     appliedGrants: {
 *         grantId: GrantId;
 *         revision: Int;
 *         day: Int;
 *     }[];
 *     consumedMail: {
 *         formatId: string;
 *         digest: string;
 *         appliedRevision: Int;
 *     }[];
 *     statistics: {
 *         jobsCompleted: Int;
 *         rescuesCompleted: Int;
 *         expeditions: Int;
 *     };
 * }} ProgressState
 */

/**
 * @typedef {{
 *     roleId: SceneRoleId;
 *     kind: 'pokemon';
 *     pokemonId: PokemonId;
 * } | {
 *     roleId: SceneRoleId;
 *     kind: 'actor';
 *     actorId: ActorId;
 * } | {
 *     roleId: SceneRoleId;
 *     kind: 'story-actor';
 *     storyActorId: StoryActorId;
 * } | {
 *     roleId: SceneRoleId;
 *     kind: 'job';
 *     jobId: JobId;
 * } | {
 *     roleId: SceneRoleId;
 *     kind: 'item';
 *     itemInstanceId: ItemInstanceId;
 * }} SceneBinding
 */

/**
 * @typedef {{
 *     kind: 'town';
 *     destination: Destination;
 * } | {
 *     kind: 'resume-session';
 *     sessionId: SessionId;
 * } | {
 *     kind: 'begin-expedition';
 *     dungeonId: DungeonId;
 *     entryPolicyId: PolicyId;
 * } | {
 *     kind: 'change-floor';
 *     sessionId: SessionId;
 *     destination: Destination;
 * } | {
 *     kind: 'end-expedition';
 *     sessionId: SessionId;
 *     outcome: FinalOutcome;
 *     policyId: PolicyId;
 * } | {
 *     kind: 'scene';
 *     sceneId: SceneId;
 * } | {
 *     kind: 'resume-turn';
 *     sessionId: SessionId;
 *     gate: {
 *         kind: 'result';
 *         resultId: ResultId;
 *     } | {
 *         kind: 'scene';
 *         sceneInstanceId: SceneInstanceId;
 *     };
 * } | {
 *     kind: 'request-rescue';
 *     sessionId: SessionId;
 *     policyId: PolicyId;
 * } | {
 *     kind: 'await-rescue';
 *     requestId: RescueRequestId;
 * }} Continuation
 */

/** @typedef {| {kind:'advance';} | {kind:'choice'; choiceId:SceneChoiceId; optionIds:SceneOptionId[];} | {kind:'name-input';field:'team';value:string;} | {kind:'name-confirm';field:'team';value:string;choiceId:SceneChoiceId;optionIds:SceneOptionId[];}} SceneAwait */

/**
 * @typedef {{
 *     sceneInstanceId: SceneInstanceId;
 *     sceneId: SceneId;
 *     cursor: Int;
 *     entryRevision: Int;
 *     bindings: SceneBinding[];
 *     choices: {
 *         choiceId: SceneChoiceId;
 *         optionId: SceneOptionId;
 *     }[];
 *     awaiting: SceneAwait;
 *     continuation: Continuation;
 * }} PendingScene
 */

/** @typedef {{ resultId:ResultId; createdRevision:Int; cursor:Int; }} ResultBase */

/**
 * @typedef {{
 *     sessionId: SessionId;
 *     dungeonId: DungeonId;
 *     outcome: FinalOutcome;
 *     retainedPokemonIds: PokemonId[];
 *     lostItemTemplates: ItemGrant[];
 *     moneyChange: Int;
 *     completedJobIds: JobId[];
 * }} ExpeditionSummary
 */

/**
 * @typedef {(ResultBase & {
 *     kind: 'expedition-complete';
 *     summary: ExpeditionSummary;
 *     continuation: Continuation;
 * }) | (ResultBase & {
 *     kind: 'defeat';
 *     summary: ExpeditionSummary;
 *     continuation: Continuation;
 * }) | (ResultBase & {
 *     kind: 'job-reward';
 *     jobId: JobId;
 *     reward: RewardBundle;
 *     grantedRevision: Int;
 *     continuation: Continuation;
 * }) | (ResultBase & {
 *     kind: 'recruit-choice';
 *     sessionId: SessionId;
 *     actorId: ActorId;
 *     optionIds: ('accept' | 'decline')[];
 *     continuation: Continuation;
 * }) | (ResultBase & {
 *     kind: 'move-learn-choice';
 *     sessionId: SessionId | null;
 *     owner: {
 *         kind: 'pokemon';
 *         pokemonId: PokemonId;
 *     } | {
 *         kind: 'actor';
 *         actorId: ActorId;
 *     };
 *     moveId: MoveId;
 *     replaceableSlotIds: MoveSlotId[];
 *     canDecline: boolean;
 *     continuation: Continuation;
 * }) | (ResultBase & {
 *     kind: 'choice';
 *     choiceId: SceneChoiceId;
 *     options: {
 *         optionId: SceneOptionId;
 *         continuation: Continuation;
 *     }[];
 * }) | (ResultBase & {
 *     kind: 'rescue';
 *     requestId: RescueRequestId;
 *     stage: 'request-ready' | 'resumed' | 'reward-ready';
 *     continuation: Continuation;
 * })} PendingResult
 */

/**
 * @typedef {{
 *     requestId: RescueRequestId;
 *     suspendedRevision: Int;
 *     session: ExpeditionState;
 *     itemArchive: ItemArchive;
 *     requestDigest: string;
 *     outcomePolicySetId: PolicyId;
 * }} SuspendedRun
 */

/**
 * @typedef {{
 *     memberKey: string;
 *     identity: SpeciesForm;
 *     nickname: string;
 *     growth: PokemonGrowth;
 *     moves: MoveSet;
 *     iqSkillIds: IqSkillId[];
 *     tacticId: TacticId;
 *     heldItem: ItemGrant | null;
 * }} ImportedTeamMember
 */

/** @typedef {{ teamId:ImportedTeamId; formatId:string; digest:string; teamName:string; members:ImportedTeamMember[]; }} ImportedTeam */

/**
 * @typedef {{
 *     requestId: RescueRequestId;
 *     direction: 'self' | 'other';
 *     formatId: string;
 *     digest: string;
 *     destination: FloorAddress;
 *     requesterName: string;
 *     phase: 'requested' | 'accepted' | 'completed' | 'resumed' | 'thanked' | 'abandoned';
 *     reward: RewardBundle | null;
 *     linkedJobId: JobId | null;
 * }} RescueRecord
 */

/** @typedef {{ suspended:SuspendedRun|null; records:Record<string,RescueRecord>; importedTeams:Record<string,ImportedTeam>; }} RescueState */

/**
 * @typedef {{
 *     code: 'shape' | 'unknown-field' | 'unknown-id' | 'range' | 'relationship' | 'ownership' | 'unsupported-version' | 'content-mismatch' | 'unresolved-rule';
 *     path: string;
 *     message: string;
 * }} StateIssue
 */

/** @typedef {| {ok:true;} | {ok:false; kind:'invalid'; issues:StateIssue[];} | {ok:false; kind:'unresolved'; requirementIds:string[];}} RuleCheck */

/**
 * @typedef {{
 *     kind: 'live';
 * } | {
 *     kind: 'entry-history';
 *     sessionId: SessionId;
 *     owner: 'active-session' | 'suspended-rescue';
 * } | {
 *     kind: 'rescue-suspended';
 *     requestId: RescueRequestId;
 * }} ValidationScope
 */

/**
 * @typedef {{
 *     profile(state: CampaignState): RuleCheck;
 *     pokemon(record: PokemonRecord, state: CampaignState, scope: ValidationScope): RuleCheck;
 *     actor(actor: SessionActor, session: ExpeditionState, state: CampaignState, scope: ValidationScope): RuleCheck;
 *     item(item: ItemInstance, container: ItemContainer, state: CampaignState, scope: ValidationScope): RuleCheck;
 *     economy(state: CampaignState): RuleCheck;
 *     floor(floor: FloorState, session: ExpeditionState, state: CampaignState, scope: ValidationScope): RuleCheck;
 *     conditions(actor: SessionActor, session: ExpeditionState, scope: ValidationScope): RuleCheck;
 *     scheduler(session: ExpeditionState, state: CampaignState, scope: ValidationScope): RuleCheck;
 *     expeditionEntry(session: ExpeditionState, state: CampaignState, scope: ValidationScope): RuleCheck;
 *     progress(state: CampaignState): RuleCheck;
 *     job(job: JobRecord, state: CampaignState): RuleCheck;
 *     scene(scene: PendingScene, state: CampaignState): RuleCheck;
 *     result(result: PendingResult, state: CampaignState): RuleCheck;
 *     rescue(state: CampaignState): RuleCheck;
 *     town(town: TownState, state: CampaignState): RuleCheck;
 *     options(options: CampaignOptions): RuleCheck;
 * }} CampaignStatePolicies
 */

/**
 * @typedef {{
 *     referenceEdition: 'blue-rescue-team';
 *     contentRevision: ContentRevision;
 *     campaignSchemaVersion: 1;
 *     policies: CampaignStatePolicies;
 *     identities: CampaignIdentityLookup;
 *     initialCampaign(profileId: string, selection: ConfirmedBlueSelection): InitialCampaignLookup;
 * }} CampaignContent
 */

/**
 * @typedef {{
 *     has(kind: CatalogKind, id: string): boolean;
 *     permitsFloor(address: FloorAddress): RuleCheck;
 *     permitsSection(dungeonId: DungeonId, sectionId: SectionId): RuleCheck;
 *     permitsForm(identity: SpeciesForm, context: 'persistent' | 'session'): RuleCheck;
 * }} CampaignIdentityLookup
 */

/**
 * @typedef {{
 *     ok: true;
 *     snapshot: CampaignSnapshot;
 * } | {
 *     ok: false;
 *     kind: 'invalid' | 'blocked';
 *     issues: readonly StateIssue[];
 *     requirementIds: readonly string[];
 * }} CampaignValidation
 */

/** @template T @typedef {T extends string | number | boolean | null | undefined ? T : T extends object ? {readonly [K in keyof T]:DeepReadonly<T[K]>} : T} DeepReadonly */

/** @typedef {DeepReadonly<CampaignState>} CampaignSnapshot */

/** @typedef {{ transactionId:TransactionId; expectedRevision:Int; }} CommandContext */

/** @typedef {{ quizRevision:string; outcomeId:string; hero:SpeciesForm; partner:SpeciesForm; }} ConfirmedBlueSelection */

/**
 * @typedef {{
 *     selection: ConfirmedBlueSelection;
 *     heroName: string;
 *     partnerName: string;
 *     teamName: string;
 *     createdAt: string;
 *     seed: RandomWords;
 *     options: CampaignOptions;
 *     initialProfileId: string;
 * }} ConfirmedNewGameInput
 */

/**
 * @typedef {{
 *     identity: SpeciesForm;
 *     growth: PokemonGrowth;
 *     moves: {
 *         moveId: MoveId;
 *         enabled: boolean;
 *         powerBoost: Int;
 *         ppCapacityBonus: Int;
 *     }[];
 *     linkedPositionGroups: Int[][];
 *     setMovePosition: Int | null;
 *     enabledIqSkillIds: IqSkillId[];
 *     tacticId: TacticId;
 *     friendAreaId: FriendAreaId;
 *     heldItems: ItemGrant[];
 * }} InitialPokemonDefinition
 */

/**
 * @typedef {{
 *     mapDefinitionId: MapDefinitionId;
 *     placements: {
 *         reference: {
 *             kind: 'starter';
 *             role: 'hero' | 'partner';
 *         } | {
 *             kind: 'story-actor';
 *             storyActorId: StoryActorId;
 *         };
 *         position: GridPosition;
 *         facing: Facing;
 *     }[];
 *     day: Int;
 *     serviceStock: {
 *         serviceId: string;
 *         stockRevision: Int;
 *         items: StoredStack[];
 *     }[];
 * }} InitialTownDefinition
 */

/**
 * @typedef {{
 *     kind: 'town';
 *     destination: Destination;
 * } | {
 *     kind: 'scene';
 *     sceneId: SceneId;
 * } | {
 *     kind: 'begin-expedition';
 *     dungeonId: DungeonId;
 *     entryPolicyId: PolicyId;
 * }} InitialContinuation
 */

/**
 * @typedef {{
 *     profileId: string;
 *     nativeProgress: NativeProgressState;
 *     hero: InitialPokemonDefinition;
 *     partner: InitialPokemonDefinition;
 *     selectedRoles: ('hero' | 'partner')[];
 *     carriedMoney: Int;
 *     bankedMoney: Int;
 *     toolboxItems: ItemGrant[];
 *     storedItems: StoredStack[];
 *     friendAreaIds: FriendAreaId[];
 *     storyNodeId: StoryNodeId;
 *     milestones: MilestoneId[];
 *     initialBranches: {
 *         branchId: StoryBranchId;
 *         nodeId: StoryNodeId;
 *     }[];
 *     rankPoints: Int;
 *     recruitedHistory: SpeciesForm[];
 *     town: InitialTownDefinition;
 *     initialScene: {
 *         sceneId: SceneId;
 *         cursor: Int;
 *         awaiting: SceneAwait;
 *         bindings: {
 *             roleId: SceneRoleId;
 *             reference: {
 *                 kind: 'starter';
 *                 role: 'hero' | 'partner';
 *             } | {
 *                 kind: 'story-actor';
 *                 storyActorId: StoryActorId;
 *             };
 *         }[];
 *         continuation: InitialContinuation;
 *     };
 * }} InitialCampaignDefinition
 */

/** @typedef {| {status:'ready'; value:InitialCampaignDefinition;} | {status:'blocked'; requirementIds:string[];}} InitialCampaignLookup */

export {};

/** Native monSeenFlags identity set, separate from recruitment and visibility.
 * Legacy absence is structural, never equivalent to an empty known history.
 * @typedef {{history:'from-creation'|'legacy-incomplete',startedRevision:Int,identities:SpeciesForm[]}} SpeciesSeenHistory
 */
