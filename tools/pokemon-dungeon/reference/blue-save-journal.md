# Opening save ownership

`src/blue/save.js` retains the version-one envelope and only accesses
`pokemon.blue-rescue-opening.v1.0` and `pokemon.blue-rescue-opening.v1.1`.
Historical campaign keys, the opening validator, checksum, payload shape and
revision bounds are unchanged.

`load()` clears prior cached state, reads both slots twice, and requires equal
observations before accepting an ownership receipt. It validates each envelope
and adventure independently, selecting the highest valid revision as before.
An unchanged corrupt fallback slot may be replaced on a later save, but its
bytes only detect changes: they never establish a valid revision or checkpoint.
The existing app confirmation still owns replacement of an unreadable journal.
A failed or changing read grants no write or delete ownership.

Before writing, the repository compares both current serialized slots with its
last observed or verified pair. Different bytes, deletion and newly corrupt data
all reject the stale operation, even when a revision or checksum coincides.
An unchanged payload is a no-op only after this ownership check. A changed
payload writes the alternate slot and reads back the complete expected pair,
including the untouched recovery slot. The next revision and cached checkpoint
advance only after that verification. Export parses the retained verified
payload; later mutations of the live adventure cannot alter that checkpoint.

The existing explicit Delete Save Data confirmation remains required. Removal
checks the same receipt before deleting, removes the nonselected slot first,
and checks both slots after each removal. It preserves the selected checkpoint
until the intermediate check succeeds. After a partial removal or ambiguous
write, it attempts no rollback or further cleanup; further mutation requires a
fresh load. Successful removal owns the empty pair, so a new adventure can save.

These are bounded optimistic checks, not cross-tab transaction isolation.
The [HTML storage model](https://html.spec.whatwg.org/multipage/webstorage.html)
does not provide an atomic compare-and-swap or a locking guarantee across agent
clusters. Another process can change storage between a check and an operation;
simultaneous writers and changes that restore identical bytes remain unproved.
This patch adds no lock key, asynchronous API, Web Lock or storage listener.

Validation is source-only: syntax, strict types, lint, hygiene hooks and an AST
comparison of the unchanged validator and checksum. It does not execute a game
module or claim a tested two-tab browser interleaving.
