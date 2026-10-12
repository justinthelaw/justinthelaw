/** Transient evidence for battle presentation. These copies never enter saves
 * and contain no random-stream state. Producers record already decided facts;
 * the presentation owner cannot call gameplay or repeat its decisions. */

/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').GroundItem} GroundItem */
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {{actors:Actor[],items:GroundItem[],money:number,log:string[],explored:boolean[],floor:number,tiles:number[]}} BattleWorld */
/** @typedef {'move-attract'|'move-bubble'|'move-ember'|'move-hypnosis'|'move-leech-seed'|'move-mud-slap'|'move-razor-leaf'|'move-sand-attack'|'move-smokescreen'|'move-water-gun'} EmptyTargetMoveId */
/**
 * @typedef {{kind:'action',actorId:string,action:'walk'|'wait'|'other',cameraActor?:Actor}
 * | {kind:'camera',actor:Actor,mode:'look'|'leader'|'input'}
 * | {kind:'flush'}
 * | {kind:'face',actor:Actor}
 * | {kind:'cast',actor:Actor,moveId:string,first:boolean,phase?:'release'}
 * | {kind:'target',actorId:string,moveId:string,target:Actor,phase?:'visit'|'repeat-hit',singleTile?:boolean}
 * | {kind:'empty-target',actorId:string,moveId:EmptyTargetMoveId,from:import('./mechanics-types.js').Point,to:import('./mechanics-types.js').Point,stop:'empty'|'wall'|'actor'|'outside',singleTile:boolean}
 * | {kind:'move',actor:Actor}
 * | {kind:'damage',before:Actor,after:Actor,amount:number,effectiveness:0|1|2|3,cause:'move'|'residual'|'recoil'|'hunger'|'item'|'constriction'}
 * | {kind:'survival',actorId:string}
 * | {kind:'no-damage',actor:Actor,target:Actor}
 * | {kind:'miss',target:Actor,actorId?:string,accuracy?:1|2}
 * | {kind:'heal',before:Actor,after:Actor}
 * | {kind:'heal-result',actor:Actor,amount:number}
 * | {kind:'effect',before:Actor,after:Actor,effectId?:number}
 * | {kind:'whiffer-sound',target:Actor}
 * | {kind:'poke-spin',actor:Actor}
 * | {kind:'poke-flight',from:import('./mechanics-types.js').Point,to:import('./mechanics-types.js').Point}
 * | {kind:'poke-impact',target:Actor}
 * | {kind:'poke-catch'}
 * | {kind:'poke-drop',from:import('./mechanics-types.js').Point,origin:import('./mechanics-types.js').Point,direction:import('./mechanics-types.js').Direction,landing:import('./mechanics-types.js').Point|null,placed:boolean}
 * | {kind:'poke-end',actor:Actor}
 * | {kind:'pickup',sequence:330|331|332,afterWalk:boolean}
 * | {kind:'sync',actors:Actor[],items?:GroundItem[],money?:number,afterWalk?:boolean,berryResult?:true}
 * | {kind:'faint',actor:Actor}} BattleEvent
 */

/** All nested mutable actor fields are copied. The fixed opening admission
 * bounds actors at twelve, learned slots at four and every status dictionary.
 * @param {Actor} actor @returns {Actor} */
export function captureActor(actor){
  const snapshot={...actor,stats:{...actor.stats},moves:actor.moves.map(move=>Object.freeze({...move})),
    status:{...actor.status},periodic:{...actor.periodic},stages:{...actor.stages},
    heldItem:actor.heldItem?{...actor.heldItem}:null,goal:actor.goal?{...actor.goal}:null,
    ...(actor.enabledIq?{enabledIq:[...actor.enabledIq]}:{})};
  for(const value of [snapshot.stats,snapshot.moves,snapshot.status,snapshot.periodic,snapshot.stages,snapshot.heldItem,snapshot.goal,snapshot.enabledIq])if(value)Object.freeze(value);
  return Object.freeze(snapshot);
}

/** @param {DungeonState} state @returns {GroundItem[]} */
export function captureItems(state){
  const items=state.items.map(item=>Object.freeze({...item}));
  Object.freeze(items);return items;
}

/** @param {DungeonState} state @returns {BattleWorld} */
export function captureWorld(state){
  return {actors:[state.hero,state.partner,...state.enemies.filter(actor=>actor.hp>0)].map(captureActor),
    items:captureItems(state),money:state.money,log:[...state.log],explored:[...state.explored],
    floor:state.floor,tiles:state.tiles};
}
