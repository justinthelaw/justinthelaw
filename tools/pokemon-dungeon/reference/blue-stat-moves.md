# Foresight and Psych Up in the opening

These handlers cover learned moves reachable after repeated Tiny Woods retries.
They add no later dungeon, saved fields or battle executor. Evidence is the
pinned [comparative Red source](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0);
Blue binary, sound and physical frame parity remain unverified.

## Foresight

Mudkip learns Foresight at level 19 and Machop at level 22. Exact move-record
admission requires the existing front/opponent profile, 22 PP, accuracy 100,
one pass, evasion clamp and Ghost-immunity facts. The common executor owns
the PP charge, target selection, accuracy draw and target EXP mark.

`ExposeMoveAction` calls `ExposeStatusTarget` in
`src/move_orb_actions_1.c:590` and `src/move_orb_effects_2.c:916`.
Evasion above neutral is clamped to 10; lower stages remain lower. The target
then receives the non-Ghost result message. None of the 20 admitted battle
species is Ghost, no admitted move changes types, and Safeguard remains
unavailable. The static roster check rejects adding Ghost targets until
exposed-state behavior is implemented.

The full visual helper matters: `src/dungeon_8041AD0.c:743` substitutes
`TYPE_GHOST`, numerically **14**, for non-Ghost targets. Effect 122 is therefore
not shipped. Effect 14 uses existing `efob000` source artwork, palette 3,
attachment -1, and 11 frames lasting 22 ticks. Its generic application captures
the attachment/depth once, retains the terminal drawn frame and keeps the
native 100-tick wait limit.

## Psych Up

Psyduck learns Psych Up at level 31 and is a hero-only species. Save validation
binds the dungeon actors to the selected eligible hero/partner pair.
`src/move_orb_actions_2.c:198` copies the target's offensive, defensive and
hit-chance stages and multipliers to the user. The browser copies its six
existing stage values. All admitted moves leave the separate Q8 multipliers
neutral at 256; adding Charm or Screech requires extending that copy and the
damage inputs together.

The comparison in `src/move_checks.c` belongs to AI Status Checker selection,
through `src/dungeon_ai_attack.c:671`. It is not a human-cast rejection rule.
The handler preserves ordinary PP/accuracy ownership and synchronizes the user
after copying. Existing stage save validation and floor reset remain unchanged.
The ordinary move-target route owns effect 205 once, before the copy; adding
another generic effect would duplicate it. Its `efob058` sequence has 23 frames
lasting 35 ticks and retains its terminal frame through the result beat.

## Artwork, audio and acceptance

The basic effect bank appends IDs 14 and 205. All original 16 effect records,
249 pose indices/layer rectangles and 274,877 covered pixels are preserved.
Only the three pinned `efob058` source files are added to the archive; all 48
previous archive entries remain exact. Existing encoded/decoded budgets remain.

Sounds 613 and 756 are not newly implemented. Sequence 756's 60 notes do not fit
the current finite scheduling representation; merely raising a voice count
would not resolve its sub-frame note timing. No exact audio or manual casting
of these later-level moves is claimed.

The prior 22 rejected learned IDs/31 learnset rows become **20 IDs/28 rows**.
This count excludes internal records such as `bide-release`, which uses a
dedicated execution path. Ordinary first-attempt loadouts remain unchanged.
Source review, artifact-preservation receipts and limitations are retained in
`.work/blue-parity-20261011/stat-review/`, `stat-art/` and `stat-audio/`.
