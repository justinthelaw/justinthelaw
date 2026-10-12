import { calculateNormalDamage } from '../domain/rules/damage.js';
import { combineTypeMatchups, isPhysicalType, lookupTypeMatchup } from '../domain/rules/type-context.js';
import { dropItem, ITEM_NAMES, moneyPile } from './mechanics-items.js';
import { moveTargets } from './mechanics-targets.js';
import { captureActor } from './battle-events.js';
import { actors, clamp, distance, draw, flushQueuedMovement, message, recordAction, recordCamera, recordSync, team, wakeInitialSleep, wakeNearbyWild, DIRECTIONS } from './mechanics-common.js';

export { moveTargets } from './mechanics-targets.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').OpeningData} OpeningData */
/** @typedef {import('./mechanics-types.js').MoveData} MoveData */
/** @typedef {import('./mechanics-types.js').MoveSlot} MoveSlot */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {import('./mechanics-types.js').Effect} Effect */
/** @typedef {import('../domain/rules/type-context.js').ElementType} ElementType */
/** One synchronous chosen move owns its awards and terminal evidence; no save fields.
 * @typedef {{awards:Map<string,number>,partnerFainted:boolean,leaderFainted:boolean,rapidSpinSucceeded?:boolean}} MoveExecution */
/** @typedef {{giveExp?:boolean,falseSwipe?:boolean,execution?:MoveExecution,cause?:'move'|'residual'|'recoil'|'hunger'|'item',effectiveness?:0|1|2|3}} DamageOptions */
const ACCURACY = [84,89,94,102,110,115,140,153,179,204,256,320,384,409,422,435,448,460,473,486,512];
const EVASION = [512,486,473,460,448,435,422,409,384,345,256,204,179,153,128,102,89,76,64,51,38];
/** Authored application messages; internal status keys are not prose.
 * @type {Readonly<Record<string,string>>} */
const STATUS_MESSAGES=Object.freeze({
  sleep:'fell asleep!',paralysis:'became paralyzed!',poisoned:'was poisoned!',
  burn:'was burned!',cringe:'began cringing!',confused:'became confused!',
  infatuated:'became infatuated!',
  'leech-seed':'was seeded!','focus-energy':'began focusing energy!',
  whiffer:'began whiffing!',bide:'began storing energy!',
  enraged:'became enraged!',reflect:'was protected by Reflect!',
});
const ACTIVE_STATUSES=new Set(Object.keys(STATUS_MESSAGES));
const STATUS_CLASSES=[['poison','burn','paralysis'],['cringe','confusion','infatuated'],['focusEnergy','whiffer'],['bide','enraged']];
/** Native direct-HP callers use these exact amounts, not CalcDamage.
 * @type {Readonly<Record<string,number|string>>} */
const DIRECT_HP_AMOUNTS=Object.freeze({'move-seismic-toss':'user.level','move-dragon-rage':65,'move-endeavor':'max(0,target.currentHP-user.currentHP)'});
const RECOIL_MOVES=new Set(['move-take-down','move-submission','move-double-edge']);
const ITEM_MOVES=new Set(['move-pay-day','move-covet']);
const VARIABLE_HIT_MOVES=new Set(['move-bone-rush','move-double-slap','move-fury-swipes']);
const ZERO_DRAW_SECONDARY_MOVES=new Set(['move-mud-slap','move-dynamic-punch']);
/** Native unk158 survives live actions but is omitted from quicksaves.
 * Actor identity makes a deserialized/new actor start at zero.
 * @type {WeakSet<Actor>} */
const secondaryGateReady=new WeakSet();
const NEGATIVE_STATUSES=['sleep','poison','burn','paralysis','cringe','confusion','infatuated','leechSeed','whiffer','slow'];
const EMPTY_TARGET_PRESENTATION_MOVES=new Set(['move-attract','move-bubble','move-ember','move-hypnosis','move-leech-seed','move-mud-slap','move-razor-leaf','move-sand-attack','move-smokescreen','move-water-gun']);
const NO_BITMAP_STATUS_HELPERS=new Set(['leech-seed','focus-energy','enraged','whiffer']);
export const STATUS_KEYS=Object.freeze([...NEGATIVE_STATUSES,'focusEnergy','bide','enraged','reflect']);
/** Scoped native visualFlags bits, used only to deduplicate activation text.
 * @type {Readonly<Record<string,number>>} */
export const ABILITY_VISUAL_FLAGS=Object.freeze({Guts:0x01,Overgrow:0x02,Blaze:0x20,Torrent:0x80});
/** New floors and explicit Continue recreate native entity gate state.
 * Ordinary saves/preferences retain these live actor identities.
 * @param {DungeonState} state */
export function resetSecondaryGates(state) { for(const actor of [state.hero,state.partner,...state.enemies])secondaryGateReady.delete(actor); }
/** Read afresh after an effect that can end the dungeon. @param {DungeonState} state */
function defeated(state) { return state.status==='defeated'; }
/** Explicit handler coverage prevents a later learned move from consuming PP
 * while silently omitting its distinctive effect. All level-five starter moves
 * and the level-one Tiny Woods encounters have complete admitted handlers.
 * @param {MoveData} move */
export function supportsMove(move) {
  if(move.id==='move-thrash'){
    const [facing,damage]=move.effects;
    return move.type==='normal'&&move.power===18&&move.pp===12&&move.accuracyBeforeEffect===125&&move.accuracyAfterDamage===78&&
      move.criticalPercent===12&&move.aiWeight===15&&move.chainedHitsRaw===3&&move.range===0&&move.target===2&&move.cutsCorners===false&&
      move.effects.length===2&&facing?.op==='choose-random-facing'&&Object.keys(facing).length===2&&facing.phase==='before-each-hit'&&
      damage?.op==='normal-damage'&&Object.keys(damage).length===1;
  }
  if(move.id==='move-skull-bash'){
    const [charge,defense,damage]=move.effects;
    return move.type==='normal'&&move.power===10&&move.pp===15&&move.accuracyBeforeEffect===125&&move.accuracyAfterDamage===100&&
      move.criticalPercent===12&&move.aiWeight===15&&move.chainedHitsRaw===1&&move.range===7&&move.target===4&&move.cutsCorners===false&&move.effects.length===3&&
      charge?.op==='charge'&&Object.keys(charge).length===3&&charge.status==='skull-bash'&&charge.turns===1&&defense?.op==='stat-stage'&&Object.keys(defense).length===4&&defense.stat==='defense'&&defense.delta===1&&defense.recipient==='user'&&
      damage?.op==='normal-damage'&&Object.keys(damage).length===2&&damage.multiplier===2;
  }
  if(move.id==='move-mud-sport'){
    const effect=move.effects[0];
    return move.type==='ground'&&move.power===2&&move.pp===17&&move.accuracyBeforeEffect===125&&move.accuracyAfterDamage===100&&
      move.criticalPercent===12&&move.aiWeight===10&&move.chainedHitsRaw===1&&move.range===7&&move.target===3&&move.cutsCorners===false&&
      move.effects.length===1&&effect?.op==='floor-sport'&&Object.keys(effect).length===5&&effect.sport==='move-dependent-mud-or-water'&&
      effect.durationBounds?.length===2&&effect.durationBounds[0]===10&&effect.durationBounds[1]===12&&
      effect.damageMultiplier?.length===2&&effect.damageMultiplier[0]===1&&effect.damageMultiplier[1]===2&&
      effect.affectedType==='electric-for-mud-fire-for-water';
  }
  if(move.id==='move-heal-bell'){
    const effect=move.effects[0];
    return move.type==='normal'&&move.power===2&&move.pp===12&&move.accuracyBeforeEffect===125&&move.accuracyAfterDamage===125&&
      move.criticalPercent===12&&move.aiWeight===15&&move.chainedHitsRaw===1&&move.range===3&&move.target===1&&move.cutsCorners===false&&
      move.effects.length===1&&effect?.op==='cure-negative-statuses'&&Object.keys(effect).length===1;
  }
  if(move.id==='move-charm'||move.id==='move-screech'){
    const effect=move.effects[0],charm=move.id==='move-charm';
    return move.type==='normal'&&move.power===2&&move.pp===22&&move.accuracyBeforeEffect===(charm?75:100)&&
      move.accuracyAfterDamage===(charm?100:88)&&move.criticalPercent===12&&move.aiWeight===15&&move.chainedHitsRaw===1&&
      move.range===(charm?0:8)&&move.target===0&&move.cutsCorners===!charm&&move.effects.length===1&&
      effect?.op==='stat-multiplier'&&Object.keys(effect).length===5&&effect.stat===(charm?'attack':'defense')&&
      effect.recipient==='target'&&effect.factor?.length===2&&effect.factor[0]===1&&effect.factor[1]===(charm?2:4)&&
      Array.isArray(effect.minimum)&&effect.minimum.length===2&&effect.minimum[0]===2&&effect.minimum[1]===256;
  }
  if(move.id==='move-foresight'){
    const [clampEvasion,expose]=move.effects;
    return move.type==='normal'&&move.power===2&&move.pp===22&&move.accuracyBeforeEffect===100&&move.accuracyAfterDamage===100&&
      move.criticalPercent===12&&move.aiWeight===15&&move.chainedHitsRaw===1&&move.range===0&&move.target===0&&move.cutsCorners===false&&move.effects.length===2&&
      clampEvasion?.op==='clamp-evasion'&&Object.keys(clampEvasion).length===2&&clampEvasion.maxStage===10&&
      expose?.op==='remove-type-immunity'&&Object.keys(expose).length===3&&expose.targetType==='ghost'&&
      expose.incomingTypes?.length===2&&expose.incomingTypes[0]==='normal'&&expose.incomingTypes[1]==='fighting';
  }
  if(move.id==='move-psych-up'){
    const effect=move.effects[0];
    return move.type==='normal'&&move.power===2&&move.pp===17&&move.accuracyBeforeEffect===125&&move.accuracyAfterDamage===125&&
      move.criticalPercent===12&&move.aiWeight===15&&move.chainedHitsRaw===1&&move.range===0&&move.target===2&&move.cutsCorners===false&&move.effects.length===1&&
      effect?.op==='copy-stat-modifiers'&&Object.keys(effect).length===3&&effect.fromActor==='target'&&effect.toActor==='user';
  }
  if(move.id==='move-rapid-spin'){
    const [normal,cleanup]=move.effects;
    return move.type==='normal'&&move.power===4&&move.pp===17&&move.accuracyBeforeEffect===125&&move.accuracyAfterDamage===90&&move.criticalPercent===12&&
      move.chainedHitsRaw===1&&move.range===0&&move.target===0&&move.cutsCorners===false&&move.aiWeight===30&&move.effects.length===2&&
      normal?.op==='normal-damage'&&Object.keys(normal).length===1&&cleanup?.op==='post-hit-rapid-spin'&&Object.keys(cleanup).length===5&&
      cleanup.phase==='after-chosen-move'&&cleanup.requires==='successful-nonzero-damage'&&cleanup.gate==='RollSecondaryEffect(user,0)'&&
      cleanup.cureStatusClasses?.length===2&&cleanup.cureStatusClasses[0]==='frozen'&&cleanup.cureStatusClasses[1]==='leech-seed';
  }
  if(move.id==='move-synthesis'){
    const effect=move.effects[0];
    return move.chainedHitsRaw===1&&move.range===7&&move.target===3&&move.accuracyBeforeEffect===125&&move.accuracyAfterDamage===125&&
      move.effects.length===1&&effect?.op==='heal'&&Object.keys(effect).length===2&&effect.amountByWeather?.clear===50;
  }
  if(VARIABLE_HIT_MOVES.has(move.id)&&move.chainedHitsRaw!==0)return false;
  if(move.id==='move-bonemerang'&&move.chainedHitsRaw!==2)return false;
  if((Object.hasOwn(DIRECT_HP_AMOUNTS,move.id)||RECOIL_MOVES.has(move.id)||ITEM_MOVES.has(move.id))&&move.chainedHitsRaw!==1)return false;
  /** @param {string|string[]|undefined} actual @param {string[]} expected */
  function conditions(actual,expected){return Array.isArray(actual)&&actual.length===expected.length&&actual.every((value,index)=>value===expected[index]);}
  /** @param {Effect} effect @returns {boolean} */
  function supports(effect) {
    if(effect.op==='normal-damage')return effect.multiplier===undefined||move.id==='move-low-kick';
    if(effect.op==='apply-status')return ACTIVE_STATUSES.has(effect.status??'');
    if(effect.op==='secondary'){
      if(!effect.effect||!supports(effect.effect))return false;
      if(effect.secondaryChanceRaw!==undefined&&(!ZERO_DRAW_SECONDARY_MOVES.has(move.id)||effect.secondaryChanceRaw!==0))return false;
      if(ZERO_DRAW_SECONDARY_MOVES.has(move.id)&&!(effect.chancePercent===100&&effect.secondaryChanceRaw===0&&effect.gate==='secondary-effect-common'))return false;
      return move.id!=='move-covet'||effect.chancePercent===100&&effect.requires==='nonzero-damage'&&effect.gate==='secondary-effect-common';
    }
    if(effect.op==='speed-stage')return (effect.delta??0)<0;
    if(effect.op==='floor-sport')return move.id==='move-water-sport';
    if(effect.op==='drop-money')return move.id==='move-pay-day'&&effect.amount===null&&conditions(effect.requires,['target-defeated','target-not-recruited']);
    if(effect.op==='take-held-item')return move.id==='move-covet'&&conditions(effect.requires,['user-empty-handed','target-has-item'])&&conditions(effect.blockedBy,['sticky-hold','alert-specs']);
    if(effect.op==='reduce-hp')return Object.hasOwn(DIRECT_HP_AMOUNTS,move.id)&&effect.amount===DIRECT_HP_AMOUNTS[move.id];
    if(effect.op==='recoil')return move.id==='move-struggle'||RECOIL_MOVES.has(move.id)&&effect.basis==='user-max-hp'&&effect.fraction?.[0]===1&&effect.fraction?.[1]===8&&effect.minimum===1&&effect.requires==='successful-nonzero-damage'&&effect.blockedBy==='rock-head';
    return ['stat-stage','drain','exclude-user','pp-cost'].includes(effect.op);
  }
  return move.effects.every(supports);
}
/** @param {OpeningData} data @param {Actor} actor @param {string} name */
export function ability(data,actor,name) { return data.species[actor.speciesId]?.abilities.includes(name) ?? false; }
/** SetVisualFlags announces only a false-to-true transition. A later inactive
 * evaluation clears the bit; unrelated move types do not evaluate a type boost.
 * @param {DungeonState} state @param {Actor} actor @param {string} name @param {boolean} active @param {GameEvent[]} events */
function announceBoost(state,actor,name,active,events) {
  const bit=ABILITY_VISUAL_FLAGS[name]??0,previous=actor.abilityVisualFlags??0;
  actor.abilityVisualFlags=active?previous|bit:previous&~bit;
  if(active&&!(previous&bit))message(state,events,`${actor.name}'s ${name} boosted its power!`);
}
/** Numerical calculation already succeeded. Preserve the native message order:
 * stat abilities, then matching-type abilities, before the second accuracy roll.
 * This never samples RNG, changes damage or infers a successful hit.
 * @param {DungeonState} state @param {Actor} actor @param {MoveData} move @param {OpeningData} data @param {GameEvent[]} events */
function announceDamageAbilities(state,actor,move,data,events) {
  if(ability(data,actor,'Guts'))announceBoost(state,actor,'Guts',NEGATIVE_STATUSES.some(key=>!!actor.status[key]),events);
  for(const [type,name] of /** @type {const} */([['water','Torrent'],['grass','Overgrow'],['fire','Blaze']])){
    if(move.type===type&&ability(data,actor,name))announceBoost(state,actor,name,actor.hp<=Math.floor(actor.maxHp/4),events);
  }
}
/** @param {string} name @returns {ElementType} */
function element(name) { return /** @type {ElementType} */(name.charAt(0).toUpperCase()+name.slice(1)); }
/** @param {OpeningData} data @param {Actor} actor @returns {[ElementType,ElementType]} */
function types(data,actor) { const p=data.species[actor.speciesId];return [element(p?.types[0]??'None'),element(p?.types[1]??'None')]; }
/** @param {OpeningData} data @param {string} id @returns {MoveSlot} */
export function moveSlot(data,id) { const m=data.moves[id];if(!m)throw new Error(`Unknown move ${id}.`);return {id,name:m.name,pp:m.pp,maxPp:m.pp,enabled:true,set:false}; }
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {number} base @param {OpeningData} data */
function hits(state,actor,target,base,data) {
  const roll=draw(state,100);
  if(actor.id===target.id)return true;
  if(actor.status.whiffer)return false;
  if(base>100)return true;
  const a=clamp((actor.stages.accuracy??10)+(ability(data,actor,'Compoundeyes')?2:0),0,20);
  const e=clamp(target.stages.evasion??10,0,20);
  return roll<Math.trunc(Math.trunc(base*(ACCURACY[a]??256)/256)*(EVASION[e]??256)/256);
}
/** @returns {MoveExecution} */
function createMoveExecution() { return {awards:new Map(),partnerFainted:false,leaderFainted:false}; }
/** Native HandleFaint retains the original partner until forced loss. This
 * applies only inside its current move, never to scheduler admission.
 * @param {Actor} actor */
function moveEntityValid(actor) { return actor.hp>0||actor.id==='partner'; }
/** IsFloorOver excludes the separate original-partner forced-loss flag.
 * Preserve that distinction locally while the public state records defeat.
 * @param {DungeonState} state @param {MoveExecution} execution */
function moveFloorOver(state,execution) { return execution.leaderFainted||state.status==='rescued'||state.status==='defeated'&&!execution.partnerFainted; }
/** AddExpPoints captures recipient eligibility and the award at the KO. The
 * original party has no experience-locked members or recruitment transitions.
 * @param {DungeonState} state @param {MoveExecution} execution @param {number} exp */
function queueExperience(state,execution,exp) {
  for(const member of [state.hero,state.partner]){
    if(!moveEntityValid(member)||member.level>=100)continue;
    const award=Math.min(9999999,member.exp+exp)-member.exp;
    if(award>0)execution.awards.set(member.id,(execution.awards.get(member.id)??0)+award);
  }
}
/** EnemyEvolution runs after all passes/handlers, in active party slot order.
 * Partner forced loss suppresses every award. A surviving partner can still
 * receive an earlier award after a later confused hit removes the leader.
 * @param {DungeonState} state @param {Actor} actor @param {MoveExecution} execution @param {OpeningData} data @param {GameEvent[]} events */
function flushExperience(state,actor,execution,data,events) {
  if(!moveEntityValid(actor)||execution.partnerFainted||state.status==='rescued'||state.status==='defeated'&&!execution.leaderFainted)return;
  for(const member of [state.hero,state.partner]){
    const exp=execution.awards.get(member.id)??0;
    if(member.hp<=0||member.level>=100||exp<=0)continue;
    member.exp=Math.min(9999999,member.exp+exp);
    message(state,events,`${member.name} gained ${exp} Exp. Points.`);
    gainLevels(state,member,data,events);recordSync(state,events,[member]);
  }
}
/** @param {DungeonState} state @param {Actor} actor @param {number} amount @param {GameEvent[]} events */
export function heal(state,actor,amount,events) {
  const before=captureActor(actor),restored=Math.min(amount,actor.maxHp-actor.hp);actor.hp+=restored;
  // Every admitted caller requests positive HP restoration and no max-HP rise.
  // HealTargetHP still invokes its effect and message when HP was already full.
  if(amount>0){
    const after=captureActor(actor);
    events.push({type:'heal',actorId:actor.id,amount:restored,presentation:{kind:'heal',before,after}});
    const text=restored===0?`${actor.name}'s HP remained unchanged.`:actor.hp===actor.maxHp?`${actor.name} was fully healed!`:`${actor.name} recovered ${restored} HP!`;
    message(state,events,text,{kind:'heal-result',actor:after,amount:restored});
  }
}
/** HandleFaint silently unlinks seed recipients before removing the source.
 * The source itself and the original HP-zero partner are still valid here.
 * Preserve the dormant source binding/countdown; Rapid Spin clears its slot.
 * @param {DungeonState} state @param {Actor} source @param {GameEvent[]} events */
function unlinkFaintedLeechSource(state,source,events) {
  /** @type {Actor[]} */const changed=[];
  for(const actor of [state.hero,state.partner,...state.enemies]){
    if((actor===source||moveEntityValid(actor))&&actor.status.leechSeed&&actor.leechSource===source.id){delete actor.status.leechSeed;changed.push(actor);}
  }
  if(changed.length)recordSync(state,events,changed);
}
/** @param {DungeonState} state @param {Actor} target @param {number} amount @param {OpeningData} data @param {GameEvent[]} events @param {Actor|null} [source] @param {DamageOptions} [options] */
export function damage(state,target,amount,data,events,source=null,options={}) {
  if(target.hp<=0)return;
  flushQueuedMovement(state,events);wakeInitialSleep(state,target,events);
  // Native final modifiers/rounding can produce zero. Its dedicated branch
  // reports no damage and does not run the damage-number/hit reaction path.
  if(amount<=0){message(state,events,`${target.name} took no damage!`,source?{kind:'no-damage',actor:captureActor(source),target:captureActor(target)}:undefined);return;}
  const before=captureActor(target);
  const loss=Math.min(target.hp,Math.max(0,amount));target.hp-=loss;
  const survived=options.falseSwipe===true&&target.hp===0;
  if(survived)target.hp=1;
  // Native damage numbers/messages use nominal damage before the HP clamp.
  const displayed=amount;
  events.push({type:'damage',actorId:source?.id,targetId:target.id,amount:displayed,presentation:{kind:'damage',before,after:captureActor(target),amount:displayed,effectiveness:options.effectiveness??2,cause:options.cause??(source?'move':'residual')}});
  message(state,events,options.cause==='recoil'?`${target.name} took ${displayed} damage from recoil!`:`${target.name} took ${displayed} damage!`);
  if(survived)message(state,events,'False Swipe prevented fainting!',{kind:'survival',actorId:target.id});
  if(target.status.bide)target.bideDamage=Math.min(999,target.bideDamage+amount);
  if(source&&target.hp>0&&target.status.enraged){const previous=captureActor(target);target.stages.attack=clamp((target.stages.attack??10)+1,0,20);recordEffect(events,previous,target,425);}
  if(target.hp>0)return;
  delete target.skullBashSlot;events.push({type:'defeat',actorId:target.id,presentation:{kind:'faint',actor:captureActor(target)}});message(state,events,options.cause==='recoil'?`${target.name} fainted from recoil!`:`${target.name} fainted!`);
  // The native drop precedes HandleFaint, including the original partner.
  // Only the leader retains its held slot for the dungeon-exit owner.
  if(target.id!=='hero'&&target.heldItem){dropItem(state,target.heldItem,target,events);target.heldItem=null;recordSync(state,events,[target],true);}
  unlinkFaintedLeechSource(state,target,events);
  if(team(target)){
    state.status='defeated';
    if(options.execution){if(target.id==='partner')options.execution.partnerFainted=true;else options.execution.leaderFainted=true;}
    return;
  }
  if(options.giveExp===false||!source||!team(source))return;
  const species=data.species[target.speciesId];
  const exp=Math.max(1,Math.floor((species?.experienceYield??0)*(target.level+9)/10/(target.experienceMarked?1:2)));
  const execution=options.execution??createMoveExecution();
  queueExperience(state,execution,exp);
  // All admitted move callers provide their shared receipt. Keep the exported
  // standalone damage helper's completed-call behavior for other consumers.
  if(!options.execution)flushExperience(state,source,execution,data,events);
}
/** @param {DungeonState} state @param {Actor} actor @param {OpeningData} data @param {GameEvent[]} events */
function gainLevels(state,actor,data,events) {
  const p=data.species[actor.speciesId];if(!p)return;
  while(actor.level<100){const row=p.growth[actor.level];if(!row||actor.exp<(row[0]??Infinity))break;
    actor.level++;const hp=row[1]??0;actor.maxHp=Math.min(999,actor.maxHp+hp);actor.hp=Math.min(actor.maxHp,actor.hp+hp);actor.stats.hp=actor.maxHp;
    for(const [i,key] of /** @type {const} */([[2,'attack'],[3,'specialAttack'],[4,'defense'],[5,'specialDefense']]))actor.stats[key]=Math.min(255,actor.stats[key]+(row[i]??0));
    message(state,events,`${actor.name} grew to Level ${actor.level}!`);events.push({type:'level',actorId:actor.id,amount:actor.level,presentation:{kind:'sync',actors:[captureActor(actor)]}});
    /** @type {string[]} */const candidates=p.learnset.filter(([level])=>level===actor.level).map(([,id])=>id).filter(id=>!actor.moves.some(m=>m.id===id));
    if(candidates.length){const id=candidates[draw(state,candidates.length)];if(id){if(actor.moves.length<4){actor.moves.push(moveSlot(data,id));message(state,events,`${actor.name} learned ${data.moves[id]?.name}!`);recordSync(state,events,[actor]);}else state.pendingLearning.push({actorId:actor.id,moveId:id});}}
  }
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {string} status @param {OpeningData} data @param {GameEvent[]} events */
function inflict(state,actor,target,status,data,events) {
  const normalized=status==='poisoned'?'poison':status==='leech-seed'?'leechSeed':status==='focus-energy'?'focusEnergy':status==='confused'?'confusion':status;
  if(target.status[normalized]){
    if(status==='whiffer'){
      const timer=data.timers.whiffer;
      // Smokescreen advances its duration draw before the status owner discovers
      // that Whiffer is already active. Later curer adjustment is draw-free,
      // and the resulting value is discarded.
      if(timer&&timer.max!==timer.min)draw(state,timer.max-timer.min+1);
      message(state,events,`${target.name} is already a whiffer!`);
    }else if(status==='sleep'){
      const timer=data.timers.sleep;
      // Basic sleep moves calculate a duration before SleepStatusTarget sees
      // existing Sleep. The discarded duration never replaces the old timer.
      if(timer&&timer.max!==timer.min)draw(state,timer.max-timer.min+1);
      const before=captureActor(target);recordEffect(events,before,target,37);
      message(state,events,`${target.name} is already asleep!`);
    }
    return;
  }
  if(status==='sleep'&&(ability(data,target,'Insomnia')||ability(data,target,'Vital Spirit')))return;
  if(status==='paralysis'&&ability(data,target,'Limber'))return;
  if(status==='infatuated'&&ability(data,target,'Oblivious'))return;
  if(normalized==='confusion'&&ability(data,target,'Own Tempo'))return;
  if(status==='burn'&&(types(data,target).includes('Fire')||ability(data,target,'Water Veil')))return;
  if(status==='cringe'&&ability(data,target,'Inner Focus'))return;
  if(status==='leech-seed'&&types(data,target).includes('Grass'))return;
  if(status==='poisoned'&&(types(data,target).includes('Poison')||types(data,target).includes('Steel')||ability(data,target,'Immunity')))return;
  const timer=data.timers[status==='poisoned'?'poison':status==='confused'?'confusion':status];
  if(!timer){message(state,events,`${target.name} was unaffected.`);return;}
  const extra=status==='sleep'?0:1;
  let duration=timer.min+(timer.max===timer.min?0:draw(state,timer.max-timer.min+1));
  if(!timer.indefinite&&NEGATIVE_STATUSES.includes(normalized)&&ability(data,target,'Natural Cure'))duration=Math.min(duration,5);
  if(status==='sleep'&&ability(data,target,'Early Bird'))duration=Math.max(1,Math.floor(duration/2));
  const turns=timer.indefinite?128:duration+extra;
  const before=captureActor(target);
  // The original stores one status per class. A fresh paralysis replaces a
  // burn, and Smokescreen replaces Focus Energy rather than stacking with it.
  for(const group of STATUS_CLASSES)if(group.includes(normalized))for(const key of group)delete target.status[key];
  if(normalized==='bide'||normalized==='enraged')delete target.skullBashSlot;
  target.status[normalized]=turns;
  if(status==='leech-seed'){target.leechSource=actor.id;target.periodic.leechSeed=0;}
  if(status==='poisoned')target.periodic.poison=0;
  if(status==='burn')target.periodic.burn=0;
  if(status==='bide')target.bideDamage=0;
  const effectId=status==='sleep'?37:status==='burn'?76:status==='cringe'?323:status==='paralysis'?423:status==='infatuated'?15:undefined;
  const result=`${target.name} ${STATUS_MESSAGES[status]??'changed status!'}`;
  // Paralysis requests its result message before PlayParalysisEffect. The
  // other admitted bitmap helpers start their effect before result text.
  // These four source-proven helpers are no-op/sound-only: they neither create
  // nor drain a bitmap. Their icon snapshot follows the result message.
  if(NO_BITMAP_STATUS_HELPERS.has(status)){
    if(status==='whiffer')events.push({type:'presentation',presentation:{kind:'whiffer-sound',target:before}});
    message(state,events,result);
    recordSync(state,events,[target]);
  }else{
    if(status==='paralysis')message(state,events,result);
    recordEffect(events,before,target,effectId);
    if(status!=='paralysis')message(state,events,result);
  }
  events.push({type:'status',actorId:target.id,text:normalized});
}
/** Native stat-effect selectors; missing exported artwork is left to presentation.
 * @type {Readonly<Record<string,readonly [number,number]>>} */
const STAT_EFFECTS={attack:[404,425],specialAttack:[403,402],defense:[399,398],accuracy:[397,396],evasion:[14,13]};
/** @param {GameEvent[]} events @param {Actor} before @param {Actor} actor @param {number} [effectId] */
function recordEffect(events,before,actor,effectId) {
  events.push({type:'presentation',presentation:{kind:'effect',before,after:captureActor(actor),...(effectId===undefined?{}:{effectId})}});
}
/** Heal Bell's native status owner clears admitted negative classes first,
 * then the independent negative-speed counters. Sealed moves and unrepresented
 * status classes remain outside this opening state rather than being invented.
 * @param {DungeonState} state @param {Actor} target @param {GameEvent[]} events */
function cureNegativeStatuses(state,target,events){
  const hadNegative=NEGATIVE_STATUSES.some(key=>!!target.status[key]);
  /** @type {string[]} */const cured=[];
  /** @param {string} key @param {string} text @param {()=>void} [cleanup] */
  const cure=(key,text,cleanup)=>{if(!target.status[key])return;delete target.status[key];cleanup?.();cured.push(key);message(state,events,text);recordSync(state,events,[target]);events.push({type:'status',actorId:target.id,text:`cured-${key}`});};
  cure('sleep',`${target.name} woke up!`);
  cure('poison',`${target.name} recovered from poison!`);
  cure('burn',`${target.name} recovered from a burn!`);
  cure('paralysis',`${target.name} recovered from paralysis!`);
  cure('confusion',`${target.name} recovered from confusion!`);
  cure('infatuated',`${target.name} got over its infatuation!`);
  cure('cringe',`${target.name} is no longer cringing!`);
  cure('leechSeed',`${target.name}'s Leech Seed wore off.`,()=>{target.leechSource=null;});
  // EndLeechSeedClassStatus releases unk8 even when the class is inactive.
  if(hadNegative&&target.leechSource!==null){target.leechSource=null;recordSync(state,events,[target]);}
  cure('whiffer',`${target.name} recovered from its Whiffer status!`);
  // Native enters the class-ending block only when MonsterHasNegativeStatus
  // was true, then SendMoveEndMessage clears the whole represented class.
  if(hadNegative)cure('focusEnergy',`${target.name} lost its Focus Energy status!`);
  // Native leaves the inactive class countdown fields intact.
  cure('slow',`${target.name} returned to normal speed!`);
  if(!cured.length){message(state,events,'But nothing happened.');return;}
  const postCure=captureActor(target);recordEffect(events,postCure,target,21);recordSync(state,events,[target]);
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {Effect} effect @param {OpeningData} data @param {GameEvent[]} events */
function applyEffect(state,actor,target,effect,data,events) {
  const recipient=effect.recipient==='user'?actor:target;
  if(effect.op==='stat-stage') {
    const stat=effect.stat==='special-attack'?'specialAttack':effect.stat==='special-defense'?'specialDefense':effect.stat;
    if(!stat)return;
    if((effect.delta??0)<0&&(ability(data,recipient,'Clear Body')||ability(data,recipient,'White Smoke')||stat==='accuracy'&&ability(data,recipient,'Keen Eye')||stat==='attack'&&ability(data,recipient,'Hyper Cutter')))return;
    const before=captureActor(recipient);
    const old=recipient.stages[stat]??10;recipient.stages[stat]=clamp(old+(effect.delta??0),0,20);
    recordEffect(events,before,recipient,STAT_EFFECTS[stat]?.[(effect.delta??0)>0?1:0]);
    message(state,events,old===recipient.stages[stat]?`${recipient.name}'s ${stat} can't go any further.`:`${recipient.name}'s ${stat} ${effect.delta&&effect.delta>0?'rose':'fell'}!`);
  } else if(effect.op==='apply-status'&&effect.status)inflict(state,actor,recipient,effect.status,data,events);
  else if(effect.op==='speed-stage'){
    // All admitted actors have base stage one. LowerSpeed refuses a further
    // reduction at stage zero, without drawing or refreshing a duration.
    if(recipient.status.slow||recipient.status.paralysis)message(state,events,`${recipient.name}'s Movement Speed cannot fall further.`);
    else{const before=captureActor(recipient);recipient.status.slow=7+draw(state,2);recordEffect(events,before,recipient,394);message(state,events,`${recipient.name}'s Movement Speed fell!`);}
  }
}
/** Native s24_8 multiplication rounds from bit seven before the Q8 shift.
 * The selected stat-multiplier records clamp to 0.01, encoded as Q8 value 2.
 * @param {number} value @param {number} factor */
function multiplyQ8(value,factor){return Math.max(2,Math.floor((value*factor+128)/256));}
/** Historical opening saves have none of these four fields. Upgrade the live
 * actor coherently before the first multiplier mutation so its next save does
 * not contain a partial shape. Validation continues to reject partial input.
 * @param {Actor} actor */
function initializeMultipliers(actor){
  if(actor.physicalOffenseMultiplierQ8===undefined){
    actor.physicalOffenseMultiplierQ8=256;actor.specialOffenseMultiplierQ8=256;
    actor.physicalDefenseMultiplierQ8=256;actor.specialDefenseMultiplierQ8=256;
  }
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {MoveData} move @param {OpeningData} data @param {GameEvent[]} events @param {{effectiveness:0|1|2|3}} [visual] */
function damageAmount(state,actor,target,move,data,events,visual) {
  const physical=isPhysicalType(element(move.type)),a=actor.stats,t=target.stats,regular=move.id==='regular-attack';
  let multiplier=regular?128:move.id==='move-skull-bash'?512:256;
  if(move.id==='move-low-kick')multiplier=data.species[target.speciesId]?.lowKickMultiplier??256;
  const armored=ability(data,target,'Battle Armor')||ability(data,target,'Shell Armor');
  const result=calculateNormalDamage({
    type:{moveType:element(move.type),attackerTypes:types(data,actor),defenderTypes:types(data,target),defenderExposed:false,abilities:{wonderGuard:false,torrent:ability(data,actor,'Torrent'),overgrow:ability(data,actor,'Overgrow'),blaze:ability(data,actor,'Blaze')},attackerHp:actor.hp,attackerMaxHp:actor.maxHp,mudSport:(state.mudSport??0)>0,waterSport:state.waterSport>0,charging:false},
    stats:{rawOffense:physical?a.attack:a.specialAttack,rawDefense:physical?t.defense:t.specialDefense,movePower:move.power,offenseStage:actor.stages[physical?'attack':'specialAttack']??10,defenseStage:target.stages[physical?'defense':'specialDefense']??10,offensiveMultiplierQ8:(physical?actor.physicalOffenseMultiplierQ8:actor.specialOffenseMultiplierQ8)??256,defensiveMultiplierQ8:(physical?target.physicalDefenseMultiplierQ8:target.specialDefenseMultiplierQ8)??256,flashFireBoost:0,skullBash:physical&&target.skullBashSlot!==undefined,abilities:{guts:ability(data,actor,'Guts'),attackerNegativeStatus:NEGATIVE_STATUSES.some(key=>!!actor.status[key])}},
    critical:{moveChance:move.criticalPercent,focusEnergy:!!actor.status.focusEnergy,typeAdvantageMaster:false,battleArmor:armored,shellArmor:false},teamMember:team(actor),leader:actor.id==='hero',integerBelly:Math.floor(actor.belly),level:actor.level,regularAttack:regular,targetEffectsApply:true,reflect:!!target.status.reflect,lightScreen:false,moveEffectMultiplierQ8:multiplier,
    rolls:actor.id!=='hero'&&Math.floor(actor.belly)===0?null:{sharedPowerRoll:draw(state,100),criticalRoll:armored?null:draw(state,100),varianceRoll:draw(state,16384)},
  });
  // Native early one-damage branches bypass both ability-flag evaluators.
  // Accuracy 1 / absent-target failures never reach this function at all.
  if(result.earlyReason===null)announceDamageAbilities(state,actor,move,data,events);
  if(visual)visual.effectiveness=result.type.matchup==='little'?0:result.type.matchup==='resist'?1:result.type.matchup==='super'?3:2;
  return result.damage;
}
/** Damage handling samples contact flags before a move's secondary/recoil owner;
 * TriggerTargetAbilityEffect applies them only after that owner returns.
 * @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {MoveData} move @param {OpeningData} data */
function sampleContactReactions(state,actor,target,move,data) {
  const contact=distance(actor,target)===1&&isPhysicalType(element(move.type))&&!target.status.sleep&&!target.status.bide&&!target.status.enraged;
  const staticReaction=contact&&ability(data,target,'Static')&&draw(state,100)<12;
  const charmReaction=contact&&ability(data,target,'Cute Charm')&&draw(state,100)<12;
  return {staticReaction,charmReaction};
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {{staticReaction:boolean,charmReaction:boolean}} reactions @param {OpeningData} data @param {GameEvent[]} events */
function triggerContactReactions(state,actor,target,reactions,data,events) {
  if(reactions.staticReaction){message(state,events,`${target.name}'s Static activated!`);inflict(state,target,actor,'paralysis',data,events);}
  if(reactions.charmReaction){message(state,events,`${target.name}'s Cute Charm activated!`);inflict(state,target,actor,'infatuated',data,events);}
}
/** sub_806F370's three admitted move callers bypass numerical modifiers and
 * accuracy 2. Only Wonder Guard checks type matchups; it never scales damage.
 * Endeavor passes giveExp=false, unlike Seismic Toss and Dragon Rage.
 * @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {MoveData} move @param {OpeningData} data @param {GameEvent[]} events @param {MoveExecution} execution */
function resolveDirectHp(state,actor,target,move,data,events,execution) {
  let amount=move.id==='move-seismic-toss'?actor.level:move.id==='move-dragon-rage'?65:Math.max(0,target.hp-actor.hp);
  if(ability(data,target,'Wonder Guard')){
    const [first,second]=types(data,target),moveType=element(move.type);
    if(combineTypeMatchups(lookupTypeMatchup(moveType,first,false),lookupTypeMatchup(moveType,second,false))!=='super')amount=0;
  }
  if(amount>0&&!team(target))target.experienceMarked=true;
  damage(state,target,amount,data,events,actor,{giveExp:move.id!=='move-endeavor',execution});
  if(amount>0&&target.hp>0&&moveEntityValid(actor)&&!moveFloorOver(state,execution)){
    const reactions=sampleContactReactions(state,actor,target,move,data);
    triggerContactReactions(state,actor,target,reactions,data,events);
  }
}
/** ThiefAction uses sub_805727C(user, target, 0): no percentage draw. The
 * caller already requires successful damage and a living target/active floor.
 * Alert Specs and equipment update effects cannot occur in the opening item union.
 * @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {OpeningData} data @param {GameEvent[]} events */
function takeHeldItem(state,actor,target,data,events) {
  if(ability(data,target,'Shield Dust')||ability(data,target,'Sticky Hold'))return;
  if(actor.heldItem){message(state,events,`${actor.name} is already holding an item.`);return;}
  const item=target.heldItem;
  if(!item){message(state,events,`${target.name} has no held item.`);return;}
  actor.heldItem={...item};target.heldItem=null;
  wakeNearbyWild(state,events);actor.experienceMarked=true;recordSync(state,events,[actor,target]);
  const name=item.kind==='poke'?`${item.amount} Poké`:ITEM_NAMES[item.kind];
  // This is a held-item transfer, not a pickup or a wallet deposit.
  message(state,events,`${actor.name} took ${name} from ${target.name}.`);
}
/** Shared one-hit resolution. The caller owns accuracy 1, target selection and
 * hit count; the numerical draws still precede accuracy 2, as in the source.
 * @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {MoveData} move @param {OpeningData} data @param {GameEvent[]} events @param {MoveExecution} execution */
function resolveDamagingHit(state,actor,target,move,data,events,execution) {
  /** @type {{effectiveness:0|1|2|3}} */const visual={effectiveness:2};
  const amount=damageAmount(state,actor,target,move,data,events,visual);
  if(!hits(state,actor,target,move.accuracyAfterDamage,data)){message(state,events,`${actor.name}'s attack missed!`,{kind:'miss',actorId:actor.id,accuracy:2,target:captureActor(target)});return;}
  if(amount>0&&move.id!=='regular-attack'&&!team(target))target.experienceMarked=true;
  damage(state,target,amount,data,events,actor,{execution,falseSwipe:move.id==='move-false-swipe',effectiveness:visual.effectiveness});
  /** @type {{staticReaction:boolean,charmReaction:boolean}|null} */
  let reactions=null;
  if(amount>0&&target.hp>0&&moveEntityValid(actor)&&!moveFloorOver(state,execution)){
    // Contact checks precede move-specific secondary effects. Their
    // effects apply afterward, using the original defender's state.
    reactions=sampleContactReactions(state,actor,target,move,data);
  }
  // Rapid Spin's chance-zero user gate still succeeds after a target KO.
  if(amount>0&&move.id==='move-rapid-spin'&&moveEntityValid(actor))execution.rapidSpinSucceeded=true;
  // Absorb's nominal-damage healing occurs inside its handler, before the
  // queued contact effects and before any whole-move EXP or level-up healing.
  if(amount>0&&moveEntityValid(actor)&&move.effects.some(effect=>effect.op==='drain')){if(!team(actor))actor.experienceMarked=true;heal(state,actor,Math.max(1,Math.floor(amount/2)),events);}
  if(amount>0&&move.id==='move-metal-claw'&&actor.hp>0&&secondaryGateReady.has(actor)&&!moveFloorOver(state,execution)){
    // sub_805727C(user, user, 10) checks the user's native unk158/HP.
    // Neither a defeated defender nor its Shield Dust blocks this self effect.
    const secondary=move.effects.find(effect=>effect.op==='secondary');
    if(secondary?.effect&&draw(state,100)<(secondary.chancePercent??0)){
      applyEffect(state,actor,actor,secondary.effect,data,events);actor.experienceMarked=true;
    }
  }
  if(amount>0&&target.hp>0&&moveEntityValid(actor)&&!moveFloorOver(state,execution)){
    if(move.id==='move-covet')takeHeldItem(state,actor,target,data,events);
    else if(move.id!=='move-metal-claw')for(const effect of move.effects){
      if(effect.op!=='secondary'||!effect.effect)continue;
      // Only projected native chance-zero callers bypass the percentage draw.
      const succeeds=effect.secondaryChanceRaw===0||draw(state,100)<(effect.chancePercent??0);
      if(succeeds&&!ability(data,target,'Shield Dust'))applyEffect(state,actor,target,effect.effect,data,events);
    }
  }
  if(amount>0&&RECOIL_MOVES.has(move.id)&&moveEntityValid(actor)){
    // Native RollSecondaryEffect(user, 0) checks validity without an RNG draw.
    // Recoil still follows a target KO, before queued contact abilities fire.
    if(!ability(data,actor,'Rock Head'))damage(state,actor,Math.max(1,Math.floor(actor.maxHp/8)),data,events,actor,{giveExp:false,execution,cause:'recoil'});
  }
  // Struggle uses regular residual text and no Rock Head exemption. Its
  // quarter-HP recoil also precedes contact activation and queued EXP.
  if(amount>0&&move.id==='move-struggle'&&moveEntityValid(actor))damage(state,actor,Math.max(1,Math.floor(actor.maxHp/4)),data,events,actor,{giveExp:false,execution,cause:'residual'});
  // The original partner retains a valid fainted entity; Pay Day therefore
  // cannot turn a confused partner KO into money. Wild foes are not recruited.
  if(amount>0&&move.id==='move-pay-day'&&moveEntityValid(actor)&&target.hp<=0&&target.id!=='partner'){
    dropItem(state,{kind:'poke',amount:moneyPile(state)},target,events);recordSync(state,events,[],true);
  }
  // The outer target owner activates sampled flags only after the move handler.
  if(reactions&&moveEntityValid(actor)&&!moveFloorOver(state,execution))triggerContactReactions(state,actor,target,reactions,data,events);
}
/** The native raw hit count is selected before the first target/accuracy pass.
 * Every pass owns its blocker check, target scan, cast and target resolution;
 * ordinary misses do not cancel later passes. PP/use text belong to the action.
 * @param {DungeonState} state @param {Actor} actor @param {number|'struggle'|null} slot @param {OpeningData} data @param {GameEvent[]} events */
export function attack(state,actor,slot,data,events) {
  // Action execution randomizes in native direction order before wrapper/PP checks.
  if(actor.status.confusion)actor.direction=DIRECTIONS[(8-draw(state,8))&7]??'s';
  recordAction(events,actor.id,'other',actor);
  flushQueuedMovement(state,events);
  const learned=typeof slot==='number'?actor.moves[slot]:null,move=data.moves[slot==='struggle'?'move-struggle':learned?.id??'regular-attack'];if(!move)return;
  const skullRelease=typeof slot==='number'&&actor.skullBashSlot===slot&&learned?.id==='move-skull-bash';
  if(actor.status.sleep||actor.status.paralysis||actor.status.cringe||actor.status.infatuated){message(state,events,`${actor.name} can't attack!`);if(skullRelease){delete actor.skullBashSlot;recordSync(state,events,[actor]);}return;}
  if(!supportsMove(move)){message(state,events,`${move.name} is not yet available in this browser remake.`);return;}
  if(learned&&!skullRelease){if(learned.pp<=0){message(state,events,`${move.name} has no PP left!`);return;}learned.pp--;actor.usedMove=true;}
  if(move.id==='move-skull-bash'&&!skullRelease){
    events.push({type:'attack',actorId:actor.id,moveId:move.id,presentation:{kind:'cast',actor:captureActor(actor),moveId:move.id,first:true}});
    message(state,events,`${actor.name} used ${move.name}!`);delete actor.status.bide;delete actor.status.enraged;actor.bideDamage=0;actor.skullBashSlot=/** @type {number} */(slot);recordSync(state,events,[actor]);message(state,events,`${actor.name} lowered its head!`);return;
  }
  const execution=createMoveExecution(),passes=move.chainedHitsRaw===0?2+draw(state,4):move.chainedHitsRaw;
  const activeMove=skullRelease?{...move,range:0,target:0,effects:[{op:'normal-damage',multiplier:2}]}:move;
  const damaging=activeMove.effects.some(effect=>effect.op==='normal-damage');
  let foundTarget=false;
  for(let pass=0;pass<passes;pass++){
    // CannotAttack runs per pass, not between members of one area target list.
    // The opening excludes frozen/wrapped/paused/runaway status classes.
    if(!moveEntityValid(actor)||moveFloorOver(state,execution)||actor.status.sleep||actor.status.paralysis||actor.status.cringe||actor.status.infatuated)break;
    // Thrash rerolls native facing after each pass's blocker check, even when
    // the new front tile is empty. The action-level confusion draw is separate.
    if(move.id==='move-thrash')actor.direction=DIRECTIONS[(8-draw(state,8))&7]??'s';
    /** @type {import('./mechanics-targets.js').MoveTrace} */
    const trace={};
    const targets=moveTargets(state,actor,activeMove,trace);
    // Native direct/front scans stop before a later empty cast. Line projectiles
    // trace after casting and can still execute their later empty pass.
    if(pass>0&&!targets.length&&activeMove.range!==5&&move.id!=='move-thrash')break;
    events.push({type:'attack',actorId:actor.id,targetId:targets[0]?.id,moveId:move.id,presentation:{kind:'cast',actor:captureActor(actor),moveId:move.id,first:pass===0,...(skullRelease?{phase:'release'}:{})}});
    if(pass===0)message(state,events,move.id!=='regular-attack'?`${actor.name} used ${move.name}!`:`${actor.name} attacked!`);
    // The native first-team request follows cast handling, before travel.
    // Line targeting has no pre-collected target at this source boundary.
    if(activeMove.range!==5&&trace.firstTeamTarget)recordCamera(events,trace.firstTeamTarget,'look');
    if(!targets.length){
      if(EMPTY_TARGET_PRESENTATION_MOVES.has(move.id)&&trace.to&&trace.stop)events.push({type:'presentation',presentation:{kind:'empty-target',actorId:actor.id,moveId:/** @type {import('./battle-events.js').EmptyTargetMoveId} */(move.id),from:{x:actor.x,y:actor.y},to:{...trace.to},stop:trace.stop,singleTile:activeMove.range!==5}});
      continue;
    }
    foundTarget=true;
    for(const target of targets){
      if(!moveEntityValid(actor)||moveFloorOver(state,execution))break;
      if(target.hp<=0)continue;
      events.push({type:'presentation',presentation:{kind:'target',actorId:actor.id,moveId:move.id,target:captureActor(target),phase:'visit',singleTile:activeMove.range!==5}});
      wakeInitialSleep(state,target,events);
      if(!hits(state,actor,target,move.accuracyBeforeEffect,data)){message(state,events,`${target.name} avoided the move!`,{kind:'miss',actorId:actor.id,accuracy:1,target:captureActor(target)});continue;}
      // Native unk158 is set after accuracy 1, before the handler.
      secondaryGateReady.add(target);
      if(move.id==='move-mud-sport'||move.id==='move-water-sport'){
        // AccuracyCalc draws even for an always-hit self target, before this
        // shared handler's duration draw. Keep one duration/end-beat owner.
        const duration=11+draw(state,2);
        if(move.id==='move-mud-sport'){state.mudSport=duration;message(state,events,'Mud Sport came into effect!');}
        else{state.waterSport=duration;message(state,events,'Fire-type moves were weakened!');}
        continue;
      }
      // Exact Tiny Woods admission requires clear weather; no weather-changing
      // move is enabled. Reuse HealTargetHP's existing receipt and result owner.
      if(move.id==='move-synthesis'){heal(state,target,50,events);continue;}
      if(Object.hasOwn(DIRECT_HP_AMOUNTS,move.id)){resolveDirectHp(state,actor,target,move,data,events,execution);continue;}
      if(damaging)resolveDamagingHit(state,actor,target,activeMove,data,events,execution);
      else{
        // ACCURACY_2 belongs to damaging moves only. Native status handlers
        // return success even when an immunity or stat cap prevents a change.
        if(move.id!=='regular-attack'&&!team(target))target.experienceMarked=true;
        if(move.effects.some(effect=>effect.op==='exclude-user')&&target.id===actor.id)continue;
        if(move.id==='move-heal-bell'){
          cureNegativeStatuses(state,target,events);
        }else if(move.id==='move-foresight'){
          // The closed roster has no Ghost type, type changes or Safeguard.
          // sub_8041DD8 selects effect 14 for non-Ghost targets, even when
          // no boosted evasion needed resetting. Effect 122 is Ghost-only.
          const before=captureActor(target),evasive=(target.stages.evasion??10)>10;
          if(evasive)target.stages.evasion=10;
          recordEffect(events,before,target,14);
          if(evasive)message(state,events,`${target.name}'s Evasion returned to normal!`);
          message(state,events,`${target.name} isn't a Ghost type!`);
        }else if(move.id==='move-psych-up'){
          actor.stages={...target.stages};
          actor.physicalOffenseMultiplierQ8=target.physicalOffenseMultiplierQ8??256;
          actor.specialOffenseMultiplierQ8=target.specialOffenseMultiplierQ8??256;
          actor.physicalDefenseMultiplierQ8=target.physicalDefenseMultiplierQ8??256;
          actor.specialDefenseMultiplierQ8=target.specialDefenseMultiplierQ8??256;
          recordSync(state,events,[actor]);
          message(state,events,'It psyched itself up!');
        }else if(move.id==='move-charm'||move.id==='move-screech'){
          // Mist, Twist Band, Clear Body, White Smoke and Hyper Cutter are all
          // outside the selected roster/state/item surface.
          const before=captureActor(target),stat=move.id==='move-charm'?'Attack':'Defense';
          initializeMultipliers(target);
          const old=(move.id==='move-charm'?target.physicalOffenseMultiplierQ8:target.physicalDefenseMultiplierQ8)??256;
          if(move.id==='move-charm')target.physicalOffenseMultiplierQ8=multiplyQ8(old,128);
          else target.physicalDefenseMultiplierQ8=multiplyQ8(old,64);
          const current=move.id==='move-charm'?target.physicalOffenseMultiplierQ8:target.physicalDefenseMultiplierQ8;
          // Native starts the down effect before multiplying and comparing.
          recordEffect(events,before,target,move.id==='move-charm'?404:399);recordSync(state,events,[target]);
          message(state,events,old===current?`${target.name}'s ${stat} remained unchanged!`:`${target.name}'s ${stat} fell!`);
        }else for(const effect of move.effects)applyEffect(state,actor,target,effect,data,events);
      }
    }
  }
  if(!foundTarget)message(state,events,'There was no target.');
  // Chosen-move cleanup follows contact activation, even after floor loss.
  // Frozen/Destiny Bond classes are absent from the opening's saved statuses.
  if(execution.rapidSpinSucceeded&&moveEntityValid(actor)){
    if(actor.status.leechSeed)message(state,events,`${actor.name}'s Leech Seed wore off.`);
    delete actor.status.leechSeed;actor.leechSource=null;
    recordSync(state,events,[actor]);
  }
  flushExperience(state,actor,execution,data,events);
  if(skullRelease){delete actor.skullBashSlot;recordSync(state,events,[actor]);}
}
/** Resolve Skull Bash's bide-class status at one actor opportunity.
 * Timed blockers preserve it; confusion interrupts it before selection.
 * @param {DungeonState} state @param {Actor} actor @param {GameEvent[]} events
 * @returns {'preserve'|'cancel'|number|null} */
export function skullBashOpportunity(state,actor,events){
  if(actor.skullBashSlot===undefined)return null;
  const slot=actor.skullBashSlot;
  if(!Number.isInteger(slot)||slot<0||slot>3||actor.moves[slot]?.id!=='move-skull-bash'){delete actor.skullBashSlot;recordSync(state,events,[actor]);return 'cancel';}
  if(actor.status.sleep||actor.status.freeze||actor.status.infatuated)return 'preserve';
  if(actor.status.confusion){delete actor.skullBashSlot;message(state,events,`${actor.name}'s move was interrupted!`);recordSync(state,events,[actor]);return 'cancel';}
  return slot;
}

/** Native beginning-of-opportunity timers and HP accumulator, followed by source
 * blocking classes. Autonomous scheduler differences remain documented.
 * Swapping supplies its already-selected Walk and does not report an AI block.
 * @param {DungeonState} state @param {Actor} actor @param {OpeningData} data @param {GameEvent[]} events @param {boolean} [reportBlocked] */
export function beginTurn(state,actor,data,events,reportBlocked=true) {
  if(actor.hp<=0)return false;
  try {
    if(team(actor)&&actor.belly>0&&!actor.status.poison){const rate=clamp(data.species[actor.speciesId]?.regenerationRate??100,30,500);actor.regen+=actor.maxHp;actor.hp=Math.min(actor.maxHp,actor.hp+Math.floor(actor.regen/rate));actor.regen%=rate;}
    for(const key of Object.keys(actor.status)){if(key==='bide'||key==='enraged')continue;const value=actor.status[key]??0;if(value>0&&value!==127){actor.status[key]=value-1;if(actor.status[key]===0){delete actor.status[key];if(key==='leechSeed')actor.leechSource=null;
      if(key==='sleep')message(state,events,`${actor.name} woke up!`);
      if(key==='infatuated')message(state,events,`${actor.name} is no longer infatuated.`);
      if(key==='paralysis')message(state,events,`${actor.name} recovered from paralysis.`);
      if(key==='slow')message(state,events,`${actor.name}'s Movement Speed returned to normal.`);
    }}}
    if(actor.status.sleep||actor.status.infatuated){if(reportBlocked&&!(actor.status.sleep===127&&!team(actor)))message(state,events,`${actor.name} can't move!`);return false;}
    if(actor.status.bide){if(reportBlocked)message(state,events,`${actor.name} is storing energy!`);return false;}
    return true;
  } finally {
    recordSync(state,events,[actor]);
  }
}

/** Residual damage and the Bide/Rage class belong after an actor's action.
 * The scoped scheduler still uses one actor opportunity per browser turn.
 * @param {DungeonState} state @param {Actor} actor @param {OpeningData} data @param {GameEvent[]} events */
export function finishTurn(state,actor,data,events) {
  if(actor.hp<=0||defeated(state))return;
  try {
    if(actor.id==='hero'){
      // Native fractional Belly decrement is 100 thousandths, then an empty
      // integer Belly is clamped to zero before its one point of hunger damage.
      actor.belly=Math.max(0,(Math.round(actor.belly*1000)-100)/1000);
      if(actor.belly<1){actor.belly=0;damage(state,actor,1,data,events,null,{cause:'hunger'});}
    }
    if(actor.hp<=0||defeated(state))return;
    if(actor.status.poison&&--actor.periodic.poison<=0){actor.periodic.poison=10;damage(state,actor,4,data,events);}
    if(actor.status.burn&&--actor.periodic.burn<=0){actor.periodic.burn=20;damage(state,actor,5,data,events);}
    if(actor.hp<=0||defeated(state))return;
    if(actor.status.leechSeed&&--actor.periodic.leechSeed<=0){
      const source=actors(state).find(a=>a.id===actor.leechSource);actor.periodic.leechSeed=2;
      if(!source){delete actor.status.leechSeed;actor.leechSource=null;}
      else{damage(state,actor,10,data,events);if(!defeated(state))heal(state,source,10,events);}
    }
    if(actor.hp<=0||defeated(state))return;
    if(actor.status.enraged&&--actor.status.enraged===0)delete actor.status.enraged;
    if(!actor.status.bide||--actor.status.bide>0)return;
    delete actor.status.bide;
    const amount=Math.min(999,actor.bideDamage*2);actor.bideDamage=0;
    if(actor.status.sleep||actor.status.paralysis||actor.status.cringe||actor.status.infatuated)return;
    const release=data.moves['bide-release'];if(!release)return;
    recordAction(events,actor.id,'other');
    flushQueuedMovement(state,events);
    /** @type {import('./mechanics-targets.js').MoveTrace} */const trace={};
    const target=moveTargets(state,actor,release,trace)[0];
    events.push({type:'attack',actorId:actor.id,targetId:target?.id,moveId:release.id,presentation:{kind:'cast',actor:captureActor(actor),moveId:release.id,first:true}});
    message(state,events,`${actor.name} released its stored energy!`);
    if(release.range!==5&&trace.firstTeamTarget)recordCamera(events,trace.firstTeamTarget,'look');
    if(target){events.push({type:'presentation',presentation:{kind:'target',actorId:actor.id,moveId:release.id,target:captureActor(target),phase:'visit'}});wakeInitialSleep(state,target,events);}
    let missed=false;
    if(!target||(missed=!hits(state,actor,target,release.accuracyBeforeEffect,data))){message(state,events,'But it had no effect.',missed&&target?{kind:'miss',actorId:actor.id,accuracy:1,target:captureActor(target)}:undefined);return;}
    secondaryGateReady.add(target);
    if(amount>0&&!team(target))target.experienceMarked=true;
    // Native Bide release uses Fighting direct damage with contact enabled.
    // Its outer target owner activates flags before end-turn queued EXP.
    const execution=createMoveExecution();
    damage(state,target,amount,data,events,actor,{execution});
    if(amount>0&&target.hp>0&&moveEntityValid(actor)&&!moveFloorOver(state,execution)){
      const reactions=sampleContactReactions(state,actor,target,release,data);
      triggerContactReactions(state,actor,target,reactions,data,events);
    }
    flushExperience(state,actor,execution,data,events);
  } finally {
    recordSync(state,events,[actor]);
  }
}
