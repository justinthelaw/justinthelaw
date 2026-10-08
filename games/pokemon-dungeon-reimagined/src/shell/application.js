import { createApplicationAudio } from '../application/audio.js';
import { createAudioControls } from '../application/audio-controls.js';
import { initialOptions } from '../application/quiz.js';
import { exactAudioPreferences, audioPreferenceBlocked } from '../domain/gameplay/audio-preferences.js';
import { showMoveLearning } from '../application/move-learning.js';
import { showFriends } from '../application/friends.js';
import { nearbyResident, nearWigglytuff } from '../domain/gameplay/friend-residents.js';
import { supportedHeldItem } from '../domain/gameplay/held-items.js';
import { STEEL } from '../../content/authored/mt-steel.js';
import { showSteelReward, steelGroundBoundary } from '../application/steel.js';
import { WORK } from '../../content/authored/early-work.js';
import { showWork } from '../application/work.js';
import { facingJobClient } from '../domain/gameplay/escort-work.js';
import { TOWN } from '../../content/authored/town.js';
import { showTown } from '../application/town.js';
import { THUNDERWAVE as T } from '../../content/authored/thunderwave.js';
import { USABLE_ITEMS } from '../domain/gameplay/items.js';
import { THROWABLE_ITEMS } from '../domain/gameplay/throws.js';
import { createEscortCompatibility as createOpeningCompatibility } from '../persistence/escort-compatibility.js';
import { createScenePresenter } from '../application/team-formation.js';
import { MORNING } from '../../content/authored/first-morning.js';
import { TEAM } from '../../content/authored/team-formation.js';
import { loadCatalogs } from '../application/catalogs.js';
import { createGameplay } from '../domain/gameplay/index.js';
import { commandContext } from '../domain/state/transaction.js';
import { leaderInputReady, automaticTurnReady } from '../domain/turns/readiness.js';
import { createInputController } from '../input/index.js';
import { DungeonRenderer, loadEnvironmentKit } from '../rendering/index.js';
import { renderSnapshot, eventMessages } from '../application/presentation.js';
import { createView } from '../ui/view.js';
import { createSaves } from '../application/saves.js';
import { startOnboarding } from '../application/onboarding.js';
/** @typedef {{status(message:string):void,unavailable(message:string):void}} StartupView */
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('../domain/turns/types.js').Intent} Intent */
/** @typedef {import('../ui/view.js').Action} Action */

/** Composition owns lifetimes and command admission; domain owns every game
 * mutation. Frames animate and admit one bounded intent, never tick rules.
 * @param {HTMLCanvasElement} canvas @param {AbortSignal} signal @param {StartupView} startup */
export async function createApplication(canvas, signal, startup) {
  const root = document.getElementById('game-ui');
  if (!root) throw new Error('Adventure UI is missing.');
  const listeners = new AbortController();
  const lifetime = new AbortController();
  const abort = () => lifetime.abort(signal.reason); signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  /** @type {ReturnType<typeof createInputController>|undefined} */ let input;
  /** @type {DungeonRenderer|undefined} */ let renderer;
  /** @type {ReturnType<typeof createSaves>|undefined} */ let saves;
  /** @type {Awaited<ReturnType<typeof loadCatalogs>>|undefined} */ let loaded;
  /** @type {import('../rendering/environment.js').EnvironmentKit|undefined} */ let kit;
  /** @type {ResizeObserver|undefined} */ let observer;
  const view = createView(root);
  const showScene = createScenePresenter(view);
  const audio = createApplicationAudio(canvas.ownerDocument);
  let optionsDraft = initialOptions();
  /** @type {'title'|'quiz'|null} */ let draftMode = 'title';
  let draftToken = Symbol('title-options'), draftSealed = false, soundExpanded = false;
  /** @type {Partial<Record<'panel'|'hud',()=>void>>} */ const soundRefresh = {};
  let booted = false;
  let disposed = false, busy = false, paused = false, failed = false, lost = false, ready = false;
  let focusPaused = false, automaticFrame = 0, automaticTicket = 0;
  let frame = 0, lastFrame = 0, permitAt = 0, generation = 0, epochCounter = 0;
  let epoch = 'title';
  let dialogue = false, groundExploring = false;
  let followsGame = false;
  /** @type {symbol|null} */ let bindingEpoch = null;
  /** @type {ReturnType<typeof renderSnapshot>|null} */ let projected = null;
  /** @type {Snapshot|null} */ let presented = null;
  /** @type {ReturnType<typeof createGameplay>|undefined} */ let gameplay;
  let idleAt = 0;
  let assetRetries = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  /** @type {MediaQueryList|undefined} */ let density;

  function current() { return saves?.service.getBinding().instance?.getSnapshot() ?? null; }
  /** No renderer/leader readiness condition: ordinary scenes own legal settings.
   * @param {()=>boolean} owns @param {Snapshot|null} snapshot @param {symbol|null} binding
   * @param {symbol|null} draft */
  function soundOwns(owns,snapshot,binding,draft) {
    return !disposed && owns() && (draft !== null ? draftMode !== null && draftToken === draft : draftMode === null && current() === snapshot && saves?.service.getBinding().adventureEpoch === binding);
  }
  function soundForeground() { return !disposed && !busy && !paused && !failed && !lost && !focusPaused && !document.hidden && document.hasFocus(); }
  /** Preference-only dispatch retains canonical scene/PCs, never calls act().
   * @param {import('../audio/types.js').AudioPreferences} next @param {()=>boolean} owns
   * @param {Snapshot|null} snapshot @param {symbol|null} binding @param {symbol|null} draft */
  function commitSound(next,owns,snapshot,binding,draft) {
    if (!exactAudioPreferences(next) || !soundOwns(owns,snapshot,binding,draft) || !soundForeground()) return false;
    if (draft !== null) { if (draftSealed) return false; optionsDraft = {...optionsDraft,audio:{...next}}; audio.draftPreferences(next); return true; }
    if (!snapshot || !saves || !saves.service.canAcceptCommands() || audioPreferenceBlocked(snapshot)) return false;
    const adventure = saves.service.getBinding().instance;
    if (!adventure || adventure.getSnapshot() !== snapshot) return false;
    const result = adventure.dispatch({...commandContext(snapshot),epoch:adventure.getEpoch(),intent:{type:'setAudioPreferences',audio:{...next}}});
    if (result.kind !== 'accepted') { view.notify('Saved sound settings are unavailable until the current step finishes.'); return false; }
    if (result.changed) saves.autosave();
    // Repainting is performed after trusted activation stays on its original stack.
    return true;
  }
  /** Scene repaint renews its actions; retained menus rebuild their actual
   * current submenu and controls against the newly committed snapshot.
   * @param {symbol|null} draft */
  function repaintSound(draft) {
    if (draft !== null) { view.refreshAudioControls(); return; }
    refresh();
    if (!followsGame) { const snapshot = current(); if (!snapshot || !view.rebuildPanel(snapshot)) view.refreshAudioControls(); }
  }
  view.setAudioUi(cue => audio.ui(cue));
  view.setAudioControls((owns,scope) => {
    const draft = draftMode !== null ? draftToken : null;
    const snapshot = draft !== null ? null : current();
    const binding = saves?.service.getBinding().adventureEpoch ?? null;
    const preferences = draft !== null ? optionsDraft.audio : snapshot?.options.audio ?? optionsDraft.audio;
    const ownsSound = () => soundOwns(owns,snapshot,binding,draft);
    const canPresent = () => ownsSound() && soundForeground();
    const blocked = !soundForeground() || draft === null && !saves?.service.canAcceptCommands() ? 'Sound settings are unavailable during this operation.' : draft !== null && draftSealed ? 'The new adventure preview already contains its sound settings.' : draft === null ? audioPreferenceBlocked(snapshot) : null;
    const controls = createAudioControls({preferences,owns:ownsSound,canPresent,blocked,expanded:soundExpanded,draft:draft !== null,
      toggle() { soundExpanded = !soundExpanded; }, pause:audio.pause,status:audio.status,
      change(next) { const accepted = commitSound(next,owns,snapshot,binding,draft); if (accepted) repaintSound(draft); return accepted; },
      activate(event) {
        if (!canPresent()) return;
        if (preferences.muted && !commitSound({...preferences,muted:false},owns,snapshot,binding,draft)) return;
        const committed = draft !== null ? null : current();
        if (draft !== null) audio.draftPreferences(optionsDraft.audio);
        else if (committed && loaded && gameplay && saves) {
          try { const projection = renderSnapshot(committed,gameplay,epoch,loaded.catalogs.species,[]); audio.bind(saves.service.getBinding()); audio.present(saves.service.getBinding(),committed,[],projection,loaded.catalogs); } catch { audio.pause(); }
        }
        // No await, promise/storage callback, synthetic click or RAF before unlock.
        const activated = audio.activate(event);
        if (draft !== null || committed !== snapshot) repaintSound(draft);
        const currentDraft = draftToken, currentBinding = saves?.service.getBinding().adventureEpoch;
        void activated.then(() => {
          if (disposed) return;
          const matches = draft !== null ? draftMode !== null && draftToken === currentDraft : current() === committed && saves?.service.getBinding().adventureEpoch === currentBinding;
          if (matches) { soundRefresh.panel?.(); soundRefresh.hud?.(); }
        });
      },
    });
    soundRefresh[scope] = () => { if (ownsSound()) controls.refreshStatus(); };
    return controls.element;
  });
  function cancelAutomatic() {
    automaticTicket++;
    if (automaticFrame) window.cancelAnimationFrame(automaticFrame);
    automaticFrame = 0;
  }
  function canAdvanceAutomatically() {
    return !disposed && !busy && !paused && !focusPaused && !failed && !lost && !document.hidden && ready && followsGame && !view.isOpen() && saves?.service.canAcceptCommands() === true && automaticTurnReady(current());
  }
  // One owner, one dispatch per browser frame. Every callback captures the
  // binding and exact validated snapshot, and obtains commandContext only after
  // all lifetime checks. Neither save callbacks nor render promises dispatch.
  function queueAutomatic() {
    if (automaticFrame || !canAdvanceAutomatically() || !saves) return;
    const bound = saves.service.getBinding(), adventure = bound.instance;
    if (!adventure) return;
    const snapshot = adventure.getSnapshot(), revision = snapshot.revision;
    const domainEpoch = adventure.getEpoch(), ticket = automaticTicket;
    automaticFrame = window.requestAnimationFrame(() => {
      if (ticket !== automaticTicket) return;
      automaticFrame = 0;
      const now = saves?.service.getBinding();
      if (ticket !== automaticTicket || !canAdvanceAutomatically() || now?.adventureEpoch !== bound.adventureEpoch || now.instance !== adventure || adventure.getEpoch() !== domainEpoch || adventure.getSnapshot() !== snapshot || snapshot.revision !== revision) return;
      const result = adventure.dispatch({ ...commandContext(snapshot), epoch: domainEpoch, intent: { type: 'advance' } });
      if (result.kind !== 'accepted' || !result.changed) { fail(new Error('The saved turn cannot resume. Export the checkpoint and reload.')); return; }
      saves?.autosave();
      if (leaderInputReady(adventure.getSnapshot())) permitAt = performance.now() + 240;
      // Present only this committed chunk. Asset readiness queues the next RAF;
      // the 280ms player clip-idle timer never delays automatic native work.
      refresh(result.events, snapshot);
    });
  }
  function mode() {
    if (disposed || busy || paused || focusPaused || document.hidden) return /** @type {const} */ ('blocked');
    if (failed || lost) return view.isOpen() ? /** @type {const} */ ('menu') : /** @type {const} */ ('blocked');
    const snapshot = current();
    if (snapshot?.pendingScene && dialogue) return /** @type {const} */ ('dialogue');
    if (view.isOpen()) return /** @type {const} */ ('menu');
    return snapshot?.mode === 'dungeon' || snapshot?.friends && snapshot.mode === 'town' && groundExploring ? /** @type {const} */ ('world') : /** @type {const} */ ('menu');
  }
  /** @param {boolean} [worldReady] */
  function context(worldReady = ready && !failed && !lost && (current()?.mode !== 'dungeon' || leaderInputReady(current()))) {
    input?.setContext({ mode: mode(), epoch, revision: current()?.revision ?? null, worldReady,
      cameraYaw: renderer?.cameraYaw ?? 0, controlDirection: 'camera' });
  }
  function close() { cancelAutomatic(); followsGame = true; dialogue = false; saves?.cancelPreviews(); view.close(); input?.cancel(); context(); }
  function title() {
    idleAt = 0; draftMode = 'title'; draftToken = Symbol('title-options'); draftSealed = false; audio.draft('title',optionsDraft.audio);
    close(); followsGame = false;
    view.hud('', [], []); view.minimap(null);
    view.show('Pokémon Dungeon Reimagined', "Opening checkpoint: personality quiz, Awakening, Tiny Woods, Caterpie's rescue, team formation, the first morning, the Thunderwave Cave rescue, town services, ordinary requests, and Dugtrio's Diglett request. The rest of the Blue campaign is in development. Original browser staging and candidate pixel art await human review.", [
      { label: 'New game', run: newGame }, { label: 'Continue / backup', run: () => { saves?.load(); context(); } }, { label: 'Saves & import', run: () => { saves?.menu(); context(); } },
      { label: 'Controls', run: help },
    ]); context();
  }
  function help() { panel('Move: arrows/WASD (camera relative). Hold left Shift to face without stepping. Z/A attacks or talks to a client directly ahead; Space waits; 1–4 use the exact move slots. Enter/Start opens menus, Escape/Menu opens expedition actions, X/B cancels. Right Shift/Select opens the explored map. Q/E and drag orbit the camera; R recenters. Menus use arrows and Z/Enter. The website owns the touch emulator overlay.', [], 'Controls',help); }
  function newGame() {
    if (!gameplay || !loaded || busy) return;
    close(); followsGame = false; idleAt = 0; draftMode = 'quiz'; draftToken = Symbol('quiz-options'); draftSealed = false; const quizToken = draftToken; audio.draft('quiz',optionsDraft.audio); context();
    startOnboarding({ catalogs: loaded.catalogs, gameplay, view, commit(snapshot, storageMode) { draftSealed = true; view.refreshAudioControls(); saves?.newCampaign(snapshot, storageMode); }, back: title, getOptions: () => structuredClone(optionsDraft), isCurrent: () => !disposed && !draftSealed && draftMode === 'quiz' && draftToken === quizToken }); context();
  }
  function menu() { if (busy) return; cancelAutomatic(); followsGame = false; dialogue = false; input?.cancel(); saves?.menu(); context(); }
  function resumedBinding() {
    cancelAutomatic(); input?.cancel();
    // Both a saved continuing PC and a fresh floor enter the same owned pump
    // after assets are ready. No synchronous advance or retained old callback.
    refresh();
  }
  function resume() { groundExploring = false; close(); const snapshot = current(); if (snapshot) { if (draftMode !== null) { draftMode = null; draftToken = Symbol('retired-options'); refresh(); } else screen(snapshot); } else title(); context(); }
  /** @param {string} text @param {Action[]} actions @param {string} [titleText] @param {()=>void} [rebuild] */
  function panel(text, actions, titleText = 'Adventure menu', rebuild = () => panel(text,actions,titleText)) { cancelAutomatic(); followsGame = false; dialogue = false; input?.cancel(); view.show(titleText, text, [...actions, { label: 'Back', run: resume }],[],rebuild); context(); }
  function rearmWorldPermit() {
    if (!ready || failed || lost || mode() !== 'world' || current()?.mode === 'dungeon' && !leaderInputReady(current())) return;
    permitAt = performance.now() + 240;
    // A consumed no-change intent admits the next held step after the cadence.
    // Keep actor readiness, binding, revision and the one-intent queue intact.
    context(false); context();
  }
  /** @param {Intent} intent @param {'world'|'panel'} [origin] */
  function act(intent, origin = 'world') {
    if (!saves || !saves.service.canAcceptCommands() || busy || paused || focusPaused || failed || lost || disposed || document.hidden) return;
    // Only deliberate choices inside the owning panel may close it and commit.
    // Background HUD/world activations cannot dismiss saves, previews or forms.
    if (origin === 'panel' ? !view.isOpen() : view.isOpen()) return;
    const adventure = saves.service.getBinding().instance; if (!adventure) return;
    const before = adventure.getSnapshot();
    if (['continuing','learning-continuing'].includes(before.session?.scheduler.kind ?? '')) return;
    if (['move', 'face', 'attack', 'wait', 'useMove', 'setMove', 'useItem', 'throwItem', 'equipItem', 'useStairs', 'giveUp'].includes(intent.type) && (!ready || before.mode === 'dungeon' && !leaderInputReady(before) || performance.now() < permitAt)) return;
    if (['ackScene', 'submitSceneName'].includes(intent.type) && !ready) return;
    if (intent.type === 'townTravel' || intent.type === 'friendAction') groundExploring = false;
    if (view.isOpen()) close();
    permitAt = performance.now() + 240;
    const result = adventure.dispatch({ ...commandContext(before), epoch: adventure.getEpoch(), intent });
    if (result.kind !== 'accepted') { view.notify(result.kind === 'content-blocked' ? `Unavailable content: ${result.requirement.replaceAll('-', ' ')}.` : `Action unavailable: ${result.reason}.`); screen(before); rearmWorldPermit(); return; }
    permitAt = performance.now() + 240;
    if (result.changed) {
      saves.autosave();
      // floorChanged and yielded work are presented once. The canonical fresh
      // floor/continuing scheduler selects the next automatic frame separately.
      refresh(result.events, before);
    } else { screen(before); rearmWorldPermit(); }
  }
  /** @param {number} position */
  function useMove(position) {
    const snapshot = current(); const leader = snapshot?.session?.actors[snapshot.session.leaderActorId]; const slot = leader?.moves.slots[position];
    if (!leader || !slot) { view.notify('That move slot is empty.'); rearmWorldPermit(); return; }
    act({ type: 'useMove', actorId: leader.actorId, moveSlotId: slot.moveSlotId });
  }
  function moves() {
    const snapshot = current(); if (!snapshot || !gameplay) return;
    const canAct = ready && leaderInputReady(snapshot);
    panel('Use a move, or SET one for Ginseng. Selecting SET again unsets it without taking a turn.', gameplay.getMoveChoices(snapshot).flatMap(move => [{ label: `${move.isSet ? 'SET · ' : ''}${move.name}${move.powerBoost ? ` +${move.powerBoost}` : ''} · ${move.currentPp} PP${move.requirement ? ' · unavailable' : ''}`, detail: move.requirement ?? 'Use this move', disabled: !canAct || !!move.requirement,
      run: () => act({ type: 'useMove', actorId: move.actorId, moveSlotId: move.moveSlotId }, 'panel') }, { label: `${move.isSet ? 'Unset' : 'Set'} ${move.name}`, detail: 'Choose the move Ginseng can strengthen', disabled: !canAct || !move.canSet, run: () => act({ type: 'setMove', actorId: move.actorId, moveSlotId: move.moveSlotId }, 'panel') }]), 'Moves',moves);
  }
  function inventory() {
    const snapshot = current(); const session = snapshot?.session; const leader = session?.actors[session.leaderActorId];
    if (!snapshot) return;
    const canAct = ready && leaderInputReady(snapshot);
    const ids = session ? [...(snapshot.containers[session.inventory]?.itemIds ?? []), ...(leader ? snapshot.containers[leader.heldContainerId]?.itemIds ?? [] : [])] : [...(snapshot.containers[snapshot.economy.toolbox]?.itemIds ?? []), ...snapshot.selectedPartyIds.flatMap(id => snapshot.containers[snapshot.roster[id]?.heldContainerId ?? '']?.itemIds ?? [])];
    panel(snapshot.progress.appliedGrants.some(row => row.grantId === MORNING.grants[2]) ? 'Use berries, seeds or food yourself, or Throw supported items in your facing direction. Keep a clean Reviver Seed for automatic revival; eating it only restores 5 Belly. Max Elixir restores all move PP. Blast Seed hits directly ahead; Gravelerock is thrown toward enemies in the direction you face. Pickups enter your toolbox.' : 'Before the starter toolbox, floor pickups use your held slot. Use a held berry here, or Throw supported items in your facing direction.', ids.flatMap(id => {
      const item = snapshot.items[id]; return [...(item?.template.itemId === 'item-gravelerock' ? [] : [{ label: item ? `${item.template.itemId === 'item-reviver-seed' ? 'Eat ' : ''}${item.template.itemId.replace('item-', '').replaceAll('-', ' ')} ×${item.quantity}` : 'Unavailable item', disabled: !canAct || !leader || !item || !USABLE_ITEMS.includes(item.template.itemId), detail: item && !USABLE_ITEMS.includes(item.template.itemId) ? 'This item use is still in development; carrying and storage work.' : 'Use this item yourself',
        run: () => { if (leader) act({ type: 'useItem', actorId: leader.actorId, itemInstanceId: id, target: { kind: 'self' } }, 'panel'); } }]), { label: item ? `Throw ${item.template.itemId.replace('item-', '').replaceAll('-', ' ')} ×${item.quantity}` : 'Throw unavailable item', disabled: !canAct || !leader || !item || !THROWABLE_ITEMS.includes(item.template.itemId), detail: item && !THROWABLE_ITEMS.includes(item.template.itemId) ? 'This thrown effect is still in development; carrying and storage work.' : 'Throw in the direction you face; takes a turn.', run: () => { if (leader) act({ type: 'throwItem', actorId: leader.actorId, itemInstanceId: id, target: { kind: 'facing' } }, 'panel'); } }, ...(leader && item && snapshot.progress.appliedGrants.some(row => row.grantId === MORNING.grants[2]) ? [{ label: `${snapshot.containers[leader.heldContainerId]?.itemIds.includes(id) ? 'Take' : 'Hold'} ${item.template.itemId.replace('item-', '').replaceAll('-', ' ')}`, disabled: !canAct || !snapshot.containers[leader.heldContainerId]?.itemIds.includes(id) && (!loaded || !supportedHeldItem(loaded.catalogs, item.template.itemId)), detail: 'Transfer this whole item slot; takes a turn. Unsupported held effects remain unavailable.', run: () => act({ type: 'equipItem', actorId: leader.actorId, itemInstanceId: id, target: { kind: 'self' } }, 'panel') }] : [])];
    }), 'Items & held slot',inventory);
  }
  function readNews() { panel('First rescue-team news: the badge marks your team, the toolbox carries dungeon supplies, and letters in your mailbox bring requests. Resting at home is a good time to keep a checkpoint. Check your mailbox before heading out to help.', [], 'Pokémon News',readNews); }
  /** @param {import('../contracts.js').SessionId} sessionId */
  function giveUp(sessionId) {
    const snapshot = current(); if (!snapshot?.session || snapshot.session.sessionId !== sessionId) return;
    panel('Giving up ends this expedition and applies the sourced defeat losses.', [{ label: 'Confirm give up', disabled: !ready || !leaderInputReady(snapshot), run: () => act({ type: 'giveUp', sessionId }, 'panel') }], 'Give up?',() => giveUp(sessionId));
  }
  function expedition() {
    const snapshot = current(), session = snapshot?.session; if (!snapshot || !session) return;
    panel('Use stairs when standing on them, or give up this expedition. Defeat settlement retains growth and applies carried-item/money loss.', [{ label: 'Campaign & saves', run: menu }, { label: 'Give up expedition', disabled: !ready || !leaderInputReady(snapshot), run: () => giveUp(session.sessionId) }], 'Adventure menu',expedition);
  }
  /** @param {Snapshot} snapshot */
  function screen(snapshot) {
    if (!gameplay || !followsGame) return;
    const session = snapshot.session;
    const leader = session?.actors[session.leaderActorId];
    const worldReady = ready && (snapshot.mode !== 'dungeon' || leaderInputReady(snapshot));
    const team = session ? gameplay.getActors(snapshot).filter(actor => actor.role === 'hero' || actor.role === 'partner').map(actor => `${actor.name} · HP ${actor.hp}/${actor.maxHp} · Lv ${session.actors[actor.actorId]?.growth.level ?? 1}${actor.role === 'hero' && leader ? ` · Belly ${Math.floor(leader.resources.belly.numerator / leader.resources.belly.denominator)}/${Math.floor(leader.resources.maxBelly.numerator / leader.resources.maxBelly.denominator)}` : ''}`) : snapshot.selectedPartyIds.map(id => `${snapshot.roster[id]?.nickname} · Lv ${snapshot.roster[id]?.growth.level}`);
    if (session) team.push(`Moves · ${gameplay.getMoveChoices(snapshot).map(move => `${move.name} ${move.currentPp} PP`).join(' · ')}`);
    const location = session?.floor.location;
    const floor = location?.kind === 'exploration' && loaded ? loaded.catalogs.dungeons.getFloorById(location.address.floorId).display : null;
    const goal = snapshot.friends && !session ? `Team ${snapshot.profile.teamName} · Friend Areas · Poké ${snapshot.economy.carriedMoney}` : session?.purpose.kind === 'ordinary' ? `${session.dungeonId === STEEL.dungeonId ? 'Mt. Steel' : session.dungeonId === T.dungeonId ? 'Thunderwave Cave' : 'Tiny Woods'} ${floor ? `${floor.prefix}${floor.number}${floor.suffix}` : ''} · ordinary rescue work · Poké ${session.carriedMoney}` : snapshot.progress.storyNodeId === TOWN.story ? `Team ${snapshot.profile.teamName} · town services · Poké ${snapshot.economy.carriedMoney}` : session ? `${session.dungeonId === STEEL.dungeonId ? 'Mt. Steel' : session.dungeonId === T.dungeonId ? 'Thunderwave Cave' : 'Tiny Woods'} ${floor ? `${floor.prefix}${floor.number}${floor.suffix}` : ''} · ${session.dungeonId === STEEL.dungeonId ? 'Rescue Diglett' : session.dungeonId === T.dungeonId ? 'Rescue Magnemite' : 'Rescue Caterpie'} · Poké ${session.carriedMoney}` : snapshot.progress.storyNodeId === T.complete ? 'Magnemite rescued · first request complete' : snapshot.progress.storyNodeId === T.story ? 'Magnemite rescue · recovered at home' : snapshot.progress.storyNodeId === MORNING.story ? `Team ${snapshot.profile.teamName} · first morning at the rescue base` : snapshot.town.mapDefinitionId === TEAM.map ? `Team ${snapshot.profile.teamName} · rescue base` : snapshot.progress.clears['tiny-woods'] ? 'Caterpie rescued · reunite and return home' : 'Butterfree needs help · prepare to enter Tiny Woods';
    const onStairs = leader?.placement.kind === 'map' && Object.values(session?.floor.exits ?? {}).some(exit => leader.placement.kind === 'map' && exit.position.x === leader.placement.position.x && exit.position.z === leader.placement.position.z);
    view.hud(`${goal}${(session?.scheduler.kind === 'continuing' || session?.scheduler.kind === 'learning-continuing') ? ' · Resolving turn; menus pause progress' : ''}`, team, [ { label: 'Menu', run: menu }, { label: 'Moves', run: moves, disabled: !session }, { label: 'Items', run: inventory, disabled: !!snapshot.pendingScene },
      { label: snapshot.friends && !session ? nearbyResident(snapshot) ? 'Talk to resident' : nearWigglytuff(snapshot) ? 'Wigglytuff' : 'Ground menu' : loaded && facingJobClient(snapshot, loaded.catalogs) ? 'Talk to client' : 'Attack', run: () => { if (snapshot.friends && !session) resume(); else act({ type: 'attack' }); }, disabled: snapshot.mode !== 'dungeon' && !(snapshot.friends && snapshot.mode === 'town') || !worldReady },
      { label: 'Wait', run: () => act({ type: 'wait' }), disabled: snapshot.mode !== 'dungeon' || !worldReady },
      { label: 'Use stairs', run: () => { if (session) act({ type: 'useStairs', sessionId: session.sessionId }); }, disabled: snapshot.mode !== 'dungeon' || !onStairs || !worldReady },
    ]);
    view.minimap(session ? projected : null);
    if (loaded && snapshot.pendingResult?.kind === 'move-learn-choice') {
      dialogue = false;
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      showMoveLearning({ snapshot,catalogs: loaded.catalogs,view,menu,open() { followsGame = false; input?.cancel(); context(); },send(intent) { if (current() !== snapshot || saves?.service.getBinding().adventureEpoch !== shownEpoch) { view.notify('This move choice is stale.'); return; } act(intent,'panel'); } });
    } else if (session?.scheduler.kind === 'learning-continuing') {
      dialogue = false; groundExploring = false; view.close(); input?.cancel();
    } else if (snapshot.steel?.rewardChoice) {
      dialogue = false;
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      showSteelReward({ snapshot, view, saves: menu, open() { followsGame = false; input?.cancel(); context(); }, send(intent,shown) { if (current() !== shown || saves?.service.getBinding().adventureEpoch !== shownEpoch) { view.notify('This reward choice is stale.'); return; } act(intent, 'panel'); } });
    } else if (snapshot.friends?.nicknamePrompt && loaded) {
      dialogue = false;
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      showFriends({ snapshot,catalogs: loaded.catalogs,view,menu,open() { followsGame = false; input?.cancel(); context(); },explore() {},send(intent,shown) { if (current() === shown && saves?.service.getBinding().adventureEpoch === shownEpoch) act(intent,'panel'); } });
    } else if (snapshot.pendingScene) {
      groundExploring = false;
      dialogue = true;
      // A readiness repaint can change the focused control without changing
      // revision/mode. Drop queued confirms before replacing that owner.
      input?.cancel();
      // Capture binding and snapshot with the displayed gate, never refresh an
      // obsolete callback's authority at activation time.
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      showScene({ snapshot, epoch, prompt: gameplay.getScenePrompt(snapshot), ready, saves: menu, news: readNews, memoryOnly: saves?.isMemoryOnly() ?? false,
        saveTutorial(complete) { saves?.saveTutorial(snapshot, complete); },
        send(intent) { if (current() !== snapshot || saves?.service.getBinding().adventureEpoch !== shownEpoch) { view.notify('This scene prompt is stale.'); return; } act(intent, 'panel'); } });
    } else if (loaded && snapshot.earlyWork && (snapshot.earlyWork.clientPrompt || snapshot.earlyWork.returned || snapshot.earlyWork.reward || snapshot.pendingResult)) {
      dialogue = false;
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      showWork({ snapshot, catalogs: loaded.catalogs, view, back: resume, menu,
        open() { followsGame = false; input?.cancel(); context(); },
        send(intent,shown) { if (current() !== shown || saves?.service.getBinding().adventureEpoch !== shownEpoch) { view.notify('This work selection is stale.'); return; } act(intent, 'panel'); },
      }, 'flow');
    } else if (loaded && snapshot.friends && !session) {
      dialogue = false;
      if (!groundExploring) {
        const shownEpoch = saves?.service.getBinding().adventureEpoch;
        showFriends({ snapshot,catalogs: loaded.catalogs,view,menu,open() { followsGame = false; input?.cancel(); context(); },explore(shown) { if (current() !== shown || saves?.service.getBinding().adventureEpoch !== shownEpoch) return; groundExploring = true; close(); screen(shown); context(); },send(intent,shown) { if (current() === shown && saves?.service.getBinding().adventureEpoch === shownEpoch) act(intent,'panel'); } });
      } else view.close();
    } else if (loaded && !session && (snapshot.progress.storyNodeId === WORK.story || snapshot.steel?.phase === 'ready') && [TOWN.square, TOWN.post].includes(snapshot.town.mapDefinitionId)) {
      dialogue = false;
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      showTown({ snapshot, catalogs: loaded.catalogs, view, menu, open() { followsGame = false; input?.cancel(); context(); }, send(intent,shown) { if (current() !== shown || saves?.service.getBinding().adventureEpoch !== shownEpoch) return; act(intent, 'panel'); } });
    } else if (steelGroundBoundary(snapshot)) {
      dialogue = false;
      const complete = snapshot.steel?.phase === 'complete', choice = gameplay.getDungeonChoices(snapshot).find(row => row.dungeonId === STEEL.dungeonId);
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      let token = Symbol('pending');
      token = view.show(complete ? 'Diglett is home' : 'Return to Mt. Steel', complete ? 'Diglett is safe. Your rewards and return home are saved with the campaign. Rest, then visit Wigglytuff to help your new friends find a home.' : 'Your team has recovered. Return to the mountain to finish the rescue.', [
        ...(complete ? [{ label: 'Begin next morning', disabled: !ready, run() { if (view.ownsPanel(token) && current() === snapshot && saves?.service.getBinding().adventureEpoch === shownEpoch) act({ type: 'friendAction', order: { kind: 'begin' } }, 'panel'); } }] : [{ label: 'Retry Mt. Steel', disabled: !ready || !!choice?.requirement, run() { if (view.ownsPanel(token) && current() === snapshot && saves?.service.getBinding().adventureEpoch === shownEpoch) act({ type: 'enterDungeon', dungeonId: /** @type {import('../contracts.js').DungeonId} */ (STEEL.dungeonId) }, 'panel'); } }]),
        ...(!complete ? [{ label: 'Prepare in town', run: () => act({ type: 'townTravel', mapId: TOWN.square }, 'panel') }] : []),
        { label: 'Campaign & saves', run: menu }, { label: 'View rewards', run: inventory },
      ]);
    } else if (loaded && snapshot.earlyWork && snapshot.progress.storyNodeId === WORK.story) {
      dialogue = false;
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      showWork({ snapshot, catalogs: loaded.catalogs, view, back: resume, menu,
        open() { followsGame = false; input?.cancel(); context(); },
        send(intent,shown) { if (current() !== shown || saves?.service.getBinding().adventureEpoch !== shownEpoch) { view.notify('This work selection is stale.'); return; } act(intent, 'panel'); },
      }, 'flow');
    } else if (!session && snapshot.progress.storyNodeId === TOWN.story && loaded) {
      dialogue = false;
      const shownEpoch = saves?.service.getBinding().adventureEpoch;
      showTown({ snapshot, catalogs: loaded.catalogs, view, menu,
        open() { followsGame = false; input?.cancel(); context(); },
        send(intent,shown) { if (current() !== shown || saves?.service.getBinding().adventureEpoch !== shownEpoch) { view.notify('This town selection is stale.'); return; } act(intent, 'panel'); },
      });
    } else if (!session && [T.story, T.complete].includes(snapshot.progress.storyNodeId)) {
      dialogue = false;
      const complete = snapshot.progress.storyNodeId === T.complete;
      const choice = gameplay.getDungeonChoices(snapshot).find(row => row.dungeonId === T.dungeonId);
      const shownBinding = saves?.service.getBinding().adventureEpoch;
      let requestPanel = Symbol('pending');
      requestPanel = view.show(complete ? 'First request complete' : 'Back at the base', complete ? 'The Magnemite are safe, your reward is settled, and your partner has gone home. Keep a checkpoint here. Rest, then begin the next morning and visit Pokémon Square.' : 'The rescue is unfinished. Your team has recovered at home. Growth is retained; carried money and items follow the defeat rules. You can try Thunderwave Cave again.', [
        ...(complete ? [{ label: 'Begin next morning', disabled: !ready, run: () => { if (view.ownsPanel(requestPanel) && current() === snapshot && saves?.service.getBinding().adventureEpoch === shownBinding) act({ type: 'beginTown' }, 'panel'); } }] : [{ label: 'Retry Thunderwave Cave', disabled: !ready || !choice || !!choice.requirement, detail: choice?.requirement ?? 'Return to the rescue', run: () => act({ type: 'enterDungeon', dungeonId: /** @type {import('../contracts.js').DungeonId} */ (T.dungeonId) }, 'panel') }]),
        { label: 'Campaign & saves', run: menu }, { label: 'View rewards', run: inventory },
      ]);
    } else if (!session && snapshot.town.mapDefinitionId === TEAM.map) {
      dialogue = false;
      const accepted = snapshot.progress.storyNodeId === MORNING.story;
      let basePanel = Symbol('unpresented');
      const shownBinding = saves?.service.getBinding().adventureEpoch;
      basePanel = view.show(`Team ${snapshot.profile.teamName}`, accepted ? 'Magnemite\'s request is accepted. Your badge, toolbox and first news are ready at the base. It is time to help the two Magnemite in Thunderwave Cave.' : 'Your team is founded. Rest tonight, then begin the first morning at your rescue base.', [
        { label: accepted ? 'Enter Thunderwave Cave' : 'Begin first morning', disabled: !ready || accepted && !!gameplay.getDungeonChoices(snapshot).find(row => row.dungeonId === T.dungeonId)?.requirement, detail: accepted ? 'Begin the Magnemite rescue' : 'Rest and wake at home', run: () => { if (view.ownsPanel(basePanel) && current() === snapshot && saves?.service.getBinding().adventureEpoch === shownBinding) act(accepted ? { type: 'enterDungeon', dungeonId: /** @type {import('../contracts.js').DungeonId} */ (T.dungeonId) } : { type: 'beginMorning' }, 'panel'); } },
        ...(accepted ? [{ label: 'Read Pokémon News', run: readNews }] : []),
        { label: 'Campaign & saves', run: menu }, { label: 'View rewards', run: inventory },
      ]);
    } else if (!session) {
      const choice = gameplay.getDungeonChoices(snapshot)[0];
      dialogue = false;
      view.show(snapshot.progress.statistics.expeditions ? 'A chance to retry' : "Butterfree's request", 'Guide your partner through Tiny Woods. Find the stairs on each floor. Defeat retains growth and follows the sourced item and money loss rules.', [
        { label: snapshot.progress.statistics.expeditions ? 'Retry Tiny Woods' : 'Enter Tiny Woods', disabled: !choice || !!choice.requirement, detail: choice?.requirement ?? 'Begin rescue', run: () => act({ type: 'enterDungeon', dungeonId: /** @type {import('../contracts.js').DungeonId} */ ('tiny-woods') }, 'panel') },
        { label: 'Campaign & saves', run: menu }, { label: 'View rewards', run: inventory },
      ]);
    } else if (!view.isOpen()) view.close();
  }
  /** @param {readonly import('../domain/turns/types.js').Event[]} [events] @param {Snapshot|null} [before] */
  function refresh(events = [], before = null) {
    cancelAutomatic();
    if (draftMode === null) audio.bind(saves?.service.getBinding() ?? null);
    const snapshot = current();
    if (!snapshot || !gameplay || !loaded || !renderer || !saves) { title(); return; }
    const bound = saves.service.getBinding();
    if (bindingEpoch !== bound.adventureEpoch) { groundExploring = false; bindingEpoch = bound.adventureEpoch; epoch = `campaign-${++epochCounter}`; input?.cancel(); view.clearMessages(); renderer.recenter(); renderer.zoom((snapshot.options.camera.zoom - 7) / 3); renderer.reducedMotion = snapshot.options.reducedMotion === 'on' || snapshot.options.reducedMotion === 'system' && reducedMotion.matches; root?.style.setProperty('--text-scale', String(snapshot.options.accessibility.textScale)); }
    if (before) assetRetries = 0;
    if (automaticTurnReady(snapshot)) input?.cancel();
    const ticket = ++generation; ready = false; context();
    try {
      projected = renderSnapshot(snapshot, gameplay, epoch, loaded.catalogs.species, events);
      audio.present(bound,snapshot,events,projected,loaded.catalogs);
      renderer.loadWorld(projected.world); renderer.syncPickups(projected.pickups);
      if (before && before.town.mapDefinitionId !== snapshot.town.mapDefinitionId && snapshot.town.mapDefinitionId === TEAM.map) renderer.recenter();
      renderer.setFollow(snapshot.session?.leaderActorId ?? snapshot.profile.heroId);
      view.messages(eventMessages(before, projected, events));
      for (const actor of projected.actors) if (before?.session?.actors[actor.actorId] && actor.hp < (before.session.actors[actor.actorId]?.resources.hp ?? actor.hp)) renderer.flash(actor.x, actor.z, 'hit');
      presented = snapshot; idleAt = events.length && !automaticTurnReady(snapshot) ? performance.now() + 280 : 0;
      const actors = projected.actors;
      void renderer.syncActors(actors).then(() => {
        if (disposed || ticket !== generation || current() !== snapshot || bound.adventureEpoch !== saves?.service.getBinding().adventureEpoch || failed || lost) return;
        ready = true; screen(snapshot); if (!followsGame) view.rebuildPanel(snapshot); context(); queueAutomatic();
      }).catch(error => { if (!disposed && ticket === generation && current() === snapshot) fail(error); });
      screen(snapshot);
    } catch (error) { fail(error); }
  }
  /** @param {unknown} error */
  function fail(error) {
    if (disposed) return; audio.pause(); cancelAutomatic(); followsGame = false; failed = true; ready = false; input?.cancel(); context();
    const cancellation = error instanceof Error && (error.name === 'AbortError' || error.message === 'Art resource is cancelling or has conflicting identity.');
    if (cancellation && current() && assetRetries < 2) {
      dialogue = false;
      view.show('Character art interrupted', 'A previous character clip is still being released. Commands are paused. Retry the current scene after that request settles; no game turn will advance.', [
        { label: 'Retry character art', run: () => { assetRetries++; failed = false; close(); refresh(); } },
        { label: 'Saves & export', run: menu },
      ]); context(); return;
    }
    const message = error instanceof Error ? error.message : 'Adventure presentation failed.';
    if (booted) {
      dialogue = false;
      view.show('Adventure display unavailable', `${message} Commands are paused. Export unsaved progress before reloading.`, [
        { label: 'Saves & export', run: menu }, { label: 'Reload application', run: () => window.location.reload() },
      ]); context();
    } else startup.unavailable(message);
  }
  /** @param {import('../input/controller.js').IntentEnvelope} envelope */
  function intent(envelope) {
    if (envelope.epoch !== epoch || envelope.revision !== current()?.revision && current() !== null || envelope.mode !== mode()) return;
    const action = envelope.intent;
    if (action.type === 'cameraAdjust') { renderer?.rotate(action.yaw); renderer?.zoom(action.zoom); return; }
    if (action.type === 'cameraRecenter') { renderer?.recenter(); return; }
    if (action.type === 'navigate') { view.navigate(action.direction); return; }
    if (action.type === 'confirm') { view.confirm(); return; }
    if (action.type === 'cancel') { audio.ui('effect-ui-cancel'); if (view.isOpen()) resume(); else menu(); return; }
    if (action.type === 'panel') {
      if (current()?.friends && !current()?.session) { groundExploring = false; resume(); return; }
      if (action.panel === 'inventory') inventory(); else if (action.panel === 'map') panel('Gold marks your leader, blue your partner, red visible enemies and white discovered stairs. Only explored terrain is shown.', [], 'Explored map');
      else if (action.panel === 'tactics') panel('Your partner follows and attacks adjacent enemies using the reviewed opening policy. Changing tactics and IQ is not available yet.', [], 'Partner tactics');
      else expedition();
      return;
    }
    if (action.type === 'move' || action.type === 'face') act({ type: action.type, dx: action.direction.dx, dz: action.direction.dz });
    else if (action.type === 'primary') { const state = current(); if (state?.friends && !state.session) { groundExploring = false; resume(); } else act({ type: 'attack' }); }
    else if (action.type === 'wait') act({ type: 'wait' });
    else if (action.type === 'moveSlot') useMove(action.slot);
  }
  function tick(/** @type {number} */ now) {
    frame = 0; if (disposed || document.hidden) return;
    if (!failed && !lost) renderer?.update(lastFrame ? (now - lastFrame) / 1000 : 0); lastFrame = now;
    // Returning event clips to idle is presentation-only. It neither advances a
    // turn nor commits a revision, and actor readiness is rechecked normally.
    if (idleAt && now >= idleAt && current() === presented && ready) { idleAt = 0; refresh(); }
    context(); if (mode() !== 'world' || now >= permitAt) input?.flush();
    queueAutomatic();
    frame = window.requestAnimationFrame(tick);
  }
  function resize() { renderer?.resize(); }
  function watchDensity() { density?.removeEventListener('change', watchDensity); density = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`); density.addEventListener('change', watchDensity, { once: true }); resize(); }
  function dispose() {
    if (disposed) return; cancelAutomatic(); disposed = true; generation++; lifetime.abort(); listeners.abort(); signal.removeEventListener('abort', abort);
    window.cancelAnimationFrame(frame); observer?.disconnect(); density?.removeEventListener('change', watchDensity);
    audio.dispose(); delete soundRefresh.panel; delete soundRefresh.hud; input?.dispose(); saves?.dispose(); renderer?.dispose(); kit?.dispose?.(); loaded?.dispose(); view.dispose(); canvas.hidden = true; if (root) root.hidden = true;
  }
  signal.addEventListener('abort', dispose, { once: true });
  try {
    loaded = await loadCatalogs(lifetime.signal, startup.status); gameplay = createGameplay(loaded.catalogs, { tutorialSaved: snapshot => saves?.tutorialSaved(snapshot) ?? false });
    startup.status('Loading textured world and exact local character art…');
    const forest = await loadEnvironmentKit('forest', lifetime.signal);
    kit = forest; // Retain cleanup ownership if the second local kit fails.
    const town = await loadEnvironmentKit(TEAM.kitId, lifetime.signal);
    kit = { lighting: forest.lighting, create: world => world.biomeId === 'forest' ? forest.create(world) : town.create(world), dispose() { forest.dispose?.(); town.dispose?.(); } };
    const cave = await loadEnvironmentKit('cave', lifetime.signal);
    // One renderer API with read-only world-driven material and lighting routing.
    kit = { lighting: forest.lighting, lightingFor: world => world.biomeId === 'cave' ? cave.lighting : world.biomeId === TEAM.kitId ? town.lighting : forest.lighting, create(world) {
      if (world.biomeId === 'forest') return forest.create(world);
      if (world.biomeId === TEAM.kitId) return town.create(world);
      if (world.biomeId === 'cave') return cave.create(world);
      throw new Error(`Unavailable environment kit: ${world.biomeId}`);
    }, dispose() { forest.dispose?.(); town.dispose?.(); cave.dispose?.(); } };
    renderer = new DungeonRenderer(canvas, { environmentKit: kit, reducedMotion: reducedMotion.matches,
      onError: fail, onContextState(state) { cancelAutomatic(); lost = state === 'lost'; if (lost) audio.pause(); ready = false; input?.cancel(); context(); if (lost) view.notify('Graphics interrupted. Commands paused until recovery.'); else { lastFrame = 0; view.notify('Graphics restored.'); refresh(); } },
    });
    await renderer.ready; lifetime.signal.throwIfAborted();
    saves = createSaves({ gameplay, compatibility: createOpeningCompatibility(loaded.catalogs, gameplay.content, gameplay.authored), view, pause() { audio.pause(); cancelAutomatic(); paused = true; input?.cancel(); context(); return () => { paused = false; view.refreshAudioControls(); }; },
      busy(value) { busy = value; view.refreshAudioControls(false); if (busy) { cancelAutomatic(); input?.cancel(); } context(); }, changed() { draftMode = null; draftToken = Symbol('retired-options'); close(); resumedBinding(); }, back: resume, newGame });
    input = createInputController({ target: document, cameraSurface: canvas, onIntent: intent });
    canvas.hidden = false; root.hidden = false;
    observer = new ResizeObserver(resize); observer.observe(canvas); window.addEventListener('resize', resize, { signal: listeners.signal });
    reducedMotion.addEventListener('change', () => { if (renderer) { const preference = current()?.options.reducedMotion ?? 'system'; renderer.reducedMotion = preference === 'on' || preference === 'system' && reducedMotion.matches; } }, { signal: listeners.signal });
    document.addEventListener('visibilitychange', () => { cancelAutomatic(); input?.cancel(); lastFrame = 0; context(); view.refreshAudioControls(false); if (document.hidden) { window.cancelAnimationFrame(frame); frame = 0; } else { resize(); if (!frame) frame = window.requestAnimationFrame(tick); } }, { signal: listeners.signal });
    window.addEventListener('blur', () => { focusPaused = true; cancelAutomatic(); input?.cancel(); context(); view.refreshAudioControls(false); }, { signal: listeners.signal });
    window.addEventListener('focus', () => { focusPaused = false; context(); view.refreshAudioControls(false); }, { signal: listeners.signal });
    watchDensity(); booted = true; title(); frame = window.requestAnimationFrame(tick);
    return { dispose };
  } catch (error) { dispose(); throw error; }
}
