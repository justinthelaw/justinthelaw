# Thrash in retained Tiny Woods retries

Cubone is the only selected learner: level 37, hero only. Retries preserve its
level, learned moves and EXP, so this is part of the retained opening state
surface. The exact Thrash record is admitted without adding a save field,
move-copying owner, actor species, effect bank or sound sample. The other later
moves retain their current admission guards.

Pinned comparative Red [TryUseChosenMove](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_move_util.c#L392)
uses the fixed chained count of 3, with no count draw. After each pass's entity,
floor and CannotAttack checks, Thrash draws a fresh native direction (South,
Southeast, East, Northeast, North, Northwest, West, Southwest), updates facing
and scans the newly faced front tile. Empty tiles still consume that draw and
produce a cast; they do not end the remaining passes. Directions may repeat.
The independent action-level confusion draw remains before the ordinary move
handler, so a confused accepted action can consume that draw plus up to three
inner Thrash draws. Its final facing is the last executed pass's direction.

Each occupied pass retains the shared accuracy1, damage/accuracy2, contact and
faint owners. Target category 2 permits either side, including the partner;
it does not multiply the front scan into an area attack. Misses do not stop
later passes. A new blocker or terminal floor condition stops before the next
direction draw. PP is spent once and the use message is emitted once. EXP is
settled after the chosen move, using the existing original-partner and leader
KO distinctions. Thrash uses ordinary 1.0 damage; the source's post-move
confusion belongs to Outrage, and its recharge/Paused owner lists four other
moves. Neither is invented for Thrash. Native paused/frozen/wrapped/runaway
classes remain outside the represented status set.

The [move route](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_data.c#L473)
is preparation 6, actor animation 1, no cast/target/travel overlay and STOP direct
sound. The first displayed pass alone creates preparation 6. The existing
`efob008` selection has 27 one-tick frames, palette 3, attachment −1, no loop and
a blocking wait flag. Cubone animation 1 already contains all eight directions,
each with 19 ticks and a release flag at nominal tick 12. Later Thrash casts
finish the prior actor tail but do not insert a global effect drain: native
`sub_806CF18` finishes actor playback between passes, while the TRUE effect drain
is outside the chosen-move loop. This allows the first preparation's tail to
overlap a later empty pass. Other moves' current drain behavior is unchanged.
No new endpoint, target or projectile receipt is needed.

All three battle PNGs/metadata, their source archives and pose evidence, the
motion module and Cubone's PNG/metadata remain byte-identical. The 56 selected
effects use 3,948,544 decoded atlas bytes; with the 53,248-byte Hypnosis plane,
4,001,792 stays below the unchanged 4 MiB bound. The 8,192 event cap also stays:
Thrash contributes at most three single-target/empty cast pieces within the
existing twelve-piece allowance for one party action. It creates no new queue,
status, linked action or asynchronous gameplay work.

Audio remains qualified. Native preparation sound 605 is SE5/group 5, bank 028
voice 9, wave 095, with bend and modulation controls. It is not in the admitted
PCM catalog. Existing authored attack/impact feedback remains; it does not
reproduce 605 or the original mix. No audio tuple, player, quota or music changes
are part of this handler. The separate [audio reference](blue-audio.md) retains
the other native impact/Blue-driver gaps.

Mechanics commit the bounded action once. Existing pause/visibility/faint
publication, reduced-motion, carry and disposal owners consume presentation
without rerunning its RNG or targets. Source/AST checks and offline asset
reproduction do not establish manual level 37 play, physical-frame timing,
audio audition or Blue binary identity. The comparative source clock, authored
message text and existing browser PRNG qualifications remain explicit.
