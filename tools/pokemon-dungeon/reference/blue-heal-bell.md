# Heal Bell in the opening runtime

Heal Bell is admitted for Skitty's level-37 retry path. Its exact guarded move
record is Normal, power 2, PP 12, accuracies 125/125, critical chance 12, one
hit, room allies, AI weight 15, and one `cure-negative-statuses` operation.
Pinned comparative Red source routes Heal Bell through the common per-target
status cure; exact Blue-binary call order remains unverified.

The represented cure order is sleep; the poison/burn/paralysis class; the
confusion/infatuation/cringe class; Leech Seed; Whiffer/Focus Energy; then slow.
Each active class emits its cure message and a state sync. Entering the negative
status block also clears a dormant Leech Seed source binding, even when Leech
Seed is no longer active. Focus Energy alone remains because it is positive and
does not enter that block; Focus Energy is cleared with its whole native class
when any represented negative status caused entry. Unaffected allies report
that nothing happened. Unrepresented native classes are not invented.

The native-qualified presentation route uses actor animation 12, preparation
effect 22, and cast effect 50. The successful per-target cure uses effect 21
with attachment set 3 and a fixed target anchor, starting from a fully post-cure
snapshot so old status icons cannot return during the effect. Effect 50 is
stored in the existing basic bank; no third runtime bank is added.

No AI branch is added. Skitty is hero-only in the selected partner table, Heal
Bell occurs only in Skitty's selected learnset, and the hero is controlled by
the player. The implemented move is a late-retry route and has not been manually
cast. Its mechanics and art admission are statically reviewed comparative-source
translations, not proof of exact Blue-binary behavior.

Heal Bell closes one rejected move ID and one learnset row. The current static
late-retry gap is **17 distinct move IDs across 22 learnset rows**.

## Evidence

- `tools/pokemon-dungeon/.work/blue-ready-20261011/heal-bell-mechanics/source-evidence.md`
- `tools/pokemon-dungeon/.work/blue-ready-20261011/heal-bell-mechanics/heal-bell-independent-review.md`
- `tools/pokemon-dungeon/.work/blue-ready-20261011/heal-bell-art/README.md`
- Pinned comparative Red revision `013475aa04f5be3191e5527c186d9bfceae7cae0`
- [Common cure and class endings](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/move_orb_effects_5.c#L39)
- [Native negative-status classifier](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_logic.c#L471)
- [Cure-effect controller](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_8041AD0.c#L983)
