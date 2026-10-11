// Parse and compare source only. Never import/evaluate game code or saved state.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse } from 'acorn';

const game = new URL('../../../games/pokemon-dungeon-reimagined/', import.meta.url);
const read = path => readFile(new URL(path, game), 'utf8');
const ast = source => parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
const hash = source => createHash('sha256').update(source).digest('hex');
function nodes(value, predicate, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (typeof value.type === 'string' && predicate(value)) result.push(value);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(row => nodes(row, predicate, result));
    else nodes(child, predicate, result);
  }
  return result;
}
function plain(node) {
  if (Array.isArray(node)) return node.map(plain);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node).filter(([key]) => !['start', 'end', 'raw'].includes(key)).map(([key, value]) => [key, plain(value)]));
}
function oneFunction(tree, name) {
  const found = nodes(tree, node => node.type === 'FunctionDeclaration' && node.id.name === name);
  assert.equal(found.length, 1, `One private ${name} owner.`);
  return found[0];
}
function exactFunction(tree, expected) {
  const wanted = ast(expected).body[0];
  assert.deepEqual(plain(oneFunction(tree, wanted.id.name)), plain(wanted), `Exact ${wanted.id.name} receipt boundary.`);
}
function replaceOnce(source, from, to) {
  assert.equal(source.split(from).length, 2, `One unchanged admission/cancellation hunk: ${from}`);
  return source.replace(from, to);
}

function audit(source) {
  const tree = ast(source), owner = oneFunction(tree, 'createSaveRepository');
  const receipt = nodes(tree, node => node.type === 'VariableDeclarator' && node.id.name === 'saveReceipts');
  assert.equal(receipt.length, 1);
  assert(receipt[0].start > owner.start && receipt[0].end < owner.end, 'Receipt map is repository-local, never shared between content owners.');
  assert.deepEqual(plain(receipt[0].init), plain(ast('new Map();').body[0].expression));
  exactFunction(tree, `function frozenContentOwner() {
    return Object.isFrozen(content) && ['policies', 'identities'].every(key => {
      const descriptor = Object.getOwnPropertyDescriptor(content, key);
      return descriptor && Object.hasOwn(descriptor, 'value') && descriptor.value && typeof descriptor.value === 'object' && Object.isFrozen(descriptor.value);
    });
  }`);
  exactFunction(tree, `function rememberCommitted(save, loaded) {
    if (disposed || !frozenContentOwner()) { saveReceipts = new Map(); return; }
    const backup = loaded.primary.ok ? loaded.primary : loaded.backup;
    const admitted = backup.ok ? [save, backup.value] : [save];
    const next = new Map();
    let textLength = 0;
    for (const receipt of admitted) { textLength += receipt.text.length; next.set(receipt.text, receipt); }
    saveReceipts = textLength <= 2 * 1024 * 1024 ? next : new Map();
  }`);
  exactFunction(tree, `async function decodeSlot(slot, receipts) {
    if (!slot.ok) return slot;
    if (slot.value === null) return fail('empty');
    const receipt = receipts?.get(slot.value);
    return receipt ? succeed(receipt) : decodeSave(slot.value, content, compatibility);
  }`);
  const calls = nodes(tree, node => node.type === 'CallExpression' && node.callee.type === 'Identifier');
  const writes = calls.filter(node => node.callee.name === 'rememberCommitted');
  assert.equal(writes.length, 1, 'Only the ordinary writer can mint committed receipts.');
  const writer = oneFunction(tree, 'writeJob');
  assert(writes[0].start > writer.start && writes[0].end < writer.end);
  const reuse = calls.filter(node => node.callee.name === 'prepareLoad' && node.arguments.length > 1);
  assert.equal(reuse.length, 1, 'Only ordinary save preparation can request receipt reuse.');
  assert(reuse[0].start > writer.start && reuse[0].end < writer.end);
  assert.equal(reuse[0].arguments[1].value, true);

  // Strip only the individually audited receipt addition, then authenticate the
  // complete pre-existing repository. Queueing, CAS, public import/load/export,
  // exclusive authority, failures, stale guards and cancellation stay unchanged.
  const start = source.indexOf('  /** Exact canonical bytes admitted by this repository');
  const end = source.indexOf('  /** @param {CommitGuard} guard @returns {boolean} */', start);
  assert(start > 0 && end > start);
  const addition = ast(`function scope() { ${source.slice(start, end)} }`).body[0].body.body;
  assert.equal(addition.length, 3, 'Only the private map and the two audited helpers are added.');
  assert.equal(addition[0].kind, 'let');
  assert.equal(addition[0].declarations.length, 1);
  assert.deepEqual(addition.slice(1).map(node => node.id.name), ['frozenContentOwner', 'rememberCommitted']);
  let original = source.slice(0, start) + source.slice(end);
  const replacements = [
    ["   * @param {StorageSlot} slot @param {ReadonlyMap<string,EncodedSave>|null} receipts\n   * @returns {Promise<Result<EncodedSave>>}", "   * @param {StorageSlot} slot @returns {Promise<Result<EncodedSave>>}"],
    ['async function decodeSlot(slot, receipts)', 'async function decodeSlot(slot)'],
    ["    if (slot.value === null) return fail('empty');\n    const receipt = receipts?.get(slot.value);\n    return receipt ? succeed(receipt) : decodeSave(slot.value, content, compatibility);", "    return slot.value === null ? fail('empty') : decodeSave(slot.value, content, compatibility);"],
    ['  /** Only ordinary saves may reuse exact successful write receipts. Public load,\n   * confirmation and import retain independent original-envelope admission.\n   * @param {CommitGuard} guard @param {boolean} [reuseStoredReceipts]\n   * @returns {Promise<Result<PreparedLoad>>} */', '  /** @param {CommitGuard} guard @returns {Promise<Result<PreparedLoad>>} */'],
    ['async function prepareLoad(guard, reuseStoredReceipts = false)', 'async function prepareLoad(guard)'],
    ['    const receipts = reuseStoredReceipts && frozenContentOwner() ? saveReceipts : null;\n', ''],
    ['decodeSlot(stored.value.primary, receipts)', 'decodeSlot(stored.value.primary)'],
    ['decodeSlot(stored.value.backup, receipts)', 'decodeSlot(stored.value.backup)'],
    ['prepareLoad(job.guard, true)', 'prepareLoad(job.guard)'],
    ['    const committed = await commit(encoded.value, loaded.value, job.guard);\n    if (committed.ok) rememberCommitted(encoded.value, loaded.value);\n    return committed;', '    return commit(encoded.value, loaded.value, job.guard);'],
    ['    /** @param {CommitGuard} guard */\n    prepareLoad: guard => prepareLoad(guard),', '    prepareLoad,'],
    ['if (result.ok) { knownGeneration = result.value.generation; saveReceipts = new Map(); }', 'if (result.ok) knownGeneration = result.value.generation;'],
    ["disposed = true; saveReceipts = new Map(); invalidateQueued('disposed');", "disposed = true; invalidateQueued('disposed');"],
  ];
  for (const [from, to] of replacements) original = replaceOnce(original, from, to);
  assert.equal(hash(original), 'b59c87904a331013f40f551612e9c97031fcd73a25d4c28ada56337a235ce4a9', 'All non-receipt repository behavior remains exact.');
}

const source = await read('src/persistence/repository.js');
audit(source);
const mutations = [
  ['revision key', 'receipts?.get(slot.value)', 'receipts?.get(slot.revision)'],
  ['empty cached', "if (slot.value === null) return fail('empty');", ''],
  ['failure bypass', 'if (!slot.ok) return slot;', ''],
  ['unbounded receipts', 'textLength <= 2 * 1024 * 1024', 'true'],
  ['mutable content', 'reuseStoredReceipts && frozenContentOwner()', 'reuseStoredReceipts'],
  ['public load reuse', 'prepareLoad: guard => prepareLoad(guard),', 'prepareLoad: guard => prepareLoad(guard, true),'],
  ['failed write mints receipt', 'if (committed.ok) rememberCommitted', 'if (!committed.ok) rememberCommitted'],
  ['missing storage read', 'await boundary(() => adapter.read())', 'succeed(lastRecord)'],
  ['generation bypass', 'loaded.value.record.generation !== knownGeneration', 'false'],
  ['original import bypass', 'decodeSave(text, content, compatibility)', 'succeed(saveReceipts.get(text))'],
  ['dispose retains receipts', "disposed = true; saveReceipts = new Map(); invalidateQueued('disposed');", "disposed = true; invalidateQueued('disposed');"],
];
for (const [label, from, to] of mutations) {
  assert(source.includes(from), `Mutation target exists: ${label}`);
  assert.throws(() => audit(source.replace(from, to)), undefined, `Audit rejects ${label}.`);
}
assert.equal(hash(await read('src/persistence/codec.js')), 'dcf16b090934e1baabee03b8054c415ef5493e60004e9b2aca2277ffac7f6852', 'Original byte-bounded raw envelope, hash-before-conversion and full campaign admission remain byte-identical.');
console.log(`Save receipt source audit PASS: exact two-envelope committed receipts, 2 Mi UTF-16 text bound, fresh storage/CAS/guards, unchanged public load/import and codec, ${mutations.length} rejected source mutations; no game execution or timing claim.`);
