/** Safe DOM construction: imported names/question/dialogue/save text are never HTML.
 * @param {string} tag @param {string} [text] @param {string} [className] */
export function node(tag, text = '', className = '') {
  const element = document.createElement(tag); element.textContent = text; element.className = className; return element;
}
/** @typedef {{label:string,run:()=>void,disabled?:boolean,detail?:string}} Action */
/** @param {Action} action */
export function button(action) {
  const element = document.createElement('button'); element.type = 'button'; element.textContent = action.label;
  element.disabled = action.disabled ?? false; if (action.detail) element.title = action.detail;
  element.addEventListener('click', action.run); return element;
}
/** @param {HTMLElement} root */
export function createView(root) {
  const hud = node('section', '', 'hud'); hud.setAttribute('aria-label', 'Team status');
  const objective = node('p', '', 'objective');
  const stats = node('div', '', 'team-stats');
  const toolbar = node('nav', '', 'toolbar'); toolbar.setAttribute('aria-label', 'Adventure actions');
  const notice = node('p', '', 'notice'); notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
  const log = node('ol', '', 'event-log'); log.setAttribute('aria-label', 'Recent adventure events');
  const map = document.createElement('canvas'); map.className = 'minimap'; map.setAttribute('aria-label', 'Explored floor minimap: gold leader, blue partner, red visible enemy, white stairs'); map.width = 160; map.height = 120;
  const panel = node('section', '', 'panel'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'panel-heading'); panel.tabIndex = -1; panel.hidden = true;
  root.tabIndex = -1;
  hud.append(objective, stats, toolbar); root.replaceChildren(hud, map, log, notice, panel);
  let panelOpen = false;
  let panelToken = Symbol('closed');
  /** @type {((snapshot:import('../contracts/campaign.js').CampaignSnapshot)=>void)|null} */ let panelRebuild = null;
  let hudToken = Symbol('hud');
  /** @type {((owns:()=>boolean,scope:'panel'|'hud')=>HTMLElement)|null} */ let audioControls = null;
  /** @type {((cue:string)=>void)|null} */ let audioUi = null;
  const soundToolbar = node('div','','sound-toolbar'); hud.append(soundToolbar);
  /** @type {HTMLElement|null} */ let panelSound = null;
  let audioPanelToken = Symbol('audio-panel'), audioHudToken = Symbol('audio-hud');
  /** @param {'panel'|'hud'} scope */
  function sound(scope) {
    const token = Symbol('audio-control');
    if (scope === 'panel') audioPanelToken = token; else audioHudToken = token;
    const outer = scope === 'panel' ? panelToken : hudToken;
    return audioControls?.(() => scope === 'panel' ? panelOpen && panelToken === outer && audioPanelToken === token : !panelOpen && hudToken === outer && audioHudToken === token,scope) ?? null;
  }
  /** @param {string|undefined} key */
  function soundFocus(key) { if (!key) return false; const target = [...root.querySelectorAll('[data-audio-control]')].find(element => element instanceof HTMLElement && element.dataset.audioControl === key && !element.matches(':disabled') && !element.closest('[hidden]') && !element.closest('[inert]')); if (target instanceof HTMLElement) { target.focus({preventScroll:true}); return true; } return false; }
  const controlSelector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)';
  function panelControls() { return [...panel.querySelectorAll(controlSelector)].flatMap(element => element instanceof HTMLElement && !element.closest('[hidden]') && !element.closest('[inert]') ? [element] : []); }
  function focusPanel() {
    const focus = panelControls()[0];
    (focus instanceof HTMLElement ? focus : panel).focus({ preventScroll: true });
  }
  function containFocus() {
    if (panelOpen && !panel.contains(document.activeElement)) focusPanel();
  }
  document.addEventListener('focusin', containFocus);
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = panelControls();
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); panel.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  /** @type {string[]} */ let history = [];
  /** @param {string} title @param {string} text @param {Action[]} actions @param {HTMLElement[]} [extra]
   * @param {(snapshot:import('../contracts/campaign.js').CampaignSnapshot)=>void} [rebuild] */
  function show(title, text, actions, extra = [], rebuild) {
    const soundKey = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.audioControl : undefined;
    panelToken = Symbol('panel'); panelOpen = true; panel.hidden = false; hud.inert = true;
    const token = panelToken;
    panelRebuild = rebuild ?? null;
    const heading = node('h2', title); heading.id = 'panel-heading';
    const content = node('p', text); const controls = node('div', '', 'choices');
    controls.append(...actions.map(action => button({ ...action, run() { if (panelOpen && panelToken === token) { audioUi?.('effect-ui-confirm'); action.run(); } } })));
    panelSound = sound('panel');
    panel.replaceChildren(heading, content, ...extra, ...(panelSound ? [panelSound] : []), controls);
    if (!soundFocus(soundKey)) focusPanel(); return panelToken;
  }
  return {
    show,
    /** The shell invokes after an admitted preference commit or guarded current
     * asset readiness; each registered model redraws its exact current submenu.
     * @param {import('../contracts/campaign.js').CampaignSnapshot} snapshot */
    rebuildPanel(snapshot) {
      const rebuild = panelRebuild;
      if (!panelOpen || !rebuild) return false;
      const focused = document.activeElement;
      const owned = focused instanceof HTMLElement && panel.contains(focused);
      const audioKey = owned ? focused.dataset.audioControl : undefined;
      const inputs = [...panel.querySelectorAll('input:not([data-audio-control]),textarea,select')];
      const inputIndex = inputs.indexOf(/** @type {Element} */ (focused));
      const text = owned && focused instanceof HTMLButtonElement ? focused.textContent : null;
      const selection = owned && (focused instanceof HTMLInputElement || focused instanceof window.HTMLTextAreaElement) && focused.selectionStart !== null ? [focused.selectionStart,focused.selectionEnd] : null;
      const token = panelToken; rebuild(snapshot);
      const changed = panelOpen && panelToken !== token;
      if (changed && owned && !soundFocus(audioKey)) {
        const target = inputIndex >= 0 ? panel.querySelectorAll('input:not([data-audio-control]),textarea,select')[inputIndex] : text !== null ? panelControls().find(element => element instanceof HTMLButtonElement && element.textContent === text) : null;
        if (target instanceof HTMLElement && !target.matches(':disabled') && !target.closest('[hidden]') && !target.closest('[inert]')) {
          target.focus({preventScroll:true});
          if (selection && (target instanceof HTMLInputElement || target instanceof window.HTMLTextAreaElement)) target.setSelectionRange(selection[0] ?? 0,selection[1] ?? selection[0] ?? 0);
        }
      }
      return changed;
    },
    /** @param {(owns:()=>boolean,scope:'panel'|'hud')=>HTMLElement} factory */
    setAudioControls(factory) { audioControls = factory; },
    /** @param {(cue:string)=>void} listener */
    setAudioUi(listener) { audioUi = listener; },
    /** @param {boolean} [restoreFocus] */
    refreshAudioControls(restoreFocus = true) {
      const key = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.audioControl : undefined;
      if (panelOpen && panelSound) { const next = sound('panel'); if (next) { panelSound.replaceWith(next); panelSound = next; } }
      else { const next = sound('hud'); soundToolbar.replaceChildren(...(next ? [next] : [])); }
      if (restoreFocus) soundFocus(key);
    },
    /** @param {symbol} token */
    ownsPanel: token => panelOpen && panelToken === token,
    close() {
      const restoreFocus = panelOpen && panel.contains(document.activeElement);
      panelToken = Symbol('closed'); panelRebuild = null; panelOpen = false; panel.hidden = true; hud.inert = false;
      if (restoreFocus) root.focus({ preventScroll: true });
    },
    isOpen: () => panelOpen,
    /** @param {string} message */ notify(message) { notice.textContent = message; },
    /** @param {string[]} messages */ messages(messages) { history = [...history, ...messages].slice(-5); log.replaceChildren(...history.map(message => node('li', message))); },
    clearMessages() { history = []; log.replaceChildren(); },
    /** @param {string} goal @param {string[]} team @param {Action[]} actions */
    hud(goal, team, actions) { const token = hudToken = Symbol('hud'); objective.textContent = goal; stats.replaceChildren(...team.map(text => node('p', text))); toolbar.replaceChildren(...actions.map(action => button({ ...action, run() { if (!panelOpen && hudToken === token) { audioUi?.('effect-ui-confirm'); action.run(); } } }))); const soundView = sound('hud'); soundToolbar.replaceChildren(...(soundView ? [soundView] : [])); hud.hidden = team.length === 0; },
    /** @param {import('../presentation/types.js').RenderSnapshot|null} view */
    minimap(view) {
      map.hidden = !view; if (!view) return;
      const ctx = map.getContext('2d'); if (!ctx) return;
      ctx.fillStyle = '#0d1721'; ctx.fillRect(0, 0, map.width, map.height);
      const size = Math.min(map.width / view.world.width, map.height / view.world.height);
      const offsetX = (map.width - size * view.world.width) / 2, offsetZ = (map.height - size * view.world.height) / 2;
      for (let z = 0; z < view.world.height; z++) for (let x = 0; x < view.world.width; x++) {
        if (!view.world.explored[z]?.[x]) continue;
        ctx.fillStyle = view.world.tiles[z]?.[x] === 'wall' ? '#334b50' : view.world.visible[z]?.[x] ? '#82a085' : '#526c58';
        ctx.fillRect(offsetX + x * size, offsetZ + z * size, Math.max(1, size), Math.max(1, size));
      }
      for (const exit of view.world.exits) { ctx.fillStyle = '#ffffff'; ctx.fillRect(offsetX + exit.x * size, offsetZ + exit.z * size, Math.max(2, size), Math.max(2, size)); }
      for (const actor of view.actors) { ctx.fillStyle = actor.role === 'hero' ? '#ffcf69' : actor.role === 'partner' ? '#7bccff' : '#ff7c7c'; ctx.fillRect(offsetX + actor.x * size, offsetZ + actor.z * size, Math.max(2, size), Math.max(2, size)); }
    },
    /** @param {import('../input/map.js').Direction} direction */
    navigate(direction) {
      const controls = panelControls();
      const current = controls.indexOf(/** @type {HTMLElement} */ (document.activeElement));
      const delta = direction.dz || direction.dx; const next = controls[(current + delta + controls.length) % controls.length]; if (next && next !== document.activeElement) { next.focus(); audioUi?.('effect-ui-cursor'); }
    },
    confirm() { if (document.activeElement instanceof HTMLButtonElement && panel.contains(document.activeElement)) document.activeElement.click(); },
    dispose() { panelOpen = false; panelToken = Symbol('disposed'); panelRebuild = null; hudToken = Symbol('disposed'); document.removeEventListener('focusin', containFocus); root.replaceChildren(); },
  };
}
