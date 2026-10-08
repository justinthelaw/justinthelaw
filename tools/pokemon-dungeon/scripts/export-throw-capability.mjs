// Parse source snapshots and authoring JSON only; never evaluate game modules.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('../../../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const authoring = 'tools/pokemon-dungeon/content/throw-capability/';
const bytes = await read(authoring + 'facts.json'), facts = JSON.parse(bytes);
assert.equal(facts.schemaVersion, 1);
assert.equal(facts.repository, 'pret/pmd-red');
assert.equal(facts.commit, '6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.qualification, 'pinned-red-comparative-not-blue-binary-proof');
const pins = [
  ['data/monster/monster_data.json',460024,'024f8d2b42582e4d017e3d408b1229b369396d9321ab11c1b7737d19b52bce2e'],
  ['include/constants/monster.h',12605,'e7c8795acd4d98f29ef50c7e1af9bb250a3e4bb07b6070b5a6d866c8da8265f9'],
  ['include/structs/str_pokemon.h',5386,'0ddac900868a8fe924943d23b7f6cafac087b82380fcb94a81e564da9c1fa17b'],
  ['tools/dungeonjson/dungeonjson.cpp',43319,'beea15a8d9c5c31cd3498e1317d731f8fbc15a63e500baff5d4a36fe98cd8f20'],
  ['src/pokemon.c',35082,'ca46804becf408ad3a3a8cad21d7ac16309b2e43fd80bf4945a29951b66aa58b'],
  ['src/dungeon_logic.c',47442,'662b79a226f4e76a5b7c4e84553477e1e310c28e2483c80b702f4bbe35d9ced9'],
  ['src/dungeon_action_execution.c',16333,'a1c974ab7811d990f06cfe1a7376ddeb4c283b51bec092179cd88436d100dd11'],
];
assert.equal(facts.sourceFiles.length, pins.length);
const anchors = [[34,19985,20028,20071,20117],[4,205,231,381,384,419,431],[135],[691,745,731],[801,804],[1403,1407],[222,232]];
const blobs = ["cdcce326580ce11e4ed1c1ece945370c57aa4b7b", "4b37b07b13c7dd4dd0c53204f4f3ac7383c5da60", "51b868b46f04d1354bbeb77cf6253adf307f0701", "3b7acc9290109f52b1caee73e38da855200c07ae", "3c5ab6eec362d6fccea49d1254cbb07682f1b172", "4f7fb462ccc2ad2aae25cc693b2e2ea146e5ba6d", "c26e0ac4f097b6a1e29f00d876ce9e6cb14d0c78"];
for (const [i,[path,length,sha256]] of pins.entries()) {
  assert.deepEqual(facts.sourceFiles[i], {path,bytes:length,sha256,gitBlobSha:blobs[i],lines:anchors[i]});
}
// Only factual monster parameters are published. Native implementation source
// stays in the verified research cache; its exact metadata is independently pinned.
const nativeBytes = await read(authoring + 'native-monster-data.json');
assert.equal(Buffer.byteLength(nativeBytes),pins[0][1]);
assert.equal(hash(nativeBytes),pins[0][2]);
assert.equal(createHash('sha1').update(`blob ${Buffer.byteLength(nativeBytes)}\0`).update(nativeBytes).digest('hex'),blobs[0]);
const native = JSON.parse(nativeBytes);
const profiles = (await Promise.all([1,2,3,4,5].map(async n => JSON.parse(await read(`tools/pokemon-dungeon/content/species-runtime/profiles-${n}.json`)).records))).flat();
assert.equal(profiles.length,419); assert.equal(new Set(profiles.map(p => p.id)).size,419);
const byId = new Map(profiles.map(p => [p.internalId,p]));
assert.deepEqual([...byId.keys()].sort((a,b)=>a-b),Array.from({length:419},(_,i)=>i+1));
assert.equal(profiles.filter(p=>p.persistence==='persistent').length,413);
assert.equal(profiles.filter(p=>p.persistence==='temporary').length,6);
// Independent complete canonical crosswalk, rather than trusting the export join.
const expected = new Map();
for (let dex=1;dex<=386;dex++) {
  if (dex===201) continue;
  expected.set(dex<=200?dex:dex<=351?dex+25:dex+28,{speciesId:`pokemon-${String(dex).padStart(3,'0')}`,formId:dex===351?'castform-normal':dex===386?'deoxys-normal':null});
}
for(let n=0;n<26;n++) expected.set(201+n,{speciesId:'pokemon-201',formId:`unown-${String.fromCharCode(97+n)}`});
for(const [id,speciesId,formId] of [[377,'pokemon-351','castform-snowy'],[378,'pokemon-351','castform-sunny'],[379,'pokemon-351','castform-rainy'],[415,'pokemon-201','unown-exclamation'],[416,'pokemon-201','unown-question'],[417,'pokemon-386','deoxys-attack'],[418,'pokemon-386','deoxys-defense'],[419,'pokemon-386','deoxys-speed']]) expected.set(id,{speciesId,formId});
const temporary=new Set([377,378,379,417,418,419]);
const excluded=new Map([[0,['MonsterNameNone','sentinel']],[420,['MonsterNameMunchlax','npc-only-exclusion']],[421,['MonsterNameDecoy','special-internal-exclusion']],[422,['MonsterNameStatue','special-internal-exclusion']],[423,['MonsterNameRayquaza','cutscene-duplicate-exclusion']]]);
assert.equal(native.length,424); assert.equal(facts.records.length,424);
assert.deepEqual(facts.records.filter(r=>r.profileId===null).map(r=>r.nativeId),[0,420,421,422,423]);
for(const [id,row] of facts.records.entries()) {
  const raw=native[id]; assert.equal(typeof raw.canThrowItems,'boolean');
  const canonical=expected.get(id), profile=byId.get(id);
  if(canonical) {
    assert(profile); assert.equal(profile.speciesId,canonical.speciesId); assert.equal(profile.formId,canonical.formId);
    assert.equal(profile.id,canonical.formId??canonical.speciesId); assert.equal(profile.persistence,temporary.has(id)?'temporary':'persistent');
  } else assert.equal(raw.name,excluded.get(id)[0]);
  assert.deepEqual(row,{nativeId:id,sourceName:raw.name,canThrowItems:raw.canThrowItems,profileId:profile?.id??null,speciesId:profile?.speciesId??null,formId:profile?.formId??null,persistence:profile?.persistence??null,disposition:profile?'canonical-profile':excluded.get(id)[1]});
}
assert.equal(facts.records.filter(r=>r.canThrowItems).length,423);
assert.deepEqual(facts.records.filter(r=>!r.canThrowItems).map(r=>r.nativeId),[422]);
const output=`// Generated by export-throw-capability.mjs; pinned original Red comparative, not Blue binary proof.
// Authoring SHA-256: ${hash(bytes)}; provenance: ${authoring}facts.json.
/** @type {ReadonlyArray<Readonly<{nativeId:number,sourceName:string,canThrowItems:boolean,profileId:string|null,speciesId:string|null,formId:string|null,persistence:string|null,disposition:string}>>} */
export const NATIVE_THROW_CAPABILITY = Object.freeze(${JSON.stringify(facts.records)}.map(row => Object.freeze(row)));
`;
assert(Buffer.byteLength(output)<1048576);
const destination='games/pokemon-dungeon-reimagined/content/throw-capability-facts.js';
if(process.argv.includes('--check')) assert.equal(await read(destination),output,'Stale throw capability projection');
else await writeFile(new URL(destination,root),output);
console.log('Verified 424 source positions/419 exact profile joins,423 true/Statue422 false; factual source bytes, exact source-chain metadata and independent mapping; no game execution.');
