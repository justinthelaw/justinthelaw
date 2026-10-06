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
  const controlSelector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)';
  function focusPanel() {
    const focus = panel.querySelector(controlSelector);
    (focus instanceof HTMLElement ? focus : panel).focus({ preventScroll: true });
  }
  function containFocus() {
    if (panelOpen && !panel.contains(document.activeElement)) focusPanel();
  }
  document.addEventListener('focusin', containFocus);
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...panel.querySelectorAll(controlSelector)].filter(element => element instanceof HTMLElement);
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); panel.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  /** @type {string[]} */ let history = [];
  /** @param {string} title @param {string} text @param {Action[]} actions @param {HTMLElement[]} [extra] */
  function show(title, text, actions, extra = []) {
    panelToken = Symbol('panel'); panelOpen = true; panel.hidden = false; hud.inert = true;
    const heading = node('h2', title); heading.id = 'panel-heading';
    const content = node('p', text); const controls = node('div', '', 'choices'); controls.append(...actions.map(button));
    panel.replaceChildren(heading, content, ...extra, controls);
    focusPanel(); return panelToken;
  }
  return {
    show,
    /** @param {symbol} token */
    ownsPanel: token => panelOpen && panelToken === token,
    close() {
      const restoreFocus = panelOpen && panel.contains(document.activeElement);
      panelToken = Symbol('closed'); panelOpen = false; panel.hidden = true; hud.inert = false;
      if (restoreFocus) root.focus({ preventScroll: true });
    },
    isOpen: () => panelOpen,
    /** @param {string} message */ notify(message) { notice.textContent = message; },
    /** @param {string[]} messages */ messages(messages) { history = [...history, ...messages].slice(-5); log.replaceChildren(...history.map(message => node('li', message))); },
    clearMessages() { history = []; log.replaceChildren(); },
    /** @param {string} goal @param {string[]} team @param {Action[]} actions */
    hud(goal, team, actions) { objective.textContent = goal; stats.replaceChildren(...team.map(text => node('p', text))); toolbar.replaceChildren(...actions.map(button)); hud.hidden = team.length === 0; },
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
      const controls = [...panel.querySelectorAll(controlSelector)].filter(element => element instanceof HTMLElement);
      const current = controls.indexOf(/** @type {HTMLElement} */ (document.activeElement));
      const delta = direction.dz || direction.dx; controls[(current + delta + controls.length) % controls.length]?.focus();
    },
    confirm() { if (document.activeElement instanceof HTMLButtonElement && panel.contains(document.activeElement)) document.activeElement.click(); },
    dispose() { document.removeEventListener('focusin', containFocus); root.replaceChildren(); },
  };
}
