/** Actual move impact selection for the scoped roster. It does not choose AI
 * intentions, draw RNG, or change actors/saves. Optional traces are transient. */
import { actors, actorAt, canStep, inSight, open, team, VECTORS } from './mechanics-common.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').MoveData} MoveData */
/** @typedef {import('./mechanics-types.js').Direction} Direction */
/** Transient evidence from actual scans; AI callers omit it.
 * @typedef {{to?:import('./mechanics-types.js').Point,stop?:'empty'|'wall'|'actor'|'outside',firstTeamTarget?:Actor}} MoveTrace */

// Native direction indices run opposite to the browser's shared DIRECTIONS.
// Keep this local so impact order cannot change movement or random facing.
/** @type {readonly Direction[]} */
const NATIVE_DIRECTIONS = Object.freeze(['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw']);

/** Comparative SetNewTarget applies the confusion override before its target
 * category, but Baton Pass always excludes its user. The selected roster has
 * no neutral shopkeepers, rescue targets, invisibility or Nontraitor IQ.
 * @param {Actor} actor @param {Actor} target @param {MoveData} move */
function admitsTarget(actor, target, move) {
  if (target.hp <= 0 || move.id === 'move-baton-pass' && target.id === actor.id) return false;
  if (actor.status.confusion) return true;
  const allied = team(actor) === team(target), self = actor.id === target.id;
  switch (move.target) {
    case 0:
    case 4: return !allied;
    case 1: return allied;
    case 2:
    case 3: return true;
    case 5: return !self;
    case 6: return allied && !self;
    default: return false;
  }
}

/** Retain native SetNewTarget's first admitted team member before self-last
 * sorting, inside the same candidate traversal. AI callers omit this receipt.
 * @param {boolean} admitted @param {Actor} target @param {MoveTrace|undefined} trace */
function rememberTeam(admitted,target,trace){
  if(admitted&&trace&&!trace.firstTeamTarget&&team(target))trace.firstTeamTarget=target;
  return admitted;
}

/** Preserve the caller's current room roster order. Native wild-slot reuse is
 * a separate spawn/scheduling owner; sorting by position would not recover it.
 * Charging moves must provide their effective release profile before admission.
 * @param {DungeonState} state @param {Actor} actor @param {MoveData} move @param {MoveTrace} [trace]
 * @returns {Actor[]} */
export function moveTargets(state, actor, move, trace) {
  if (actor.hp <= 0) return [];
  if (move.range === 7) return rememberTeam(admitsTarget(actor, actor, move),actor,trace) ? [actor] : [];
  if (move.range === 3) {
    const targets = actors(state).filter(target => rememberTeam(admitsTarget(actor, target, move) && inSight(state, actor, target),target,trace));
    // Native SortTargets preserves the other candidates and moves self last.
    // Confused room attacks can otherwise consume their self roll too early.
    const selfIndex = targets.findIndex(target => target.id === actor.id);
    if (selfIndex >= 0) targets.push(...targets.splice(selfIndex, 1));
    return targets;
  }
  if (move.range === 2) {
    /** @type {Actor[]} */ const targets = [];
    const facing = Math.max(0, NATIVE_DIRECTIONS.indexOf(actor.direction));
    for (let offset = 0; offset < NATIVE_DIRECTIONS.length; offset++) {
      const direction = NATIVE_DIRECTIONS[(facing + offset) % NATIVE_DIRECTIONS.length] ?? 's';
      const [dx, dy] = VECTORS[direction];
      const target = actorAt(state, actor.x + dx, actor.y + dy);
      if (target && rememberTeam(admitsTarget(actor, target, move),target,trace)) targets.push(target);
    }
    return targets;
  }
  // The opening has front-one, front-two, straight-line and corner-cut moves.
  // Other geometry stays unavailable until its own source-backed owner exists.
  if (![0, 4, 5, 8].includes(move.range)) return [];
  const [dx, dy] = VECTORS[actor.direction], limit = move.range === 5 ? 10 : move.range === 4 ? 2 : 1;
  for (let step = 1; step <= limit; step++) {
    const x = actor.x + dx * step, y = actor.y + dy * step;
    const passable = open(state, x, y);
    if (trace) {
      // Native adjacent projectiles advance before terrain admission. Keep an
      // outside point intact; camera visibility is a presentation decision.
      trace.to = {x, y};
      trace.stop = x < 0 || y < 0 || x >= state.width || y >= state.height ? 'outside' : passable ? 'empty' : 'wall';
    }
    if (!passable) return [];
    if (move.range === 0 && !move.cutsCorners && !canStep(state, actor, dx, dy)) return [];
    const target = actorAt(state, x, y);
    if (!target) continue;
    if (trace) trace.stop = 'actor';
    if (rememberTeam(admitsTarget(actor, target, move),target,trace)) return [target];
    // Front-two checks its second cell when the first actor is inadmissible.
    // A line projectile stops at the first actor even if the relation rejects it.
    if (move.range !== 4) return [];
  }
  return [];
}
