# Ordinary save receipts

## Scope and observed source cost

An accepted command runs full campaign validation. Its ordinary autosave then
validates the new snapshot and reads both durable envelopes. Each existing
envelope previously ran full validation twice: raw decode and canonical
re-encoding. With a primary and backup, that is six full validations per
command/save cycle. This count is static call-graph evidence, not a measured
duration or a gameplay acceptance result.

The repository now retains the two exact canonical envelopes from its own last
successful ordinary write. Each receipt contains the unchanged encoded text and
the codec's detached deeply frozen snapshot/envelope. Only the next ordinary
save preparation may reuse them, and only for a full exact text match after a
fresh adapter read. No revision, digest, generation or header is a cache key.
The new snapshot still passes full encoding/validation on every save.

## Admission and lifetime

- Public load, recovery, confirmation and file import always execute the
  original full codec. The byte-pinned codec and all historical pins are
  unchanged; hash verification still precedes original-envelope conversion.
- Cache misses, changed bytes, failed slots and empty slots retain their
  original behavior. Original legacy text cannot match a normalized current
  receipt; migration is never inferred from a header or cached generation.
- Only `writeJob` can seed receipts, after both successful `encodeSave` and
  atomic `commit`. Public/exclusive commit arguments cannot seed them. Failed
  encoding, stale guards, failed writes and quota errors mint no receipts.
- The cached backup is precisely the successfully admitted primary or fallback
  backup chosen by the existing commit owner. Invalid primary protection,
  generation comparison, transaction CAS and all guard checks remain intact.
- The cache belongs to one repository and its trusted local content lifetime.
  Its content, policies and identity interfaces must be frozen; mutable or
  incomplete injected interfaces keep full decoding. The selected shell closes
  the repository before disposing its catalogs. Changing content/catalog owners
  requires constructing a new repository.
- Each successful ordinary write replaces the entire private map with at most
  two receipts. Combined encoded text is limited to 2 Mi UTF-16 code units;
  larger envelopes simply keep full decoding. There is no growing history.
  Reset and disposal clear the map; completion after disposal cannot refill it.

## Concurrency review

Save jobs remain serialized and waiting autosaves retain the original epoch/slot
coalescing. A preparation captures one private receipt map; maps are replaced,
never mutated after publication. Concurrent public preparation always decodes
independently. Receipt reuse never adopts a storage generation or grants write
authority: another tab's changed generation still conflicts, and changed text
with the same generation misses the cache. Adapter slot failures are returned
before lookup. Disposal/epoch guards still run after each awaited operation.

## Verification and remaining acceptance

`tools/pokemon-dungeon/scripts/check-save-receipts.mjs` parses source, checks
exact cache helpers and the sole ordinary-writer path, authenticates every
unrelated repository statement against its pre-change bytes, checks the frozen
codec hash, and rejects eleven deliberate source mutations. It is included in
`save-boundaries:check` and never imports or executes game modules.

Local parser/type/lint execution remains dependent on the pinned tool install;
the current environment's security policy blocks that install. Independent
review, hosted static checks and same-save manual browser timing are required.
No latency improvement, interrupted-save/device acceptance or full-campaign
completion is claimed by this source change.
