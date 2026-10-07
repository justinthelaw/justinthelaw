import { THUNDERWAVE as T } from '../../content/authored/thunderwave.js';
import { MORNING } from '../../content/authored/first-morning.js';
import { node } from '../ui/view.js';
import { checkName, diagnostics } from '../../content/state/pokemon-rules.js';

/** Forms project the canonical gate. Only unsubmitted text lives here; it is
 * retained across saves and readiness repaints within this binding/revision.
 * @param {ReturnType<typeof import('../ui/view.js').createView>} view */
export function createScenePresenter(view) {
  let draftKey = '', draftText = '';
  /** @param {{snapshot:import('../contracts/campaign.js').CampaignSnapshot,epoch:string,prompt:ReturnType<typeof import('../domain/gameplay/scenes.js').scenePrompt>,ready:boolean,send:(intent:import('../domain/turns/types.js').Intent)=>void,saves:()=>void,saveTutorial:(complete:()=>void)=>void,memoryOnly:boolean,news:()=>void}} options */
  return function show({ snapshot, epoch, prompt, ready, send, saves, saveTutorial, memoryOnly, news }) {
    const scene = snapshot.pendingScene;
    if (!scene || !prompt) { view.show('Scene unavailable', 'This saved scene requires authored content that is unavailable.', [{ label: 'Campaign & saves', run: saves }]); return; }
    const tokens = { sceneId: scene.sceneId, sceneInstanceId: scene.sceneInstanceId, cursor: scene.cursor, revision: snapshot.revision };
    const gate = prompt.awaiting;
    let panelToken = Symbol('unpresented');
    /** @param {import('../domain/turns/types.js').Intent} intent */
    const submitIntent = intent => { if (view.ownsPanel(panelToken)) send(intent); };
    /** @type {import('../ui/view.js').Action[]} */ const actions = [];
    /** @type {HTMLElement[]} */ const extra = [];
    if (scene.sceneId === MORNING.scenes[1]) {
      extra.push(node('p', memoryOnly ? 'Memory-only mode: prepare a file checkpoint and continue this session. Browser saving is unavailable in this mode; retain the downloaded file and export later progress again.' : 'Your current bed checkpoint must save successfully in this browser before the tutorial can continue. A failed save leaves you here.'));
      actions.push({ label: memoryOnly ? 'Export & rest' : 'Save & rest', disabled: !ready, run: () => { if (view.ownsPanel(panelToken)) saveTutorial(() => submitIntent({ type: 'ackScene', ...tokens, optionId: null })); } });
    } else if (gate.kind === 'advance') actions.push({ label: 'Continue', disabled: !ready, run: () => submitIntent({ type: 'ackScene', ...tokens, optionId: null }) });
    else if (gate.kind === 'choice' || gate.kind === 'name-confirm') {
      if (gate.kind === 'name-confirm') { const candidate = node('p', gate.value); candidate.style.whiteSpace = 'pre-wrap'; candidate.setAttribute('aria-label', `Team name: ${gate.value}`); extra.push(candidate); }
      for (const option of prompt.options) actions.push({ label: option.label, disabled: !ready, run: () => submitIntent({ type: 'ackScene', ...tokens, optionId: option.id }) });
    } else {
      const key = `${epoch}:${scene.sceneInstanceId}:${snapshot.revision}:${scene.cursor}`;
      if (draftKey !== key) { draftKey = key; draftText = gate.value; }
      const label = node('label', 'Team name'); label.setAttribute('for', 'team-name');
      const input = document.createElement('input'); input.id = 'team-name'; input.type = 'text'; input.value = draftText; input.autocomplete = 'off'; input.spellcheck = false;
      // The host bridge admits only A/Start for this explicit text-field opt-in.
      input.setAttribute('data-game-controls-confirm', 'submit');
      const feedback = node('p'); feedback.id = 'team-name-feedback'; feedback.setAttribute('aria-live', 'polite'); input.setAttribute('aria-describedby', feedback.id);
      function validation() {
        draftText = input.value;
        const report = diagnostics(); checkName(draftText, 'Pokémon', report, '/name'); const result = report.result();
        feedback.textContent = `${[...draftText].length}/10 source cells. ${result.ok ? 'Spaces count as characters.' : result.kind === 'invalid' ? 'Enter one to ten characters without controls.' : 'Use supported letters, digits, spaces or punctuation; this glyph is not supported.'}`;
        input.setAttribute('aria-invalid', String(!result.ok)); return result.ok;
      }
      const submit = () => { if (validation() && ready) submitIntent({ type: 'submitSceneName', ...tokens, name: input.value }); };
      input.addEventListener('input', validation);
      input.addEventListener('keydown', event => { if ((event.key === 'Enter' || !event.isTrusted && event.code === 'KeyZ') && !event.isComposing) { event.preventDefault(); event.stopPropagation(); if (!event.repeat) submit(); } });
      validation();
      extra.push(label, input, feedback, node('p', 'Only submitted names are saved. Opening and closing saves keeps your current draft; reloading restores the last valid prefill.'));
      actions.push({ label: 'Submit name', disabled: !ready, run: submit });
    }
    if (snapshot.progress.appliedGrants.some(row => row.grantId === MORNING.grants[3])) actions.push({ label: 'Read Pokémon News', run: () => { if (view.ownsPanel(panelToken)) news(); } });
    actions.push({ label: 'Campaign & saves', run: () => { if (view.ownsPanel(panelToken)) saves(); } });
    panelToken = view.show([T.story, T.returned].includes(snapshot.progress.storyNodeId) ? 'The Magnemite request' : snapshot.progress.storyNodeId === MORNING.story ? 'The first morning' : 'A rescue team begins', prompt.text, actions, extra);
  };
}
