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
const solarSequences=new Set([768,784,785]);
const counterSequence=853;
const lightScreenSequences=new Set([851,890]);
const protectSequence=708;
const safeguardSequence=776;
const lightScreenVoiceKeys=new Set(['028:6']);
const safeguardVoiceKeys=new Set(['026:34']);
const solarVoiceKeys=new Set(['026:4','026:16','026:21','026:22']);
const solarSourcePaths=new Set(['sound/songs/seq_768.s','sound/songs/seq_784.s','sound/songs/seq_785.s','sound/wave/wave_099.s','sound/wave/wave_110.s']);
const originalFacts={
  samples:data.samples.slice(0,16),
  cues:data.cues.filter(cue=>!solarSequences.has(cue.sequence)&&cue.sequence!==counterSequence&&!lightScreenSequences.has(cue.sequence)&&cue.sequence!==protectSequence&&cue.sequence!==safeguardSequence),
  scale:data.scale,frequencyBase:data.frequencyBase,
  voices:Object.fromEntries(Object.entries(data.voices).filter(([key])=>!solarVoiceKeys.has(key)&&!lightScreenVoiceKeys.has(key)&&!safeguardVoiceKeys.has(key)))
};
assert.equal(sha(JSON.stringify(originalFacts)),"390f18e76b41ea124954f467c8fcb7b21c1e09b4b806189fa6f209a6ef5dbfe9",'Prior PCM source facts changed; review and repin them.');
assert.equal(data.sources.length,80);
assert.equal(sha(JSON.stringify(data.sources.slice(0,68))),"f137bab8df8d7fc3285c4ad305ec5c0cd3b330870c659d4a3ed304b10a61b2ea",'Pinned prior PCM source ledger changed.');
assert.deepEqual(data.sources.slice(68,73).map(source=>source.path).sort(),[...solarSourcePaths].sort());
assert.equal(data.sources[73].path,'sound/songs/seq_853.s');
assert.deepEqual(data.sources.slice(74,77).map(source=>source.path),['sound/songs/seq_851.s','sound/songs/seq_890.s','sound/wave/wave_044.s']);
assert.deepEqual(data.sources[77],{path:'sound/songs/seq_708.s',bytes:3346,sha256:'1dd00c00bc07cdf3b0f1557ce768b8348220037360bbc56134c11fc32830886a',url:`https://github.com/pret/pmd-red/blob/${data.sourceCommit}/sound/songs/seq_708.s`});
assert.deepEqual(data.sources.slice(78).map(({path,bytes,sha256})=>[path,bytes,sha256]),[
  ['sound/songs/seq_776.s',3364,'666f4c704cbea66afe91e55af1f6c4b86a261be9e9e7181c02803e7d123bd143'],
  ['sound/wave/wave_125.s',203160,'eecafcf2b7f14a7603f865d0f5f110eb179120257ec22d90473be994e23d4f4c']
]);
assert.deepEqual(data.sources.slice(74,77).map(({bytes,sha256})=>[bytes,sha256]),[
  [2335,'c33a195b1af12c2a1e9d844ba7de949c7dff34b5f35d9089c7eff0fdc9b43a5d'],
  [1157,'5d1fa0978c451137195830269c1ca9cb20b1ecef0793c5ff3cbfa7d79620f7eb'],
  [90489,'5364fcf27ad86ffc346d146abd46d90a68f07cb99d40a3c74d89f9ffeae5be2e']
]);
assert.deepEqual(data.cues.filter(cue=>solarSequences.has(cue.sequence)).map(({id,sequence})=>[id,sequence]),[
  ['effect-solar-beam-cast',768],['effect-solar-beam-travel',784],['effect-solar-beam-preparation',785]
]);
assert.deepEqual([...Object.keys(data.voices).filter(key=>solarVoiceKeys.has(key))].sort(),[...solarVoiceKeys].sort());
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
assert.equal(literalBytes,123712);assert.equal(decodedBytes,494812);
assert.equal(data.samples.length,20);
assert.deepEqual(data.samples.at(-1)&&((({id,sampleCount,loopStart,literalBytes,sampleSha256,literalSha256})=>({id,sampleCount,loopStart,literalBytes,sampleSha256,literalSha256}))(data.samples.at(-1))),{
  id:125,sampleCount:17648,loopStart:0,literalBytes:17648,
  sampleSha256:'f8c1b345b37c8958d727eb9855f458301e1398cbfe12fd307651b36c31d09e0f',
  literalSha256:'f8c1b345b37c8958d727eb9855f458301e1398cbfe12fd307651b36c31d09e0f'
});

// MODT0 adds16*modM before signed coarse/fine pitch splitting.
// The selected older cues have no pitch modulation, so their tuples stay exact.
function frequency(key,bend,range,mod=0){
  const pitch=bend*range*4+16*mod,effective=Math.max(0,key+(pitch>>8)),fine=pitch&255;
  const left=data.frequencyBase[data.scale[effective]&15]>>>(data.scale[effective]>>4);
  const right=data.frequencyBase[data.scale[effective+1]&15]>>>(data.scale[effective+1]>>4);
  const interpolated=BigInt(left)+(BigInt(right-left)*BigInt(fine)*16777216n>>32n);
  return Number(18592768n*interpolated>>32n);
}
const cues={},groups={};let noteCount=0,levelCount=0,rateCount=0;
for(const cue of data.cues){
  const group6=cue.sequence===407||cue.sequence===413||cue.sequence===927||cue.sequence===938;
  const qualifiedVoice=[680,774,927,938,605,708,768,784,785,853,851,890,776].includes(cue.sequence);
  assert.equal(cue.bank,[605,890].includes(cue.sequence)?28:qualifiedVoice?26:undefined);
  assert.equal(cue.player,group6?'SE6':'SE5');assert.equal(cue.priority,127);
  if(group6)groups[cue.id]=6;
  const tempo=cue.controls.find(control=>control.command==='TEMPO').value*2;
  const frame=tick=>Math.ceil(tick*150/tempo),fineFrame=frame(cue.fineTick);
  const state={VOL:0,PAN:0,MOD:0,LFOS:22,MODT:0,BENDR:2,BEND:0};
  const changes=new Map();let phase=0;
  for(let tick=0;tick<cue.fineTick;tick++){
    for(const control of cue.controls)if(control.tick===tick)state[control.command]=control.value;
    let mod=0;
    if(state.MOD&&state.LFOS){
      // STRB wraps stored phase but leaves the sum register intact. The
      // native branch then stores its signed modulation result as one byte.
      const sum=phase+state.LFOS;phase=sum&255;
      const triangle=((sum-64)&128)?(sum<<24)>>24:128-sum;
      mod=(Math.floor(triangle*state.MOD/64)<<24)>>24;
    }
    // Native TrkVolPitSet applies MODT 1 before stereo-pan truncation.
    if(state.MODT===1)assert.equal(cue.sequence,605);
    const pan=Math.max(-128,Math.min(127,state.PAN*2+(state.MODT===2?mod:0))),volume=state.MODT===1?state.VOL*2*(mod+128)>>>7:state.VOL*2;
    changes.set(frame(tick),{right:(pan+128)*volume>>8,left:(127-pan)*volume>>8,bend:state.BEND,range:state.BENDR,pitchMod:state.MODT===0?mod:0});
  }
  const frames=[];let current=changes.get(0);
  const requiredFrames=Math.max(fineFrame+11,...cue.notes.map(note=>frame(note.tick+note.gate)+16));
  for(let at=0;at<requiredFrames;at++){current=changes.get(at)??current;frames.push(current);}
  const notes=cue.notes.map(note=>{
    // Numeric VOICE evidence stays intact; only new cues qualify its source bank.
    assert(Number.isInteger(note.voice));
    const voiceKey=qualifiedVoice?`${String(cue.bank).padStart(3,'0')}:${note.voice}`:note.voice;
    const voice=data.voices[voiceKey];assert(voice,'Selected PCM voice is unavailable.');
    if(qualifiedVoice){
      assert.equal(voice.bank,cue.bank);
      assert(cue.controls.some(control=>control.command==='VOICE'&&control.value===note.voice));
    }
    const start=frame(note.tick),release=frame(note.tick+note.gate);
    const rates=[],levels=[];let envelope=255,end=-1;
    for(let at=start;at<release+16;at++){
      if(at>=release)envelope=envelope*voice.envelope[3]>>8;
      else if(at>start&&voice.envelope[2]!==255)envelope=envelope*voice.envelope[1]>>8;
      const control=frames[at],master=15*envelope>>4;
      const right=128*note.velocity*control.right>>14,left=127*note.velocity*control.left>>14;
      const pair=[left*master>>8,right*master>>8],prior=levels.at(-1);
      if(!prior||prior[1]!==pair[0]||prior[2]!==pair[1])levels.push([at,...pair]);
      if(envelope===0){end=at;break;}
      const rate=frequency(note.key,control.bend,control.range,control.pitchMod);
      if(rates.at(-1)?.[1]!==rate)rates.push([at,rate]);
    }
    const endLimit=cue.sequence===785?107:82;
    assert(end>start&&end<=endLimit);
    if(end>82)assert.equal(cue.sequence,785,'Only named Solar preparation cue may end after frame 82.');
    assert(levels.length<=59&&rates.length<=45);
    noteCount++;levelCount+=levels.length;rateCount+=rates.length;
    return [voice.wave,start,end,rates,levels];
  });
  const noteLimit=cue.sequence===784?14:13;
  assert(notes.length<=noteLimit);
  if(notes.length>13)assert.equal(cue.sequence,784,'Only named Solar travel cue may use 14 notes.');
  if(cue.sequence===785)assert.equal(fineFrame,138,'Solar preparation FINE exception changed.');
  if(group6)assert(notes.length<=5);
  cues[cue.id]=[fineFrame,notes];
}
assert.equal(noteCount,124);assert.equal(levelCount,1257);assert.equal(rateCount,647);
assert.equal(cues['effect-safeguard'][0],50);
assert.deepEqual(cues['effect-safeguard'][1].map(note=>note.slice(0,3)),[[125,2,5],[125,5,50],[125,5,50]]);
assert.equal(cues['effect-protect'][0],79);
assert.equal(cues['effect-protect'][1].length,12);
assert.equal(cues['effect-light-screen-target'][0],33);
assert.deepEqual(cues['effect-light-screen-target'][1].map(note=>note.slice(0,3)),[[110,0,32],[110,0,32]]);
assert.equal(cues['effect-light-screen-hit'][0],10);
assert.deepEqual(cues['effect-light-screen-hit'][1].map(note=>note.slice(0,3)),[[44,2,24]],'Sequence 890 finite release lifetime changed');
assert.deepEqual(groups,{'effect-whiffer':6,'effect-sleep-helper':6,'effect-paralysis':6,'effect-disable-target':6});
assert.deepEqual(cues['effect-whiffer'],[13,[[115,2,4,[[2,38473]],[[2,109,111],[3,108,110],[4,0,0]]],[115,5,7,[[5,30536]],[[5,109,111],[6,108,110],[7,0,0]]],[115,8,10,[[8,24236]],[[8,109,111],[9,108,110],[10,0,0]]],[115,11,13,[[11,19236]],[[11,90,92],[13,0,0]]]]]);
assert.equal(cues['effect-heal'][0],72);assert.equal(cues['effect-heart'][0],43);
assert.deepEqual(cues['effect-heal'][1].map(note=>note[1]),[4,12,19,23,27,30,34,38,42,45,49,57,64]);
assert.deepEqual(cues['effect-heart'][1].map(note=>note[1]),[2,8,22,30,35]);
assert.equal(cues['effect-pickup-money'][0],18);
assert.deepEqual(cues['effect-pickup-money'][1].map(note=>[note[0],note[1],note[2],note[3]]),[[127,1,5,[[1,24236]]],[127,3,18,[[3,18157]]]]);
assert.deepEqual(cues['effect-item-loss'],[19,[[116,2,18,[[2,13602],[7,12343],[8,11565],[9,10154],[10,8632],[11,7580],[12,6443],[13,5133],[14,4657],[15,4224],[16,4089],[17,3476]],[[2,104,113],[3,116,101],[4,95,122],[5,123,92],[6,85,129],[7,131,82],[8,100,112],[9,107,105],[10,107,104],[11,98,111],[12,114,94],[13,89,119],[14,121,86],[15,81,126],[16,109,95],[17,98,107],[18,0,0]]]]]);
assert.equal(sha(JSON.stringify(cues['effect-rapid-spin'])),'436c0a4f21979b8207bbb2b0c72684cb4322d9aa38b819eeac0cff54f109bf99','Pinned 678 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-synthesis'])),'af54f5ec1aa8610af52e908a5486e21ba03d31c15f37654c1491d395ba2194ae','Pinned 809 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-move-preparation'])),'f292eefd776a177a352288e9ec869c738a3341266dd4daf4ca5a54ddb6f66333','Pinned 621 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-sleep-helper'])),'3066198c45df0c8468e687b8d6fddcca103b12d0b5d9fb38776603e5a2e5a833','Pinned 407 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-vine-whip'])),'e1b9839cf2523a328079509a8e40ff72946151bc3334eed10e0e868fbba3c360','Pinned 745 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-razor-leaf'])),'a7845d0de5b051ed24bd77370fd727375581dcbd67c93ac1a7d75c5b8f02e4f0','Pinned 825 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-leech-seed-travel'])),'ebb7f9f3155ca1fead75c17c0df9604f825c96c5615e8a9d621d47e63d0e76fe','Pinned 807 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-bubble-impact'])),'0a1d378249c60c0b1613e20f41f4769ae6b6540ebd628c817c6541dfdcd1a6ba','Pinned 628 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-water-sport'])),'99bc55e88f4eba3b77a5946f6dc1d8e1abeb6f6a232fd5fe12ac96e206f82e30','Pinned 717 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-tackle'])),'128f620476a460df9f2444c00ea2f79978025e4502b88fe884cd7e9d22356aa7','Pinned 344 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-disable-cast'])),'302c5693e50fff4baaa0861bae09edc6aa753dccc73c9de1c9f9290d621b4f1a','Pinned 680 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-thunder'])),'87fce4867b6a6cf7777f9046c50fd1846d357df1aade35faeac0636b166863ca','Pinned 774 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-paralysis'])),'b1bc0730b3af224fba5ab16889c09f3ed698711858bf6d7191413d57237971dd','Pinned 927 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-disable-target'])),'324e199e441b0416d244a8ab0b7f8df98308371ea4a599d1b98bff1eecdeb7e2','Pinned 938 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-strength-up'])),'3c4ac3dbf9ac2b18a9aaadafdbd53f8fb85e30caee60946508d7cf0f0d30309c','Pinned 605 finite tuple changed.');
assert.equal(sha(JSON.stringify(cues['effect-counter'])),'eb3480d13040a3d6b81285cd017869da52230d552144314fd5630665d5444a36','Pinned 853 finite tuple changed.');
const generated=`/** Generated selected public Red PCM facts; Blue identity, resampling, global reverb and mix remain qualified. */\n`+
  `export const PCM_SOURCE_SHA256='${sha(bytes)}';\n`+
  `export const PCM_FRAME_SECONDS=280896/16777216;\nexport const PCM_EFFECT_GAIN=${data.browserGain};\n`+
  `/** [sample id, sample count, loop start, loops, signed-8 bytes including source guard]. */\n`+
  `/** @type {readonly (readonly [number,number,number,boolean,string])[]} */\n`+
  `export const PCM_SAMPLES=${JSON.stringify(samples)};\n`+
  `/** @typedef {readonly [number,number,number,readonly (readonly [number,number])[],readonly (readonly [number,number,number])[]]} PcmNote */\n`+
  `/** Note: [sample id, start frame, zero-envelope frame, frequency steps, integer left/right levels]. Cue: [FINE frame, notes]. */\n`+
  `/** @type {Readonly<Record<string,readonly [number,readonly PcmNote[]]>>} */\n`+
  `export const PCM_EFFECTS=${JSON.stringify(cues)};\n`+
  `/** Numeric song-table replacement domain; omitted legacy cues use group5. */\n`+
  `/** @type {Readonly<Record<string,5|6>>} */\nexport const PCM_EFFECT_GROUPS=${JSON.stringify(groups)};\n`;
// Exact selected-cue catalog admission; shared/live/note/row/end limits stay fixed.
assert.equal(Buffer.byteLength(generated),189062,'Selected PCM catalog byte projection changed.');
if(process.argv.includes('--check'))assert.equal(await readFile(output,'utf8'),generated,'Regenerate selected PCM data.');
else await writeFile(output,generated);
console.log(`Selected PCM: 20 samples, 124 notes, ${levelCount} stereo rows, ${rateCount} frequency rows, ${Buffer.byteLength(generated)} runtime bytes; static source/data only${sourceArgument>=0?', source hashes verified':''}.`);
