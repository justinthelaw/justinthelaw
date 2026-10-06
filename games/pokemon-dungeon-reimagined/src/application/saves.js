import { createIndexedDbAdapter, createSaveRepository, createPersistenceService, notificationApplies } from '../persistence/index.js';
import { createAdventure } from '../domain/adventure.js';
/** @typedef {import('../persistence/application.js').ReplacementRequest} ReplacementRequest */
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot */

/** Persistence/UI owner: exact frozen snapshot identity is retained by detached
 * bind; observers run after service operations. No save callback dispatches.
 * @param {{compatibility:import('../persistence/codec.js').SaveCompatibility,gameplay:ReturnType<typeof import('../domain/gameplay/index.js').createGameplay>,view:ReturnType<typeof import('../ui/view.js').createView>,pause:()=>()=>void,busy:(value:boolean)=>void,changed:()=>void,back:()=>void,newGame:()=>void}} options */
export function createSaves(options) {
  const { gameplay, view, compatibility } = options;
  const repository = createSaveRepository({ adapter: createIndexedDbAdapter(), content: gameplay.content, compatibility });
  const service = createPersistenceService({ repository, initial: /** @type {import('../domain/turns/types.js').Adventure|null} */ (null),
    getCurrent: instance => instance.getSnapshot(),
    bind(snapshot) { const created = createAdventure({ initial: snapshot, content: gameplay.content, handlers: gameplay.handlers, turns: gameplay.turns }); if (!created.ok) throw new Error(created.message); return created.adventure; },
    pause: options.pause,
  });
  let disposed = false; let memory = false; let tutorialSaving = false;
  /** Exact session export receipt; never represents durable browser storage.
   * @type {{snapshot:Snapshot,epoch:symbol}|null} */ let tutorialSession = null;
  /** @type {Set<ReplacementRequest>} */ const previews = new Set();
  function cancelPreviews() { for (const token of previews) service.cancelReplacement(token); previews.clear(); }
  /** @param {()=>Promise<void>} action */
  function run(action) {
    options.busy(true); cancelPreviews();
    void action().catch(error => { if (!disposed) view.notify(error instanceof Error ? error.message : 'Save operation failed.'); }).finally(() => { if (!disposed) options.busy(false); });
  }
  /** @param {import('../persistence/contracts.js').SavePreview|null} preview */
  function description(preview) { return preview ? `${preview.teamName} · ${preview.mode} · revision ${preview.revision} · ${preview.savedAt}` : 'An empty campaign slot.'; }
  /** @param {ReplacementRequest} token */
  function confirmation(token) {
    previews.add(token);
    view.show(token.source === 'reset' ? 'Reset browser saves?' : 'Replace campaign?', `${token.message} ${description(token.preview)}`, [
      { label: 'Confirm replacement', run: () => {
        previews.delete(token); options.busy(true);
        void service.confirmReplacement(token, true).then(outcome => {
          if (disposed) return;
          if (!outcome.result.ok) { view.notify(outcome.result.message); menu(); return; }
          memory = outcome.status === 'unsaved'; cancelPreviews();
          view.notify(memory ? 'Memory-only campaign. Export to keep a copy; browser saves are preserved.' : 'Campaign replacement completed.');
          options.changed();
        }).catch(error => { if (!disposed) view.notify(error instanceof Error ? error.message : 'Replacement failed.'); }).finally(() => { if (!disposed) options.busy(false); });
      } },
      { label: 'Cancel', run: () => { cancelPreviews(); menu(); } },
    ]);
  }
  /** @param {import('../persistence/contracts.js').Result<ReplacementRequest>} result */
  function prepared(result) { if (disposed) return; if (result.ok) confirmation(result.value); else view.notify(result.message); }
  /** @param {boolean} [autosave] */
  async function save(autosave = false) {
    const outcome = await service.save(autosave);
    if (disposed || !outcome.notification || !notificationApplies(outcome.notification, service.getContext())) return;
    if (autosave && !outcome.result.ok && ['memory-only', 'superseded', 'stale'].includes(outcome.result.code)) return;
    view.notify(service.isCurrentRevisionSaved() ? 'Current progress saved.' : outcome.result.ok ? 'An earlier checkpoint is saved; current progress is unsaved.' : outcome.result.message);
  }
  function load() {
    run(async () => {
      const result = await service.prepareLoad(); if (disposed) return;
      if (!result.ok) { view.notify(result.message); return; }
      const preparation = result.value;
      for (const token of [preparation.primary, preparation.backup]) if (token) previews.add(token);
      const actions = [ { label: 'Back', run: menu } ];
      for (const slot of /** @type {const} */ (['primary', 'backup'])) {
        const token = preparation[slot]; const status = preparation.view[slot];
        actions.unshift({ label: `${slot === 'primary' ? 'Primary' : 'Backup'}: ${status.status === 'ready' ? description(status.preview) : status.status === 'empty' ? 'empty' : status.message}`, run: () => { if (token) confirmation(token); } });
      }
      view.show('Continue a campaign', 'Choose primary or backup explicitly. Loading backup requires a recovery confirmation.', actions.map((action, index) => ({ ...action, disabled: index < 2 && !(index === 0 ? preparation.backup : preparation.primary) })));
    });
  }
  function importMenu() {
    cancelPreviews(); const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json'; input.setAttribute('aria-label', 'Save file');
    view.show('Import save file', 'Select a canonical save file (maximum 64 MiB). Preview is validated before replacement.', [
      { label: 'Preview browser import', run: () => { const file = input.files?.[0]; if (file) run(async () => prepared(await service.prepareImportFile(file, 'durable'))); else view.notify('Choose a save file first.'); } },
      { label: 'Preview memory import', run: () => { const file = input.files?.[0]; if (file) run(async () => prepared(await service.prepareImportFile(file, 'memory'))); else view.notify('Choose a save file first.'); } },
      { label: 'Back', run: menu },
    ], [input]);
  }
  function menu() {
    cancelPreviews();
    const active = service.getBinding().instance !== null;
    view.show('Campaign & saves', active ? `${memory ? 'Memory-only campaign. Export to keep progress.' : service.isCurrentRevisionSaved() ? 'Current revision saved.' : 'Current revision unsaved.'} Primary and backup use this browser. File export is independent of browser storage.` : 'Start a new adventure or choose a validated browser save.', [
      { label: 'Resume adventure', run: options.back, disabled: !active },
      { label: 'New game', run: options.newGame },
      { label: 'Continue / backup', run: load },
      { label: memory ? 'Preview browser save' : 'Save checkpoint', disabled: !active, run: () => run(async () => { if (memory) prepared(await service.preparePersistCurrent()); else await save(); }) },
      { label: 'Export save', disabled: !active, run: () => run(async () => {
        const outcome = await service.exportSave(); if (disposed) return;
        if (!outcome.result.ok) { view.notify(outcome.result.message); return; }
        if (!outcome.notification || !notificationApplies(outcome.notification, service.getContext())) return;
        const url = URL.createObjectURL(new Blob([outcome.result.value.text], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = 'pokemon-dungeon-save.json'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        view.notify('Save file prepared. Keep the downloaded file to retain this checkpoint.');
      }) },
      { label: 'Import save', run: importMenu },
      { label: 'Preview reset', run: () => run(async () => prepared(await service.prepareReset())) },
    ]);
    options.busy(false);
  }
  return { service, menu, load, cancelPreviews,
    /** @param {Snapshot} snapshot */
    tutorialSaved(snapshot) { return service.getBinding().instance?.getSnapshot() === snapshot && (service.isCurrentRevisionSaved() || tutorialSession?.snapshot === snapshot && tutorialSession.epoch === service.getBinding().adventureEpoch); },
    /** Called only by the owning bed panel. Success cannot dispatch until the
     * operation has settled and input ownership has been restored.
     * @param {Snapshot} snapshot @param {()=>void} complete */
    saveTutorial(snapshot, complete) {
      if (disposed || tutorialSaving || service.getBinding().instance?.getSnapshot() !== snapshot) return;
      const epoch = service.getBinding().adventureEpoch;
      const current = () => !disposed && service.getBinding().adventureEpoch === epoch && service.getBinding().instance?.getSnapshot() === snapshot;
      tutorialSaving = true; options.busy(true); cancelPreviews();
      void (async () => {
        if (memory) {
          const outcome = await service.exportSave();
          if (!current()) return false;
          if (!outcome.result.ok) { view.notify(outcome.result.message); return false; }
          const url = URL.createObjectURL(new Blob([outcome.result.value.text], { type: 'application/json' }));
          const link = document.createElement('a'); link.href = url; link.download = 'pokemon-dungeon-save.json'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          tutorialSession = { snapshot, epoch };
          view.notify('Memory-only tutorial checkpoint prepared for download. This browser has not saved it. Keep the file; later progress needs a new export.');
          return true;
        }
        const outcome = await service.save();
        if (!current()) return false;
        if (!outcome.result.ok || !service.isCurrentRevisionSaved()) { view.notify(outcome.result.ok ? 'The tutorial checkpoint is stale. Save again.' : outcome.result.message); return false; }
        view.notify('Bed checkpoint saved in this browser.'); return true;
      })().then(saved => { tutorialSaving = false; if (!disposed) options.busy(false); if (saved && current()) complete(); }).catch(error => { tutorialSaving = false; if (!disposed) { options.busy(false); view.notify(error instanceof Error ? error.message : 'Tutorial checkpoint failed.'); } });
    },
    isMemoryOnly: () => memory,
    /** @param {Snapshot} snapshot @param {'durable'|'memory'} storageMode */
    newCampaign(snapshot, storageMode) { run(async () => prepared(await service.prepareNewGame(snapshot, storageMode))); },
    autosave() { void save(true).catch(error => { if (!disposed) view.notify(error instanceof Error ? error.message : 'Autosave failed.'); }); },
    dispose() { disposed = true; cancelPreviews(); service.dispose(); },
  };
}
