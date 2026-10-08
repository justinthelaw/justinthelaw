// AST/data audit only. Never import or evaluate game/native modules.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';

const root = new URL('../../../',import.meta.url);
const game = 'games/pokemon-dungeon-reimagined/';
const read = path => readFile(new URL(path,root),'utf8');
const factSource = await read(game+'content/authored/native-general-rng-facts.js');
const facts = JSON.parse(factSource.slice(factSource.indexOf('Object.freeze(')+14,factSource.lastIndexOf(');')));
assert.equal(facts.commit,'6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.qualification,'pinned-red-comparative-not-blue-binary-proof');
assert.deepEqual(facts.sourceFiles,[{ path: 'src/random.c',sha256: '40545e44f2a45674cc157b238e7d07a14ff9dcf952f734ee5b916809ac9f2e81',locators: '6–9 SeedRng;12–23 signed Rand16Bit/Rand32Bit;26–40 RandInt/RandRange;43–52 state/reseed' }]);
assert.deepEqual([facts.algorithm,facts.multiplier,facts.increment,facts.seedOffset,facts.seedByteCount,facts.transitionsPerRandom32,facts.signedHalfwords,facts.integerScaleBits,facts.equalRangeTransitions,facts.reseedStoresReturnedBits],['red-general-lcg-v1',1566083941,1,54021,6,2,true,16,0,true]);
const source = await read(game+'src/domain/native-general-rng.js');
const tree = parse(source,{ ecmaVersion: 'latest',sourceType: 'module' });
parse(factSource,{ ecmaVersion: 'latest',sourceType: 'module' });
function nodes(node,predicate) {
  const found = [];
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.type === 'string' && predicate(value)) found.push(value);
    for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(walk); else if (child && typeof child === 'object') walk(child);
  }
  walk(node); return found;
}
function functionSource(name) {
  const matches = nodes(tree,node => node.type === 'FunctionDeclaration' && node.id.name === name);
  assert.equal(matches.length,1,name);
  return source.slice(matches[0].start,matches[0].end);
}
const next = functionSource('nativeGeneralRandom32');
assert.equal((next.match(/Math\.imul\(/g) ?? []).length,2);
assert.ok(next.includes('Math.imul(state.word,MULTIPLIER)') && next.includes('Math.imul(first,MULTIPLIER)'));
assert.ok(next.includes('((first >> 16) << 16) | (second >> 16)'), 'Both signed halfwords retain native sign extension.');
assert.ok(next.includes('word: second,transitions: state.transitions + 2'));
assert.ok(next.indexOf('Number.MAX_SAFE_INTEGER - 2') < next.indexOf('Math.imul'));
const integer = functionSource('nativeGeneralRandomInteger');
assert.ok(integer.includes('upperExclusive < 0') && !integer.includes('upperExclusive < 1'));
assert.ok(integer.includes('(Math.imul(result.value & 0xffff,upperExclusive) >> 16) & 0xffff'));
assert.equal((integer.match(/nativeGeneralRandom32\(/g) ?? []).length,1);
assert.ok(!integer.includes('%') && !integer.includes('while') && !integer.includes('for ('));
const range = functionSource('nativeGeneralRandomRange');
assert.ok(range.includes('if (first === second) return') && range.indexOf('if (first === second)') < range.indexOf('nativeGeneralRandomInteger('));
assert.ok(range.includes('Math.abs(first-second)') && range.includes('Math.min(first,second)'));
const reseed = functionSource('reseedNativeGeneralRandom');
assert.ok(reseed.includes('nativeGeneralRandom32({ ...previous,word })') && reseed.includes('word: result.value >>> 0'));
assert.ok(functionSource('seedNativeGeneralRandom').includes('bytes[0]*bytes[1] + bytes[2]*bytes[3] + bytes[4]*bytes[5]'));
assert.ok(!source.includes('Math.random') && !source.includes('Date.now') && !source.includes('randomInteger(') && !source.includes('campaign.random'));
console.log(`Native general RNG pinned text/AST audit: ${createHash('sha256').update(factSource).digest('hex')}; signed-halfword ordering, low16 integer scaling, equal/reversed range, exact reseed and explicit seed/state interfaces. No game execution.`);
