// AST/source audit only. Never import or evaluate the game validator or states.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse } from 'acorn';

const path = new URL('../../../games/pokemon-dungeon-reimagined/src/domain/state/structure.js', import.meta.url);
const ast = source => parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
const hash = source => createHash('sha256').update(source).digest('hex');
function plain(node) {
  if (Array.isArray(node)) return node.map(plain);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node).filter(([key]) => !['start', 'end', 'raw'].includes(key)).map(([key, value]) => [key, plain(value)]));
}
const before = '        if (inspect(value, member, path, [], undefined, shapes)) return inspect(value, member, path, issues, visitor, shapes);';
const after = `        // A successful isolated probe has already proved this entire member.
        // Only a visitor needs a second walk to deliver the admitted references;
        // repeating a visitorless success multiplies work at each nested union.
        if (inspect(value, member, path, [], undefined, shapes)) return visitor ? inspect(value, member, path, issues, visitor, shapes) : true;`;
const instanceGuard = `      // Nullable IDs probe this branch before null. Reject their known type
      // mismatch without constructing/catching an exception for every tile.
      if (typeof value !== 'string') return fail();
`;

function audit(source) {
  const tree = ast(source);
  const inspect = tree.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'inspect');
  assert(inspect, 'One original structural inspector.');
  const selection = inspect.body.body.find(node => node.type === 'SwitchStatement');
  const union = selection.cases.find(node => node.test?.value === 'union');
  const expected = ast(`function scope() { switch (shape.kind) {
    case 'union': {
      for (const member of shape.members) {
        if (inspect(value, member, path, [], undefined, shapes)) return visitor ? inspect(value, member, path, issues, visitor, shapes) : true;
      }
      return fail();
    }
  } }`).body[0].body.body[0].cases[0];
  assert.deepEqual(plain(union), plain(expected), 'Union selection still probes every necessary member with isolated diagnostics/no visitor; only successful visitorless probes avoid repetition.');
  const instance = selection.cases.find(node => node.test?.value === 'instance');
  const expectedInstance = ast(`function scope() { switch (shape.kind) {
    case 'instance':
      if (typeof value !== 'string') return fail();
      try { instanceId(shape.name, value); return true; } catch { return fail(); }
  } }`).body[0].body.body[0].cases[0];
  assert.deepEqual(plain(instance), plain(expectedInstance), 'Known nonstring instance mismatches keep the exact failure; strings retain the original complete identity validator.');
  assert.equal(source.split(after).length, 2, 'One narrowly scoped successful-union optimization.');
  assert.equal(source.split(instanceGuard).length, 2, 'One narrowly scoped nonstring instance guard.');
  assert.equal(hash(source.replace(after, before).replace(instanceGuard, '')), 'b7427f58fe2d1dd9b76dbfdddb906e4f2b006a00fb8740d8d4fbfdd976e5394b', 'Every other shape/diagnostic/visitor/registry statement remains byte-identical.');
}

const source = await readFile(path, 'utf8');
audit(source);
const mutations = [
  ['redundant visitorless traversal', 'return visitor ? inspect(value, member, path, issues, visitor, shapes) : true;', 'return inspect(value, member, path, issues, visitor, shapes);'],
  ['probe bypass', 'if (inspect(value, member, path, [], undefined, shapes))', 'if (true)'],
  ['probe diagnostics leak', 'inspect(value, member, path, [], undefined, shapes)', 'inspect(value, member, path, issues, undefined, shapes)'],
  ['speculative visitor', 'inspect(value, member, path, [], undefined, shapes)', 'inspect(value, member, path, [], visitor, shapes)'],
  ['wrong registry', 'inspect(value, member, path, [], undefined, shapes)', 'inspect(value, member, path, [], undefined, SHAPES)'],
  ['admitted visitors skipped', 'return visitor ? inspect(value, member, path, issues, visitor, shapes) : true;', 'return true;'],
  ['no matching branch accepted', '      return fail();', '      return true;'],
  ['reference visitor removed', 'if (valid && visitor) visitor(shape.name, value, path);', 'if (false) visitor(shape.name, value, path);'],
  ['nonnull ID check bypass', "if (typeof value !== 'string') return fail();", "if (typeof value !== 'string') return true;"],
  ['null throws again', "      if (typeof value !== 'string') return fail();\n", ''],
  ['string identity validator bypass', 'try { instanceId(shape.name, value); return true; }', 'try { return true; }'],
];
for (const [label, from, to] of mutations) {
  assert(source.includes(from), `Mutation target exists: ${label}`);
  assert.throws(() => audit(source.replace(from, to)), undefined, `Audit rejects ${label}.`);
}
console.log(`Structural preflight source audit PASS: successful visitorless probe returns once, nonstring identity mismatches fail without exceptions, original string identity/failure/visitor semantics and all other validator bytes retained, ${mutations.length} rejected source mutations; no game execution or measured timing claim.`);
