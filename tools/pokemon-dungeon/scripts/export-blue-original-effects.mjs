import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {parseExpressionAt} from 'acorn';

// Local JSON/source validation only. Never import or execute game/audio modules.
const input=new URL('../audio/blue-original-effects.json',import.meta.url);
const output=new URL('../../../games/pokemon-dungeon-reimagined/src/blue/audio-bank.js',import.meta.url);
const raw=await readFile(input,'utf8'),data=JSON.parse(raw);
assert.deepEqual(Object.keys(data),['revision','authorship','patches','effects']);
assert.equal(data.revision,'blue-opening-effects-v1');
assert.equal(data.authorship.source,'tools/pokemon-dungeon/audio/blue-original-effects.json');
const effectIds=['attack','hit','pickup','stairs','rescue-found','reward','level-up','faint'].map(id=>`effect-${id}`);
assert.deepEqual(data.effects.map(cue=>cue.id),effectIds);
assert.equal(Object.keys(data.patches).length,6);
const finite=value=>typeof value==='number'&&Number.isFinite(value);
for(const patch of Object.values(data.patches)){
  assert(['sine','triangle','square','sawtooth'].includes(patch.wave));
  assert(finite(patch.gain)&&patch.gain>0&&patch.gain<=.12);
  assert(finite(patch.attack)&&patch.attack>0&&patch.attack<=.1);
  assert(finite(patch.release)&&patch.release>0&&patch.release<=.25);
  assert(finite(patch.glide)&&patch.glide>-1&&patch.glide<=0);
}
const usedPatches=new Set();let notes=0;
for(const cue of data.effects){
  assert.deepEqual(Object.keys(cue),['id','title','role','bpm','beats','loop','notes']);
  assert(typeof cue.title==='string'&&cue.title&&typeof cue.role==='string'&&cue.role);
  assert(finite(cue.bpm)&&cue.bpm>=54&&cue.bpm<=180&&finite(cue.beats)&&cue.beats>0&&cue.beats<=4);
  assert.equal(cue.loop,false);assert(cue.notes.length>=1&&cue.notes.length<=8);
  let previous=-1;
  for(const note of cue.notes){
    const patch=data.patches[note.patch];assert(patch);usedPatches.add(note.patch);
    assert(finite(note.beat)&&note.beat>=0&&note.beat>=previous&&finite(note.length)&&note.length>0&&note.beat+note.length<cue.beats);
    assert(Number.isInteger(note.pitch)&&note.pitch>=12&&note.pitch<=107&&finite(note.velocity)&&note.velocity>0&&note.velocity<=1);
    assert(note.length*60/cue.bpm+patch.release+.01<=4);previous=note.beat;notes++;
  }
}
assert.deepEqual([...usedPatches].sort(),Object.keys(data.patches).sort());
// Keep source labels and duration/loop checks outside the effects-only runtime.
// Slice fields without reserializing retained playback values.
const syntax=parseExpressionAt(raw,0,{ecmaVersion:'latest'});
const field=(object,name)=>{
  const value=object.properties.find(item=>item.type==='Property'&&item.key.value===name);
  assert(value,`Missing authored effect field: ${name}`);return value;
};
const cuts=[[field(syntax,'revision').start,field(syntax,'patches').start]];
for(const cue of field(syntax,'effects').value.elements){
  cuts.push([field(cue,'title').start,field(cue,'bpm').start]);
  cuts.push([field(cue,'beats').start,field(cue,'notes').start]);
}
let playback=raw;
for(const [start,end] of cuts.sort((left,right)=>right[0]-left[0]))playback=playback.slice(0,start)+playback.slice(end);
const literal=playback.replace(/("(?:\\.|[^"\\])*")|\s+/gu,(_match,string)=>string??'');
const generated='/** Original sound effects by Codex for this project. Generated from tools/pokemon-dungeon/audio/blue-original-effects.json.\n'+
  ' * No background music, commercial soundtrack, samples or ROM data.\n */\n'+
  '/** @type {import(\'./audio-types.js\').OpeningAudioBank} */\n'+
  `export const OPENING_AUDIO_BANK = ${literal};\n`;
assert(Buffer.byteLength(generated)<8*1024,'Opening effects exceed their 8KiB budget.');
if(process.argv.includes('--check'))assert.equal(await readFile(output,'utf8'),generated,'Regenerate the scoped original effects.');
else await writeFile(output,generated);
console.log(`Blue original effects: 8 cues, 6 used patches, ${notes} notes; ${Buffer.byteLength(generated)} runtime bytes. Static JSON/source only.`);
