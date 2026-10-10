import { calculateNormalDamage } from '../domain/rules/damage.js';
import { isPhysicalType } from '../domain/rules/type-context.js';
import { actors, actorAt, canStep, clamp, distance, draw, inSight, message, open, team, DIRECTIONS, VECTORS } from './mechanics-common.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').OpeningData} OpeningData */
/** @typedef {import('./mechanics-types.js').MoveData} MoveData */
/** @typedef {import('./mechanics-types.js').MoveSlot} MoveSlot */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {import('./mechanics-types.js').Effect} Effect */
/** @typedef {import('../domain/rules/type-context.js').ElementType} ElementType */
const ACCURACY = [84,89,94,102,110,115,140,153,179,204,256,320,384,409,422,435,448,460,473,486,512];
const EVASION = [512,486,473,460,448,435,422,409,384,345,256,204,179,153,128,102,89,76,64,51,38];
const ACTIVE_STATUSES=new Set(['sleep','paralysis','poisoned','burn','cringe','confused','confusion','infatuated','leech-seed','focus-energy','whiffer','bide','enraged','reflect']);
const STATUS_CLASSES=[['poison','burn','paralysis'],['cringe','confusion','infatuated'],['focusEnergy','whiffer'],['bide','enraged']];
const NEGATIVE_STATUSES=['sleep','poison','burn','paralysis','cringe','confusion','infatuated','leechSeed','whiffer','slow'];
export const STATUS_KEYS=Object.freeze([...NEGATIVE_STATUSES,'focusEnergy','bide','enraged','reflect']);
/** Read afresh after an effect that can end the dungeon. @param {DungeonState} state */
function defeated(state) { return state.status==='defeated'; }
/** Explicit handler coverage prevents a later learned move from consuming PP
 * while silently omitting its distinctive effect. All level-five starter moves
 * and the level-one Tiny Woods encounters have complete admitted handlers.
 * @param {MoveData} move */
export function supportsMove(move) {
  /** @param {Effect} effect @returns {boolean} */
  function supports(effect) {
    if(effect.op==='normal-damage')return effect.multiplier===undefined||move.id==='move-low-kick';
    if(effect.op==='apply-status')return ACTIVE_STATUSES.has(effect.status??'');
    if(effect.op==='secondary')return !!effect.effect&&supports(effect.effect);
    if(effect.op==='speed-stage')return (effect.delta??0)<0;
    if(effect.op==='floor-sport')return move.id==='move-water-sport';
    if(effect.op==='recoil')return move.id==='move-struggle';
    return ['stat-stage','drain','exclude-user','pp-cost'].includes(effect.op);
  }
  return move.effects.every(supports);
}
/** @param {OpeningData} data @param {Actor} actor @param {string} name */
export function ability(data,actor,name) { return data.species[actor.speciesId]?.abilities.includes(name) ?? false; }
/** @param {string} name @returns {ElementType} */
function element(name) { return /** @type {ElementType} */(name.charAt(0).toUpperCase()+name.slice(1)); }
/** @param {OpeningData} data @param {Actor} actor @returns {[ElementType,ElementType]} */
function types(data,actor) { const p=data.species[actor.speciesId];return [element(p?.types[0]??'None'),element(p?.types[1]??'None')]; }
/** @param {OpeningData} data @param {string} id @returns {MoveSlot} */
export function moveSlot(data,id) { const m=data.moves[id];if(!m)throw new Error(`Unknown move ${id}.`);return {id,name:m.name,pp:m.pp,maxPp:m.pp,enabled:true,set:false}; }
/** @param {DungeonState} state @param {Actor} actor @param {MoveData} move @returns {Actor[]} */
export function moveTargets(state,actor,move) {
  const all=actors(state),confused=!!actor.status.confusion;
  const eligible=/** @param {Actor} target */target=>confused||(move.target===6?team(target)===team(actor)&&target.id!==actor.id:team(target)!==team(actor));
  if(move.range===7)return [actor];
  if(move.range===3)return all.filter(a=>eligible(a)&&inSight(state,actor,a));
  if(move.range===2)return all.filter(a=>a.id!==actor.id&&eligible(a)&&distance(actor,a)<=1);
  const [dx,dy]=VECTORS[actor.direction],limit=move.range===5?10:move.range===4?2:1;
  for(let n=1;n<=limit;n++) {
    const x=actor.x+dx*n,y=actor.y+dy*n;
    // Projectile and two-tile moves check destination terrain, while a regular
    // adjacent attack also checks the two walls alongside a diagonal.
    if(!open(state,x,y))return [];
    if(move.range===0&&!move.cutsCorners&&!canStep(state,actor,dx,dy))return [];
    const target=actorAt(state,x,y);
    if(target){if(eligible(target)||move.range===5&&move.target===2)return [target];if(move.range!==4)return [];}
  }
  return [];
}
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
/** @param {DungeonState} state @param {Actor} actor @param {number} amount @param {GameEvent[]} events */
export function heal(state,actor,amount,events) { const restored=Math.min(amount,actor.maxHp-actor.hp);actor.hp+=restored;if(restored>0){events.push({type:'heal',actorId:actor.id,amount:restored});message(state,events,`${actor.name} recovered ${restored} HP.`);} }
/** @param {DungeonState} state @param {Actor} target @param {number} amount @param {OpeningData} data @param {GameEvent[]} events @param {Actor|null} [source] */
export function damage(state,target,amount,data,events,source=null) {
  if(target.hp<=0)return;
  // Native final modifiers/rounding can produce zero. Its dedicated branch
  // reports no damage and does not run the damage-number/hit reaction path.
  if(amount<=0){message(state,events,`${target.name} took no damage!`);return;}
  const loss=Math.min(target.hp,Math.max(0,amount));target.hp-=loss;
  events.push({type:'damage',actorId:source?.id,targetId:target.id,amount:loss});
  message(state,events,`${target.name} took ${loss} damage!`);
  if(target.status.bide)target.bideDamage=Math.min(999,target.bideDamage+amount);
  if(source&&target.status.enraged&&loss>0)target.stages.attack=clamp((target.stages.attack??10)+1,0,20);
  if(target.hp>0)return;
  events.push({type:'defeat',actorId:target.id});message(state,events,`${target.name} fainted!`);
  if(team(target)){state.status='defeated';return;}
  if(target.heldItem){state.items.push({id:`item-${state.nextId++}`,x:target.x,y:target.y,...target.heldItem});target.heldItem=null;}
  if(!source||!team(source))return;
  const species=data.species[target.speciesId];
  const exp=Math.max(1,Math.floor((species?.experienceYield??0)*(target.level+9)/10/(target.experienceMarked?1:2)));
  message(state,events,`The team gained ${exp} Exp. Points.`);
  for(const member of [state.hero,state.partner]){if(member.hp>0&&member.level<100){member.exp=Math.min(9999999,member.exp+exp);gainLevels(state,member,data,events);}}
}
/** @param {DungeonState} state @param {Actor} actor @param {OpeningData} data @param {GameEvent[]} events */
function gainLevels(state,actor,data,events) {
  const p=data.species[actor.speciesId];if(!p)return;
  while(actor.level<100){const row=p.growth[actor.level];if(!row||actor.exp<(row[0]??Infinity))break;
    actor.level++;const hp=row[1]??0;actor.maxHp=Math.min(999,actor.maxHp+hp);actor.hp=Math.min(actor.maxHp,actor.hp+hp);actor.stats.hp=actor.maxHp;
    for(const [i,key] of /** @type {const} */([[2,'attack'],[3,'specialAttack'],[4,'defense'],[5,'specialDefense']]))actor.stats[key]=Math.min(255,actor.stats[key]+(row[i]??0));
    message(state,events,`${actor.name} grew to Level ${actor.level}!`);events.push({type:'level',actorId:actor.id,amount:actor.level});
    /** @type {string[]} */const candidates=p.learnset.filter(([level])=>level===actor.level).map(([,id])=>id).filter(id=>!actor.moves.some(m=>m.id===id));
    if(candidates.length){const id=candidates[draw(state,candidates.length)];if(id){if(actor.moves.length<4){actor.moves.push(moveSlot(data,id));message(state,events,`${actor.name} learned ${data.moves[id]?.name}!`);}else state.pendingLearning.push({actorId:actor.id,moveId:id});}}
  }
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {string} status @param {OpeningData} data @param {GameEvent[]} events */
function inflict(state,actor,target,status,data,events) {
  const normalized=status==='poisoned'?'poison':status==='leech-seed'?'leechSeed':status==='focus-energy'?'focusEnergy':status==='confused'?'confusion':status;
  if(target.status[normalized])return;
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
  // The original stores one status per class. A fresh paralysis replaces a
  // burn, and Smokescreen replaces Focus Energy rather than stacking with it.
  for(const group of STATUS_CLASSES)if(group.includes(normalized))for(const key of group)delete target.status[key];
  target.status[normalized]=turns;
  if(status==='leech-seed'){target.leechSource=actor.id;target.periodic.leechSeed=0;}
  if(status==='poisoned')target.periodic.poison=0;
  if(status==='burn')target.periodic.burn=0;
  if(status==='bide')target.bideDamage=0;
  message(state,events,`${target.name} ${status==='sleep'?'fell asleep!':`became ${status.replaceAll('-',' ')}!`}`);events.push({type:'status',actorId:target.id,text:normalized});
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {Effect} effect @param {OpeningData} data @param {GameEvent[]} events */
function applyEffect(state,actor,target,effect,data,events) {
  const recipient=effect.recipient==='user'?actor:target;
  if(effect.op==='stat-stage') {
    const stat=effect.stat==='special-attack'?'specialAttack':effect.stat==='special-defense'?'specialDefense':effect.stat;
    if(!stat)return;
    if((effect.delta??0)<0&&(ability(data,recipient,'Clear Body')||ability(data,recipient,'White Smoke')||stat==='accuracy'&&ability(data,recipient,'Keen Eye')||stat==='attack'&&ability(data,recipient,'Hyper Cutter')))return;
    const old=recipient.stages[stat]??10;recipient.stages[stat]=clamp(old+(effect.delta??0),0,20);
    message(state,events,old===recipient.stages[stat]?`${recipient.name}'s ${stat} can't go any further.`:`${recipient.name}'s ${stat} ${effect.delta&&effect.delta>0?'rose':'fell'}!`);
  } else if(effect.op==='apply-status'&&effect.status)inflict(state,actor,recipient,effect.status,data,events);
  else if(effect.op==='speed-stage'){
    // All admitted actors have base stage one. LowerSpeed refuses a further
    // reduction at stage zero, without drawing or refreshing a duration.
    if(recipient.status.slow||recipient.status.paralysis)message(state,events,`${recipient.name}'s Movement Speed cannot fall further.`);
    else{recipient.status.slow=7+draw(state,2);message(state,events,`${recipient.name}'s Movement Speed fell!`);}
  }
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {MoveData} move @param {OpeningData} data */
function damageAmount(state,actor,target,move,data) {
  const physical=isPhysicalType(element(move.type)),a=actor.stats,t=target.stats,regular=move.id==='regular-attack';
  let multiplier=regular?128:256;
  if(move.id==='move-low-kick')multiplier=data.species[target.speciesId]?.lowKickMultiplier??256;
  const armored=ability(data,target,'Battle Armor')||ability(data,target,'Shell Armor');
  return calculateNormalDamage({
    type:{moveType:element(move.type),attackerTypes:types(data,actor),defenderTypes:types(data,target),defenderExposed:false,abilities:{wonderGuard:false,thickFat:ability(data,target,'Thick Fat'),flashFire:ability(data,target,'Flash Fire'),levitate:ability(data,target,'Levitate'),torrent:ability(data,actor,'Torrent'),overgrow:ability(data,actor,'Overgrow'),swarm:ability(data,actor,'Swarm'),blaze:ability(data,actor,'Blaze')},attackerHp:actor.hp,attackerMaxHp:actor.maxHp,weather:'clear',mudSport:false,waterSport:state.waterSport>0,charging:false},
    stats:{rawOffense:physical?a.attack:a.specialAttack,rawDefense:physical?t.defense:t.specialDefense,movePower:move.power,offenseStage:actor.stages[physical?'attack':'specialAttack']??10,defenseStage:target.stages[physical?'defense':'specialDefense']??10,offensiveMultiplierQ8:256,defensiveMultiplierQ8:256,flashFireBoost:0,attackerForm:'none',defenderForm:'none',skullBash:false,attackerItem:'none',defenderItem:'none',abilities:{guts:ability(data,actor,'Guts'),attackerNegativeStatus:NEGATIVE_STATUSES.some(key=>!!actor.status[key]),hugePower:ability(data,actor,'Huge Power'),purePower:ability(data,actor,'Pure Power'),hustle:ability(data,actor,'Hustle'),plus:false,minus:false,sameSidePlus:false,sameSideMinus:false,intimidate:ability(data,target,'Intimidate'),marvelScale:false,defenderNegativeStatus:false}},
    critical:{moveChance:move.criticalPercent,focusEnergy:!!actor.status.focusEnergy,typeAdvantageMaster:false,battleArmor:armored,shellArmor:false},teamMember:team(actor),leader:actor.id==='hero',integerBelly:Math.floor(actor.belly),level:actor.level,regularAttack:regular,targetEffectsApply:true,reflect:!!target.status.reflect,lightScreen:false,moveEffectMultiplierQ8:multiplier,
    rolls:actor.id!=='hero'&&Math.floor(actor.belly)===0?null:{sharedPowerRoll:draw(state,100),criticalRoll:armored?null:draw(state,100),varianceRoll:draw(state,16384)},
  }).damage;
}
/** An action consumes PP once; all targets and hits belong to that same turn.
 * @param {DungeonState} state @param {Actor} actor @param {number|'struggle'|null} slot @param {OpeningData} data @param {GameEvent[]} events */
export function attack(state,actor,slot,data,events) {
  if(actor.status.paralysis||actor.status.cringe){message(state,events,`${actor.name} can't attack!`);return;}
  const learned=typeof slot==='number'?actor.moves[slot]:null,move=data.moves[slot==='struggle'?'move-struggle':learned?.id??'regular-attack'];if(!move)return;
  if(!supportsMove(move)){message(state,events,`${move.name} is not yet available in this browser remake.`);return;}
  if(learned){if(learned.pp<=0){message(state,events,`${move.name} has no PP left!`);return;}learned.pp--;actor.usedMove=true;}
  if(actor.status.confusion)actor.direction=DIRECTIONS[draw(state,8)]??'s';
  const targets=moveTargets(state,actor,move);
  events.push({type:'attack',actorId:actor.id,targetId:targets[0]?.id,moveId:move.id});
  message(state,events,move.id!=='regular-attack'?`${actor.name} used ${move.name}!`:`${actor.name} attacked!`);
  if(move.id==='move-water-sport'){state.waterSport=11+draw(state,2);message(state,events,'Fire-type moves were weakened!');return;}
  if(!targets.length){message(state,events,'There was no target.');return;}
  for(const target of targets){
    if(actor.hp<=0||defeated(state))break;
    if(target.hp<=0)continue;
    if(!hits(state,actor,target,move.accuracyBeforeEffect,data)){message(state,events,`${target.name} avoided the move!`);continue;}
    const damaging=move.effects.some(effect=>effect.op==='normal-damage');
    if(damaging){
      const count=move.hitCount.min_hits===null?1:move.hitCount.min_hits+draw(state,(move.hitCount.max_hits??move.hitCount.min_hits)-move.hitCount.min_hits+1);
      for(let hit=0;hit<count&&target.hp>0&&actor.hp>0&&!defeated(state);hit++){
        let amount=damageAmount(state,actor,target,move,data);
        if(!hits(state,actor,target,move.accuracyAfterDamage,data)){message(state,events,`${actor.name}'s attack missed!`);continue;}
        if(move.id==='move-false-swipe')amount=Math.min(amount,Math.max(0,target.hp-1));
        if(amount>0&&move.id!=='regular-attack'&&!team(target))target.experienceMarked=true;
        damage(state,target,amount,data,events,actor);
        if(amount>0&&move.effects.some(effect=>effect.op==='drain')){if(!team(actor))actor.experienceMarked=true;heal(state,actor,Math.max(1,Math.floor(amount/2)),events);}
        if(amount>0&&target.hp>0&&!defeated(state)){
          // Contact checks precede move-specific secondary effects. Their
          // effects apply afterward, using the original defender's state.
          const contact=distance(actor,target)===1&&isPhysicalType(element(move.type))&&!target.status.sleep&&!target.status.bide&&!target.status.enraged;
          const staticReaction=contact&&ability(data,target,'Static')&&draw(state,100)<12;
          const charmReaction=contact&&ability(data,target,'Cute Charm')&&draw(state,100)<12;
          for(const effect of move.effects){if(effect.op==='secondary'&&effect.effect&&draw(state,100)<(effect.chancePercent??0)&&!ability(data,target,'Shield Dust'))applyEffect(state,actor,target,effect.effect,data,events);}
          if(staticReaction)inflict(state,target,actor,'paralysis',data,events);
          if(charmReaction)inflict(state,target,actor,'infatuated',data,events);
        }
        if(amount>0&&move.id==='move-struggle'&&actor.hp>0&&!defeated(state))damage(state,actor,Math.max(1,Math.floor(actor.maxHp/4)),data,events);
      }
    }else{
      // ACCURACY_2 belongs to damaging moves only. The original status handlers
      // return success even when an immunity or a stat cap prevents a change.
      if(move.id!=='regular-attack'&&!team(target))target.experienceMarked=true;
      if(move.effects.some(effect=>effect.op==='exclude-user')&&target.id===actor.id)continue;
      for(const effect of move.effects)applyEffect(state,actor,target,effect,data,events);
    }
  }
}
/** Native beginning-of-opportunity timers and HP accumulator, followed by source
 * blocking classes. Autonomous scheduler differences remain documented.
 * Swapping supplies its already-selected Walk and does not report an AI block.
 * @param {DungeonState} state @param {Actor} actor @param {OpeningData} data @param {GameEvent[]} events @param {boolean} [reportBlocked] */
export function beginTurn(state,actor,data,events,reportBlocked=true) {
  if(actor.hp<=0)return false;
  if(team(actor)&&actor.belly>0&&!actor.status.poison){const rate=clamp(data.species[actor.speciesId]?.regenerationRate??100,30,500);actor.regen+=actor.maxHp;actor.hp=Math.min(actor.maxHp,actor.hp+Math.floor(actor.regen/rate));actor.regen%=rate;}
  for(const key of Object.keys(actor.status)){if(key==='bide'||key==='enraged')continue;const value=actor.status[key]??0;if(value>0&&value!==127){actor.status[key]=value-1;if(actor.status[key]===0){delete actor.status[key];if(key==='leechSeed')actor.leechSource=null;
    if(key==='sleep')message(state,events,`${actor.name} woke up!`);
    if(key==='infatuated')message(state,events,`${actor.name} is no longer infatuated.`);
    if(key==='paralysis')message(state,events,`${actor.name} recovered from paralysis.`);
    if(key==='slow')message(state,events,`${actor.name}'s Movement Speed returned to normal.`);
  }}}
  if(actor.status.sleep||actor.status.infatuated){if(reportBlocked)message(state,events,`${actor.name} can't move!`);return false;}
  if(actor.status.bide){if(reportBlocked)message(state,events,`${actor.name} is storing energy!`);return false;}
  return true;
}

/** Residual damage and the Bide/Rage class belong after an actor's action.
 * The scoped scheduler still uses one actor opportunity per browser turn.
 * @param {DungeonState} state @param {Actor} actor @param {OpeningData} data @param {GameEvent[]} events */
export function finishTurn(state,actor,data,events) {
  if(actor.hp<=0||defeated(state))return;
  if(actor.id==='hero'){
    // Native fractional Belly decrement is 100 thousandths, then an empty
    // integer Belly is clamped to zero before its one point of hunger damage.
    actor.belly=Math.max(0,(Math.round(actor.belly*1000)-100)/1000);
    if(actor.belly<1){actor.belly=0;damage(state,actor,1,data,events);}
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
  if(actor.status.confusion)actor.direction=DIRECTIONS[draw(state,8)]??'s';
  const target=moveTargets(state,actor,release)[0];
  events.push({type:'attack',actorId:actor.id,targetId:target?.id,moveId:release.id});
  message(state,events,`${actor.name} released its stored energy!`);
  if(!target||amount===0||!hits(state,actor,target,release.accuracyBeforeEffect,data)){message(state,events,'But it had no effect.');return;}
  if(!team(target))target.experienceMarked=true;
  damage(state,target,amount,data,events,actor);
}
