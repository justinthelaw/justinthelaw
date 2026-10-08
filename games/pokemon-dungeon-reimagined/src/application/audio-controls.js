import { exactAudioPreferences } from '../domain/gameplay/audio-preferences.js';
import { node } from '../ui/view.js';
/** A direct view-owned DOM listener keeps the genuine Event on its original stack.
 * Ordinary view.confirm() synthetic clicks intentionally cannot enable sound.
 * @param {{preferences:import('../audio/types.js').AudioPreferences,owns:()=>boolean,blocked:string|null,canPresent:()=>boolean,expanded:boolean,toggle:()=>void,change:(value:import('../audio/types.js').AudioPreferences)=>boolean,activate:(event:Event)=>void,pause:()=>void,status:()=>import('../audio/types.js').AudioStatus,draft:boolean}} options */
export function createAudioControls(options) {
  const region = node('section','','audio-controls'); region.setAttribute('aria-label','Sound controls');
  const status = node('p'); status.setAttribute('role','status');
  const enable = document.createElement('button'); enable.type = 'button'; enable.textContent = 'Enable sound'; enable.title = 'Enable game sound'; enable.dataset.audioControl = 'enable';
  const pause = document.createElement('button'); pause.type = 'button'; pause.textContent = 'Pause sound'; pause.title = 'Pause game sound'; pause.dataset.audioControl = 'pause';
  const settings = document.createElement('button'); settings.type = 'button'; settings.textContent = 'Sound settings'; settings.title = 'Adjust sound settings'; settings.dataset.audioControl = 'settings';
  settings.setAttribute('aria-expanded',String(options.expanded));
  const ranges = node('div','','sound-settings'); ranges.hidden = !options.expanded;
  let preferences = {...options.preferences};
  function refreshStatus() {
    if (!options.owns()) return;
    const state = options.status();
    status.textContent = options.blocked ?? (preferences.master === 0 ? 'Raise master volume to enable sound.' : state.state === 'ready' ? 'Sound enabled.' : state.reason ?? 'Tap Enable sound in the game.');
    if (options.draft) status.textContent += ' Saved with your new adventure.';
    enable.disabled = preferences.master === 0 || !options.canPresent() || preferences.muted && !!options.blocked;
  }
  /** @param {Event} event */
  function activate(event) {
    if (!options.owns() || !options.canPresent()) return;
    if (!event.isTrusted) { status.textContent = 'Tap Enable sound in the game.'; return; }
    options.activate(event);
  }
  enable.addEventListener('click',activate);
  enable.addEventListener('keydown',event => {
    if (!['Enter',' '].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || event.isComposing) return;
    event.preventDefault(); event.stopPropagation(); activate(event);
  });
  pause.addEventListener('click',() => { if (options.owns()) { options.pause(); refreshStatus(); } });
  settings.addEventListener('click',() => { if (options.owns()) { options.toggle(); ranges.hidden = !ranges.hidden; settings.setAttribute('aria-expanded',String(!ranges.hidden)); } });
  /** @param {import('../audio/types.js').AudioPreferences} next */
  function commit(next) { if (!options.owns() || options.blocked || !exactAudioPreferences(next)) return false; const changed = options.change(next); if (changed) preferences = {...next}; refreshStatus(); return changed; }
  for (const key of /** @type {const} */ (['master','music','effects'])) {
    const label = node('label',`${key[0]?.toUpperCase()}${key.slice(1)} volume`);
    const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '1'; input.step = '.05'; input.value = String(preferences[key]); input.disabled = !!options.blocked;
    input.setAttribute('aria-label',`${key} volume`); input.title = `Adjust ${key} volume`; input.dataset.audioControl = key;
    input.addEventListener('change',() => { const value = Number(input.value); if (!Number.isFinite(value) || !commit({...preferences,[key]:Math.max(0,Math.min(1,value))})) input.value = String(preferences[key]); });
    label.append(input); ranges.append(label);
  }
  const muteLabel = node('label','Mute sound');
  const mute = document.createElement('input'); mute.type = 'checkbox'; mute.checked = preferences.muted; mute.disabled = !!options.blocked; mute.title = 'Mute game sound'; mute.dataset.audioControl = 'mute';
  mute.addEventListener('change',() => { if (!commit({...preferences,muted:mute.checked})) mute.checked = preferences.muted; });
  muteLabel.append(mute); ranges.append(muteLabel);
  region.append(enable,pause,settings,status,ranges); refreshStatus();
  return {element:region,refreshStatus};
}
