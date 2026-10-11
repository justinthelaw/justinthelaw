import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

// Finite source-data arithmetic only. Never import or execute game/native code.
const input=new URL('../audio/blue-pcm-effects.json',import.meta.url);
const output=new URL('../../../games/pokemon-dungeon-reimagined/src/blue/audio-pcm-data.js',import.meta.url);
const bytes=await readFile(input),data=JSON.parse(bytes);
const sha=value=>createHash('sha256').update(value).digest('hex');
assert.equal(data.schemaVersion,1);
assert.equal(data.edition,'Red Rescue Team comparative');
assert.equal(data.sourceCommit,'013475aa04f5be3191e5527c186d9bfceae7cae0');
assert.deepEqual(data.clock,{cpuHz:16777216,cyclesPerFrame:280896,initialTempo:150,threshold:150});
assert.equal(data.browserGain,.22);assert.equal(data.nativeMaster,14);
const fixed=Object.fromEntries(['samples','cues','scale','frequencyBase','voices'].map(key=>[key,data[key]]));
assert.equal(sha(JSON.stringify(fixed)),'0e81d9a3a8e4c6f29003a7e16e0c9148da47572d9460a2158c15c5399841cee9','Selected PCM source facts changed; review and repin them.');
assert.equal(data.sources.length,36);
assert.equal(sha(JSON.stringify(data.sources)),'c53cfdf01c6412066d54e43b34b7981dc4fe84b4643818fe1d8b944a7a11cb9a','Pinned PCM source ledger changed.');
const sourceArgument=process.argv.indexOf('--source-root');
if(sourceArgument>=0){
  const sourceRoot=process.argv[sourceArgument+1];assert(sourceRoot,'Provide --source-root PATH');
  for(const source of data.sources){
    assert(!source.path.startsWith('/')&&!source.path.split('/').includes('..'));
    const file=await readFile(path.join(sourceRoot,source.path));
    assert.equal(file.length,source.bytes,source.path);assert.equal(sha(file),source.sha256,source.path);
    assert.equal(source.url,`https://github.com/pret/pmd-red/blob/${data.sourceCommit}/${source.path}`);
  }
}
let decodedBytes=0,literalBytes=0;
const samples=data.samples.map(sample=>{
  const raw=Buffer.from(sample.base64,'base64');
  assert.equal(raw.toString('base64'),sample.base64);assert.equal(raw.length,sample.literalBytes);
  assert.equal(sha(raw),sample.literalSha256);assert.equal(sha(raw.subarray(0,sample.sampleCount)),sample.sampleSha256);
  assert.equal(sample.type,0);assert.equal(sample.frequencyQ10,0x11BB400);assert.equal(sample.baseSampleRate,18157);
  assert(sample.status===0||sample.status===0x4000);
  assert.equal(raw.length,sample.sampleCount+(sample.status?1:0));
  if(sample.status)assert.equal(raw.at(-1),raw[sample.loopStart]);
  assert(sample.loopStart>=0&&sample.loopStart<sample.sampleCount);
  literalBytes+=raw.length;decodedBytes+=sample.sampleCount*4;
  return [sample.id,sample.sampleCount,sample.loopStart,Boolean(sample.status),sample.base64];
});
assert.equal(literalBytes,27487);assert.equal(decodedBytes,109940);

function frequency(key,bend,range){
  const pitch=bend*range*4,effective=Math.max(0,key+(pitch>>8)),fine=pitch&255;
  const left=data.frequencyBase[data.scale[effective]&15]>>>(data.scale[effective]>>4);
  const right=data.frequencyBase[data.scale[effective+1]&15]>>>(data.scale[effective+1]>>4);
  const interpolated=BigInt(left)+(BigInt(right-left)*BigInt(fine)*16777216n>>32n);
  return Number(18592768n*interpolated>>32n);
}
const cues={};let noteCount=0,levelCount=0,rateCount=0;
for(const cue of data.cues){
  assert.equal(cue.player,'SE5');assert.equal(cue.priority,127);
  const tempo=cue.controls.find(control=>control.command==='TEMPO').value*2;
  const frame=tick=>Math.ceil(tick*150/tempo),fineFrame=frame(cue.fineTick);
  const state={VOL:0,PAN:0,MOD:0,LFOS:22,MODT:0,BENDR:2,BEND:0};
  const changes=new Map();let phase=0;
  for(let tick=0;tick<cue.fineTick;tick++){
    for(const control of cue.controls)if(control.tick===tick)state[control.command]=control.value;
    let mod=0;
    if(state.MOD&&state.LFOS){
      phase=(phase+state.LFOS)&255;
      const triangle=phase<64?phase:phase<192?128-phase:phase-256;
      mod=Math.floor(triangle*state.MOD/64);
    }
    const pan=Math.max(-128,Math.min(127,state.PAN*2+(state.MODT===2?mod:0))),volume=state.VOL*2;
    changes.set(frame(tick),{right:(pan+128)*volume>>8,left:(127-pan)*volume>>8,bend:state.BEND,range:state.BENDR});
  }
  const frames=[];let current=changes.get(0);
  for(let at=0;at<fineFrame+11;at++){current=changes.get(at)??current;frames.push(current);}
  const notes=cue.notes.map(note=>{
    const voice=data.voices[note.voice],start=frame(note.tick),release=frame(note.tick+note.gate);
    const rates=[],levels=[];let envelope=255,end=-1;
    for(let at=start;at<release+12;at++){
      if(at>=release)envelope=envelope*voice.envelope[3]>>8;
      else if(at>start&&voice.envelope[2]!==255)envelope=envelope*voice.envelope[1]>>8;
      const control=frames[at],master=15*envelope>>4;
      const right=128*note.velocity*control.right>>14,left=127*note.velocity*control.left>>14;
      const pair=[left*master>>8,right*master>>8],prior=levels.at(-1);
      if(!prior||prior[1]!==pair[0]||prior[2]!==pair[1])levels.push([at,...pair]);
      if(envelope===0){end=at;break;}
      const rate=frequency(note.key,control.bend,control.range);
      if(rates.at(-1)?.[1]!==rate)rates.push([at,rate]);
    }
    assert(end>start&&end<=82);assert(levels.length<=17&&rates.length<=12);
    noteCount++;levelCount+=levels.length;rateCount+=rates.length;
    return [voice.wave,start,end,rates,levels];
  });
  assert(notes.length<=13);
  cues[cue.id]=[fineFrame,notes];
}
assert.equal(noteCount,21);assert.equal(levelCount,247);assert.equal(rateCount,41);
assert.equal(cues['effect-heal'][0],72);assert.equal(cues['effect-heart'][0],43);
assert.deepEqual(cues['effect-heal'][1].map(note=>note[1]),[4,12,19,23,27,30,34,38,42,45,49,57,64]);
assert.deepEqual(cues['effect-heart'][1].map(note=>note[1]),[2,8,22,30,35]);
assert.equal(cues['effect-pickup-money'][0],18);
assert.deepEqual(cues['effect-pickup-money'][1].map(note=>[note[0],note[1],note[2],note[3]]),[[127,1,5,[[1,24236]]],[127,3,18,[[3,18157]]]]);
assert.deepEqual(cues['effect-item-loss'],[19,[[116,2,18,[[2,13602],[7,12343],[8,11565],[9,10154],[10,8632],[11,7580],[12,6443],[13,5133],[14,4657],[15,4224],[16,4089],[17,3476]],[[2,104,113],[3,116,101],[4,95,122],[5,123,92],[6,85,129],[7,131,82],[8,100,112],[9,107,105],[10,107,104],[11,98,111],[12,114,94],[13,89,119],[14,121,86],[15,81,126],[16,109,95],[17,98,107],[18,0,0]]]]]);
const generated=`/** Generated selected public Red PCM facts; Blue identity, resampling, global reverb and mix remain qualified. */\n`+
  `export const PCM_SOURCE_SHA256='${sha(bytes)}';\n`+
  `export const PCM_FRAME_SECONDS=280896/16777216;\nexport const PCM_EFFECT_GAIN=${data.browserGain};\n`+
  `/** [sample id, sample count, loop start, loops, signed-8 bytes including source guard]. */\n`+
  `/** @type {readonly (readonly [number,number,number,boolean,string])[]} */\n`+
  `export const PCM_SAMPLES=${JSON.stringify(samples)};\n`+
  `/** @typedef {readonly [number,number,number,readonly (readonly [number,number])[],readonly (readonly [number,number,number])[]]} PcmNote */\n`+
  `/** Note: [sample id, start frame, zero-envelope frame, frequency steps, integer left/right levels]. Cue: [FINE frame, notes]. */\n`+
  `/** @type {Readonly<Record<string,readonly [number,readonly PcmNote[]]>>} */\n`+
  `export const PCM_EFFECTS=${JSON.stringify(cues)};\n`;
assert(Buffer.byteLength(generated)<=41100,'Selected PCM data exceeds its admission allowance.');
if(process.argv.includes('--check'))assert.equal(await readFile(output,'utf8'),generated,'Regenerate selected PCM data.');
else await writeFile(output,generated);
console.log(`Selected PCM: 5 samples, 21 notes, 247 stereo rows, 41 frequency rows, ${Buffer.byteLength(generated)} runtime bytes; static source/data only${sourceArgument>=0?', source hashes verified':''}.`);
