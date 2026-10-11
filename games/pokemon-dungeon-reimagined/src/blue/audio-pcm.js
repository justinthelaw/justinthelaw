import {PCM_EFFECTS,PCM_SAMPLES,PCM_FRAME_SECONDS,PCM_EFFECT_GAIN} from './audio-pcm-data.js';

/** @typedef {{source:AudioBufferSourceNode,left:GainNode,right:GainNode,end:number,fine:number}} PcmVoice */
const MAX_PCM_VOICES=15;
/** Four finite SE5 cues. No native reverb, song interpreter, timer or game callback.
 * The caller creates this owner only inside the existing trusted activation.
 * @param {AudioContext} context @param {GainNode} destination */
export function createPcmEffects(context,destination){
  /** @type {Map<number,{buffer:AudioBuffer,loop:boolean,loopStart:number}>} */const buffers=new Map();
  /** @type {Set<PcmVoice>} */const voices=new Set();
  let disposed=false;
  for(const [id,size,loopStart,loop,encoded] of PCM_SAMPLES){
    const raw=globalThis.atob(encoded),buffer=context.createBuffer(1,size,18157),samples=buffer.getChannelData(0);
    for(let index=0;index<size;index++){const value=raw.charCodeAt(index);samples[index]=(value<128?value:value-256)/128;}
    buffers.set(id,{buffer,loop,loopStart});
  }
  const merger=context.createChannelMerger(2);
  try{merger.connect(destination);}catch(error){merger.disconnect();buffers.clear();throw error;}

  /** @param {PcmVoice} voice */
  function release(voice){
    voice.source.onended=null;
    for(const node of [voice.source,voice.left,voice.right])try{node.disconnect();}catch{/* Already detached. */}
    voices.delete(voice);
  }
  /** @param {PcmVoice} voice */
  function retire(voice){try{voice.source.stop();}catch{/* Pending or already stopped. */}release(voice);}
  function stop(){for(const voice of voices)retire(voice);}
  function prune(){for(const voice of voices)if(voice.end<=context.currentTime)retire(voice);}
  /** FINE detaches native release tails; replacement stops only attached notes.
   * Recognized overload consumes the request without an authored fallback.
   * @param {string} id @param {number} when @param {number} availableVoices */
  function play(id,when,availableVoices){
    if(!Object.hasOwn(PCM_EFFECTS,id))return false;
    const cue=PCM_EFFECTS[id];if(!cue)return false;
    if(disposed)return true;
    prune();
    for(const voice of voices)if(context.currentTime<voice.fine)retire(voice);
    const [fine,notes]=cue;
    if(!Number.isFinite(when)||when<context.currentTime||!Number.isSafeInteger(availableVoices)||availableVoices<0||voices.size+notes.length>Math.min(MAX_PCM_VOICES,availableVoices))return true;
    try{
      for(const [wave,start,end,rates,levels] of notes){
        const sample=buffers.get(wave);if(!sample)throw new RangeError('Selected PCM sample is unavailable.');
        const source=context.createBufferSource();
        /** @type {GainNode|undefined} */let left,right;
        /** @type {PcmVoice|undefined} */let voice;
        try{
          left=context.createGain();right=context.createGain();
          voice={source,left,right,end:when+end*PCM_FRAME_SECONDS,fine:when+fine*PCM_FRAME_SECONDS};voices.add(voice);
          source.buffer=sample.buffer;source.loop=sample.loop;
          source.loopStart=sample.loopStart/18157;source.loopEnd=sample.buffer.length/18157;
          left.gain.setValueAtTime(0,context.currentTime);right.gain.setValueAtTime(0,context.currentTime);
          for(const [frame,frequency] of rates)source.playbackRate.setValueAtTime(frequency/18157,when+frame*PCM_FRAME_SECONDS);
          for(const [frame,leftLevel,rightLevel] of levels){
            left.gain.setValueAtTime(PCM_EFFECT_GAIN*leftLevel/256,when+frame*PCM_FRAME_SECONDS);
            right.gain.setValueAtTime(PCM_EFFECT_GAIN*rightLevel/256,when+frame*PCM_FRAME_SECONDS);
          }
          source.connect(left);source.connect(right);left.connect(merger,0,0);right.connect(merger,0,1);
          const retained=voice;source.onended=()=>release(retained);
          source.start(when+start*PCM_FRAME_SECONDS);source.stop(voice.end);
        }catch(error){
          if(voice)retire(voice);
          else{source.disconnect();left?.disconnect();right?.disconnect();}
          throw error;
        }
      }
    }catch(error){stop();throw error;}
    return true;
  }
  function dispose(){if(disposed)return;disposed=true;stop();buffers.clear();try{merger.disconnect();}catch{/* Retired context. */}}
  return Object.freeze({play,stop,dispose,count(){prune();return voices.size;}});
}
