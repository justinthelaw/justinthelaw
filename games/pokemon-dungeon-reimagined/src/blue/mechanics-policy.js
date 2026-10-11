import { actorAt, directionFor, distance, inSight, open } from './mechanics-common.js';

/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').MoveData} MoveData */
/** @typedef {import('./mechanics-types.js').IqSkill} IqSkill */
/** @typedef {import('./mechanics-types.js').Tactic} Tactic */

/** IQ stays at its original value of one: Tiny Woods contains no Gummis.
 * Each available skill belongs to a different native exclusivity group.
 * @type {readonly {id:IqSkill,name:string,description:string}[]} */
export const IQ_SKILLS=Object.freeze([
  {id:'item-catcher',name:'Item Catcher',description:'Catch a thrown item when the held slot is empty. Berries, seeds and drinks cannot be caught.'},
  {id:'course-checker',name:'Course Checker',description:'Check for walls and Pokémon in the path before choosing a ranged move or thrown item.'},
  {id:'dedicated-traveler',name:'Dedicated Traveler',description:'Try to move first. Attack when unable to keep moving.'},
  {id:'item-master',name:'Item Master',description:'Use a held item when it is needed.'},
  {id:'exclusive-move-user',name:'Exclusive Move-User',description:'Use moves instead of regular attacks.'},
]);
/** @type {readonly IqSkill[]} */
export const DEFAULT_IQ=Object.freeze(['item-catcher','course-checker','item-master']);
/** These three tactics are available from leader level one.
 * @type {readonly {id:Tactic,name:string,description:string}[]} */
export const TACTICS=Object.freeze([
  {id:'together',name:"Let's go together",description:'Stay close to the leader while fighting nearby foes.'},
  {id:'after-foes',name:'Go after foes',description:'Head toward a visible foe. Follow the leader when no foe is in sight.'},
  {id:'avoid-first-hit',name:'Avoid the first hit',description:'Approach foes but wait two tiles away. Attack when they come within reach.'},
]);
/** Absence in a historical opening save means the original initial defaults,
 * because no preference controls existed when that save was written.
 * @param {Actor} actor @param {IqSkill} id */
export function hasIq(actor,id){return (actor.enabledIq??DEFAULT_IQ).includes(id);}
/** @param {Actor} actor @returns {Tactic} */
export function tacticFor(actor){return actor.tactic??'together';}
/** CheckVariousStatuses2(TRUE), restricted to opening-supported conditions.
 * @param {Actor} actor */
export function canChangePolicy(actor){return actor.hp>0&&!actor.status.sleep&&!actor.status.infatuated;}
/** @param {Actor} actor @param {IqSkill} id */
export function toggleIq(actor,id){
  if(!canChangePolicy(actor)||!IQ_SKILLS.some(skill=>skill.id===id))return;
  const enabled=actor.enabledIq??DEFAULT_IQ;
  actor.enabledIq=enabled.includes(id)?enabled.filter(skill=>skill!==id):[...enabled,id];
}
/** @param {Actor} actor @param {Tactic} id */
export function setTactic(actor,id){if(canChangePolicy(actor)&&TACTICS.some(tactic=>tactic.id===id)){actor.tactic=id;actor.goal=null;}}
/** Native line/corner-cut AI targeting considers the intended foe separately
 * from the move's eventual impact. Course Checker controls only the former.
 * @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {MoveData} move */
export function considersLineMove(state,actor,target,move){
  if(move.range!==5&&move.range!==8)return false;
  return considersLineTarget(state,actor,target,move.range===5?10:1);
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {number} limit */
export function considersLineTarget(state,actor,target,limit){
  const dx=target.x-actor.x,dy=target.y-actor.y;
  if(distance(actor,target)>limit||dx!==0&&dy!==0&&Math.abs(dx)!==Math.abs(dy)||!inSight(state,actor,target))return false;
  if(!hasIq(actor,'course-checker'))return true;
  for(let n=1;n<=distance(actor,target);n++){
    const x=actor.x+Math.sign(dx)*n,y=actor.y+Math.sign(dy)*n;
    if(!open(state,x,y))return false;
    const occupant=actorAt(state,x,y);
    if(occupant)return occupant.id===target.id;
  }
  return false;
}

// Short original paraphrases of the inspected talkp partner table. Selection
// uses native HP thresholds and every member of the ten-species partner pool.
/** @type {Readonly<Record<string,readonly [string,string,string]>>} */
const PARTNER_TALK=Object.freeze({
  'pokemon-001':['We can do this, {hero}!','This is becoming difficult.','{hero}, I need help now...'],
  'pokemon-004':['My tail flame is bright! Onward, {hero}!','This fight is getting harder.','My flame is fading... Help, {hero}!'],
  'pokemon-007':['Give it everything, {hero}!','I am beginning to wear out.','{hero}, I am barely standing...'],
  'pokemon-025':['Keep going, {hero}!','Those attacks are hurting.','{hero}, I need help to continue...'],
  'pokemon-152':['Together, we can finish this!','I am having a hard time.','Please help me, {hero}...'],
  'pokemon-155':['Ready to go, {hero}!','This is becoming harder.','My back flame is fading... Help!'],
  'pokemon-158':['Our best effort, {hero}!','Ouch, these hits hurt.','{hero}, I cannot take much more!'],
  'pokemon-252':['Count on my best, {hero}!','The going is getting harder.','{hero}, I need help quickly...'],
  'pokemon-255':['We will manage together, {hero}!','I am wearing out.','I am in trouble, {hero}!'],
  'pokemon-258':['Stay with it, {hero}!','This is becoming rough.','{hero}, please help me now...'],
});
/** The currently admitted sub_8070BC0 statuses. Bide is not in the native
 * two-turn charging list and does not by itself block the menu's Talk command.
 * @param {Actor} actor */
export function canTalk(actor){return actor.hp>0&&!['sleep','confusion','cringe','infatuated'].some(status=>!!actor.status[status]);}
/** Both Talk paths are turn-free. Team-menu Talk faces the partner south;
 * field Talk turns the partner toward the leader before input resumes.
 * @param {DungeonState} state @param {boolean} [field] @param {boolean} [includeName] */
export function talkToPartner(state,field=false,includeName=true){
  if(!canTalk(state.hero))return `${state.hero.name} cannot talk right now.`;
  if(state.partner.status.sleep===127)delete state.partner.status.sleep;
  if(!canTalk(state.partner))return `${state.partner.name} cannot respond right now.`;
  state.hero.direction=directionFor(state.partner.x-state.hero.x,state.partner.y-state.hero.y);
  state.partner.direction=field?directionFor(state.hero.x-state.partner.x,state.hero.y-state.partner.y):'s';
  const mood=state.partner.hp<=Math.floor(state.partner.maxHp/4)?2:state.partner.hp<=Math.floor(state.partner.maxHp*6/10)?1:0;
  const response=(PARTNER_TALK[state.partner.speciesId]?.[mood]??'Let us keep going together.').replaceAll('{hero}',state.hero.name);
  return includeName?`${state.partner.name}: ${response}`:response;
}
