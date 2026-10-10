/** Adapted from this project's original src/audio/audio-bus.js for the scoped Blue opening. */
import { musicCue, effectCue } from './audio-catalog.js';
import { DEFAULT_AUDIO_PREFERENCES, normalizeAudioPreferences } from './audio-preferences.js';
import { createSynth } from './audio-synth.js';
/** @typedef {import('./audio-types.js').AudioPresentation} AudioPresentation */
/** @typedef {import('./audio-types.js').AudioStatus} AudioStatus */
/** @typedef {import('./audio-types.js').AudioState} AudioState */
/** @typedef {import('./audio-types.js').Cue} Cue */
const LOOKAHEAD = .25;
const PUMP_MS = 80;
const MAX_FRAME_EFFECTS = 64;
const MAX_NEW_EFFECT_CUES = 4;
/** Isolated browser presentation owner. Constructing/presenting never creates an
 * AudioContext; only an actual trusted in-document user gesture can activate it.
 * @param {{document:Document}} options
 */
export function createAudioBus({ document: doc }) {
  const win = doc.defaultView;
  /** @type {AudioContext|null} */ let context = null;
  /** @type {{master:GainNode,music:GainNode,effects:GainNode,limiter:DynamicsCompressorNode}|null} */ let graph = null;
  /** @type {ReturnType<typeof createSynth>|null} */ let synth = null;
  /** @type {import('./audio-types.js').AudioPreferences} */ let preferences = DEFAULT_AUDIO_PREFERENCES;
  /** @type {AudioState} */ let state = win && typeof win.AudioContext === 'function' ? 'locked' : 'unsupported';
  /** @type {string|null} */ let reason = state === 'unsupported' ? 'This browser cannot play synthesized audio.' : null;
  /** @type {string|null} */ let epoch = null;
  /** @type {string|null} */ let selectedMusic = null;
  /** @type {Cue|null} */ let playingMusic = null;
  /** @type {Promise<boolean>|null} */ let pendingResume = null;
  let pendingResumeGeneration = -1;
  let revision = -1, lastEvent = 0, generation = 0, timer = 0;
  let armed = false, disposed = false, origin = 0, loop = 0, noteIndex = 0, musicPosition = 0;
  const listeners = new AbortController();
  function foreground() { return !doc.hidden && doc.hasFocus(); }
  function audible() { return !disposed && armed && foreground() && !preferences.muted && preferences.master > 0 && context?.state === 'running'; }
  function cancelPump() { if (timer) win?.clearTimeout(timer); timer = 0; }
  function rememberMusic() {
    if (!context || !playingMusic) return;
    const length = playingMusic.beats * 60 / playingMusic.bpm;
    const position = Math.max(0, context.currentTime - origin);
    musicPosition = playingMusic.loop ? position % length : Math.min(position, length);
  }
  function silence() {
    cancelPump(); synth?.stop(); playingMusic = null;
    if (context && graph) try { graph.master.gain.cancelScheduledValues(context.currentTime); graph.master.gain.setValueAtTime(0, context.currentTime); } catch { /* Closed/interrupted graph remains silent. */ }
  }
  function suspendContext() {
    if (!context || context.state === 'closed') return;
    try { void context.suspend().catch(() => { /* Denied suspension cannot reach game state. */ }); } catch { /* Closed concurrently. */ }
  }
  /** All scheduled nodes are stopped/disconnected before any async suspension. */
  function pause() {
    if (disposed) return;
    rememberMusic(); armed = false; generation++; silence(); suspendContext();
    if (state !== 'unsupported' && state !== 'denied') state = 'paused';
  }
  /** @param {unknown} error */
  function deny(error) {
    rememberMusic(); armed = false; generation++; silence(); suspendContext();
    state = 'denied'; reason = error instanceof Error ? error.message.slice(0, 160) : 'Sound is unavailable. Try Enable sound again.';
  }
  function levels() {
    if (!context || !graph) return;
    const now = context.currentTime;
    /** @type {[GainNode,number][]} */
    const values = [[graph.master, audible() ? preferences.master : 0], [graph.music, preferences.music], [graph.effects, preferences.effects]];
    try {
      for (const [node, value] of values) {
        node.gain.cancelScheduledValues(now); node.gain.setTargetAtTime(value, now, .015);
      }
    } catch (error) { deny(error); }
  }
  function resetMusic() {
    rememberMusic(); cancelPump(); synth?.stop('music'); playingMusic = null; loop = 0; noteIndex = 0;
    if (!audible() || !context || !selectedMusic || preferences.music === 0) return;
    playingMusic = musicCue(selectedMusic); origin = context.currentTime + .025 - musicPosition;
    pump();
  }
  /** Audio-clock-only scheduling. No callback dispatches a game intent. */
  function pump() {
    timer = 0;
    if (!audible() || !context || !playingMusic || !synth) return;
    const cue = playingMusic, seconds = 60 / cue.bpm, loopSeconds = cue.beats * seconds;
    // A delayed browser timer skips elapsed notes. Never replay a backlog.
    if (cue.loop && context.currentTime > origin + (loop + 1) * loopSeconds) {
      loop = Math.floor((context.currentTime - origin) / loopSeconds); noteIndex = 0;
    }
    let scheduled = 0;
    try {
      while (scheduled < 64) {
        const note = cue.notes[noteIndex];
        if (!note) {
          if (!cue.loop) { musicPosition = cue.beats * seconds; playingMusic = null; return; }
          loop++; noteIndex = 0; continue;
        }
        const at = origin + (loop * cue.beats + note.beat) * seconds;
        if (at > context.currentTime + LOOKAHEAD) break;
        noteIndex++; scheduled++;
        if (at >= context.currentTime + .002) synth.schedule(note, cue, at, 'music');
      }
    } catch (error) { deny(error); return; }
    const ticket = generation;
    timer = win?.setTimeout(() => { if (ticket === generation && !disposed) pump(); }, PUMP_MS) ?? 0;
  }
  function startTransport() {
    if (!audible()) return;
    state = 'ready'; reason = null; levels(); resetMusic();
  }
  function createContext() {
    if (!win) return false;
    const next = new win.AudioContext({ latencyHint: 'interactive' });
    context = next;
    /** @type {AudioNode[]} */ const created = [];
    try {
      const master = next.createGain(); created.push(master);
      const music = next.createGain(); created.push(music);
      const effects = next.createGain(); created.push(effects);
      const limiter = next.createDynamicsCompressor(); created.push(limiter);
      master.gain.value = 0; music.gain.value = 0; effects.gain.value = 0;
      limiter.threshold.value = -12; limiter.knee.value = 18; limiter.ratio.value = 8;
      limiter.attack.value = .003; limiter.release.value = .15;
      music.connect(master); effects.connect(master); master.connect(limiter); limiter.connect(next.destination);
      graph = { master, music, effects, limiter }; synth = createSynth(next, music, effects);
      next.addEventListener('statechange', () => {
        if (disposed || context !== next) return;
        if (next.state !== 'running') pause();
        else if (!armed || !foreground() || preferences.muted) { silence(); suspendContext(); }
      }, { signal: listeners.signal });
      return true;
    } catch (error) {
      for (const node of created) try { node.disconnect(); } catch { /* Partial graph. */ }
      context = null; try { void next.close().catch(() => {}); } catch { /* Already closed. */ } throw error;
    }
  }
  /** Call synchronously inside a visible Enable sound click/key handler. Synthetic
   * website keyboard bridge events and retained events cannot unlock audio.
   * @param {Event} event @returns {Promise<boolean>}
   */
  function activate(event) {
    if (disposed || !win || state === 'unsupported' || preferences.muted || preferences.master === 0 || !foreground() || !event.isTrusted || event.eventPhase === 0 || !['click','keydown','pointerup','touchend'].includes(event.type) || win.navigator.userActivation?.isActive === false) return Promise.resolve(false);
    const target = event.target;
    if (!(target instanceof win.Node) || target !== doc && target.ownerDocument !== doc) return Promise.resolve(false);
    // A pause may retire an unresolved browser resume. A fresh gesture gets its
    // own request; the retired promise must not silence this newer activation.
    if (pendingResume && pendingResumeGeneration === generation) return pendingResume;
    if (armed && context?.state === 'running') return Promise.resolve(true);
    try {
      if (!context || context.state === 'closed') {
        silence();
        if (graph) for (const node of Object.values(graph)) try { node.disconnect(); } catch { /* Previous closed graph. */ }
        graph = null; synth = null; context = null; if (!createContext()) return Promise.resolve(false);
      }
      const current = context; if (!current) return Promise.resolve(false);
      armed = true; const ticket = ++generation;
      if (current.state === 'running') { startTransport(); return Promise.resolve(true); }
      const request = current.resume().then(() => {
        if (disposed || context !== current || ticket !== generation) return false;
        if (!audible()) { silence(); suspendContext(); return false; }
        startTransport(); return true;
      }).catch(error => { if (!disposed && context === current && ticket === generation) deny(error); return false; }).finally(() => { if (pendingResume === request) pendingResume = null; });
      pendingResume = request; pendingResumeGeneration = ticket; return request;
    } catch (error) { deny(error); return Promise.resolve(false); }
  }
  /** Binding owner explicitly begins a fresh unique epoch before presenting.
   * A stale frame can never rebind the AudioBus through present().
   * @param {string} next @returns {boolean}
   */
  function beginEpoch(next) {
    if (disposed || typeof next !== 'string' || !next || next.length > 160) return false;
    if (next === epoch) return true;
    generation++; silence(); musicPosition = 0; epoch = next; revision = -1; lastEvent = 0; selectedMusic = null;
    if (pendingResume) { armed = false; suspendContext(); state = 'paused'; }
    else levels();
    return true;
  }
  /** Detaches only bounded scalars. Silent/hidden presentations consume effect
   * IDs too, so enabling sound never replays old actions.
   * @param {AudioPresentation} frame @returns {boolean}
   */
  function present(frame) {
    if (disposed || !frame || frame.epoch !== epoch || !Number.isSafeInteger(frame.revision) || frame.revision < 0 || frame.revision < revision || frame.musicCue !== null && (typeof frame.musicCue !== 'string' || !musicCue(frame.musicCue)) || !Array.isArray(frame.effects) || frame.effects.length > MAX_FRAME_EFFECTS) return false;
    let cursor = 0;
    for (const effect of frame.effects) {
      if (!effect || !Number.isSafeInteger(effect.eventId) || effect.eventId <= cursor || typeof effect.cueId !== 'string' || !effectCue(effect.cueId)) return false;
      cursor = effect.eventId;
    }
    // Commit the whole admitted frame before WebAudio can fail. Playback uses
    // the previous mark; denial/overload must not leave deferred old sounds.
    const priorEvent = lastEvent;
    lastEvent = Math.max(priorEvent, cursor);
    const changed = selectedMusic !== frame.musicCue;
    selectedMusic = frame.musicCue; revision = frame.revision;
    if (changed) { cancelPump(); synth?.stop('music'); playingMusic = null; musicPosition = 0; resetMusic(); }
    let admitted = 0;
    try {
      for (const effect of frame.effects) {
        if (effect.eventId <= priorEvent) continue;
        if (!audible() || !context || !synth || preferences.effects === 0 || admitted >= MAX_NEW_EFFECT_CUES) continue;
        const cue = effectCue(effect.cueId); if (!cue) continue;
        admitted++;
        for (const note of cue.notes) synth.schedule(note, cue, context.currentTime + .01 + note.beat * 60 / cue.bpm, 'effects');
      }
    } catch (error) { deny(error); }
    return true;
  }
  /** @param {unknown} input */
  function setPreferences(input) {
    const before = preferences; preferences = normalizeAudioPreferences(input);
    if (preferences.muted || preferences.master === 0) pause();
    else { levels(); if (before.music !== preferences.music) resetMusic(); }
    return preferences;
  }
  /** Repeated disposal releases listeners/timer/voices/graph immediately, without
   * waiting for browser promises or allowing their continuations to restart sound.
   */
  function dispose() {
    if (disposed) return;
    disposed = true; armed = false; generation++; silence(); listeners.abort();
    if (graph) for (const node of Object.values(graph)) try { node.disconnect(); } catch { /* Already disconnected. */ }
    const retained = context; graph = null; synth = null; context = null; pendingResume = null;
    if (retained && retained.state !== 'closed') try { void retained.close().catch(() => {}); } catch { /* Already closed. */ }
    state = 'disposed'; reason = null;
  }
  doc.addEventListener('visibilitychange', () => { if (!foreground()) pause(); }, { signal: listeners.signal });
  win?.addEventListener('blur', pause, { signal: listeners.signal });
  win?.addEventListener('pagehide', pause, { signal: listeners.signal });
  /** @returns {AudioStatus} */
  const status = () => Object.freeze({ state, reason, epoch, voices: synth?.count() ?? 0 });
  return Object.freeze({ beginEpoch, present, setPreferences, activate, pause, dispose, status });
}
