/** Exact current preference payload; values are rejected, never repaired in state.
 * @param {unknown} input @returns {input is import('../../audio/types.js').AudioPreferences}
 */
export function exactAudioPreferences(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const record = /** @type {Record<string,unknown>} */ (input), keys = Object.keys(record);
  if (keys.length !== 4 || !['master','music','effects','muted'].every(key => Object.hasOwn(record,key))) return false;
  return typeof record.muted === 'boolean' && ['master','music','effects'].every(key => typeof record[key] === 'number' && Number.isFinite(record[key]) && record[key] >= 0 && record[key] <= 1);
}
/** @param {import('../../contracts/campaign.js').CampaignSnapshot|null} state */
export function audioPreferenceBlocked(state) {
  if (['continuing','learning-continuing'].includes(state?.session?.scheduler.kind ?? '')) return 'Finish the current automatic step before changing saved sound settings.';
  if (state?.pendingResult?.kind === 'move-learn-choice') return 'Finish the current move choice before changing saved sound settings.';
  // The frozen first-morning proof authenticates this one native read receipt
  // as entryRevision+1. Until the actual first ACK commits it, a preferences
  // transaction would strand that source PC; never shift entry/history instead.
  if (state?.pendingScene?.sceneId === 'browser-morning-request' && state.pendingScene.cursor === 0) return 'Finish opening mail before changing saved sound settings.';
  return null;
}
/** No turn/RNG/event/resource/scene/result operation. The existing transaction
 * allocates exactly its normal command ID/revision for a real preference change.
 * @type {import('../turns/types.js').CommandHandler}
 */
export const audioPreferencesHandler = {
  plan(state,intent) {
    return intent.type === 'setAudioPreferences' && exactAudioPreferences(intent.audio) ? audioPreferenceBlocked(state) ? { kind:'rejected',reason:'unavailable' } : { kind:'mutation' } : { kind:'rejected',reason:'invalid-command' };
  },
  apply(context,intent) {
    if (intent.type !== 'setAudioPreferences' || !exactAudioPreferences(intent.audio) || audioPreferenceBlocked(context.state)) return { kind:'rejected',reason:'invalid-command' };
    const before = context.state.options.audio, next = intent.audio;
    if (before.master === next.master && before.music === next.music && before.effects === next.effects && before.muted === next.muted) return { kind:'unchanged' };
    context.state.options.audio = { master:next.master,music:next.music,effects:next.effects,muted:next.muted };
    return { kind:'changed',resumeDungeon:false };
  },
};
