const initialSceneUrl = new URL('../../assets/initial-scene.json', import.meta.url);
const manifestLimit = 4096;

/** The shell has no accepted model bundles yet. Reject resources until P06/P10
 * supply their reviewed loading contract; never turn arbitrary JSON into fetches.
 * @param {AbortSignal} signal
 * @returns {Promise<{background: string}>}
 */
export async function loadInitialScene(signal) {
  const response = await fetch(initialSceneUrl, { signal, cache: 'no-cache', redirect: 'error' });
  if (!response.ok) throw new Error(`The initial scene could not be loaded (HTTP ${response.status}).`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The initial scene response was empty.');
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      length += result.value.byteLength;
      if (length > manifestLimit) throw new Error('The initial scene exceeded its size limit.');
      chunks.push(result.value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  /** @type {unknown} */
  let value;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch (error) { throw new Error('The initial scene is damaged or incomplete. Try loading it again.', { cause: error }); }
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || !('schemaVersion' in value) || value.schemaVersion !== 1
      || !('background' in value) || typeof value.background !== 'string' || !/^#[0-9a-f]{6}$/.test(value.background)
      || !('assets' in value) || !Array.isArray(value.assets) || value.assets.length !== 0
      || Object.keys(value).some(key => !['schemaVersion', 'background', 'assets'].includes(key))) {
    throw new Error('The initial scene is invalid or belongs to a different application version.');
  }
  return { background: value.background };
}
