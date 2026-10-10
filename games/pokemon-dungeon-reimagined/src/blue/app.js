import { createRenderer, BOOT_DURATION_MS, OPENING_DURATION_MS } from './renderer.js';
import { paginateDialogue, textWidth } from './render-font.js';
import { createOpeningAudio } from './audio.js';
import { createInput } from './input.js';
import { canContinueDash } from './dash.js';
import { createDungeonMenus } from './menus.js';
import { DungeonCamera } from './dungeon-camera.js';
import { discoverCameraArea } from './mechanics-visibility.js';
import { loadOnboarding, createQuiz, currentQuestion, nextQuestion, answerQuestion,
  finishQuiz, eligiblePartners, speciesName } from './onboarding.js';
import { NAMING_END_KEY, NAMING_KEYS, createNamingState, namingLabels, moveNamingSelection,
  moveNamingCaret, deleteNamingCharacter, activateNamingKey, replaceNamingText, namingError, sanitizeNamingText } from './naming.js';
import { loadOpeningData, createDungeon, performAction, retryDungeon, validateDungeon,
  getDungeonTurnPhase, prepareDungeonTurn, completeForcedTurn, updateVisibility } from './mechanics.js';
import { createSaveRepository, validateOpeningSave } from './save.js';
import { createPreferencesRepository } from './preferences.js';
import { STORY, GENERAL_TUTORIALS, ITEM_TUTORIALS, interpolateStory } from './story.js';

/** @typedef {import('./save.js').OpeningSave} OpeningSave */
/** @typedef {import('./save.js').Phase} Phase */
/** @typedef {import('./renderer.js').View} View */
/** @typedef {import('./renderer.js').Dialogue} Dialogue */
/** @typedef {import('./menus.js').Menu} Menu */
/** @typedef {import('./input.js').InputAction} InputAction */
/** @typedef {import('./mechanics-types.js').DungeonAction} DungeonAction */
/** @typedef {import('./mechanics-types.js').ActionResult} ActionResult */
/** @typedef {import('./audio-types.js').AudioScene} AudioScene */
/** @typedef {import('./naming.js').NamingState} NamingState */
/** @typedef {{editor:NamingState,transition:number}} NameComposition */

/** @param {string} id */
function element(id) {
  const value = document.getElementById(id);
  if (!value) throw new Error(`The game surface is missing: ${id}`);
  return value;
}
/** @param {string} id */
function canvas(id) {
  const value = element(id);
  if (!(value instanceof HTMLCanvasElement)) throw new Error('A game screen is missing.');
  return value;
}

document.documentElement.dataset.bootstrap = 'started';
window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
const application = element('application');
const startup = element('startup');
const game = element('game');
const screens = element('screens');
const topCanvas = canvas('top-screen');
const bottomCanvas = canvas('bottom-screen');
const choiceButtons = element('choice-buttons');
const advanceButton = element('advance');
const startPrompt = element('start-prompt');
const startButton = /** @type {HTMLButtonElement} */ (element('start-game'));
const startInstruction = element('start-instruction');
const narration = element('narration');
const nameEntry = element('name-entry');
const nameInput = /** @type {HTMLInputElement} */ (element('name-input'));
const warning = element('save-warning');
const soundButton = element('sound-toggle');
const touchControls = element('touch-controls');
const controlsToggle = element('controls-toggle');
const helpPanel = element('help');
const helpToggle = element('help-toggle');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;

/** @param {unknown} error */
function showFailure(error) {
  startup.hidden = false; game.hidden = true;
  element('heading').textContent = 'Unable to start';
  element('status').textContent = 'Your saved progress has been preserved.';
  const failure = element('failure');
  failure.textContent = error instanceof Error ? error.message : 'The game could not load.';
  failure.hidden = false; element('progress').hidden = true;
  const retry = element('retry'); retry.hidden = false;
  retry.onclick = () => window.location.reload();
  application.setAttribute('aria-busy', 'false');
  console.error('Blue Rescue Team opening', error);
}

async function loadRuntime() {
  const controller = new AbortController();
  let abandoned = false, timedOut = false;
  window.addEventListener('pagehide', () => { abandoned = true; controller.abort(); }, { once: true });
  const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
  try {
    const [onboarding, data, renderer] = await Promise.all([
      loadOnboarding(controller.signal), loadOpeningData(controller.signal),
      createRenderer(topCanvas, bottomCanvas, { reducedMotion, signal: controller.signal }),
    ]);
    if (abandoned) { renderer.dispose(); return null; }
    return { onboarding, data, renderer };
  } catch (error) {
    controller.abort();
    if (abandoned) return null;
    if (timedOut) throw new Error('Loading took too long. Check your connection and try again.', { cause: error });
    throw error;
  } finally { window.clearTimeout(timeout); }
}

async function main() {
  const loaded = await loadRuntime(); if (!loaded) return;
  const { onboarding, data, renderer } = loaded;
  const audio = createOpeningAudio(document);
  const preferenceRepository = createPreferencesRepository();
  const preferences = preferenceRepository.load();
  audio.setMuted(preferences.muted);
  const starterIds = new Set(data.starterIds);
  /** @param {unknown} value @returns {value is OpeningSave} */
  function validSave(value) {
    if (!validateOpeningSave(value, state => validateDungeon(state, data), starterIds)) return false;
    if (Object.keys(value.quiz.scores).sort().join('|') !== [...onboarding.natureOrder].sort().join('|')) return false;
    if (value.quiz.questionId !== null && !onboarding.questions.some(question => question.id === value.quiz.questionId)) return false;
    if (value.quiz.usedCategories.some(category => !onboarding.questions.some(question => question.categoryId === category))) return false;
    if (value.natureId && !onboarding.natureOrder.includes(value.natureId)) return false;
    const script = STORY[value.phase];
    if (script ? value.line >= script.length : value.phase === 'result' ? value.line > 2 : value.line !== 0) return false;
    if (value.phase === 'quiz' && (!value.quiz.questionId || value.quiz.answered >= 8)) return false;
    if (!['welcome', 'quiz'].includes(value.phase) && value.quiz.answered !== 8) return false;
    if (!['welcome', 'quiz', 'gender'].includes(value.phase)) {
      const result = onboarding.results.find(record => record.natureId === value.natureId);
      if (!result || value.heroSpeciesId !== (value.gender === 'male' ? result.maleSpeciesId : result.femaleSpeciesId)) return false;
    }
    if (!['welcome', 'quiz', 'gender', 'result', 'partner'].includes(value.phase) &&
        !eligiblePartners(onboarding, value.heroSpeciesId).includes(value.partnerSpeciesId)) return false;
    if (value.phase === 'complete' && !value.rewarded) return false;
    if (value.dungeon && (value.dungeon.hero.speciesId !== value.heroSpeciesId ||
        value.dungeon.partner.speciesId !== value.partnerSpeciesId ||
        value.dungeon.hero.name !== value.heroName || value.dungeon.partner.name !== value.partnerName)) return false;
    return true;
  }
  const repository = createSaveRepository(validSave);
  const stored = repository.load();
  /** @type {OpeningSave|null} */ let state = stored.state;
  /** @type {'opening'|'title'|'menu'|'play'} */ let mode = 'opening';
  /** @type {Menu|null} */ let menu = null;
  /** @type {View} */ let view = { scene: 'opening', reducedMotion };
  /** @type {string[]} */ let labels = [];
  /** @type {string[]} */ let speechPages = [];
  /** @type {Dialogue|null} */ let speech = null;
  /** @type {Dialogue|null} */ let fieldDialogue = null;
  /** @type {string|null} */ let notice = null;
  /** @type {string[]} */ let tutorials = [];
  /** Live message presentation is independent of the persisted Message Log. */
  /** @type {string[]} */ let liveMessages = [];
  let liveMessageRemaining = 0;
  let selectedIndex = 0, dialoguePage = 0, speechStarted = 0, clock = 0, lastFrame = 0;
  let openingStarted = 0, textSpeed = preferences.textSpeed, revealed = false, uiSignature = '!unrendered', lastNarration = '';
  let busy = false, paused = document.hidden || !document.hasFocus(), disposed = false, transition = 0, frameId = 0;
  let saveTimer = 0, hasStored = stored.hasStored, saveFailed = false;
  let eventUntil = 0, presentationRevision = 0, lastRenderedRevision = -1, titleImmediate = false;
  let nameComposing = false;
  /** @type {NameComposition|null} */ let nameComposition = null;
  /** @type {NameComposition|null} */ let completedNameComposition = null;
  /** @type {number|null} */ let forcedReadyAt = null;
  let fastDungeon = preferences.fastDungeon, gridVisible = preferences.grids;
  /** @type {'waiting'|'starting'|'running'} */ let startGate = 'waiting';
  /** @type {HTMLElement|null} */ let helpReturnFocus = null;
  /** @type {'map'|'team'|'log'} */ let topScreen = preferences.topScreen;
  let mapVisible = false;
  const currentDungeon = () => state?.dungeon ?? null;
  const dungeonCamera = new DungeonCamera();
  /** @type {{menu:Menu,index:number,revision:number,event?:Event}|null} */let pendingCameraChoice=null;
  /** @type {{menu:Menu,revision:number}|null} */let pendingCameraCancel=null;

  function resetDungeonCamera(){
    dungeonCamera.reset();pendingCameraChoice=null;pendingCameraCancel=null;
    const dungeon=currentDungeon();if(dungeon)updateVisibility(dungeon);
  }
  function requestMenuCamera(){
    const dungeon=currentDungeon();
    if(mode!=='play'||state?.phase!=='dungeon'||!dungeon){dungeonCamera.reset();pendingCameraChoice=null;pendingCameraCancel=null;return;}
    const member=pendingCameraCancel?.menu===menu?'hero':menu?.cameraChoices?.[selectedIndex]??menu?.cameraMember??'hero';
    dungeonCamera.request(dungeon,member,clock);
    view.cameraActorId=dungeonCamera.target;
  }
  /** @param {number} index */
  function selectChoice(index){
    if(pendingCameraCancel)return;
    if(index!==selectedIndex)pendingCameraChoice=null;
    selectedIndex=index;view.selectedIndex=index;requestMenuCamera();
  }
  function advanceMenuCamera(){
    const dungeon=currentDungeon();if(mode!=='play'||state?.phase!=='dungeon'||!dungeon)return;
    requestMenuCamera();
    const changed=dungeonCamera.advance(dungeon,clock);
    if(changed&&discoverCameraArea(dungeon,changed))commitSoon();
    view.cameraActorId=dungeonCamera.target;
    if(!dungeonCamera.locked&&pendingCameraCancel){
      const pending=pendingCameraCancel;pendingCameraCancel=null;
      if(pending.menu===menu&&pending.revision===presentationRevision){if(pending.menu.cancel)pending.menu.cancel();else showMenu(null);}
    }
    if(!dungeonCamera.locked&&pendingCameraChoice){
      const pending=pendingCameraChoice;pendingCameraChoice=null;
      if(pending.menu===menu&&pending.revision===presentationRevision&&pending.index===selectedIndex)choose(pending.event);
    }
  }

  /** @param {string|null} message */
  function setWarning(message) {
    warning.hidden = !message; warning.textContent = message ?? '';
  }
  setWarning(stored.warning);

  function commitNow() {
    window.clearTimeout(saveTimer); saveTimer = 0;
    if (!state) return;
    const result = repository.save(state);
    if (result) { saveFailed = true; setWarning(result); }
    else { hasStored = true; if (saveFailed) setWarning(null); saveFailed = false; }
  }
  function commitSoon() {
    if (saveTimer) return;
    saveTimer = window.setTimeout(commitNow, 220);
  }

  function clearLiveMessages() { liveMessages = []; liveMessageRemaining = 0; }
  /** @param {ActionResult} result */
  function enqueueLiveMessages(result) {
    if (result.events.some(event => event.type === 'floor')) clearLiveMessages();
    for (const event of result.events) {
      if (event.type !== 'message' || !event.text) continue;
      liveMessages.push(event.text);
      if (liveMessages.length > 8) liveMessages.shift();
      // Native live-message lifetime is 240 nominal frames after a new line.
      liveMessageRemaining = 240 * 1000 / 60;
    }
  }

  /** @param {Menu|null} next */
  function showMenu(next) {
    pendingCameraChoice=null;pendingCameraCancel=null;
    menu = next; selectedIndex = next?.initialSelection??0; dialoguePage = 0; notice = null;
    // Input owns the cue. Rendering a submenu must not replace its accept or
    // cancel sound on the source's single menu-effect channel.
    input.clear(); rebuild();
  }

  const dungeonMenus = createDungeonMenus({
    state: currentDungeon, data, show: showMenu, act: act, commit: commitNow,
    title: returnToMenu, help: showHelp, settings: settingsMenu,
  });

  /** The opening waits at frame zero until one deliberate game gesture. Its
   * bounded sound attempt settles even when sound is unavailable or muted.
   * @param {Event} event
   */
  function beginOpening(event) {
    if (startGate !== 'waiting' || disposed) return;
    startGate = 'starting'; input.clear(); lastFrame = 0;
    startButton.disabled = true; startInstruction.textContent = 'Starting your adventure...';
    startPrompt.setAttribute('aria-busy', 'true');
    const ready = () => {
      if (disposed) return;
      startGate = 'running'; clock = 0; openingStarted = 0; lastFrame = 0;
      paused = document.hidden || !document.hasFocus(); input.clear();
      startPrompt.hidden = true; startPrompt.setAttribute('aria-busy', 'false');
      lastRenderedRevision = -1; updateSoundButton();
    };
    void audio.activate(event).then(ready, ready);
    updateSoundButton();
  }

  /** False consumes an activation while the opening is waiting or starting.
   * Browser utility controls never start the game implicitly.
   * @param {Event} event @param {boolean} [gameInput] @returns {boolean}
   */
  function activate(event, gameInput = true) {
    if (disposed) return false;
    if (!helpPanel.hidden) {
      // B normally resolves on release so it can double as Run. Help has no
      // such chord: close during its live keydown so sound can resume too.
      if (event instanceof window.KeyboardEvent && event.type === 'keydown' &&
          ['b', 'x'].includes(event.key.toLowerCase()) && !event.repeat) {
        hideHelp(event); return false;
      }
      return true;
    }
    if (startGate !== 'running') {
      const target = event.target;
      if (gameInput && !(target instanceof HTMLElement && target.closest('#browser-controls')) &&
          (['keydown', 'pointerup', 'click', 'touchend'].includes(event.type) ||
            event instanceof window.KeyboardEvent && event.type === 'keyup' && event.key === 'Shift')) beginOpening(event);
      return false;
    }
    if (!document.hidden && document.hasFocus()) {
      if (paused) lastFrame = 0;
      paused = false;
    }
    void audio.activate(event).then(() => { if (!disposed) updateSoundButton(); });
    updateSoundButton();
    if (gameInput && dungeonTurnLocked()) return false;
    return true;
  }

  const input = createInput(document, {
    activate,
    action: handleInput,
    move(dx, dy, faceOnly, run, continuedDash) {
      if (!isDungeonInput()) return { delayMs: 50, accepted: false };
      if (clock < eventUntil) return { delayMs: eventUntil - clock, accepted: false };
      const dungeon = currentDungeon(); if (!dungeon) return { delayMs: 50, accepted: false };
      if (continuedDash && !canContinueDash(dungeon, dx, dy)) return { delayMs: 0, accepted: false, stopRepeat: true };
      const skipPickup = run && Math.floor(dungeon.hero.belly) > 0;
      const running = skipPickup && !dungeon.hero.status.confusion;
      const accepted = act(faceOnly ? { type: 'face', dx, dy } : { type: 'move', dx, dy, skipPickup, runRequested: run }, running);
      return { delayMs: Math.max(0, eventUntil - clock), accepted: faceOnly || accepted, stopRepeat: run && !faceOnly && !accepted };
    },
    interrupt() {
      pendingCameraChoice=null;pendingCameraCancel=null;
      paused = true; lastFrame = 0; audio.pause(); updateSoundButton(); commitNow();
      for (const button of touchControls.querySelectorAll('.held')) button.classList.remove('held');
    },
  });

  function resumeForeground() {
    if (disposed) return;
    paused = document.hidden || !document.hasFocus();
    lastFrame = 0;
    // Audio keeps its own trusted-gesture gate. Regaining visual focus neither
    // synthesizes input nor replays a held key or an interrupted sound.
    updateSoundButton();
  }
  function updateMotionPreference() {
    if (disposed) return;
    reducedMotion = motionPreference.matches;
    view.reducedMotion = reducedMotion;
    if (reducedMotion) eventUntil = Math.min(eventUntil, clock);
    lastRenderedRevision = -1;
  }
  function detachPresentationListeners() {
    window.removeEventListener('focus', resumeForeground);
    document.removeEventListener('visibilitychange', resumeForeground);
    motionPreference.removeEventListener('change', updateMotionPreference);
  }
  window.addEventListener('focus', resumeForeground);
  document.addEventListener('visibilitychange', resumeForeground);
  motionPreference.addEventListener('change', updateMotionPreference);

  /** @param {unknown} error */
  function fail(error) {
    if (disposed) return;
    commitNow(); disposed = true; transition += 1;
    detachPresentationListeners();
    input.dispose(); audio.dispose(); renderer.dispose(); window.cancelAnimationFrame(frameId);
    showFailure(error);
  }

  function isDungeonSurface() {
    return mode === 'play' && state?.phase === 'dungeon' && !menu && !notice && !fieldDialogue && !tutorials.length && !busy && !paused && !dungeonCamera.locked && helpPanel.hidden === true;
  }
  function dungeonTurnLocked() {
    const dungeon = currentDungeon();
    return Boolean(dungeon && isDungeonSurface() && getDungeonTurnPhase(dungeon) !== 'input');
  }
  function isDungeonInput() {
    const dungeon = currentDungeon();
    return Boolean(dungeon && isDungeonSurface() && getDungeonTurnPhase(dungeon) === 'input');
  }
  function clearForcedInput() {
    input.clear();
    for (const button of touchControls.querySelectorAll('.held')) button.classList.remove('held');
  }

  /** @param {Phase} phase @returns {AudioScene} */
  function musicFor(phase) {
    if (['welcome', 'quiz', 'gender', 'result', 'partner', 'partner-confirm', 'partner-name', 'partner-name-confirm', 'departure'].includes(phase)) return 'quiz';
    if (phase === 'awakening' && (state?.line ?? 0) < 3) return 'silent';
    if (phase === 'named' && (state?.line ?? 0) >= 2) return 'silent';
    if (['awakening', 'hero-name', 'hero-name-confirm', 'named'].includes(phase)) return 'awakening';
    if (['trouble', 'help-choice', 'enter'].includes(phase)) return 'trouble';
    if (phase === 'dungeon') return 'dungeon';
    if (phase === 'clearing') return 'clearing';
    if (phase === 'defeated') return 'failure';
    if (phase === 'complete') return 'complete';
    return 'reunion';
  }

  /** @param {Phase} phase @param {number} [line] @param {boolean} [newFloor] */
  async function setPhase(phase, line = 0, newFloor = false) {
    if (!state || disposed) return;
    resetDungeonCamera();
    clearLiveMessages();
    nameComposing = false; nameComposition = null; completedNameComposition = null;
    if ((phase === 'partner-name' || phase === 'hero-name') &&
        (state.phase !== phase || !state.naming || state.naming.text !== state.nameDraft)) state.naming = createNamingState(state.nameDraft);
    state.phase = phase; state.line = line; dialoguePage = 0; selectedIndex = 0;
    menu = null; notice = null; fieldDialogue = null; tutorials = []; forcedReadyAt = null; input.clear();
    const token = ++transition; busy = true; lastFrame = 0;
    // Keep the last complete scene on screen while its successor's art loads.
    // Publishing a new view here would start actor movement before it is ready.
    labels = []; view.choices = []; presentationRevision += 1; uiSignature = '!unrendered';
    choiceButtons.replaceChildren(); advanceButton.hidden = true; nameEntry.hidden = true;
    application.setAttribute('aria-busy', 'true'); commitNow();
    const ids = phase === 'partner' ? [state.heroSpeciesId, ...eligiblePartners(onboarding, state.heroSpeciesId)] :
      phase === 'dungeon' ? [state.heroSpeciesId, state.partnerSpeciesId, 'pokemon-016', 'pokemon-102', 'pokemon-191', 'pokemon-265'] :
        ['awakening', 'named', 'trouble', 'help-choice', 'enter', 'clearing', 'reunion', 'complete', 'hero-name', 'hero-name-confirm'].includes(phase)
          ? [state.heroSpeciesId, state.partnerSpeciesId, 'pokemon-010', 'pokemon-012'] : [state.heroSpeciesId, state.partnerSpeciesId];
    const deadline = window.setTimeout(() => {
      if (!disposed && token === transition) fail(new Error('Character artwork took too long to load. Reload to continue from the saved checkpoint.'));
    }, 20000);
    try {
      await renderer.loadSpecies(ids);
      if (disposed || token !== transition) return;
      busy = false; lastFrame = 0; input.clear();
      view.events = []; view.eventStartedAt = clock; eventUntil = clock;
      audio.setScene(musicFor(phase)); rebuild(); application.setAttribute('aria-busy', 'false');
      if (phase === 'dungeon') settleDungeon(newFloor);
    } catch (error) { if (!disposed && token === transition) fail(error); }
    finally { window.clearTimeout(deadline); }
  }

  function beginNewGame() {
    state = {
      version: 1, phase: 'welcome', line: 0, quiz: createQuiz(onboarding),
      gender: 'male', natureId: '', heroSpeciesId: 'pokemon-025', partnerSpeciesId: 'pokemon-004',
      heroName: 'Pikachu', partnerName: 'Charmander', nameDraft: '', dungeon: null,
      tutorialSeen: [], rewarded: false,
    };
    mode = 'play'; void setPhase('welcome');
  }

  function returnToMenu() {
    resetDungeonCamera();
    clearLiveMessages();
    commitNow(); mode = 'menu'; menu = null; notice = null; fieldDialogue = null; tutorials = [];
    selectedIndex = 0; dialoguePage = 0; forcedReadyAt = null; input.clear(); audio.setScene('menu'); rebuild();
  }

  function adventureLog() {
    const dungeon = state?.dungeon;
    showMenu({ title: 'Adventure Log', detail: state?.rewarded ?
      `${state.heroName} and ${state.partnerName}\nCaterpie rescued in Tiny Woods.\nRewards: Oran, Pecha, and Rawst Berries.\n${dungeon?.turn ?? 0} dungeon turns.` :
      state ? `${state.heroName} and ${state.partnerName}\n${dungeon ? `Tiny Woods B${dungeon.floor}F\n${dungeon.turn} dungeon turns.` : 'The adventure has begun.'}\nCaterpie is waiting to be rescued.` : 'There are no adventures to record yet.',
    choices: [{ label: 'Back', run: () => showMenu(null) }] });
  }

  function settingsMenu() {
    showMenu({ title: 'Game Options', choices: [
      { label: `Text: ${textSpeed === 0 ? 'Instant' : textSpeed === 14 ? 'Fast' : 'Normal'}`, run() {
        textSpeed = textSpeed === 28 ? 14 : textSpeed === 14 ? 0 : 28; persistOptions(); settingsMenu();
      } },
      { label: `Upper screen: ${topScreen}`, run() {
        topScreen = topScreen === 'team' ? 'map' : topScreen === 'map' ? 'log' : 'team'; persistOptions(); settingsMenu();
      } },
      { label: `Dungeon Speed: ${fastDungeon ? 'Fast' : 'Slow'}`, run() { fastDungeon = !fastDungeon; persistOptions(); settingsMenu(); } },
      { label: `Grids: ${gridVisible ? 'On' : 'Off'}`, run() { gridVisible = !gridVisible; persistOptions(); settingsMenu(); } },
      { label: `Sound: ${audio.status().muted ? 'Off' : 'On'}`, run(event) {
        const muted = !audio.status().muted;
        audio.setMuted(muted); persistOptions();
        if (!muted && event) activate(event, false);
        updateSoundButton(); settingsMenu();
      } },
      { label: 'Back', run: () => mode === 'play' && state?.phase === 'dungeon' ? dungeonMenus.others() : showMenu(null) },
    ] });
  }

  function persistOptions() {
    preferenceRepository.save({ version: 1, textSpeed, topScreen, fastDungeon, grids: gridVisible, muted: audio.status().muted });
  }

  function showHelp() {
    pendingCameraChoice=null;pendingCameraCancel=null;
    helpReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    input.clear(); paused = true; lastFrame = 0; audio.pause(); updateSoundButton();
    helpPanel.hidden = false; helpToggle.setAttribute('aria-expanded', 'true');
    screens.inert = true; touchControls.inert = true;
    element('help-close').focus();
  }
  /** @param {Event} [event] */
  function hideHelp(event) {
    helpPanel.hidden = true; helpToggle.setAttribute('aria-expanded', 'false');
    screens.inert = false; touchControls.inert = false;
    (helpReturnFocus?.isConnected ? helpReturnFocus : screens).focus(); input.clear();
    paused = document.hidden || !document.hasFocus(); lastFrame = 0;
    if (event) activate(event, false);
    updateSoundButton();
  }

  function isNaming() { return mode === 'play' && (state?.phase === 'partner-name' || state?.phase === 'hero-name'); }
  /** @returns {NamingState|null} */
  function namingState() {
    if (!state || !isNaming()) return null;
    if (!state.naming || state.naming.text !== state.nameDraft) state.naming = createNamingState(state.nameDraft);
    return state.naming;
  }
  /** @param {boolean} [redraw] */
  function updateNaming(redraw = true) {
    if (!state?.naming) return;
    state.nameDraft = state.naming.text; selectedIndex = state.naming.selected;
    view.naming = state.naming; view.nameValue = state.nameDraft; view.selectedIndex = selectedIndex;
    if (redraw) rebuild();
    commitSoon();
  }
  function confirmName() {
    const editor = namingState(); if (!state || !editor) return;
    const error = namingError(editor.text, textWidth);
    if (error) {
      audio.effect('denied');
      if (!editor.text.length) { lastNarration = 'Please enter a name.'; narration.textContent = lastNarration; return; }
      // Confirm-name errors return to a fresh native naming screen: OVR, a,
      // and the caret at the end. Keep the entered text, including spaces.
      state.naming = createNamingState(editor.text); input.clear(); screens.focus();
      notice = error === 'empty' ? 'Please enter a name.' : 'This name is too long.';
      dialoguePage = 0; rebuild(); commitSoon(); return;
    }
    audio.effect('confirm');
    state.nameDraft = editor.text; screens.focus();
    void setPhase(state.phase === 'hero-name' ? 'hero-name-confirm' : 'partner-name-confirm');
  }
  function chooseNaming() {
    if(nameComposing)return;
    const editor = namingState(); if (!editor) return;
    if (document.activeElement === nameInput) {
      const prefix = nameInput.value.slice(0, nameInput.selectionStart ?? nameInput.value.length);
      replaceNamingText(editor, nameInput.value, Array.from(sanitizeNamingText(prefix)).length);
      updateNaming(false); confirmName(); return;
    }
    const key = NAMING_KEYS[selectedIndex];
    const result = activateNamingKey(editor, selectedIndex);
    if (result !== 'end') audio.effect(result === 'denied' ? 'denied' : key?.kind === 'delete' ? 'cancel' : key?.kind === 'mode' ? 'open' : 'confirm');
    updateNaming();
    if (result === 'end') confirmName();
  }

  /** Rebuild semantic UI only after an action or phase transition, never per frame. */
  function rebuild() {
    /** @type {View} */ const next = {
      scene: mode === 'play' ? 'quiz' : mode, reducedMotion, titleImmediate, gender: state?.gender,
      heroSpeciesId: state?.heroSpeciesId, partnerSpeciesId: state?.partnerSpeciesId,
      heroName: state?.heroName, partnerName: state?.partnerName,
      dungeon: state?.dungeon, selectedIndex, topScreen, mapVisible,
      cameraActorId:dungeonCamera.target,menuActorId:menu?.cameraMember,
      dungeonLightLevel:data.floors[(state?.dungeon?.floor??1)-1]?.generation.visibilityRange,
      events: view.events, eventStartedAt: view.eventStartedAt, eventDuration: view.eventDuration,
    };
    labels = []; speech = null; speechPages = [];
    let text = '', speaker = '', portraitSpeciesId = '', portraitEmotion = 'normal';
    if (mode === 'menu') {
      next.menuTitle = 'Blue Rescue Team';
      labels = state ? ['Continue', 'Delete Save Data', 'Adventure Log'] : ['New Game', 'Adventure Log'];
    }
    if (mode === 'play' && state) {
      const phase = state.phase;
      next.storyPhase = phase;
      next.storyLine = state.line;
      if (phase === 'quiz') {
        const question = currentQuestion(state.quiz, onboarding);
        text = question?.prompt ?? '';
        labels = question?.options.map(option => option.text) ?? [];
        next.quizProgress = state.quiz.answered + 1;
      } else if (phase === 'gender') {
        next.scene = 'gender'; text = 'Are you a boy or a girl?'; labels = ['Boy', 'Girl'];
      } else if (phase === 'result') {
        next.scene = 'result';
        const natureId = state.natureId;
        const result = onboarding.results.find(record => record.natureId === natureId);
        text = state.line === 0 ? `You seem to be the ${state.natureId} type.` : state.line === 1 ? result?.description ?? '' : `A Pokémon with your personality is... ${speciesName(state.heroSpeciesId)}!`;
      } else if (phase === 'partner') {
        next.scene = 'partner';
        next.partnerChoices = eligiblePartners(onboarding, state.heroSpeciesId);
        labels = next.partnerChoices.map(speciesName); next.choiceColumns = 1;
      } else if (phase === 'partner-confirm') {
        next.scene = 'partner'; text = `Would you like ${speciesName(state.partnerSpeciesId)} as your partner?`; labels = ['Yes', 'No'];
      } else if (phase === 'partner-name' || phase === 'hero-name') {
        next.scene = 'name'; next.nameTarget = phase === 'hero-name' ? 'hero' : 'partner';
        const editor = namingState();
        if (editor) { next.naming = editor; next.nameValue = editor.text; selectedIndex = editor.selected; labels = namingLabels(editor); }
      } else if (phase === 'partner-name-confirm' || phase === 'hero-name-confirm') {
        next.scene = 'quiz';
        text = `Is ${state.nameDraft} the name you want?`; labels = ['Yes', 'No'];
      } else if (phase === 'help-choice') {
        next.scene = 'trouble'; text = 'Will you help rescue Caterpie?'; speaker = state.partnerName;
        portraitSpeciesId = state.partnerSpeciesId; labels = ['Yes', 'No'];
      } else if (phase === 'dungeon') {
        next.scene = 'dungeon'; next.notice = liveMessages.length ? liveMessages.join('\n') : undefined;
      } else if (phase === 'defeated') {
        next.scene = 'dungeon'; text = 'The rescue did not go as planned... Caterpie still needs your help.';
        labels = ['Try again', 'Return to top menu'];
      } else if (phase === 'complete') {
        next.scene = 'complete'; text = 'Caterpie is safely home with Butterfree. Your first rescue is complete.';
        labels = ['Adventure Log', 'Return to top menu'];
      } else {
        next.scene = phase === 'welcome' || phase === 'departure' ? 'quiz' : phase === 'enter' || phase === 'trouble' ? 'trouble' :
          phase === 'clearing' ? 'clearing' : phase === 'reunion' ? 'reunion' : 'awakening';
        const line = STORY[phase]?.[state.line];
        if (line) {
          next.storyPose = line.pose;
          text = interpolateStory(line.text, { heroName: state.heroName, partnerName: state.partnerName, heroSpeciesName: speciesName(state.heroSpeciesId) });
          portraitEmotion = line.emotion ?? 'normal';
          if (line.speaker !== 'narrator') {
            speaker = line.speaker === 'hero' ? state.heroName : line.speaker === 'partner' ? state.partnerName : line.speaker === 'butterfree' ? 'Butterfree' : 'Caterpie';
            portraitSpeciesId = line.speaker === 'hero' ? state.heroSpeciesId : line.speaker === 'partner' ? state.partnerSpeciesId : line.speaker === 'butterfree' ? 'pokemon-012' : 'pokemon-010';
          }
          if (line.quiet) { speaker = ''; text = `(${text})`; }
          if (line.offscreen) { speaker = ''; portraitSpeciesId = ''; }
          if (line.scene === 'dream') { next.blackout = true; speaker = ''; portraitSpeciesId = ''; }
        }
      }
    }
    if (menu) { labels = menu.choices.map(choice => choice.label); next.disabledChoices = menu.choices.map(choice => Boolean(choice.disabled)); next.menuTitle = menu.title; text = menu.detail ?? ''; speaker = ''; portraitSpeciesId = ''; }
    if (fieldDialogue) { text = fieldDialogue.text; speaker = fieldDialogue.speaker ?? ''; portraitSpeciesId = fieldDialogue.portraitSpeciesId ?? ''; portraitEmotion = fieldDialogue.portraitEmotion ?? 'normal'; labels = []; }
    if (tutorials.length) { text = tutorials[0] ?? ''; labels = []; speaker = ''; portraitSpeciesId = ''; }
    if (notice) { text = notice; labels = []; speaker = ''; portraitSpeciesId = ''; }
    if (text) {
      speechPages = paginateDialogue(text, speaker);
      dialoguePage = Math.min(dialoguePage, speechPages.length - 1);
      speech = { text: speechPages[dialoguePage] ?? '', speaker, portraitSpeciesId: portraitSpeciesId || undefined, portraitEmotion, visibleChars: 0 };
      next.dialogue = speech;
      if (dialoguePage < speechPages.length - 1) labels = [];
    }
    selectedIndex = Math.min(selectedIndex, Math.max(0, labels.length - 1));
    next.selectedIndex = selectedIndex; next.choices = labels;
    revealed = Boolean(menu) || !speech || textSpeed === 0; speechStarted = clock;
    view = next; presentationRevision += 1; uiSignature = '!unrendered';
    requestMenuCamera();
    game.dataset.scene = mode === 'play' ? state?.phase ?? 'opening' : mode;
    const naming = isNaming() && !notice && !menu;
    nameEntry.hidden = !naming;
    screens.setAttribute('aria-label', naming
      ? 'Name entry. Arrows select keys, Z confirms, X deletes, Q or L and R move the text caret, and Enter selects END.'
      : 'Game screens. Use arrow keys and Z to play.');
    if (naming && state) {
      if (nameInput.value !== state.nameDraft) {
        nameInput.value = state.nameDraft;
        // Controller edits can run while the native field owns focus. Assigning
        // value moves its caret to the end, so restore the editor's position.
        // Unchanged values leave normal browser typing and selection untouched.
        if (document.activeElement === nameInput) {
          const caret = Array.from(state.nameDraft).slice(0, state.naming?.caret ?? Array.from(state.nameDraft).length).join('').length;
          nameInput.setSelectionRange(caret, caret);
        }
      }
      element('name-label').textContent = state.phase === 'hero-name' ? 'Your name' : "Your partner's name";
    }
    const announcement = [speaker, text].filter(Boolean).join(': ');
    if (announcement !== lastNarration) { narration.textContent = announcement; lastNarration = announcement; }
  }

  function syncChoices() {
    const bounds = renderer.getChoiceBounds();
    const toolbar = renderer.getToolbarBounds();
    const signature = bounds.map(bound => `${bound.index}:${labels[bound.index]}:${Boolean(view.disabledChoices?.[bound.index])}:${bound.x}:${bound.y}:${bound.width}:${bound.height}`).join('|') +
      '#' + toolbar.map(bound => `${bound.id}:${bound.x}:${bound.y}:${bound.width}:${bound.height}`).join('|');
    if (signature !== uiSignature) {
      const namingFocusOwner = isNaming() && !notice && !menu && choiceButtons.contains(document.activeElement) ? state?.naming : null;
      /** @type {HTMLButtonElement|null} */ let namingFocusTarget = null;
      uiSignature = signature; choiceButtons.replaceChildren();
      const currentRevision = presentationRevision;
      for (const bound of bounds) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'game-choice';
        button.disabled = Boolean(view.disabledChoices?.[bound.index]);
        button.textContent = labels[bound.index] ?? ''; button.setAttribute('aria-label', labels[bound.index] ?? 'Choose');
        button.style.left = `${bound.x / 256 * 100}%`; button.style.top = `${bound.y / 192 * 100}%`;
        button.style.width = `${bound.width / 256 * 100}%`; button.style.height = `${bound.height / 192 * 100}%`;
        button.addEventListener('click', event => {
          event.stopPropagation();
          if (currentRevision !== presentationRevision) return;
          if (!activate(event)) return;
          selectChoice(bound.index); choose(event);
        });
        button.addEventListener('focus', () => {
          if (currentRevision !== presentationRevision) return;
          selectChoice(bound.index);
          if (isNaming() && state?.naming) { state.naming.selected = selectedIndex; commitSoon(); }
        });
        choiceButtons.append(button);
        if (namingFocusOwner && bound.index === namingFocusOwner.selected) namingFocusTarget = button;
      }
      for (const bound of toolbar) {
        const button = document.createElement('button');
        const label = { throw: 'Throw', moves: 'Moves', items: 'Items', team: 'Team', menu: 'Menu' }[bound.id];
        if (!label) continue;
        button.type = 'button'; button.className = 'game-choice'; button.textContent = label;
        button.setAttribute('aria-label', label); button.title = bound.id === 'throw' ? 'Throw command' : `Open ${label.toLowerCase()}`;
        button.style.left = `${bound.x / 256 * 100}%`; button.style.top = `${bound.y / 192 * 100}%`;
        button.style.width = `${bound.width / 256 * 100}%`; button.style.height = `${bound.height / 192 * 100}%`;
        button.addEventListener('click', event => {
          event.stopPropagation();
          if (currentRevision === presentationRevision) handleToolbar(bound.id, event);
        });
        choiceButtons.append(button);
      }
      // Keep keyboard/assistive activation on the current naming key, including
      // automatic END selection at ten characters. Never steal native-field
      // focus or restore a key from a replaced editor or presentation.
      if (namingFocusTarget && state?.naming === namingFocusOwner && presentationRevision === currentRevision) {
        namingFocusTarget.focus({ preventScroll: true });
      }
    }
    const hideAdvance = !speech || Boolean(view.choices?.length) || busy;
    if (advanceButton.hidden !== hideAdvance) advanceButton.hidden = hideAdvance;
  }

  /** The initial dungeon has no Toolbox: its visible Throw shortcut is inert.
   * @param {string} id @param {Event} event
   */
  function handleToolbar(id, event) {
    if (!['throw', 'moves', 'items', 'team', 'menu'].includes(id)) return;
    if (!activate(event) || !isDungeonInput() || clock < eventUntil || id === 'throw') return;
    screens.focus(); input.clear(); audio.effect('open');
    if (id === 'moves') dungeonMenus.moves('hero');
    else if (id === 'items') dungeonMenus.items();
    else if (id === 'team') dungeonMenus.team();
    else dungeonMenus.main();
  }

  /** @param {InputAction} action @param {Event} [event] */
  function handleInput(action, event) {
    if (disposed || document.hidden) return;
    if (!helpPanel.hidden) { if (action === 'cancel' || action === 'menu') hideHelp(event); return; }
    if (busy || paused || startGate !== 'running') return;
    if(dungeonCamera.locked&&['north','south','west','east'].includes(action))return;
    if (dungeonTurnLocked()) return;
    if (isDungeonInput() && clock < eventUntil) return;
    if (mode === 'opening') { if (action === 'confirm' || action === 'menu' || action === 'cancel') { mode = 'title'; titleImmediate = true; audio.setScene('title'); rebuild(); input.clear(); } return; }
    if (mode === 'title') { if (action === 'confirm' || action === 'menu') { mode = 'menu'; audio.setScene('menu'); rebuild(); input.clear(); } return; }
    if (isNaming() && !notice && !menu) {
      const editor = namingState(); if (!editor) return;
      if (action === 'north' || action === 'south' || action === 'west' || action === 'east') {
        const moved = moveNamingSelection(editor, action); screens.focus(); updateNaming(false);
        audio.effect(moved ? 'cursor' : 'denied'); return;
      }
      if (action === 'caretLeft' || action === 'caretRight') {
        const moved = moveNamingCaret(editor, action === 'caretLeft' ? -1 : 1); updateNaming(false);
        audio.effect(moved ? 'cursor' : 'denied'); return;
      }
      if (action === 'menu') { editor.selected = NAMING_END_KEY; screens.focus(); updateNaming(false); audio.effect('cursor'); return; }
      if (action === 'cancel') { const changed = deleteNamingCharacter(editor); updateNaming(); audio.effect(changed ? 'cancel' : 'denied'); return; }
      if (action === 'confirm' || action === 'setMove' || action === 'wait') { chooseNaming(); return; }
    }
    if (action === 'cancel' && (state?.phase === 'hero-name-confirm' || state?.phase === 'partner-name-confirm')) {
      audio.effect('cancel');
      void setPhase(state.phase === 'hero-name-confirm' ? 'hero-name' : 'partner-name');
      return;
    }
    if (['north', 'south', 'west', 'east'].includes(action) && labels.length) {
      if (speech && !revealed) return;
      const columns = view.choiceColumns ?? (view.scene === 'partner' && state?.phase === 'partner' ? 2 : 1);
      const delta = action === 'north' ? -columns : action === 'south' ? columns : action === 'west' ? -1 : 1;
      selectChoice((selectedIndex + delta + labels.length) % labels.length);
      screens.focus(); audio.effect('cursor'); return;
    }
    if (action === 'map' && state?.phase === 'dungeon' && !menu) {
      mapVisible = !mapVisible; topScreen = mapVisible ? 'map' : 'team'; rebuild(); return;
    }
    if ((action === 'cancel' || action === 'menu') && mode === 'menu') {
      audio.effect('cancel');
      if (menu) showMenu(null); else { mode = 'title'; audio.setScene('title'); rebuild(); }
      return;
    }
    if ((action === 'cancel' || action === 'menu') && state?.phase === 'dungeon') {
      if (menu) {
        audio.effect('cancel');
        if(menu.cameraChoices&&dungeonCamera.target!=='hero'){
          pendingCameraChoice=null;pendingCameraCancel={menu,revision:presentationRevision};requestMenuCamera();return;
        }
        if (menu.cancel) menu.cancel(); else showMenu(null); return;
      }
      if (speech || notice || tutorials.length) { handleInput('confirm', event); return; }
      audio.effect('open');
      dungeonMenus.main();
      return;
    }
    if (action === 'confirm') { choose(event); return; }
    if (isDungeonInput() && clock >= eventUntil) {
      if (action === 'wait') act({ type: 'wait' });
      else if (action === 'setMove') {
        const slot = state?.dungeon?.hero.moves.findIndex(move => move.set) ?? -1;
        if (slot >= 0) act(state?.dungeon?.hero.moves.every(move => move.pp === 0) ? { type: 'struggle' } : { type: 'moveSlot', slot });
        else { notice = 'Set a move from the Moves menu first.'; rebuild(); }
      }
    }
  }

  /** @param {Event} [event] */
  function choose(event) {
    if (busy || paused || disposed || !helpPanel.hidden || startGate !== 'running') return;
    if(pendingCameraCancel)return;
    if(dungeonCamera.locked){if(menu)pendingCameraChoice={menu,index:selectedIndex,revision:presentationRevision,event};return;}
    if (dungeonTurnLocked()) return;
    if (speech && !revealed) { revealed = true; audio.effect('confirm'); return; }
    if (speech && dialoguePage < speechPages.length - 1) { dialoguePage += 1; rebuild(); audio.effect('confirm'); return; }
    if (notice) { notice = null; dialoguePage = 0; rebuild(); return; }
    if (tutorials.length) { tutorials.shift(); dialoguePage = 0; rebuild(); return; }
    if (fieldDialogue) { fieldDialogue = null; dialoguePage = 0; rebuild(); return; }
    if (isNaming() && !menu) { chooseNaming(); return; }
    if (state?.phase === 'dungeon' && clock < eventUntil) return;
    if (menu?.choices[selectedIndex]?.disabled) { audio.effect('denied'); return; }
    if (menu) {
      audio.effect('confirm');
      const choice = menu.choices[selectedIndex];
      if (choice) choice.run(event);
      else if (!menu.choices.length) menu.cancel?.();
      return;
    }
    if (state?.phase !== 'dungeon') audio.effect('confirm');
    if (mode === 'menu') {
      if (state) {
        if (selectedIndex === 0) {
          // Keep the live adventure even when storage was denied or its last
          // write failed. A reload has already admitted stored state at boot.
          mode = 'play'; selectedIndex = 0; dialoguePage = 0;
          const phase = state.phase, line = state.line;
          void setPhase(phase, line);
        } else if (selectedIndex === 1) showMenu({ title: 'Delete opening save?', detail: 'This deletes only this opening adventure. Your older campaign saves are preserved.', choices: [
          { label: 'No', run: () => showMenu(null) },
          { label: 'Yes, delete', run() { if (repository.remove()) { state = null; hasStored = false; showMenu(null); } else setWarning('The saved adventure could not be deleted.'); } },
        ] }); else adventureLog();
      } else if (selectedIndex === 0) {
        if (hasStored) showMenu({ title: 'Start a new adventure?', detail: 'An unreadable opening save is stored here. Starting anew will replace its recovery checkpoints.', choices: [
          { label: 'Keep saved data', run: () => showMenu(null) }, { label: 'Start new game', run: beginNewGame },
        ] }); else beginNewGame();
      } else adventureLog();
      return;
    }
    if (!state) return;
    const phase = state.phase;
    if (phase === 'quiz') {
      if (!answerQuestion(state.quiz, onboarding, selectedIndex)) return;
      selectedIndex = 0; dialoguePage = 0;
      if (state.quiz.questionId) { rebuild(); commitNow(); }
      else if (state.quiz.answered === 8) void setPhase('gender');
      else { nextQuestion(state.quiz, onboarding); rebuild(); commitNow(); }
    } else if (phase === 'gender') {
      state.gender = selectedIndex === 0 ? 'male' : 'female';
      const result = finishQuiz(state.quiz, onboarding); state.natureId = result.natureId;
      state.heroSpeciesId = state.gender === 'male' ? result.maleSpeciesId : result.femaleSpeciesId;
      state.heroName = speciesName(state.heroSpeciesId); void setPhase('result');
    } else if (phase === 'result') {
      if (state.line < 2) { state.line += 1; dialoguePage = 0; rebuild(); commitNow(); }
      else void setPhase('partner');
    } else if (phase === 'partner') {
      const partner = eligiblePartners(onboarding, state.heroSpeciesId)[selectedIndex]; if (!partner) return;
      state.partnerSpeciesId = partner; state.partnerName = speciesName(partner); void setPhase('partner-confirm');
    } else if (phase === 'partner-confirm') {
      if (selectedIndex === 1) void setPhase('partner');
      else { state.nameDraft = state.partnerName; void setPhase('partner-name'); }
    } else if (phase === 'partner-name-confirm' || phase === 'hero-name-confirm') {
      if (selectedIndex === 1) void setPhase(phase === 'hero-name-confirm' ? 'hero-name' : 'partner-name');
      else if (phase === 'partner-name-confirm') { state.partnerName = state.nameDraft; void setPhase('departure'); }
      else { state.heroName = state.nameDraft; void setPhase('named'); }
    } else if (phase === 'help-choice') {
      if (selectedIndex === 0) void setPhase('enter');
      else { notice = `${state.partnerName}: Caterpie is frightened and alone. Please, let us help him together.`; dialoguePage = 0; rebuild(); }
    } else if (phase === 'dungeon') {
      if (clock >= eventUntil) act({ type: 'attack' });
    } else if (phase === 'defeated') {
      if (selectedIndex === 1) returnToMenu();
      else if (state.dungeon) { retryDungeon(state.dungeon, data); void setPhase('dungeon', 0, true); }
    } else if (phase === 'complete') {
      if (selectedIndex === 0) adventureLog(); else returnToMenu();
    } else advanceStory();
  }

  function advanceStory() {
    if (!state) return;
    const phase = state.phase, script = STORY[phase];
    if (!script) return;
    if (state.line < script.length - 1) {
      state.line += 1; dialoguePage = 0;
      audio.setScene(musicFor(phase));
      if (phase === 'reunion' && state.line === 5) { state.rewarded = true; audio.effect('reward'); }
      rebuild(); commitNow(); return;
    }
    if (phase === 'welcome') { nextQuestion(state.quiz, onboarding); void setPhase('quiz'); }
    else if (phase === 'departure') void setPhase('awakening');
    else if (phase === 'awakening') { state.nameDraft = state.heroName; void setPhase('hero-name'); }
    else if (phase === 'named') void setPhase('trouble');
    else if (phase === 'trouble') void setPhase('help-choice');
    else if (phase === 'enter') {
      try {
        state.dungeon = createDungeon({ heroSpeciesId: state.heroSpeciesId, partnerSpeciesId: state.partnerSpeciesId,
          heroName: state.heroName, partnerName: state.partnerName }, data);
        void setPhase('dungeon', 0, true);
      } catch (error) { fail(error); }
    } else if (phase === 'clearing') { audio.effect('rescue'); void setPhase('reunion'); }
    else if (phase === 'reunion') { state.rewarded = true; void setPhase('complete'); }
  }

  /** @param {DungeonAction} action @param {boolean} [running] @returns {boolean} */
  function act(action, running = false) {
    const dungeon = currentDungeon(); if (!dungeon || busy || disposed) return false;
    try {
      const result = performAction(dungeon, action, data);
      presentDungeonResult(result, running);
      return result.consumedTurn;
    } catch (error) { fail(error); return false; }
  }

  /** @param {ActionResult} result @param {boolean} [running] @param {boolean} [autonomous] */
  function presentDungeonResult(result, running = false, autonomous = false) {
    const dungeon = currentDungeon(); if (!dungeon || disposed) return;
    enqueueLiveMessages(result);
    view.events = result.events; view.eventStartedAt = clock;
    // Comparative native walking spans 24 frames, or 12 with Fast selected.
    // Running suppresses movement interpolation rather than shortening turns.
    const onlyMovement = !result.events.some(event => ['attack', 'damage', 'throw'].includes(event.type));
    view.eventDuration = running && onlyMovement ? 0 : (fastDungeon ? 12 : 24) * 1000 / 60;
    const visibleAction = result.events.some(event => ['move', 'attack', 'damage', 'heal', 'defeat', 'throw', 'level'].includes(event.type));
    eventUntil = clock + (result.consumedTurn && !reducedMotion && (!autonomous || visibleAction) ? view.eventDuration : 0);
    for (const event of result.events.slice(0, 20)) {
      if (event.type === 'attack') audio.effect('attack');
      else if (event.type === 'damage') audio.effect('hit');
      else if (event.type === 'heal') audio.effect('heal');
      else if (event.type === 'level') audio.effect('levelUp');
      else if (event.type === 'defeat') audio.effect('faint');
      else if (event.type === 'floor') audio.effect('stairs');
      else if (event.type === 'item') audio.effect(event.text === 'poke' ? 'money' : 'pickup');
    }
    for (const event of result.events) {
      const lesson = event.type === 'tutorial' && event.text ? ITEM_TUTORIALS[event.text] : undefined;
      if (lesson) tutorials.push(lesson);
      if (event.type === 'talk' && event.text) {
        const actor = event.actorId === 'hero' ? dungeon.hero : dungeon.partner;
        fieldDialogue = { text: event.text, speaker: actor.name, portraitSpeciesId: actor.speciesId };
      }
    }
    rebuild(); commitSoon(); settleDungeon(result.events.some(event => event.type === 'floor'));
  }

  /** One preparation or forced completion per eligible animation frame. Time
   * spent hidden, unfocused, loading or in Help never advances this deadline.
   * @returns {boolean} Whether this frame performed autonomous scheduler work.
   */
  function advanceDungeonClock() {
    if (startGate !== 'running' || document.hidden || !document.hasFocus() || !isDungeonSurface() || clock < eventUntil) return false;
    const dungeon = currentDungeon(); if (!dungeon) return false;
    try {
      const phase = getDungeonTurnPhase(dungeon);
      if (phase === 'forced') {
        if (forcedReadyAt === null) { clearForcedInput(); forcedReadyAt = clock + 60 * 1000 / 60; }
        if (clock < forcedReadyAt) return true;
        clearForcedInput(); forcedReadyAt = null;
        presentDungeonResult(completeForcedTurn(dungeon, data), false, true); commitNow();
        return true;
      }
      forcedReadyAt = null;
      if (phase !== 'unprepared') return false;
      const result = prepareDungeonTurn(dungeon, data);
      if (result.phase === 'forced') clearForcedInput();
      else if (result.phase === 'advanced') input.discardQueuedMovement();
      if (result.phase === 'forced') forcedReadyAt = clock + 60 * 1000 / 60;
      if (result.changed) { presentDungeonResult(result, false, true); commitNow(); }
      return result.phase === 'forced' || result.phase === 'advanced' || result.phase === 'blocked';
    } catch (error) { fail(error); return true; }
  }

  /** @param {boolean} [newFloor] */
  function settleDungeon(newFloor = false) {
    const dungeon = currentDungeon(); if (!dungeon || !state) return;
    if (dungeon.status === 'rescued') { void setPhase('clearing'); return; }
    if (dungeon.status === 'defeated') { void setPhase('defeated'); return; }
    if (dungeon.pendingLearning.length) { dungeonMenus.learning(); return; }
    if (dungeon.status === 'stairs') {
      if (getDungeonTurnPhase(dungeon) === 'input') { audio.effect('open'); dungeonMenus.stairs(); }
      return;
    }
    const unseen = GENERAL_TUTORIALS.findIndex((_, index) => !state?.tutorialSeen.includes(index + 1));
    if (newFloor && unseen >= 0) {
      state.tutorialSeen.push(unseen + 1); tutorials = [GENERAL_TUTORIALS[unseen] ?? ''];
      input.clear(); dialoguePage = 0; rebuild(); commitNow();
    }
  }

  function updateSoundButton() {
    const status = audio.status();
    const enabled = !status.muted && (startGate !== 'running' || status.state === 'ready');
    soundButton.textContent = status.muted ? 'Sound off' : enabled ? 'Sound on' : 'Enable sound';
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundButton.title = enabled ? 'Mute game sound' : 'Enable game sound';
  }

  startButton.addEventListener('click', event => { activate(event); });
  controlsToggle.addEventListener('click', event => {
    activate(event, false); touchControls.hidden = !touchControls.hidden;
    controlsToggle.setAttribute('aria-pressed', String(!touchControls.hidden));
    controlsToggle.setAttribute('aria-expanded', String(!touchControls.hidden));
    input.clear(); screens.focus();
  });
  helpToggle.addEventListener('click', event => { if (helpPanel.hidden) showHelp(); else hideHelp(event); });
  element('help-close').addEventListener('click', hideHelp);
  document.addEventListener('keydown', event => {
    if (helpPanel.hidden || event.key !== 'Tab') return;
    const buttons = [...helpPanel.querySelectorAll('button')];
    if (!buttons.length) return;
    const current = buttons.findIndex(button => button === document.activeElement);
    const next = (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    event.preventDefault(); buttons[next]?.focus();
  });
  element('save-screen').addEventListener('click', () => {
    bottomCanvas.toBlob(blob => {
      if (!blob || disposed) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'blue-rescue-team-screen.png';
      link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, 'image/png');
  });
  soundButton.addEventListener('click', event => {
    const status = audio.status();
    audio.setMuted(startGate !== 'running' ? !status.muted : status.state === 'ready' && !status.muted);
    persistOptions();
    activate(event, false); updateSoundButton(); screens.focus();
  });
  advanceButton.addEventListener('click', event => { if (activate(event)) choose(event); screens.focus(); });
  bottomCanvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    if (!activate(event)) return;
    const bounds = bottomCanvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 256;
    const y = (event.clientY - bounds.top) / bounds.height * 192;
    const toolbar = renderer.getToolbarBounds().find(bound => x >= bound.x && x < bound.x + bound.width && y >= bound.y && y < bound.y + bound.height);
    if (toolbar) { handleToolbar(toolbar.id, event); return; }
    if (!nameEntry.hidden) {
      if (x >= 32 && x <= 224 && y >= 16 && y <= 72) { nameInput.focus(); nameInput.select(); }
      return;
    }
    screens.focus(); handleInput('confirm', event);
  });
  bottomCanvas.addEventListener('pointerup', event => { activate(event); });
  /** @returns {NamingState|null} */
  function activeNameField() {
    if (disposed || busy || nameEntry.hidden || !helpPanel.hidden || document.activeElement !== nameInput) return null;
    return namingState();
  }
  /** @param {NameComposition|null} owner */
  function ownsNameComposition(owner) {
    return Boolean(owner && !disposed && !busy && !nameEntry.hidden && isNaming() &&
      owner.transition === transition && owner.editor === state?.naming);
  }
  /** @param {NamingState|null} editor */
  function syncNameInput(editor) {
    if (!editor) return;
    const prefix = nameInput.value.slice(0, nameInput.selectionStart ?? nameInput.value.length);
    const caret = Array.from(sanitizeNamingText(prefix)).length;
    replaceNamingText(editor, nameInput.value, caret);
    if (nameInput.value !== editor.text) { nameInput.value = editor.text; nameInput.setSelectionRange(caret, caret); }
    updateNaming(false);
  }
  nameInput.addEventListener('compositionstart', () => {
    const editor = activeNameField();
    nameComposing = Boolean(editor); completedNameComposition = null;
    nameComposition = editor ? { editor, transition } : null;
  });
  nameInput.addEventListener('compositionend', () => {
    const owner = nameComposition;
    nameComposing = false; nameComposition = null;
    completedNameComposition = ownsNameComposition(owner) ? owner : null;
    if (completedNameComposition) syncNameInput(completedNameComposition.editor);
  });
  nameInput.addEventListener('input', event => {
    if (nameComposing || event instanceof window.InputEvent && event.isComposing) return;
    const fromComposition = event instanceof window.InputEvent && /composition/i.test(event.inputType);
    // Some browsers send a final input after compositionend. Admit it only for
    // that same editor and phase; delayed IME events cannot edit a successor.
    if (fromComposition && !ownsNameComposition(completedNameComposition)) return;
    if (!fromComposition) completedNameComposition = null;
    syncNameInput(activeNameField());
  });
  function syncNameCaret() {
    if (nameComposing) return;
    const editor = activeNameField(); if (!editor) return;
    const prefix = nameInput.value.slice(0, nameInput.selectionStart ?? nameInput.value.length);
    editor.caret = Math.min(9, Array.from(editor.text).length, Array.from(sanitizeNamingText(prefix)).length);
    updateNaming(false);
  }
  nameInput.addEventListener('select', syncNameCaret);
  nameInput.addEventListener('keyup', syncNameCaret);
  for (const button of touchControls.querySelectorAll('button[data-key]')) {
    if (!(button instanceof HTMLButtonElement)) continue;
    const key = button.dataset.key; if (!key) continue;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); button.classList.add('held');
      if (key !== 'a' || document.activeElement !== nameInput) screens.focus();
      input.pointer(key, true, event);
    });
    button.addEventListener('pointerup', event => { event.preventDefault(); button.classList.remove('held'); input.pointer(key, false, event); });
    button.addEventListener('pointercancel', event => { button.classList.remove('held'); input.pointer(key, false, event, true); });
    button.addEventListener('lostpointercapture', event => { button.classList.remove('held'); input.pointer(key, false, event, true); });
    button.addEventListener('click', event => {
      if (event.detail === 0) { input.pointer(key, true, event); input.pointer(key, false, event); }
    });
  }
  window.addEventListener('pagehide', () => {
    commitNow(); disposed = true; transition += 1; input.dispose(); audio.dispose(); renderer.dispose();
    detachPresentationListeners();
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('arcade-controls-visibility', syncHostControls);
  }, { once: true });

  /** @param {number} now */
  function frame(now) {
    if (disposed) return;
    const elapsed = lastFrame ? Math.min(50, Math.max(0, now - lastFrame)) : 0;
    lastFrame = now;
    if (startGate === 'running' && !document.hidden && document.hasFocus() && !paused && !busy && helpPanel.hidden) clock += elapsed;
    if (liveMessageRemaining > 0 && !document.hidden && document.hasFocus() && isDungeonSurface()) {
      liveMessageRemaining = Math.max(0, liveMessageRemaining - elapsed);
      if (liveMessageRemaining === 0) clearLiveMessages();
    }
    if(mode==='opening')audio.setScene(clock-openingStarted>=BOOT_DURATION_MS?'opening':'silent');
    if (mode === 'opening' && clock - openingStarted >= OPENING_DURATION_MS) {
      mode = 'title'; titleImmediate = false; audio.setScene('title'); rebuild();
    }
    advanceMenuCamera();
    const schedulerWorked = advanceDungeonClock();
    if (disposed) return;
    if (startGate === 'running' && !document.hidden && document.hasFocus() && !busy && !paused && helpPanel.hidden && !schedulerWorked && !dungeonTurnLocked()) input.update(now, isDungeonInput());
    if (speech) {
      const count = Array.from(speech.text).length;
      speech.visibleChars = revealed || textSpeed === 0 ? count : Math.floor((clock - speechStarted) / textSpeed);
      if (speech.visibleChars >= count) revealed = true;
      view.dialogue = speech;
    }
    view.choices = revealed || !speech ? labels : [];
    view.selectedIndex = selectedIndex; view.topScreen = topScreen; view.mapVisible = mapVisible;
    if (mode === 'play' && state?.phase === 'dungeon') view.notice = liveMessages.length ? liveMessages.join('\n') : undefined;
    view.showGrid = isDungeonInput() && input.isFacing();
    view.gridLines = gridVisible;
    view.showToolbar = isDungeonInput() && clock >= eventUntil;
    view.fade = busy ? .5 : 0;
    if (!document.hidden && (startGate === 'running' && !paused && !busy && helpPanel.hidden || lastRenderedRevision !== presentationRevision)) {
      try { renderer.render(view, clock); syncChoices(); lastRenderedRevision = presentationRevision; }
      catch (error) { fail(error); return; }
    }
    frameId = window.requestAnimationFrame(frame);
  }

  const embedded = window.parent !== window;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  function syncHostControls() {
    if (!embedded || disposed) return;
    const visibility = document.documentElement.dataset.arcadeControlsVisible;
    game.dataset.externalControls = visibility === 'true' || visibility === 'false' ? visibility : String(coarsePointer);
  }
  game.dataset.embedded = String(embedded);
  game.dataset.externalControls = String(embedded && coarsePointer);
  syncHostControls(); window.addEventListener('arcade-controls-visibility', syncHostControls);
  controlsToggle.hidden = embedded;
  touchControls.hidden = embedded || !coarsePointer;
  controlsToggle.setAttribute('aria-pressed', String(!touchControls.hidden));
  controlsToggle.setAttribute('aria-expanded', String(!touchControls.hidden));
  startup.hidden = true; game.hidden = false; application.setAttribute('aria-busy', 'false');
  openingStarted = clock; audio.setScene('silent'); updateSoundButton(); rebuild();
  // The host may deliberately own a pending overlay activation during loading.
  // Only refine focus already inside this document; never steal it from there.
  if (document.hasFocus()) screens.focus();
  frameId = window.requestAnimationFrame(frame);
}

void main().catch(showFailure);
