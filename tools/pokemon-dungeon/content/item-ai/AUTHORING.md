# Native item AI metadata

This additive factual owner preserves the frozen effects corpus and its old-save
integrity pins. `facts.json` authors all240 native array positions as explicit
ordered self-use/ally-throw/enemy-throw boolean triples, joined by `internalId`
to canonical item IDs. All categories, menu actions and spawn ranges compare
against the existing complete item corpus. Omitted spawn ranges stay null.

The raw `native-item-data.json` snapshot is data/item/item_data.json from
pret/pmd-red at `6bcbec4f906938c0243aa2026bcbd41b577bab85`. Source hashes and
locators are in facts.json. The snapshot stores factual item parameters and
symbol names, not commercial descriptions or extracted game assets.
The43 explicit triples are copied exactly; the197 omitted triples are confirmed
zero defaults from dungeonjson.cpp666–680 and751–774. str_items.h7–24 fixes
flag order; item.h12–24 fixes category numbers, including unused category7.

`npm run item-ai:export` validates every row against this snapshot and the
unchanged effects items, then projects a local immutable browser resource.
`npm run item-ai:check` performs the same static joins and byte comparison.
Neither command imports or evaluates any game module. Normalized category,
action and throw facts retain their existing owner; no narrow sample replaces
the complete catalog. The additive resource has no save-state field.

These are pinned original Red comparative facts, without Blue binary proof.
AI eligibility is distinct from Item Master, action selection, targeting,
conditions, autonomous use/throw execution, catching or command permission.
This checkpoint implements none of those additional behaviors.
