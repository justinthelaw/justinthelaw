import { MENU_EFFECTS, MENU_EFFECT_GAIN, MENU_EFFECT_TICK_SECONDS } from './audio-menu-data.js';

/** @typedef {{source:OscillatorNode,gain:GainNode}} PulseVoice */

/** Source-derived short PSG effects, with browser band-limiting and mix gain.
 * No PCM, music, timers, callbacks into game state, or unbounded queues.
 * @param {AudioContext} context @param {GainNode} destination
 */
export function createMenuEffects(context,destination){
  /** @type {Set<PulseVoice>} */const voices=new Set();
  /** @type {Map<number,PeriodicWave>} */const waves=new Map();

  /** @param {number} duty */
  function wave(duty){
    const retained=waves.get(duty);if(retained)return retained;
    const real=new Float32Array(129),imaginary=new Float32Array(129);
    for(let harmonic=1;harmonic<real.length;harmonic++){
      const phase=2*Math.PI*harmonic*duty;
      real[harmonic]=2*Math.sin(phase)/(Math.PI*harmonic);
      imaginary[harmonic]=2*(1-Math.cos(phase))/(Math.PI*harmonic);
    }
    const result=context.createPeriodicWave(real,imaginary,{disableNormalization:true});
    waves.set(duty,result);return result;
  }
  /** @param {PulseVoice} voice */
  function release(voice){
    voice.source.onended=null;
    try{voice.source.disconnect();}catch{/* Already detached. */}
    try{voice.gain.disconnect();}catch{/* Already detached. */}
    voices.delete(voice);
  }
  function stop(){
    for(const voice of voices){
      try{voice.source.stop();}catch{/* Pending or already stopped. */}
      release(voice);
    }
  }
  /** A recognized effect consumes its request even when the shared voice budget
   * is full. SE2 replaces its previous cue, including any future pulse notes.
   * @param {string} id @param {number} when @param {number} availableVoices
   */
  function play(id,when,availableVoices){
    const cue=MENU_EFFECTS[id];if(!cue)return false;
    stop();
    if(!Number.isFinite(when)||cue.notes.length>availableVoices)return true;
    try{
      const shape=wave(cue.duty);
      for(const [tick,gate,divisor,envelope] of cue.notes){
        const source=context.createOscillator();
        /** @type {GainNode|undefined} */let gain;
        /** @type {PulseVoice|undefined} */let voice;
        try{
          gain=context.createGain();voice={source,gain};voices.add(voice);
          const start=when+tick*MENU_EFFECT_TICK_SECONDS,end=start+gate*MENU_EFFECT_TICK_SECONDS;
          source.setPeriodicWave(shape);source.frequency.setValueAtTime(131072/divisor,start);
          gain.gain.setValueAtTime(0,context.currentTime);
          gain.gain.setValueAtTime(MENU_EFFECT_GAIN*envelope/15,start);
          gain.gain.setValueAtTime(0,end);
          source.connect(gain);gain.connect(destination);
          const retained=voice;source.onended=()=>release(retained);
          source.start(start);source.stop(end);
        }catch(error){
          if(voice){try{source.stop();}catch{/* Unstarted node. */}release(voice);}
          else{source.disconnect();gain?.disconnect();}
          throw error;
        }
      }
    }catch(error){stop();throw error;}
    return true;
  }
  return Object.freeze({play,stop,count:()=>voices.size});
}
