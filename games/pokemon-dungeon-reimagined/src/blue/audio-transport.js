/** Adapted from this project's original src/audio/audio-bus.js for the scoped Blue opening. */
import { effectCue, isKnownEffect } from './audio-catalog.js';
import { DEFAULT_AUDIO_PREFERENCES, normalizeAudioPreferences } from './audio-preferences.js';
import { createSynth, MAX_VOICES } from './audio-synth.js';
import { createMenuEffects } from './audio-menu.js';
import { createPcmEffects } from './audio-pcm.js';
/** @typedef {import('./audio-types.js').AudioPresentation} AudioPresentation */
/** @typedef {import('./audio-types.js').AudioStatus} AudioStatus */
/** @typedef {import('./audio-types.js').AudioState} AudioState */
/** @typedef {import('./audio-types.js').Cue} Cue */
const RESUME_TIMEOUT_MS = 2000;
const MAX_FRAME_EFFECTS = 64;
const MAX_NEW_EFFECT_CUES = 4;
/** Isolated browser presentation owner. Constructing/presenting never creates an
 * AudioContext; only an actual trusted in-document user gesture can activate it.
 * @param {{document:Document}} options
 */
export function createAudioBus({ document: doc }) {
  const win = doc.defaultView;
  /** @type {AudioContext|null} */ let context = null;
  /** @type {{master:GainNode,effects:GainNode,limiter:DynamicsCompressorNode}|null} */ let graph = null;
  /** @type {ReturnType<typeof createSynth>|null} */ let synth = null;
  /** @type {ReturnType<typeof createMenuEffects>|null} */ let menuEffects = null;
  /** @type {ReturnType<typeof createPcmEffects>|null} */ let pcmEffects = null;
  /** @type {import('./audio-types.js').AudioPreferences} */ let preferences = DEFAULT_AUDIO_PREFERENCES;
  /** @type {AudioState} */ let state = win && typeof win.AudioContext === 'function' ? 'locked' : 'unsupported';
  /** @type {string|null} */ let reason = state === 'unsupported' ? 'This browser cannot play synthesized audio.' : null;
  /** @type {string|null} */ let epoch = null;
  /** @type {Promise<boolean>|null} */ let pendingResume = null;
  /** @type {((result:boolean)=>void)|null} */ let resolveResume = null;
  let resumeTimer = 0, blurTimer = 0, parentBlurTimer = 0;
  let pendingResumeGeneration = -1;
  let revision = -1, lastEvent = 0, generation = 0;
  let armed = false, disposed = false, hostControlsHeld = false;
  const listeners = new AbortController();
  function foreground() { return !doc.hidden && doc.hasFocus(); }
  function hostControlsFocused() {
    if (!win || win.parent === win) return false;
    try {
      const active = win.parent.document.activeElement;
      return win.frameElement?.isConnected === true && Boolean(active?.closest('[data-game-controls-overlay]'));
    } catch { return false; }
  }
  function audible() { return !disposed && !hostControlsHeld && armed && foreground() && !preferences.muted && preferences.master > 0 && context?.state === 'running'; }
  /** Retire the current request before resolving its caller. A browser may keep
   * resume() pending until a later gesture; it must not hold the UI gate open.
   * @param {boolean} result
   */
  function settleResume(result) {
    if (resumeTimer) win?.clearTimeout(resumeTimer);
    const resolve = resolveResume;
    resumeTimer = 0; resolveResume = null; pendingResume = null; pendingResumeGeneration = -1;
    resolve?.(result);
  }
  function silence() {
    synth?.stop(); menuEffects?.stop(); pcmEffects?.stop();
    if (context && graph) try { graph.master.gain.cancelScheduledValues(context.currentTime); graph.master.gain.setValueAtTime(0, context.currentTime); } catch { /* Closed/interrupted graph remains silent. */ }
  }
  function clearBlurTimers() {
    if (blurTimer) win?.clearTimeout(blurTimer);
    if (parentBlurTimer) win?.clearTimeout(parentBlurTimer);
    blurTimer = 0; parentBlurTimer = 0;
  }
  function suspendContext() {
    if (!context || context.state === 'closed') return;
    try { void context.suspend().catch(() => { /* Denied suspension cannot reach game state. */ }); } catch { /* Closed concurrently. */ }
  }
  /** All scheduled nodes are stopped/disconnected before any async suspension. */
  function pause() {
    if (disposed) return;
    clearBlurTimers(); hostControlsHeld = false; armed = false; generation++; settleResume(false); silence(); suspendContext();
    if (state !== 'unsupported' && state !== 'denied') state = 'paused';
  }
  /** @param {unknown} error */
  function deny(error) {
    clearBlurTimers(); hostControlsHeld = false; armed = false; generation++; settleResume(false); silence(); suspendContext();
    state = 'denied'; reason = error instanceof Error ? error.message.slice(0, 160) : 'Sound is unavailable. Try Enable sound again.';
  }
  function levels() {
    if (!context || !graph) return;
    const now = context.currentTime;
    /** @type {[GainNode,number][]} */
    const values = [[graph.master, audible() ? preferences.master : 0], [graph.effects, preferences.effects]];
    try {
      for (const [node, value] of values) {
        node.gain.cancelScheduledValues(now); node.gain.setTargetAtTime(value, now, .015);
      }
    } catch (error) { deny(error); }
  }
  function startTransport() {
    if (!audible()) return;
    state = 'ready'; reason = null; levels();
  }
  /** Keep a previously gesture-unlocked running context silent while a same-origin
   * host control briefly owns focus. This path never unlocks or resumes audio.
   */
  function holdForHostControls() {
    if (!armed || context?.state !== 'running') { pause(); return; }
    clearBlurTimers(); hostControlsHeld = true; generation++; settleResume(false); silence();
    if (state !== 'unsupported' && state !== 'denied') state = 'paused';
    // Focus events can observe an intermediate activeElement. Classify after the
    // current focus transfer, while keeping every already scheduled node silent.
    blurTimer = win?.setTimeout(() => {
      blurTimer = 0;
      if (foreground()) restoreHostControlsHold();
      else if (!hostControlsFocused()) pause();
    }, 0) ?? 0;
  }
  function restoreHostControlsHold() {
    if (!hostControlsHeld) return;
    clearBlurTimers(); hostControlsHeld = false;
    if (disposed || !foreground() || preferences.muted || preferences.master === 0 || context?.state !== 'running' || !armed) { pause(); return; }
    startTransport();
  }
  function classifyParentBlur() {
    if (!win || win.parent === win) return;
    if (parentBlurTimer) win.clearTimeout(parentBlurTimer);
    // Some browsers blur the parent Window when focus enters its iframe. Wait
    // for that transfer to settle and pause only for a true parent background.
    parentBlurTimer = win.setTimeout(() => {
      parentBlurTimer = 0;
      try {
        const parentDoc = win.parent.document;
        if (parentDoc.hidden || !parentDoc.hasFocus()) pause();
      } catch { pause(); }
    }, 0);
  }
  function createContext() {
    if (!win) return false;
    const next = new win.AudioContext({ latencyHint: 'interactive' });
    context = next;
    /** @type {AudioNode[]} */ const created = [];
    try {
      const master = next.createGain(); created.push(master);
      const effects = next.createGain(); created.push(effects);
      const limiter = next.createDynamicsCompressor(); created.push(limiter);
      master.gain.value = 0; effects.gain.value = 0;
      limiter.threshold.value = -12; limiter.knee.value = 18; limiter.ratio.value = 8;
      limiter.attack.value = .003; limiter.release.value = .15;
      effects.connect(master); master.connect(limiter); limiter.connect(next.destination);
      graph = { master, effects, limiter };
      menuEffects = createMenuEffects(next, effects);
      pcmEffects = createPcmEffects(next, effects);
      synth = createSynth(next, effects, () => (menuEffects?.count() ?? 0) + (pcmEffects?.count() ?? 0));
      next.addEventListener('statechange', () => {
        if (disposed || context !== next) return;
        if (next.state !== 'running') pause();
        else if (!armed || !foreground() || preferences.muted) { silence(); suspendContext(); }
      }, { signal: listeners.signal });
      return true;
    } catch (error) {
      for (const node of created) try { node.disconnect(); } catch { /* Partial graph. */ }
      menuEffects?.stop(); menuEffects = null; pcmEffects?.dispose(); pcmEffects = null; synth?.stop(); synth = null;
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
        pcmEffects?.dispose(); graph = null; synth = null; menuEffects = null; pcmEffects = null; context = null; if (!createContext()) return Promise.resolve(false);
      }
      const current = context; if (!current) return Promise.resolve(false);
      armed = true; const ticket = ++generation;
      if (current.state === 'running') { startTransport(); return Promise.resolve(state === 'ready' && audible()); }
      const request = new Promise(resolve => { resolveResume = resolve; });
      pendingResume = request; pendingResumeGeneration = ticket;
      resumeTimer = win.setTimeout(() => {
        if (!disposed && context === current && ticket === generation) deny(new Error('Sound did not start. Try Enable sound again.'));
      }, RESUME_TIMEOUT_MS);
      void current.resume().then(() => {
        if (disposed || context !== current || ticket !== generation) return;
        if (!audible()) { silence(); suspendContext(); settleResume(false); return; }
        startTransport();
        if (ticket === generation) settleResume(true);
      }).catch(error => { if (!disposed && context === current && ticket === generation) deny(error); });
      return request;
    } catch (error) { deny(error); return Promise.resolve(false); }
  }
  /** Binding owner explicitly begins a fresh unique epoch before presenting.
   * A stale frame can never rebind the AudioBus through present().
   * @param {string} next @returns {boolean}
   */
  function beginEpoch(next) {
    if (disposed || typeof next !== 'string' || !next || next.length > 160) return false;
    if (next === epoch) return true;
    const wasResuming = pendingResume !== null;
    generation++; settleResume(false); silence(); epoch = next; revision = -1; lastEvent = 0;
    if (wasResuming) { armed = false; suspendContext(); state = 'paused'; }
    else levels();
    return true;
  }
  /** Detaches only bounded scalars. Silent/hidden presentations consume effect
   * IDs too, so enabling sound never replays old actions.
   * @param {AudioPresentation} frame @returns {boolean}
   */
  function present(frame) {
    if (disposed || !frame || frame.epoch !== epoch || !Number.isSafeInteger(frame.revision) || frame.revision < 0 || frame.revision < revision || !Array.isArray(frame.effects) || frame.effects.length > MAX_FRAME_EFFECTS) return false;
    let cursor = 0;
    for (const effect of frame.effects) {
      if (!effect || !Number.isSafeInteger(effect.eventId) || effect.eventId <= cursor || typeof effect.cueId !== 'string' || !isKnownEffect(effect.cueId)) return false;
      cursor = effect.eventId;
    }
    // Commit the whole admitted frame before WebAudio can fail. Playback uses
    // the previous mark; denial/overload must not leave deferred old sounds.
    const priorEvent = lastEvent;
    lastEvent = Math.max(priorEvent, cursor);
    revision = frame.revision;
    let admitted = 0;
    try {
      for (const effect of frame.effects) {
        if (effect.eventId <= priorEvent) continue;
        if (!audible() || !context || !synth || preferences.effects === 0 || admitted >= MAX_NEW_EFFECT_CUES) continue;
        admitted++;
        if (menuEffects?.play(effect.cueId, context.currentTime + .01, MAX_VOICES - synth.count() - (pcmEffects?.count() ?? 0))) continue;
        if (pcmEffects?.play(effect.cueId, context.currentTime + .01, MAX_VOICES - synth.count() - (menuEffects?.count() ?? 0))) continue;
        const cue = effectCue(effect.cueId); if (!cue) continue;
        for (const note of cue.notes) synth.schedule(note, cue, context.currentTime + .01 + note.beat * 60 / cue.bpm);
      }
    } catch (error) { deny(error); }
    return true;
  }
  /** @param {unknown} input */
  function setPreferences(input) {
    preferences = normalizeAudioPreferences(input);
    if (preferences.muted || preferences.master === 0) pause();
    else levels();
    return preferences;
  }
  /** Repeated disposal releases listeners/voices/graph immediately, without
   * waiting for browser promises or allowing their continuations to restart sound.
   */
  function dispose() {
    if (disposed) return;
    disposed = true; clearBlurTimers(); hostControlsHeld = false; armed = false; generation++; settleResume(false); silence(); listeners.abort();
    if (graph) for (const node of Object.values(graph)) try { node.disconnect(); } catch { /* Already disconnected. */ }
    pcmEffects?.dispose();
    const retained = context; graph = null; synth = null; menuEffects = null; pcmEffects = null; context = null; pendingResume = null;
    if (retained && retained.state !== 'closed') try { void retained.close().catch(() => {}); } catch { /* Already closed. */ }
    state = 'disposed'; reason = null;
  }
  doc.addEventListener('visibilitychange', () => { if (!foreground()) pause(); }, { signal: listeners.signal });
  win?.addEventListener('blur', holdForHostControls, { signal: listeners.signal });
  win?.addEventListener('focus', restoreHostControlsHold, { signal: listeners.signal });
  win?.addEventListener('pagehide', pause, { signal: listeners.signal });
  try { if (win && win.parent !== win) win.parent.addEventListener('blur', classifyParentBlur, { signal: listeners.signal }); } catch { /* Cross-origin embedding keeps the normal child pause path. */ }
  /** @returns {AudioStatus} */
  const status = () => Object.freeze({ state, reason, epoch, voices: (synth?.count() ?? 0) + (menuEffects?.count() ?? 0) + (pcmEffects?.count() ?? 0) });
  return Object.freeze({ beginEpoch, present, setPreferences, activate, pause, dispose, status });
}
