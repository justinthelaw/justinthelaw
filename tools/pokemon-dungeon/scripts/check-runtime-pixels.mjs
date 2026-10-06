// Independent static JSON/binary/source-catalog joins. Never imports exporter or game.
import { readFile, readdir, realpath, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const target = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/assets/characters/pixel/', import.meta.url));
const source = fileURLToPath(new URL('../art/roster/', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const assert = (value, message) => { if (!value) throw new Error(message); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function keys(value, names) { assert(equal(Object.keys(value).sort(), names.split(' ').sort()), 'Unexpected declaration fields'); }
async function local(name, pin) {
    assert(/^[a-z0-9.-]+$/.test(name), 'Unsafe runtime resource name');
    const file = path.join(target, name); assert((await lstat(file)).isFile() && await realpath(file) === file, 'Runtime symlink/non-file');
    const bytes = await readFile(file); assert(bytes.length > 0 && bytes.length <= 900 * 1024, 'Runtime file exceeds900KiB');
    if (pin) assert(bytes.length === pin.encodedBytes && hash(bytes) === pin.sha256, 'Runtime resource hash/length mismatch');
    return bytes;
}
assert(await realpath(target) === target.replace(/\/$/, ''), 'Symlink runtime directory');
const manifestBytes = await local('manifest.json'), m = JSON.parse(manifestBytes);
keys(m, 'schemaVersion profile review sourceManifestSha256 cell page clips characters shards bundles pageCount');
const authorBytes = await readFile(path.join(source, 'manifest.json')), author = JSON.parse(authorBytes);
assert(m.schemaVersion === 2 && m.profile === 'directional-pixel-clip-v2' && m.review === 'roster-provisional-integration' && m.sourceManifestSha256 === hash(authorBytes), 'Runtime provenance/review mismatch');
assert(manifestBytes.length <= 262144 && equal(m.cell, {width:96,height:96,footAnchor:[48,92]}) && equal(m.page, {width:384,height:768}), 'Root metadata/cell contract');
assert(equal(m.clips, author.clips.map(({id,durationsMs,loop}) => ({id,durationsMs,loop}))), 'Changed clip timing');
assert(m.characters.length === 419 && m.shards.length === 27 && m.pageCount === 5028 && m.bundles.length >= 1 && m.bundles.length <= 128, 'Roster/bundle coverage');
assert((await local('integrity.js')).toString() === `// Generated from the deterministic runtime manifest; no runtime authoring dependency.\nexport const PIXEL_MANIFEST_SHA256 = '${hash(manifestBytes)}';\n`, 'Root integrity pin');
const authorCharacters=[];
for (const shard of author.shards) {
    const bytes = await readFile(path.join(source, shard.path)); assert(hash(bytes) === shard.sha256 && bytes.length === shard.encodedBytes, 'Stale authoring metadata');
    authorCharacters.push(...JSON.parse(bytes).characters);
}
const canonical=(await Promise.all([1,2,3,4,5].map(async n=>JSON.parse(await readFile(new URL(`../content/species-runtime/profiles-${n}.json`,import.meta.url),'utf8')).records))).flat();
const identities = new Set(), profiles = new Set(), paths = new Set(['manifest.json','integrity.js']), pageKeys = new Set(), pngNames = new Set();
for (const character of m.characters) {
    keys(character, 'profileId speciesId formId assetId worldHeight shardId');
    const expected = authorCharacters.find(c => c.profileId === character.profileId), fact = canonical.find(c => c.id === character.profileId);
    assert(expected && fact && character.speciesId === fact.speciesId && character.formId === fact.formId && character.formId === expected.catalogFormId && character.assetId === expected.assetId && character.worldHeight === expected.worldHeight, 'Exact canonical species/form/scale join');
    const id = JSON.stringify([character.speciesId,character.formId]); assert(!identities.has(id) && !profiles.has(character.profileId), 'Duplicate identity'); identities.add(id); profiles.add(character.profileId);
}
assert(new Set(m.characters.map(c=>c.speciesId)).size === 386, 'Species closure');
const bundles = new Map();
for (const bundle of m.bundles) {
    keys(bundle, 'id path sha256 encodedBytes shardId');
    assert(/^bundle-\d{3}$/.test(bundle.id) && bundle.path === `${bundle.id}.bin` && !bundles.has(bundle.id) && !paths.has(bundle.path) && m.shards.some(s=>s.id===bundle.shardId), 'Bundle identity/path/ownership');
    paths.add(bundle.path); bundles.set(bundle.id, { definition: bundle, bytes: await local(bundle.path, bundle), ranges: [] });
}
const shardIds = new Set(); let pages = 0, preserved = 0, total = 0;
for (const declaration of m.shards) {
    keys(declaration, 'id path sha256 encodedBytes');
    assert(/^pages-\d{2}$/.test(declaration.id) && declaration.path === `${declaration.id}.json` && !shardIds.has(declaration.id) && !paths.has(declaration.path) && declaration.encodedBytes <= 131072, 'Shard identity/path/size');
    shardIds.add(declaration.id); paths.add(declaration.path);
    const shard = JSON.parse(await local(declaration.path, declaration)); keys(shard, 'schemaVersion id pages');
    const chars = m.characters.filter(c=>c.shardId===declaration.id);
    assert(shard.schemaVersion===2 && shard.id===declaration.id && chars.length>=1 && chars.length<=16 && shard.pages.length===chars.length*12, 'Shard closure');
    for (const page of shard.pages) {
        keys(page, 'profileId speciesId formId assetId clip path sha256 encodedBytes decodedRgbaBytes bundleId offset');
        const c = chars.find(c=>c.profileId===page.profileId), original = authorCharacters.find(c=>c.profileId===page.profileId), originalPage = original?.pages.find(p=>p.clip===page.clip);
        assert(c && originalPage && c.speciesId===page.speciesId && c.formId===page.formId && c.assetId===page.assetId && m.clips.some(c=>c.id===page.clip), 'Exact page identity/clip join');
        const key=JSON.stringify([page.speciesId,page.formId,page.clip]); assert(!pageKeys.has(key) && /^[a-z0-9-]+\.png$/.test(page.path) && !pngNames.has(page.path), 'Duplicate/unsafe PNG declaration'); pageKeys.add(key); pngNames.add(page.path);
        assert(page.path===path.basename(originalPage.path) && page.sha256===originalPage.sha256 && page.encodedBytes===originalPage.encodedBytes && Number.isSafeInteger(page.encodedBytes) && page.encodedBytes>0 && page.encodedBytes<=65536 && page.decodedRgbaBytes===1179648, 'Source page/hash/budget join');
        const bundle = bundles.get(page.bundleId); assert(bundle && bundle.definition.shardId===shard.id && Number.isSafeInteger(page.offset) && page.offset>=0 && page.offset+page.encodedBytes<=bundle.bytes.length, 'Bundle range outside owner');
        bundle.ranges.push([page.offset,page.offset+page.encodedBytes]);
        const png=bundle.bytes.subarray(page.offset,page.offset+page.encodedBytes), file=path.resolve(source,originalPage.path);
        assert(/^(?:output|\.\.\/production\/output)\/[a-z0-9-]+\.png$/.test(originalPage.path) && await realpath(file)===file, 'Source PNG path');
        assert(hash(png)===page.sha256 && png.equals(await readFile(file)), 'Extracted bytes differ from exact source PNG');
        assert(png.length>=33 && png.toString('hex',0,8)==='89504e470d0a1a0a' && png.readUInt32BE(16)===384 && png.readUInt32BE(20)===768 && png[24]===8 && png[25]===6, 'PNG dimensions/encoding');
        pages++; total+=png.length; if(original.preserved)preserved++;
    }
}
for (const {definition,bytes,ranges} of bundles.values()) {
    let end=0; for(const [start,next] of ranges.sort((a,b)=>a[0]-b[0])){assert(start===end,'Overlapping/unindexed bundle segment');end=next;}
    assert(end===bytes.length && shardIds.has(definition.shardId),'Bundle coverage/owner');
}
for (const c of m.characters) for (const clip of m.clips) assert(pageKeys.has(JSON.stringify([c.speciesId,c.formId,clip.id])),'Missing declared clip');
assert(pages===5028 && preserved===192 && total===author.totals.encodedPageBytes,'Page/byte/starter totals');
assert(equal((await readdir(target)).sort(),[...paths].sort()),'Unexpected/stale runtime files');
console.log(JSON.stringify({status:'static-runtime-closure-not-art-acceptance',profiles:419,species:386,pages,preservedStarterPages:preserved,shards:shardIds.size,bundles:bundles.size,encodedPngBytes:total,largestBundleBytes:Math.max(...m.bundles.map(b=>b.encodedBytes)),files:paths.size}));
