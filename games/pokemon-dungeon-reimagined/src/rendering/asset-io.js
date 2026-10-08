const base = new URL('../../assets/characters/pixel/', import.meta.url);
/** Bounded stream reads into one declared-capacity buffer before JSON/decode.
 * No unbounded chunk list; a short response needs at most one final trim copy.
 * @param {URL} url @param {number} limit @param {AbortSignal} signal */
export async function readLocalBytes(url, limit, signal) {
    if (url.origin !== base.origin || !url.pathname.startsWith(new URL('../../', import.meta.url).pathname))
        throw new Error('Art URL leaves the local game.');
    const response = await fetch(url, { signal, redirect: 'error', cache: 'no-cache' });
    if (!response.ok)
        throw new Error(`Art fetch failed (${response.status}).`);
    const reader = response.body?.getReader();
    if (!reader)
        throw new Error('Art response is empty.');
    let length = 0;
    const bytes = new Uint8Array(limit);
    try {
        for (;;) {
            const value = await reader.read();
            if (value.done)
                break;
            if (length + value.value.byteLength > limit)
                throw new Error('Art response exceeds declared budget.');
            bytes.set(value.value, length);
            length += value.value.byteLength;
        }
    }
    finally {
        await reader.cancel();
        reader.releaseLock();
    }
    return length === limit ? bytes : bytes.slice(0, length);
}
/** @param {Uint8Array<ArrayBuffer>} bytes */
export async function sha256(bytes) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join(''); }
