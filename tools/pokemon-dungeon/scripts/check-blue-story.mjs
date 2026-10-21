import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import * as acorn from 'acorn';

// Parse only. Never import, evaluate or play the game to inspect its opening.
const root = new URL('../../../games/pokemon-dungeon-reimagined/src/blue/', import.meta.url);
const readAst = async filename => acorn.parse(await readFile(new URL(filename, root), 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
const [storyAst, appAst, actorsAst, mechanicsAst] = await Promise.all(['story.js', 'app.js', 'render-story.js', 'mechanics.js'].map(readAst));

function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') yield node;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) { for (const child of value) yield* nodes(child); }
    else if (value && typeof value === 'object') yield* nodes(value);
  }
}
function member(node) {
  if (node?.type === 'Identifier') return node.name;
  if (node?.type === 'MemberExpression' && !node.computed) return `${member(node.object)}.${node.property.name}`;
  return null;
}
function literal(node) {
  if (node?.type === 'Literal') return node.value;
  if (node?.type === 'ArrayExpression') return node.elements.map(literal);
  if (node?.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(property => {
    assert.equal(property.type, 'Property'); assert(!property.computed && !property.method);
    return [property.key.name ?? property.key.value, literal(property.value)];
  }));
  if (node?.type === 'CallExpression' && member(node.callee) === 'Object.freeze' && node.arguments.length === 1) return literal(node.arguments[0]);
  assert.fail(`Expected declarative story data, received ${node?.type}`);
}
function declaration(ast, name) {
  const result = [...nodes(ast)].find(node => node.type === 'VariableDeclarator' && node.id.name === name);
  assert(result, `Missing story owner: ${name}`);
  return literal(result.init);
}
function fn(ast, name) {
  const result = [...nodes(ast)].find(node => node.type === 'FunctionDeclaration' && node.id.name === name);
  assert(result, `Missing opening function: ${name}`); return result;
}
function calls(node, name) { return [...nodes(node)].filter(child => child.type === 'CallExpression' && member(child.callee) === name); }
function equals(node, name, value) { return node?.type === 'BinaryExpression' && node.operator === '===' && member(node.left) === name && node.right.type === 'Literal' && node.right.value === value; }
function branches(node, name, value) { return [...nodes(node)].filter(child => child.type === 'IfStatement' && equals(child.test, name, value)); }

// Independent checkpoint: the approved authored adaptation at 1444a4f34788.
// This pins dialogue, speakers, expressions and saved line positions, not a
// claim of commercial-script parity. A story edit needs explicit source/save review.
const story = declaration(storyAst, 'STORY');
assert.equal(createHash('sha256').update(JSON.stringify(story)).digest('hex'),
  '67e3f68f04770409cdcfbb825308ced4939652c778471bb330cac4de7030d16c', 'Authored dialogue or saved story line meanings changed');
const expectedBeats = {
  awakening: { awake: 3 },
  named: { cry: 2, arrival: 3 },
  clearing: { approach: 1, turn: 2, thanks: 4 },
  reunion: { greeting: 1, gift: 4, reward: 5, thanks: 6, departure: 8 },
};
assert.deepEqual(declaration(storyAst, 'STORY_BEATS'), expectedBeats, 'Saved story beat indices changed');
assert.deepEqual(declaration(storyAst, 'STORY_TRANSITIONS'), {
  named: { frames: 172 }, enter: { wait: 10, frames: 120 }, clearing: { wait: 30, walk: 88, frames: 148 },
}, 'Source-qualified movement waits changed');
assert(story.named[expectedBeats.named.cry].offscreen, 'Butterfree must cry before becoming visible');
assert.equal(story.clearing[0].speaker, 'caterpie');
assert.equal(story.reunion[expectedBeats.reunion.reward].speaker, 'narrator');

const gate = fn(storyAst, 'storyMovementGate');
for (const [phase, beat] of [['enter', null], ['named', 'arrival'], ['clearing', 'approach']]) {
  const branch = [...nodes(gate)].find(node => node.type === 'IfStatement' &&
    (beat ? node.test.type === 'LogicalExpression' && node.test.operator === '&&' && equals(node.test.left, 'phase', phase) &&
      node.test.right.type === 'BinaryExpression' && node.test.right.operator === '===' && member(node.test.right.left) === 'line' && member(node.test.right.right) === `STORY_BEATS.${phase}.${beat}` : equals(node.test, 'phase', phase)));
  assert(branch && [...nodes(branch.consequent)].some(node => node.type === 'ReturnStatement' && member(node.argument) === `STORY_TRANSITIONS.${phase}`), `Missing movement gate: ${phase}`);
}
for (const name of ['setPhase', 'rebuild', 'advanceStory', 'advanceStoryTransition']) {
  assert(calls(fn(appAst, name), 'storyMovementGate').length > 0, `${name} must use the shared movement gate`);
}
const advance = fn(appAst, 'advanceStory');
for (const [from, to] of [['welcome', 'quiz'], ['departure', 'awakening'], ['awakening', 'hero-name'], ['named', 'trouble'], ['trouble', 'enter'], ['clearing', 'reunion'], ['reunion', 'complete']]) {
  assert(branches(advance, 'phase', from).some(branch => calls(branch.consequent, 'setPhase').some(call => call.arguments[0]?.value === to)), `Opening route must retain ${from} -> ${to}`);
}
assert(calls(fn(appAst, 'advanceStoryTransition'), 'createDungeon').length === 1, 'Departure must create the dungeon once');
const stairs = branches(fn(mechanicsAst, 'performAction'), 'action.type', 'stairs')[0];
assert(stairs, 'Missing stairs branch');
assert(branches(stairs.consequent, 'state.floor', 3).some(branch => [...nodes(branch.consequent)].some(node =>
  node.type === 'AssignmentExpression' && member(node.left) === 'state.status' && node.right.value === 'rescued')), 'B3F stairs must reach Caterpie');

// Consumers may use named beats, never repeat numeric story-line anchors.
for (const [ast, label, owner] of [[advance, 'reward publication', 'state.line'], [actorsAst, 'story actors', 'line']]) {
  assert(![...nodes(ast)].some(node => node.type === 'BinaryExpression' && ['===', '>=', '<=', '<', '>'].includes(node.operator) && member(node.left) === owner && node.right.type === 'Literal' && typeof node.right.value === 'number'), `${label} repeats a numeric story beat`);
}
assert([...nodes(advance)].some(node => node.type === 'BinaryExpression' && node.operator === '===' && member(node.left) === 'state.line' && member(node.right) === 'STORY_BEATS.reunion.reward'), 'Reward must remain attached to its saved story beat');
console.log('Blue story: authored text/indices, movement gates, opening route and B3F rescue checked statically; no game execution.');
