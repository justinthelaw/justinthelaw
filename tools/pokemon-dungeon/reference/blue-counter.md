# Pursuit and Counter

This bounded retry-scope owner admits Treecko's level-16 Pursuit using
comparative Red source at `pret/pmd-red@013475aa04f5be3191e5527c186d9bfceae7cae0`.
Original Blue timing and mix identity remain qualified.

- Pursuit has Dark power 8, PP 17, accuracy 125/100, critical 12, player USER
  range 7, AI tuple 0, and weight 30. The AI tuple scans an adjacent foe before
  the player tuple applies Counter to the user.
- Counter shares the Reflect class. A duplicate Counter does not draw a new
  timer or refresh it. Its ordinary target effect still renders. A fresh Counter
  replaces Reflect and stores a 7–12-opportunity timer.
- Beginning-of-opportunity expiry clears the class with the Counter-specific
  message. The existing Reflect shield icon represents the active class.
- Common physical direct-damage owners rebound the nominal damage after the
  original hit and before secondary, recoil, and contact owners. Sleep and the
  represented Bide class suppress the reaction. This includes Bide, Rage and
  Skull Bash; the existing Solar charge field retains the same source-class gate,
  though no admitted Counter learner also learns Solar Beam. Native freeze
  suppression remains source evidence but its removed browser field is not
  restored. Counterattack damage cannot recurse.
- Effect 321 uses pinned `efob006` animation 0 and owns sequence 853 once on its
  first source update. The finite cue reuses bank 026 voice 16 / wave 110, adds
  no decoded sample, and retains the existing dynamic player caps.

Old saves omit `status.counter` and remain valid. New saves persist its optional
timer; Reflect and Counter cannot coexist. Mini Counter, Mirror Coat, Protect,
Detect, and the broader campaign reflect family remain outside this owner.

## Deferred experience

A Counter KO can remove the acting wild before its caller reaches
`EnemyEvolution`. Native `AddExpPoints` records `expGainedInTurn`; the next
eligible actor's scheduler applies that award after beginning-of-opportunity
timers and before input or AI. For example, the last wild can fall while the
hero's Counter timer has one opportunity left: Counter expires before the EXP
message at the next preparation. Applying the award inside the dead wild's
move would reverse that order.

The browser retains only the two party awards in an optional
`pendingExperience` record. Live playing and stairs checkpoints retain it,
including forced turns on stairs. Defeat, rescue and new floor/retry transitions
discard it. Existing saves without the field remain valid; no native history is
inferred from their current EXP. This is source-reviewed behavior, not a manual
high-level playthrough result.

Owning comparative sources at the pinned revision:
[award and level processing](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_leveling.c),
[scheduler boundaries](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_engine.c),
and [Counter damage](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_damage.c).
