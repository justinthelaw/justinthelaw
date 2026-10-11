import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';

// Local JSON/source validation only. Never import or execute game/audio modules.
const input=new URL('../audio/blue-original-score.json',import.meta.url);
const output=new URL('../../../games/pokemon-dungeon-reimagined/src/blue/audio-bank.js',import.meta.url);
const raw=await readFile(input,'utf8'),data=JSON.parse(raw);
assert.deepEqual(Object.keys(data),['revision','authorship','patches','music','effects']);
assert.equal(data.revision,'blue-opening-original-audio-v1');
assert.equal(data.authorship.source,'tools/pokemon-dungeon/audio/blue-original-score.json');
const musicIds=['file-select','theres-trouble','welcome-to-the-world-of-pokemon','intro','title-screen','dungeon-fail','dungeon-complete','heartwarming','a-successful-rescue','in-the-depths-of-the-pit','tiny-woods'].map(id=>`music-${id}`);
const effectIds=['attack','hit','miss','pickup','money','stairs','rescue-found','reward','level-up','faint'].map(id=>`effect-${id}`);
assert.deepEqual(data.music.map(cue=>cue.id),musicIds);
assert.deepEqual(data.effects.map(cue=>cue.id),effectIds);
assert.equal(Object.keys(data.patches).length,9);
const finite=value=>typeof value==='number'&&Number.isFinite(value);
for(const patch of Object.values(data.patches)){
  assert(['sine','triangle','square','sawtooth'].includes(patch.wave));
  assert(finite(patch.gain)&&patch.gain>0&&patch.gain<=.12);
  assert(finite(patch.attack)&&patch.attack>0&&patch.attack<=.1);
  assert(finite(patch.release)&&patch.release>0&&patch.release<=.25);
  assert(finite(patch.glide)&&patch.glide> -1&&patch.glide<=0);
}
const usedPatches=new Set();let notes=0,maxMusicVoices=0;
for(const [bus,cues]of [['music',data.music],['effects',data.effects]])for(const cue of cues){
  assert(typeof cue.title==='string'&&cue.title&&typeof cue.role==='string'&&cue.role);
  assert(finite(cue.bpm)&&cue.bpm>=54&&cue.bpm<=180&&finite(cue.beats)&&cue.beats>0&&cue.beats<=32&&typeof cue.loop==='boolean');
  assert(cue.notes.length>=1&&cue.notes.length<=(bus==='effects'?8:128));
  if(bus==='effects')assert.equal(cue.loop,false);
  let previous=-1;const spans=[];
  for(const note of cue.notes){
    const patch=data.patches[note.patch];assert(patch);usedPatches.add(note.patch);
    assert(finite(note.beat)&&note.beat>=0&&note.beat>=previous&&finite(note.length)&&note.length>0&&note.beat+note.length<cue.beats);
    assert(Number.isInteger(note.pitch)&&note.pitch>=12&&note.pitch<=107&&finite(note.velocity)&&note.velocity>0&&note.velocity<=1);
    const duration=note.length*60/cue.bpm+patch.release+.01;assert(duration<=4);previous=note.beat;notes++;
    // Static reservation arithmetic includes the existing 250ms lookahead.
    for(let loop=0;loop<(cue.loop?3:1);loop++){
      const start=(loop*cue.beats+note.beat)*60/cue.bpm;spans.push([start-.25,1],[start+duration,-1]);
    }
  }
  if(bus==='music'){
    spans.sort((left,right)=>left[0]-right[0]||left[1]-right[1]);let voices=0,peak=0;
    for(const[,delta]of spans){voices+=delta;peak=Math.max(peak,voices);}
    assert(peak<=16,`Music voice budget exceeded: ${cue.id}`);maxMusicVoices=Math.max(maxMusicVoices,peak);
  }
}
assert.deepEqual([...usedPatches].sort(),Object.keys(data.patches).sort());
// Strip only JSON whitespace outside strings. Retain note token spellings so
// regenerating the selected score does not rewrite 1.0 to 1 or alter event bytes.
const literal=raw.replace(/("(?:\\.|[^"\\])*")|\s+/gu,(_match,string)=>string??'');
const generated='/** Original project score. Generated from tools/pokemon-dungeon/audio/blue-original-score.json.\n'+
  ' * No commercial soundtrack, samples or ROM data. Intro is nonlooping; reunion loops.\n'+
  ' */\n/** @type {import(\'./audio-types.js\').OpeningAudioBank} */\n'+
  `export const OPENING_AUDIO_BANK = ${literal};\n`;
assert(Buffer.byteLength(generated)<64*1024,'Opening score exceeds its 64KiB budget.');
if(process.argv.includes('--check'))assert.equal(await readFile(output,'utf8'),generated,'Regenerate the scoped original score.');
else await writeFile(output,generated);
console.log(`Blue original score: 11 themes, 10 effects, 9 used patches, ${notes} notes; music reservation peak ${maxMusicVoices}/16; ${Buffer.byteLength(generated)} runtime bytes. Static JSON/source only.`);
