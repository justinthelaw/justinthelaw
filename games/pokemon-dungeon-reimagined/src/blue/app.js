import { createRenderer, OPENING_DURATION_MS } from './renderer.js';
import { paginateDialogue } from './render-font.js';
import { createOpeningAudio } from './audio.js';
import { createInput } from './input.js';
import { createDungeonMenus } from './menus.js';
import { loadOnboarding, createQuiz, currentQuestion, nextQuestion, answerQuestion,
  finishQuiz, eligiblePartners, speciesName, normalizeName, sanitizeName } from './onboarding.js';
import { loadOpeningData, createDungeon, performAction, retryDungeon, validateDungeon } from './mechanics.js';
import { createSaveRepository, validateOpeningSave } from './save.js';
import { STORY, FLOOR_TUTORIALS, interpolateStory } from './story.js';

/** @typedef {import('./save.js').OpeningSave} OpeningSave */
/** @typedef {import('./save.js').Phase} Phase */
/** @typedef {import('./renderer.js').View} View */
/** @typedef {import('./renderer.js').Dialogue} Dialogue */
/** @typedef {import('./menus.js').Menu} Menu */
/** @typedef {import('./input.js').InputAction} InputAction */
/** @typedef {import('./mechanics-types.js').DungeonAction} DungeonAction */
/** @typedef {import('./audio-types.js').AudioScene} AudioScene */

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
const narration = element('narration');
const nameEntry = element('name-entry');
const nameInput = /** @type {HTMLInputElement} */ (element('name-input'));
const warning = element('save-warning');
const soundButton = element('sound-toggle');
const touchControls = element('touch-controls');
const controlsToggle = element('controls-toggle');
const helpPanel = element('help');
const helpToggle = element('help-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  /** @type {string|null} */ let notice = null;
  /** @type {string[]} */ let tutorials = [];
  let selectedIndex = 0, dialoguePage = 0, speechStarted = 0, clock = 0, lastFrame = 0;
  let openingStarted = 0, textSpeed = 28, revealed = false, uiSignature = '!unrendered', lastNarration = '';
  let busy = false, paused = false, disposed = false, transition = 0, frameId = 0;
  let saveTimer = 0, hasStored = stored.hasStored, saveFailed = false;
  let eventUntil = 0, lowercase = false, presentationRevision = 0, lastRenderedRevision = -1, titleImmediate = false;
  /** @type {HTMLElement|null} */ let helpReturnFocus = null;
  /** @type {'map'|'team'|'log'} */ let topScreen = 'team';
  let mapVisible = false;
  const currentDungeon = () => state?.dungeon ?? null;

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

  /** @param {Menu|null} next */
  function showMenu(next) {
    menu = next; selectedIndex = 0; dialoguePage = 0; notice = null;
    input.clear(); audio.effect(next ? 'open' : 'cancel'); rebuild();
  }

  const dungeonMenus = createDungeonMenus({
    state: currentDungeon, data, show: showMenu, act: act, commit: commitNow,
    title: returnToMenu, help: showHelp, settings: settingsMenu,
  });

  /** @param {Event} event */
  function activate(event) {
    if (disposed) return;
    if (!document.hidden && document.hasFocus()) paused = false;
    void audio.activate(event).then(() => { if (!disposed) updateSoundButton(); });
    updateSoundButton();
  }

  const input = createInput(document, {
    activate,
    action: handleInput,
    move(dx, dy, faceOnly, run) {
      if (!isDungeonInput() || clock < eventUntil) return;
      const dungeon = currentDungeon(); if (!dungeon) return;
      // Running stops before a visible foe; combat remains a deliberate action.
      if (run && dungeon.enemies.some(enemy => enemy.hp > 0 &&
          Math.max(Math.abs(enemy.x - dungeon.hero.x), Math.abs(enemy.y - dungeon.hero.y)) <= 2)) return;
      act({ type: faceOnly ? 'face' : 'move', dx, dy });
    },
    interrupt() {
      paused = true; audio.pause(); commitNow();
      for (const button of touchControls.querySelectorAll('.held')) button.classList.remove('held');
    },
  });

  /** @param {unknown} error */
  function fail(error) {
    if (disposed) return;
    commitNow(); disposed = true; transition += 1;
    input.dispose(); audio.dispose(); renderer.dispose(); window.cancelAnimationFrame(frameId);
    showFailure(error);
  }

  function isDungeonInput() {
    return mode === 'play' && state?.phase === 'dungeon' && !menu && !notice && !tutorials.length && !busy && !paused && helpPanel.hidden === true;
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

  /** @param {Phase} phase @param {number} [line] */
  async function setPhase(phase, line = 0) {
    if (!state || disposed) return;
    state.phase = phase; state.line = line; dialoguePage = 0; selectedIndex = 0;
    menu = null; notice = null; tutorials = []; input.clear();
    const token = ++transition; busy = true;
    audio.setScene(musicFor(phase)); rebuild(); commitNow();
    const ids = phase === 'partner' ? [state.heroSpeciesId, ...eligiblePartners(onboarding, state.heroSpeciesId)] :
      phase === 'dungeon' ? [state.heroSpeciesId, state.partnerSpeciesId, 'pokemon-016', 'pokemon-102', 'pokemon-191', 'pokemon-265'] :
        ['awakening', 'named', 'trouble', 'help-choice', 'enter', 'clearing', 'reunion', 'complete', 'hero-name', 'hero-name-confirm'].includes(phase)
          ? [state.heroSpeciesId, state.partnerSpeciesId, 'pokemon-010', 'pokemon-012'] : [state.heroSpeciesId, state.partnerSpeciesId];
    try {
      await renderer.loadSpecies(ids);
      if (disposed || token !== transition) return;
      busy = false; speechStarted = clock; rebuild();
      if (phase === 'dungeon') settleDungeon();
    } catch (error) { if (!disposed && token === transition) fail(error); }
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
    commitNow(); mode = 'menu'; menu = null; notice = null; tutorials = [];
    selectedIndex = 0; dialoguePage = 0; input.clear(); audio.setScene('menu'); rebuild();
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
        textSpeed = textSpeed === 28 ? 14 : textSpeed === 14 ? 0 : 28; settingsMenu();
      } },
      { label: `Upper screen: ${topScreen}`, run() {
        topScreen = topScreen === 'team' ? 'map' : topScreen === 'map' ? 'log' : 'team'; settingsMenu();
      } },
      { label: `Sound: ${audio.status().muted ? 'Off' : 'On'}`, run() {
        audio.setMuted(!audio.status().muted); updateSoundButton(); settingsMenu();
      } },
      { label: 'Back', run: () => mode === 'play' && state?.phase === 'dungeon' ? dungeonMenus.others() : showMenu(null) },
    ] });
  }

  function showHelp() {
    helpReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    input.clear(); helpPanel.hidden = false; helpToggle.setAttribute('aria-expanded', 'true');
    screens.inert = true; touchControls.inert = true;
    element('help-close').focus();
  }
  function hideHelp() {
    helpPanel.hidden = true; helpToggle.setAttribute('aria-expanded', 'false');
    screens.inert = false; touchControls.inert = false;
    (helpReturnFocus?.isConnected ? helpReturnFocus : screens).focus(); input.clear();
  }

  /** Rebuild semantic UI only after an action or phase transition, never per frame. */
  function rebuild() {
    /** @type {View} */ const next = {
      scene: mode === 'play' ? 'quiz' : mode, reducedMotion, titleImmediate,
      heroSpeciesId: state?.heroSpeciesId, partnerSpeciesId: state?.partnerSpeciesId,
      heroName: state?.heroName, partnerName: state?.partnerName,
      dungeon: state?.dungeon, selectedIndex, topScreen, mapVisible,
      events: view.events, eventStartedAt: view.eventStartedAt,
    };
    labels = []; speech = null; speechPages = [];
    let text = '', speaker = '', portraitSpeciesId = '';
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
        next.scene = 'partner'; text = 'Choose the Pokémon you would like as your partner.';
        next.partnerChoices = eligiblePartners(onboarding, state.heroSpeciesId);
        labels = next.partnerChoices.map(speciesName); next.choiceColumns = 2;
      } else if (phase === 'partner-confirm') {
        next.scene = 'partner'; text = `Would you like ${speciesName(state.partnerSpeciesId)} as your partner?`; labels = ['Yes', 'No'];
      } else if (phase === 'partner-name' || phase === 'hero-name') {
        next.scene = 'name'; next.nameTarget = phase === 'hero-name' ? 'hero' : 'partner';
        next.nameValue = state.nameDraft; next.choiceColumns = 10;
        labels = [...Array.from(lowercase ? 'abcdefghijklmnopqrstuvwxyz' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '.', '-', '!', '?', lowercase ? 'ABC' : 'abc', 'SPACE', 'BACK', 'END'];
      } else if (phase === 'partner-name-confirm' || phase === 'hero-name-confirm') {
        next.scene = phase === 'hero-name-confirm' ? 'awakening' : 'partner';
        text = `Is ${state.nameDraft} the name you want?`; labels = ['Yes', 'No'];
      } else if (phase === 'help-choice') {
        next.scene = 'trouble'; text = 'Will you help rescue Caterpie?'; speaker = state.partnerName;
        portraitSpeciesId = state.partnerSpeciesId; labels = ['Yes', 'No'];
      } else if (phase === 'dungeon') {
        next.scene = 'dungeon'; next.notice = state.dungeon?.log.at(-1);
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
          if (line.speaker !== 'narrator') {
            speaker = line.speaker === 'hero' ? state.heroName : line.speaker === 'partner' ? state.partnerName : line.speaker === 'butterfree' ? 'Butterfree' : 'Caterpie';
            portraitSpeciesId = line.speaker === 'hero' ? state.heroSpeciesId : line.speaker === 'partner' ? state.partnerSpeciesId : line.speaker === 'butterfree' ? 'pokemon-012' : 'pokemon-010';
          }
          if (line.scene === 'dream') { next.blackout = true; speaker = ''; portraitSpeciesId = ''; }
        }
      }
    }
    if (menu) { labels = menu.choices.map(choice => choice.label); next.menuTitle = menu.title; text = menu.detail ?? ''; speaker = ''; portraitSpeciesId = ''; }
    if (tutorials.length) { text = tutorials[0] ?? ''; labels = []; speaker = ''; portraitSpeciesId = ''; }
    if (notice) { text = notice; labels = []; speaker = ''; portraitSpeciesId = ''; }
    if (text) {
      speechPages = paginateDialogue(text, speaker);
      dialoguePage = Math.min(dialoguePage, speechPages.length - 1);
      speech = { text: speechPages[dialoguePage] ?? '', speaker, portraitSpeciesId: portraitSpeciesId || undefined, visibleChars: 0 };
      next.dialogue = speech;
      if (dialoguePage < speechPages.length - 1) labels = [];
    }
    selectedIndex = Math.min(selectedIndex, Math.max(0, labels.length - 1));
    next.selectedIndex = selectedIndex; next.choices = labels;
    revealed = Boolean(menu) || !speech || textSpeed === 0; speechStarted = clock;
    view = next; presentationRevision += 1; uiSignature = '!unrendered';
    game.dataset.scene = mode === 'play' ? state?.phase ?? 'opening' : mode;
    const naming = mode === 'play' && (state?.phase === 'hero-name' || state?.phase === 'partner-name');
    nameEntry.hidden = !naming;
    if (naming && state) { nameInput.value = state.nameDraft; element('name-label').textContent = state.phase === 'hero-name' ? 'Your name' : "Your partner's name"; }
    const announcement = [speaker, text].filter(Boolean).join(': ');
    if (announcement !== lastNarration) { narration.textContent = announcement; lastNarration = announcement; }
  }

  function syncChoices() {
    const bounds = renderer.getChoiceBounds();
    const signature = bounds.map(bound => `${bound.index}:${labels[bound.index]}:${bound.x}:${bound.y}:${bound.width}`).join('|');
    if (signature !== uiSignature) {
      uiSignature = signature; choiceButtons.replaceChildren();
      const currentRevision = presentationRevision;
      for (const bound of bounds) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'game-choice';
        button.textContent = labels[bound.index] ?? ''; button.setAttribute('aria-label', labels[bound.index] ?? 'Choose');
        button.style.left = `${bound.x / 256 * 100}%`; button.style.top = `${bound.y / 192 * 100}%`;
        button.style.width = `${bound.width / 256 * 100}%`; button.style.height = `${bound.height / 192 * 100}%`;
        button.addEventListener('click', event => {
          event.stopPropagation();
          if (currentRevision !== presentationRevision) return;
          activate(event); selectedIndex = bound.index; choose();
        });
        button.addEventListener('focus', () => {
          if (currentRevision !== presentationRevision) return;
          selectedIndex = bound.index; view.selectedIndex = selectedIndex;
        });
        choiceButtons.append(button);
      }
    }
    const hideAdvance = !speech || Boolean(view.choices?.length) || busy;
    if (advanceButton.hidden !== hideAdvance) advanceButton.hidden = hideAdvance;
  }

  /** @param {InputAction} action */
  function handleInput(action) {
    if (disposed || busy || document.hidden || paused) return;
    if (!helpPanel.hidden) { if (action === 'cancel' || action === 'menu') hideHelp(); return; }
    if (mode === 'opening') { if (action === 'confirm' || action === 'menu' || action === 'cancel') { mode = 'title'; titleImmediate = true; audio.setScene('title'); rebuild(); input.clear(); } return; }
    if (mode === 'title') { if (action === 'confirm' || action === 'menu') { mode = 'menu'; audio.setScene('menu'); rebuild(); input.clear(); } return; }
    if (['north', 'south', 'west', 'east'].includes(action) && labels.length) {
      if (speech && !revealed) return;
      const columns = view.choiceColumns ?? (view.scene === 'partner' && state?.phase === 'partner' ? 2 : 1);
      const delta = action === 'north' ? -columns : action === 'south' ? columns : action === 'west' ? -1 : 1;
      selectedIndex = (selectedIndex + delta + labels.length) % labels.length;
      screens.focus(); view.selectedIndex = selectedIndex; audio.effect('cursor'); return;
    }
    if (action === 'map' && state?.phase === 'dungeon' && !menu) {
      mapVisible = !mapVisible; topScreen = mapVisible ? 'map' : 'team'; rebuild(); return;
    }
    if (action === 'menu' && (state?.phase === 'partner-name' || state?.phase === 'hero-name')) {
      selectedIndex = labels.indexOf('END'); choose(); return;
    }
    if ((action === 'cancel' || action === 'menu') && mode === 'menu') {
      if (menu) showMenu(null); else { mode = 'title'; audio.setScene('title'); rebuild(); }
      return;
    }
    if ((action === 'cancel' || action === 'menu') && state?.phase === 'dungeon') {
      if (menu) { if (menu.cancel) menu.cancel(); else showMenu(null); return; }
      if (speech || notice || tutorials.length) { handleInput('confirm'); return; }
      dungeonMenus.main();
      return;
    }
    if (action === 'cancel' && (state?.phase === 'partner-name' || state?.phase === 'hero-name')) {
      state.nameDraft = Array.from(state.nameDraft).slice(0, -1).join(''); rebuild(); return;
    }
    if (action === 'confirm') { choose(); return; }
    if (isDungeonInput() && clock >= eventUntil) {
      if (action === 'wait') act({ type: 'wait' });
      else if (action === 'setMove') {
        const slot = state?.dungeon?.hero.moves.findIndex(move => move.set) ?? -1;
        if (slot >= 0) act({ type: 'moveSlot', slot }); else { notice = 'Set a move from the Moves menu first.'; rebuild(); }
      }
    }
  }

  function choose() {
    if (busy || paused || disposed || !helpPanel.hidden) return;
    if (speech && !revealed) { revealed = true; audio.effect('confirm'); return; }
    if (speech && dialoguePage < speechPages.length - 1) { dialoguePage += 1; rebuild(); audio.effect('confirm'); return; }
    if (notice) { notice = null; dialoguePage = 0; rebuild(); return; }
    if (tutorials.length) { tutorials.shift(); dialoguePage = 0; rebuild(); return; }
    audio.effect('confirm');
    if (menu) { const choice = menu.choices[selectedIndex]; choice?.run(); return; }
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
      else { state.nameDraft = state.partnerName; lowercase = false; void setPhase('partner-name'); }
    } else if (phase === 'partner-name' || phase === 'hero-name') {
      const value = labels[selectedIndex];
      if (document.activeElement === nameInput || value === 'END') {
        state.nameDraft = normalizeName(nameInput === document.activeElement ? nameInput.value : state.nameDraft,
          phase === 'hero-name' ? state.heroName : state.partnerName);
        screens.focus(); void setPhase(phase === 'hero-name' ? 'hero-name-confirm' : 'partner-name-confirm');
      } else if (value === 'BACK') { state.nameDraft = Array.from(state.nameDraft).slice(0, -1).join(''); rebuild(); }
      else if (value === 'abc' || value === 'ABC') { lowercase = !lowercase; rebuild(); }
      else if (value && Array.from(state.nameDraft).length < 10) { state.nameDraft += value === 'SPACE' ? ' ' : value; rebuild(); }
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
      else if (state.dungeon) { retryDungeon(state.dungeon, data); void setPhase('dungeon'); }
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
    else if (phase === 'awakening') { state.nameDraft = state.heroName; lowercase = false; void setPhase('hero-name'); }
    else if (phase === 'named') void setPhase('trouble');
    else if (phase === 'trouble') void setPhase('help-choice');
    else if (phase === 'enter') {
      try {
        state.dungeon = createDungeon({ heroSpeciesId: state.heroSpeciesId, partnerSpeciesId: state.partnerSpeciesId,
          heroName: state.heroName, partnerName: state.partnerName }, data);
        void setPhase('dungeon');
      } catch (error) { fail(error); }
    } else if (phase === 'clearing') { audio.effect('rescue'); void setPhase('reunion'); }
    else if (phase === 'reunion') { state.rewarded = true; void setPhase('complete'); }
  }

  /** @param {DungeonAction} action */
  function act(action) {
    const dungeon = currentDungeon(); if (!dungeon || busy || disposed) return;
    try {
      const result = performAction(dungeon, action, data);
      view.events = result.events; view.eventStartedAt = clock;
      eventUntil = clock + (result.consumedTurn && !reducedMotion ? 145 : 0);
      for (const event of result.events.slice(0, 20)) {
        if (event.type === 'attack') audio.effect('attack');
        else if (event.type === 'damage') audio.effect('hit');
        else if (event.type === 'heal') audio.effect('heal');
        else if (event.type === 'level') audio.effect('levelUp');
        else if (event.type === 'defeat') audio.effect('faint');
        else if (event.type === 'floor') audio.effect('stairs');
        else if (event.type === 'item') audio.effect(event.text === 'poke' ? 'money' : 'pickup');
      }
      rebuild(); commitSoon(); settleDungeon();
    } catch (error) { fail(error); }
  }

  function settleDungeon() {
    const dungeon = currentDungeon(); if (!dungeon || !state) return;
    if (dungeon.status === 'rescued') { void setPhase('clearing'); return; }
    if (dungeon.status === 'defeated') { void setPhase('defeated'); return; }
    if (dungeon.pendingLearning.length) { dungeonMenus.learning(); return; }
    if (dungeon.status === 'stairs') { dungeonMenus.stairs(); return; }
    if (!state.tutorialSeen.includes(dungeon.floor)) {
      state.tutorialSeen.push(dungeon.floor); tutorials = [...(FLOOR_TUTORIALS[dungeon.floor] ?? [])];
      input.clear(); dialoguePage = 0; rebuild(); commitNow();
    }
  }

  function updateSoundButton() {
    const status = audio.status();
    soundButton.textContent = status.muted ? 'Sound off' : status.state === 'ready' ? 'Sound on' : 'Enable sound';
    soundButton.setAttribute('aria-pressed', String(!status.muted && status.state === 'ready'));
    soundButton.title = status.muted || status.state !== 'ready' ? 'Enable game sound' : 'Mute game sound';
  }

  controlsToggle.addEventListener('click', event => {
    activate(event); touchControls.hidden = !touchControls.hidden;
    controlsToggle.setAttribute('aria-pressed', String(!touchControls.hidden));
    controlsToggle.setAttribute('aria-expanded', String(!touchControls.hidden));
    input.clear(); screens.focus();
  });
  helpToggle.addEventListener('click', event => { activate(event); if (helpPanel.hidden) showHelp(); else hideHelp(); });
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
    audio.setMuted(status.state === 'ready' && !status.muted);
    activate(event); updateSoundButton(); screens.focus();
  });
  advanceButton.addEventListener('click', event => { activate(event); choose(); screens.focus(); });
  bottomCanvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    activate(event);
    if (!nameEntry.hidden) {
      const bounds = bottomCanvas.getBoundingClientRect();
      const y = (event.clientY - bounds.top) / bounds.height * 192;
      if (y >= 10 && y <= 57) { nameInput.focus(); nameInput.select(); return; }
    }
    screens.focus(); handleInput('confirm');
  });
  bottomCanvas.addEventListener('pointerup', activate);
  nameInput.addEventListener('input', () => {
    if (!state || !['hero-name', 'partner-name'].includes(state.phase)) return;
    state.nameDraft = sanitizeName(nameInput.value);
    if (nameInput.value !== state.nameDraft) nameInput.value = state.nameDraft;
    view.nameValue = state.nameDraft; commitSoon();
  });
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
      if (event.detail === 0) { activate(event); input.pointer(key, true, event); input.pointer(key, false, event); }
    });
  }
  window.addEventListener('pagehide', () => {
    commitNow(); disposed = true; transition += 1; input.dispose(); audio.dispose(); renderer.dispose();
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('arcade-controls-visibility', syncHostControls);
  }, { once: true });

  /** @param {number} now */
  function frame(now) {
    if (disposed) return;
    const elapsed = lastFrame ? Math.min(50, Math.max(0, now - lastFrame)) : 0;
    lastFrame = now;
    if (!document.hidden && !paused && helpPanel.hidden) clock += elapsed;
    if (mode === 'opening' && clock - openingStarted >= OPENING_DURATION_MS) {
      mode = 'title'; titleImmediate = false; audio.setScene('title'); rebuild();
    }
    input.update(now, isDungeonInput());
    if (speech) {
      const count = Array.from(speech.text).length;
      speech.visibleChars = revealed || textSpeed === 0 ? count : Math.floor((clock - speechStarted) / textSpeed);
      if (speech.visibleChars >= count) revealed = true;
      view.dialogue = speech;
    }
    view.choices = revealed || !speech ? labels : [];
    view.selectedIndex = selectedIndex; view.topScreen = topScreen; view.mapVisible = mapVisible;
    view.fade = busy ? .5 : 0;
    if (!document.hidden && (!paused && helpPanel.hidden || lastRenderedRevision !== presentationRevision)) {
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
  openingStarted = clock; audio.setScene('opening'); updateSoundButton(); rebuild(); screens.focus();
  frameId = window.requestAnimationFrame(frame);
}

void main().catch(showFailure);
