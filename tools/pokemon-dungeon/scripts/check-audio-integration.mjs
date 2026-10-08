import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as acorn from 'acorn';

// Static authoring/source audit only. No game import, evaluation, AudioContext,
// browser, native compilation, execution test or audition.
const toolRoot = fileURLToPath(new URL('../',import.meta.url));
const gameRoot = path.resolve(toolRoot,'../../games/pokemon-dungeon-reimagined');
const data = JSON.parse(await readFile(path.join(toolRoot,'audio/current-requests.json'),'utf8'));
const score = JSON.parse(await readFile(path.join(toolRoot,'audio/original-score.json'),'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(data.revision,'current-audio-requests-v2-escort');
assert.equal(data.sourceQualification.edition,'red-comparative');
assert.equal(data.sourceQualification.blueParity,'unverified');
assert.equal(data.sourceQualification.commit,'6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(hash(await readFile(path.join(toolRoot,'audio',data.sourceQualification.report))),data.sourceQualification.reportSha256,'Source qualification report changed.');
const inventory = new Map(data.sceneInventory.map(row => [row.scene,row]));
assert.equal(inventory.size,43,'Current authored scene inventory is incomplete/duplicated.');
const nativeIds = new Set(score.nativeMusic.map(row => row.nativeId));
let cursors = 0, silent = 0;
for (const [id,item] of inventory) {
  assert.equal(item.fromCursor,0); assert(Number.isSafeInteger(item.throughCursor) && item.throughCursor >= 0 && item.throughCursor <= 10);
  assert(item.qualification && item.requestSummary,'Every current row needs honest source/collapse qualification.');
  const requests = data.sceneRequests.filter(row => row.scene === id);
  for (let cursor = 0; cursor <= item.throughCursor; cursor++) {
    const rows = requests.filter(row => cursor >= row.from && cursor <= row.through);
    assert.equal(rows.length,1,`Missing/overlapping finite cursor ${id}:${cursor}`); cursors++;
    if (rows[0].musicId === null) silent++;
  }
  for (const row of requests) {
    assert(Number.isSafeInteger(row.from) && Number.isSafeInteger(row.through) && row.from >= 0 && row.through >= row.from && row.through <= item.throughCursor);
    assert(row.musicId === null || nativeIds.has(row.musicId),'Unqualified direct MusicID.');
    assert(['ground','dungeon'].includes(row.owner),'Unqualified modifier owner.');
    assert(row.guard === undefined || ['steel-poststory','ordinary-steel-summit'].includes(row.guard),'Unknown state guard.');
  }
}
assert(data.sceneRequests.every(row => inventory.has(row.scene)));
assert.equal(new Set(data.groundRequests.map(row => row.map)).size,9);
assert(data.groundRequests.every(row => row.musicId === null || nativeIds.has(row.musicId)));
assert(data.unassigned.length >= 7,'Keep remaining source/producer/human obligations explicit.');
const runtime = path.join(gameRoot,'content/authored/audio-requests.js');
const expected = `/** Original collapsed browser staging, not native clock/script reproduction.
 * Generated from tools/pokemon-dungeon/audio/current-requests.json; provenance
 * in current-source-map.md. Explicit null and unknown requests replace music
 * with silence. No source queue or saved historical command is invented.
 * @type {readonly {scene:string,from:number,through:number,musicId:number|null,owner:'ground'|'dungeon',guard?:'steel-poststory'|'ordinary-steel-summit'}[]} */
export const SCENE_AUDIO_REQUESTS = Object.freeze([\n${data.sceneRequests.map(row => '  '+JSON.stringify(row)+',').join('\n')}\n]);
/** @type {readonly {map:string,musicId:number|null}[]} */
export const GROUND_AUDIO_REQUESTS = Object.freeze([\n${data.groundRequests.map(row => '  '+JSON.stringify(row)+',').join('\n')}\n]);
`;
if (process.argv.includes('--write')) await writeFile(runtime,expected);
assert.equal(await readFile(runtime,'utf8'),expected,'Request data differs from editable authoring source; use --write.');

/** Parses source only; returned AST nodes are never evaluated. */
async function parse(relative) {
  const source = await readFile(path.join(gameRoot,relative),'utf8');
  return {source,ast:acorn.parse(source,{ecmaVersion:'latest',sourceType:'module'})};
}
function walk(node,visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(child => walk(child,visit)); else if (value && typeof value === 'object') walk(value,visit);
}
function named(ast,name) {
  let result;
  walk(ast,node => { if (node.type === 'FunctionDeclaration' && node.id?.name === name) result = node; });
  assert(result,`Missing source owner ${name}`); return result;
}
function member(node) {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') return `${member(node.object)}.${node.property.name}`;
  return null;
}
const preferences = await parse('src/domain/gameplay/audio-preferences.js');
let apply;
walk(preferences.ast,node => { if (node.type === 'Property' && node.key.name === 'apply') apply = node.value; });
assert(apply,'Missing real handler apply.');
const writes = [], calls = [];
walk(apply,node => {
  if (node.type === 'AssignmentExpression') writes.push(member(node.left));
  assert(node.type !== 'UpdateExpression','Preference handler updates an allocator/counter.');
  if (node.type === 'CallExpression') calls.push(member(node.callee));
});
assert.deepEqual(writes,['context.state.options.audio'],'Saved settings must mutate only the detached existing preference record.');
assert(calls.every(call => ['exactAudioPreferences','audioPreferenceBlocked'].includes(call)),'Preference handler calls a game/RNG/turn/event/persistence owner.');
assert(preferences.source.includes("resumeDungeon:false") && preferences.source.includes("kind:'unchanged'"));
assert(preferences.source.includes("'continuing','learning-continuing'") && preferences.source.includes("'move-learn-choice'"));
assert(preferences.source.includes("sceneId === 'browser-morning-request' && state.pendingScene.cursor === 0"),'The exact pre-read native receipt window must block durable settings.');
const morning = await readFile(path.join(gameRoot,'content/state/first-morning.js'),'utf8');
assert(morning.includes('revision === scene.entryRevision + 1'),'Requalify the narrow pre-read guard if frozen proof changes.');
const commands = await parse('src/domain/gameplay/escort-commands.js');
assert(commands.source.includes('setAudioPreferences: audioPreferencesHandler'),'Handler is not composed.');
const gameplay = await parse('src/domain/gameplay/index.js');
assert(gameplay.source.includes("from './escort-commands.js'") && gameplay.source.includes('advanceTurns: createEscortAdvance('),'Audio must compose the real current escort registry and saved return owner.');
const currentAuthored = await parse('content/authored/escort-work.js');
const overrides = [];
walk(currentAuthored.ast,node => { if (node.type === 'Property' && node.key.name === 'lines' && node.value.type === 'ArrayExpression') overrides.push(node.value.elements.length); });
assert.deepEqual(overrides,[2,10],'Requalify audio when actual Caterpie stages change.');
assert.equal(inventory.get('browser-caterpie-morning').throughCursor,1);
assert.equal(inventory.get('browser-sinister-request').throughCursor,9);
assert.deepEqual(data.sceneRequests.filter(row => row.scene === 'browser-sinister-request').map(row => [row.from,row.through,row.musicId]),[[0,0,1],[1,2,null],[3,7,10],[8,9,null]]);
const shell = await parse('src/shell/application.js');
const refresh = named(shell.ast,'refresh'), dispose = named(shell.ast,'dispose');
const refreshText = shell.source.slice(refresh.start,refresh.end);
assert(refreshText.indexOf('audio.bind(') >= 0 && refreshText.indexOf('audio.bind(') < refreshText.indexOf('if (!snapshot'),'Reset must inspect binding before title/null early return.');
assert(refreshText.includes('audio.present(bound,snapshot,events,projected,loaded.catalogs)'),'Complete accepted events are not presented synchronously.');
assert(!refreshText.slice(refreshText.indexOf('syncActors')).includes('audio.'),'Late actor readiness must not present/unlock sound.');
assert(shell.source.slice(dispose.start,dispose.end).includes('audio.dispose()'),'Application disposal omits audio.');
assert(shell.source.includes("intent:{type:'setAudioPreferences',audio:{...next}}"));
const commit = named(shell.ast,'commitSound'), commitText = shell.source.slice(commit.start,commit.end);
assert(!/\b(?:act|advanceTurns|setTimeout|requestAnimationFrame)\s*\(/.test(commitText),'Saved preferences routed through a gameplay/clock owner.');
assert(commitText.includes('soundOwns') && commitText.includes('soundForeground') && commitText.includes('canAcceptCommands') && commitText.includes('commandContext(snapshot)') && commitText.includes('saves.autosave()'));
const repaint = named(shell.ast,'repaintSound'), repaintText = shell.source.slice(repaint.start,repaint.end);
assert(repaintText.includes('refresh()') && repaintText.includes('!followsGame') && repaintText.includes('view.refreshAudioControls()'),'A saved preference repaint must renew retained menu sound controls against the committed snapshot.');
assert(!/\b(?:close|resume|title|panel|screen)\s*\(/.test(repaintText),'Sound repaint must preserve the current menu model/actions and focus owner.');
const preferenceCallers = new Map();
walk(shell.ast,node => { if (node.type === 'Property' && ['change','activate'].includes(node.key?.name)) preferenceCallers.set(node.key.name,shell.source.slice(node.value.start,node.value.end)); });
assert(preferenceCallers.get('change')?.includes('repaintSound(draft)'),'Saved range/mute changes omit the retained-panel ownership refresh.');
const activationText = preferenceCallers.get('activate');
assert(activationText && activationText.indexOf('audio.activate(event)') < activationText.indexOf('repaintSound(draft)'),'Trusted unmute must activate on its original event stack before renewing current controls.');
assert(repaintText.includes('view.rebuildPanel(snapshot)'),'Preference repaint must rebuild the current retained gameplay model, not merely its sound controls.');
const view = await parse('src/ui/view.js');
assert(view.source.includes('panelRebuild = rebuild ?? null') && view.source.includes('if (!panelOpen || !rebuild) return false') && view.source.includes('const token = panelToken; rebuild(snapshot)'),'Retained rebuilding needs the actual active panel owner.');
const model = await parse('src/application/snapshot-panel.js');
assert(model.source.includes('send(intent,current)') && model.source.includes('view.ownsPanel(token) && current === shown') && model.source.includes('if (!view.ownsPanel(token) || current !== shown) return'),'Rebuilding must not authorize retired buttons or remove exact shown-snapshot dispatch.');
for (const module of ['friends','town','work','reward-panel']) {
  const owner = await parse(`src/application/${module}.js`);
  assert(owner.source.includes('createSnapshotPanel') && owner.source.includes('model.show(') && owner.source.includes('model.snapshot()'),`${module} retains a stale snapshot/actions after preferences.`);
}
const steelPanel = await parse('src/application/steel.js');
assert(steelPanel.source.includes('createSnapshotPanel') && steelPanel.source.includes('showRewardChoices({ model, grant') && steelPanel.source.includes('model.send('),'Steel reward choices must share the actual current retained snapshot model.');
for (const owner of ['showFriends','showTown','showWork','showSteelReward']) {
  walk(shell.ast,node => {
    if (node.type !== 'CallExpression' || node.callee.name !== owner) return;
    const send = node.arguments[0]?.properties?.find(property => property.key?.name === 'send')?.value;
    assert(send && send.params[1]?.name === 'shown',`${owner} dispatch omits its rebuilt shown-snapshot witness.`);
    const source = shell.source.slice(send.start,send.end);
    assert(/current\(\)\s*(?:===|!==)\s*shown/.test(source) && source.includes('adventureEpoch') && source.includes('shownEpoch'),`${owner} relaxed snapshot/binding command admission.`);
  });
}
const friendPanel = await parse('src/application/friends.js'), townPanel = await parse('src/application/town.js');
assert(friendPanel.source.includes("friends?.phase === 'work-two' ? 2 : 3") && friendPanel.source.includes("show(home,\"Caterpie's request\"") && friendPanel.source.includes("friends?.phase === 'caterpie-ready'"),'Retained audio menus must keep the real second-work/Caterpie owners.');
assert(friendPanel.source.includes('name(input.value)') && townPanel.source.includes('quantity(title,maximum,selected,back,input.value)'),'Rebuilding discarded a real unsubmitted nickname/quantity draft.');
assert(view.source.includes('inputIndex') && view.source.includes('setSelectionRange') && view.source.includes('soundFocus(audioKey)'),'Current rebuilt controls must retain the actual owned focus/draft selection.');
assert(shell.source.includes('ready = true; screen(snapshot); if (!followsGame) view.rebuildPanel(snapshot)'),'Retained action enablement must refresh after actual asset readiness.');
assert(shell.source.includes("'Adventure menu',expedition)") && shell.source.includes("'Give up?',() => giveUp(sessionId))") && shell.source.includes('snapshot.session.sessionId !== sessionId'),'Expedition actions must rebuild readiness and retain their actual current session context.');
const onboarding = await parse('src/application/onboarding.js');
assert(onboarding.source.includes('options: structuredClone(getOptions())') && onboarding.source.includes('if (!isCurrent()) return'),'Quiz draft is not carried through actual validated creation/current owner.');
const controls = await parse('src/application/audio-controls.js');
assert(controls.source.includes("enable.addEventListener('click',activate)") && controls.source.includes("enable.addEventListener('keydown'") && controls.source.includes('event.isTrusted') && controls.source.includes('event.preventDefault(); event.stopPropagation(); activate(event)'),'Missing direct trusted event/key ownership.');
const adapter = await parse('src/application/audio.js');
const present = named(adapter.ast,'present'), presentText = adapter.source.slice(present.start,present.end);
assert(presentText.indexOf('domainHigh = Math.max') < presentText.indexOf('bus.setPreferences'),'Validated complete domain high-water must commit before audio work.');
assert(presentText.includes('event.epoch !== captured.instance.getEpoch()') && presentText.includes('event.revision !== snapshot.revision') && presentText.includes('event.eventId <= cursor') && presentText.includes('.slice(0,4)'));
assert(adapter.source.includes('dungeonMusicCue(catalogs.dungeons.getGeneration(floor.generationId).parameters.bgMusic)'),'Floor index is not resolved through its source-qualified table.');
assert(!adapter.source.includes("event.outcome === 'hit'") && !adapter.source.includes("event.type === 'itemChanged'"),'Ambiguous hit/item events received an invented effect.');
assert(adapter.source.includes('visible.has(event.actorId)') && adapter.source.includes('visible.has(preceding.actorId)'));

let sourceVerified = false;
const sourceArgument = process.argv.indexOf('--source-root');
if (sourceArgument >= 0) {
  const nativeRoot = process.argv[sourceArgument+1]; assert(nativeRoot && !nativeRoot.startsWith('--'));
  const git = promisify(execFile);
  for (const row of data.sourceQualification.nativeFiles) {
    assert(/^(?:src|include)\/[a-zA-Z0-9_/.]+\.(?:c|h)$/.test(row.path) && !row.path.includes('..'));
    const {stdout} = await git('git',['show',`${data.sourceQualification.commit}:${row.path}`],{cwd:nativeRoot,encoding:'buffer',maxBuffer:4*1024*1024});
    assert.equal(hash(stdout),row.sha256,`Pinned comparative source changed: ${row.path}`);
  }
  sourceVerified = true;
}
// Pin the authored scene bodies used for the finite cursor inventory, never
// frozen import authentication; runtime owners may be reviewed prospectively.
for (const row of data.sourceQualification.browserFiles.filter(row => row.path.startsWith('content/authored/'))) assert.equal(hash(await readFile(path.join(gameRoot,row.path))),row.sha256,`Authored cursor inventory changed: ${row.path}; qualify updated requests.`);
console.log(`Live audio static authoring audit: ${inventory.size} scenes / ${cursors} finite cursors (${silent} explicit silent) / ${data.sceneRequests.length} requests / 9 maps; exact preference-only write, canonical composition, trusted iframe controls, complete event admission, draft creation and disposal source seams. ${sourceVerified ? '24 pinned comparative native blobs verified.' : 'Native joins declared; use --source-root to verify blobs.'} No game execution/audition; independent integration review and human gates remain open.`);
