import { createAudioBus, dungeonMusicCue, nativeMusicCue } from '../audio/index.js';
import { SCENE_AUDIO_REQUESTS, GROUND_AUDIO_REQUESTS } from '../../content/authored/audio-requests.js';
import { TEAM } from '../../content/authored/team-formation.js';
import { MORNING } from '../../content/authored/first-morning.js';
import { THUNDERWAVE } from '../../content/authored/thunderwave.js';
import { STEEL } from '../../content/authored/mt-steel.js';
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('../domain/turns/types.js').Event} DomainEvent */
/** @typedef {{adventureEpoch:symbol,instance:import('../domain/turns/types.js').Adventure|null}} Binding */
/** Qualified current requests, not a reconstruction of unsaved native audio queues.
 * Unknown scene/fixed-room/override ownership remains silent.
 * @param {Snapshot} snapshot @param {import('../domain/gameplay/support.js').Catalogs} catalogs
 */
function request(snapshot,catalogs) {
  /** Native ground-only modifier. Dungeon queues/Skarmory scripts have distinct
   * owners and must not inherit ground quest suppression. Title/quiz requests
   * are authored separately, matching their special native start-mode bypass.
   * @param {number|null|undefined} musicId */
  function ground(musicId) {
    if (musicId === null || musicId === undefined) return null;
    const native = snapshot.progress.native.scenarios.MAIN;
    if (!native) return null;
    // Current qualified chapters0–5 cannot trigger native quest12/calamity
    // overrides. Future chapters need the private start-mode bypass owner too;
    // scriptMode alone is not that native flag, so those joins remain silent.
    if (native.chapter > 5) return null;
    return nativeMusicCue(musicId);
  }
  const scene = snapshot.pendingScene;
  const session = snapshot.session;
  if (scene) {
    const row = SCENE_AUDIO_REQUESTS.find(row => row.scene === scene.sceneId && scene.cursor >= row.from && scene.cursor <= row.through);
    const summit = session?.dungeonId === STEEL.dungeonId && session.floor.location.kind === 'boss' && session.floor.location.address.floorId === STEEL.floors[8];
    if (row?.guard === 'steel-poststory' && !(summit && session.purpose.kind === 'story' && snapshot.steel?.phase === 'poststory' && snapshot.steel.bossDefeated)) return null;
    if (row?.guard === 'ordinary-steel-summit' && !(summit && session.purpose.kind === 'ordinary' && snapshot.steel?.phase === 'complete')) return null;
    return row?.owner === 'dungeon' ? row.musicId === null ? null : nativeMusicCue(row.musicId) : ground(row?.musicId);
  }
  if (session) {
    if (snapshot.steel?.phase === 'battle' && session.purpose.kind === 'story' && session.dungeonId === STEEL.dungeonId && session.floor.location.kind === 'boss' && session.floor.location.address.floorId === STEEL.floors[8]) return nativeMusicCue(11);
    if (session.floor.location.kind !== 'exploration') return null;
    const floor = catalogs.dungeons.getFloorById(session.floor.location.address.floorId);
    return dungeonMusicCue(catalogs.dungeons.getGeneration(floor.generationId).parameters.bgMusic);
  }
  // Reconstruct actual completed terminal pauses, rather than overwriting the
  // native preceding fade with the next map's ordinary enter command.
  const main = snapshot.progress.native.scenarios.MAIN, seen = snapshot.progress.seenScenes;
  if (snapshot.mode === 'town' && main?.step === 0) {
    if (main.chapter === 3 && snapshot.progress.storyNodeId === TEAM.foundedStory && snapshot.town.mapDefinitionId === TEAM.map && seen[TEAM.celebration]?.count === 1 && snapshot.progress.appliedGrants.some(row => row.grantId === TEAM.grant)) return null;
    if (main.chapter === 4 && snapshot.progress.storyNodeId === THUNDERWAVE.complete && snapshot.town.mapDefinitionId === MORNING.interior && seen[THUNDERWAVE.evening]?.count === 1 && snapshot.progress.appliedGrants.some(row => row.grantId === THUNDERWAVE.grant)) return null;
    if (main.chapter === 5 && snapshot.progress.storyNodeId === STEEL.complete && snapshot.town.mapDefinitionId === MORNING.interior && snapshot.steel?.phase === 'complete' && snapshot.steel.bossDefeated && seen[/** @type {string} */ (STEEL.scenes[8])]?.count === 1) return null;
  }
  const row = GROUND_AUDIO_REQUESTS.find(row => row.map === snapshot.town.mapDefinitionId);
  return ground(row?.musicId);
}
/** @param {DomainEvent} event @param {DomainEvent|undefined} preceding @param {Snapshot} snapshot @param {ReadonlySet<string>} visible */
function gesture(event,preceding,snapshot,visible) {
  if (event.type === 'actorMoved' && event.actorId === snapshot.session?.leaderActorId && visible.has(event.actorId)) return { cue:'effect-step',priority:1 };
  if (event.type === 'attackResolved' && event.outcome === 'miss' && visible.has(event.actorId) && (event.targetId === null || visible.has(event.targetId))) return { cue:'effect-miss',priority:2 };
  // revival.js emits actor condition invalidation immediately before this exact
  // message. Require that concrete association and the current visible audience.
  if (event.type === 'message' && event.messageId === 'reviver-seed-restored' && preceding?.type === 'conditionChanged' && visible.has(preceding.actorId)) return { cue:'effect-revive',priority:5 };
  return null;
}
/** Composition adapter owns one presentation sequence, never saved event history.
 * @param {Document} doc
 */
export function createApplicationAudio(doc) {
  const bus = createAudioBus({document:doc});
  /** @type {Binding|null} */ let binding = null;
  let counter = 0, sequence = 0, domainHigh = 0, revision = 0, epoch = 'audio-cold';
  /** @type {string|null} */ let cue = null;
  let disposed = false;
  /** @param {string} prefix */
  function begin(prefix) { epoch = `${prefix}-${++counter}`; sequence = 0; domainHigh = 0; revision = 0; cue = null; bus.beginEpoch(epoch); }
  /** Observe replacement/reset before the shell's null-snapshot early return.
   * @param {Binding|null} next */
  function bind(next) {
    if (disposed) return;
    if (binding?.adventureEpoch === next?.adventureEpoch && binding?.instance === next?.instance) return;
    bus.pause(); binding = next; begin(next?.instance ? 'audio-campaign' : 'audio-title');
  }
  /** @param {'title'|'quiz'} stage @param {import('../audio/types.js').AudioPreferences} preferences */
  function draft(stage,preferences) {
    if (disposed) return;
    binding = null; bus.pause(); begin(`audio-${stage}`);
    cue = nativeMusicCue(stage === 'title' ? 43 : 12); bus.setPreferences(preferences);
    bus.present({epoch,revision,musicCue:cue,effects:[]});
  }
  /** @param {import('../audio/types.js').AudioPreferences} preferences */
  function draftPreferences(preferences) { if (!disposed) { revision++; bus.setPreferences(preferences); bus.present({epoch,revision,musicCue:cue,effects:[]}); } }
  /** Validates/consumes every domain ID before selecting or scheduling any cue.
   * @param {Binding} captured @param {Snapshot} snapshot @param {readonly DomainEvent[]} events
   * @param {import('../presentation/types.js').RenderSnapshot} projected @param {import('../domain/gameplay/support.js').Catalogs} catalogs */
  function present(captured,snapshot,events,projected,catalogs) {
    if (disposed || !captured.instance || binding?.instance !== captured.instance || binding.adventureEpoch !== captured.adventureEpoch || captured.instance.getSnapshot() !== snapshot || projected.revision !== snapshot.revision) return false;
    let cursor = 0;
    for (const event of events) {
      if (event.epoch !== captured.instance.getEpoch() || event.revision !== snapshot.revision || !Number.isSafeInteger(event.eventId) || event.eventId <= cursor) { bus.pause(); return false; }
      cursor = event.eventId;
    }
    const previous = domainHigh; domainHigh = Math.max(domainHigh,cursor); revision = snapshot.revision;
    try {
      cue = request(snapshot,catalogs); bus.setPreferences(snapshot.options.audio);
      const visible = new Set(projected.actors.map(actor => actor.actorId));
      const selected = events.flatMap((event,index) => {
        if (event.eventId <= previous) return [];
        const found = gesture(event,events[index-1],snapshot,visible);
        return found ? [{...found,index}] : [];
      }).sort((a,b) => b.priority-a.priority || a.index-b.index).slice(0,4).sort((a,b) => a.index-b.index);
      const effects = selected.map(row => ({eventId:++sequence,cueId:row.cue}));
      if (!Number.isSafeInteger(sequence)) { bus.pause(); return false; }
      return bus.present({epoch,revision,musicCue:cue,effects});
    } catch { bus.pause(); return false; }
  }
  /** UI outcomes have local IDs only; they never enter domain/save history.
   * @param {string} id */
  function ui(id) { if (!disposed && Number.isSafeInteger(++sequence)) bus.present({epoch,revision,musicCue:cue,effects:[{eventId:sequence,cueId:id}]}); }
  return Object.freeze({bind,draft,draftPreferences,present,ui,activate:bus.activate,pause:bus.pause,status:bus.status,
    dispose() { if (disposed) return; disposed = true; binding = null; bus.dispose(); },
  });
}
