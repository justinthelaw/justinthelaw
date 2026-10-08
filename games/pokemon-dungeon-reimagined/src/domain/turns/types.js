/** P12 synchronous composition boundary. No default effects, AI, or content policies. */
/** @typedef {import('../../contracts/campaign.js').CampaignState} State */
/** @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('../../contracts/campaign.js').ActorSlotRef} ActorRef */
/** @typedef {import('../../contracts/campaign.js').ResolvedAction} Action */
/** @typedef {import('../../contracts/campaign.js').EffectCursor} EffectCursor */
/** @typedef {import('../../contracts.js').ActorId} ActorId */
/** @typedef {Exclude<import('../../contracts.js').CoreCommand,{type:'ackScene'}|{type:'ackResult'}> | {type:'ackScene',sceneId:import('../../contracts.js').SceneId,sceneInstanceId:import('../../contracts/campaign.js').SceneInstanceId,cursor:number,revision:number,optionId:import('../../contracts/campaign.js').SceneOptionId|null} | {type:'ackResult',resultId:import('../../contracts/campaign.js').ResultId,cursor:number,revision:number,choice:{kind:'ack'}|{kind:'recruit',value:'accept'|'decline'}|{kind:'move',replaceSlotId:import('../../contracts.js').MoveSlotId|null}|{kind:'option',optionId:import('../../contracts/campaign.js').SceneOptionId}} | {type:'submitSceneName',sceneId:import('../../contracts.js').SceneId,sceneInstanceId:import('../../contracts/campaign.js').SceneInstanceId,cursor:number,revision:number,name:string} | {type:'enterDungeon',dungeonId:import('../../contracts.js').DungeonId} | {type:'friendAction',order:import('../gameplay/friends.js').FriendOrder} | {type:'steelRewardChoice',choice:import('../gameplay/reward-items.js').RewardItemChoice} | {type:'workAction',order:import('../gameplay/work.js').WorkOrder} | {type:'beginTown'} | {type:'townTravel',mapId:import('../../contracts/campaign.js').MapDefinitionId} | {type:'townService',order:import('../gameplay/town-economy.js').EconomyOrder|import('../gameplay/town-shop.js').ShopOrder} | {type:'beginMorning'} | {type:'advance'} | {type:'presentation'} | {type:'useItem'|'throwItem'|'equipItem'|'placeItem'|'swapGroundItem',actorId:ActorId,itemInstanceId:import('../../contracts.js').ItemInstanceId,target:import('../../contracts/campaign.js').TargetSelector} | {type:'setTactic',actorId:ActorId,tacticId:import('../../contracts/campaign.js').TacticId} | {type:'setMoveEnabled',actorId:ActorId,moveSlotId:import('../../contracts.js').MoveSlotId,enabled:boolean} | {type:'setIqEnabled',actorId:ActorId,iqSkillId:import('../../contracts/campaign.js').IqSkillId,enabled:boolean}} Intent */
/** @typedef {import('../../contracts/campaign.js').CommandContext & {epoch:symbol,intent:Intent}} Command */
/** Transient notifications, not an audit/replay log. Tile-only counted variants
 * replace consecutive notices with exact positive safe integer counts; pickup
 * counts are invalidation notices, never quantities or a per-lot ID ledger.
 * @typedef {{type:'message',messageId:string}|{type:'messageRepeated',messageId:'wonder-tile',count:number}|{type:'pickupChanges',count:number}|{type:'actorMoved',actorId:ActorId,from:import('../../contracts.js').GridPosition,to:import('../../contracts.js').GridPosition}|{type:'attackResolved',actorId:ActorId,targetId:ActorId|null,outcome:'hit'|'miss'|'immune'}|{type:'conditionChanged',actorId:ActorId}|{type:'itemChanged',itemInstanceId:import('../../contracts.js').ItemInstanceId}|{type:'floorChanged',mapId:import('../../contracts/campaign.js').MapId}|{type:'sceneRequested',sceneId:import('../../contracts.js').SceneId}|{type:'objectiveChanged',jobId:import('../../contracts.js').JobId}|{type:'recruitOffered',actorId:ActorId}|{type:'expeditionEnded',outcome:import('../../contracts/campaign.js').FinalOutcome}|{type:'rankChanged',rankPoints:number}} EventData */
/** @typedef {Readonly<EventData & {eventId:number,revision:number,epoch:symbol}>} Event */
/** @typedef {{kind:'content-blocked',requirement:string}|{kind:'rejected',reason:'invalid-command'|'unavailable'|'stale'|'busy'|'exhausted'}} Failure */
/** @typedef {{kind:'continue'}|{kind:'prompt'}|Failure} HookResult */
/** @typedef {{kind:'continue',canAct:boolean}|{kind:'prompt',canAct:boolean}|Failure} BeginResult */
/** @typedef {{kind:'action',action:Action}|{kind:'defer'}|{kind:'replan'}|Failure} DecisionResult */
/** Each effect step resolves all zero-HP/revival/faint/recruit work synchronously.
 * Cursor prompts return the next effect cursor. A completed terminal learning
 * prompt instead owns the real after/step0 action PC; done never truncates a chain.
 * @typedef {{kind:'continue',cursor:EffectCursor}|{kind:'prompt',cursor:EffectCursor}|{kind:'prompt',completed:true,movement:false,leaderChanged:false,stop:'none'}|{kind:'done',movement:boolean,leaderChanged:boolean,stop:'none'|'recruited'|'effect-stop'}|Failure} EffectResult
 */
/** @typedef {{state:State,emit(data:EventData):void}} MutationContext */
/** @typedef {{
 * speed(context:MutationContext,actor:ActorRef):import('../rules/speed.js').SpeedContext;
 * spawn(context:MutationContext):HookResult;
 * refreshSides(context:MutationContext):HookResult;
 * forcedLoss(context:MutationContext):HookResult;
 * begin(context:MutationContext,actor:ActorRef):BeginResult;
 * fieldUpkeep(context:MutationContext):HookResult;
 * experience(context:MutationContext,actor:ActorRef|null):HookResult;
 * ai(context:MutationContext,actor:ActorRef,replan:boolean):DecisionResult;
 * startAction(context:MutationContext,actor:ActorRef,action:Action):EffectResult;
 * effect(context:MutationContext,actor:ActorRef,cursor:EffectCursor):EffectResult;
 * effectAllowed(context:MutationContext,actor:ActorRef,cursor:EffectCursor):boolean;
 * invalidReference(context:MutationContext,actor:ActorRef,cursor:EffectCursor,reason:'target'|'reaction-source'|'reaction-target'):EffectResult;
 * end(context:MutationContext,actor:ActorRef):HookResult;
 * tile(context:MutationContext,actor:ActorRef):HookResult;
 * room(context:MutationContext,actor:ActorRef):HookResult;
 * wind(context:MutationContext):HookResult;
 * }} TurnHooks
 */
/** @typedef {{kind:'presentation'}|{kind:'mutation'}|{kind:'action',action:Action}|Failure} CommandPlan */
/** @typedef {{kind:'changed',resumeDungeon:boolean}|{kind:'unchanged'}|Failure} MutationResult */
/** @typedef {{plan(snapshot:Snapshot,intent:Intent):CommandPlan;apply?: (context:MutationContext,intent:Intent)=>MutationResult;}} CommandHandler */
/** @typedef {Partial<Record<Intent['type'],CommandHandler>>} CommandHandlers */
/** consumedTurn retains the native per-dispatch action/suppressed-opportunity
 * meaning. Automatic work never supplies another player choice.
 * @typedef {{kind:'input'|'prompt'|'terminal'|'yielded',consumedTurn:boolean}} TurnOutcome */
/** @typedef {{kind:'accepted',changed:boolean,consumedTurn:boolean,turnOutcome:TurnOutcome['kind']|null,revision:number,events:readonly Event[]}|{kind:'rejected',reason:string,message:string,revision:number,events:readonly []}|{kind:'content-blocked',requirement:string,message:string,revision:number,events:readonly []}} DispatchResult */
/** @typedef {{getSnapshot():Snapshot;getEpoch():symbol;dispatch(command:Command):DispatchResult;}} Adventure */
export {};
