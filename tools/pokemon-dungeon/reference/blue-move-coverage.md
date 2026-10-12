# Opening move coverage

Repeated Tiny Woods failures retain EXP, levels and learned moves. Every retained
level-up row can therefore become reachable without entering another dungeon;
four-slot replacement choices do not make later handlers out of scope.
`supportsMove` rejects unsupported execution before PP or turn loss.

The current boundary is **seven rejected move IDs across eight learnset rows**.
Normal first-attempt level-five-to-seven moves pass admission; that establishes
static coverage, not complete move behavior or a successful playthrough.

| Species | Role | Level | Rejected move | Missing owner |
| --- | --- | ---: | --- | --- |
| Squirtle | Hero/partner | 33 | Rain Dance | Weather state and damage/accuracy joins |
| Pikachu | Hero/partner | 33 | Agility | Positive-speed counters and additional opportunities |
| Treecko | Hero/partner | 31 | Agility | Same scheduler expansion |
| Machop | Hero | 31 | Vital Throw | Hurl reaction |
| Eevee | Hero | 36 | Baton Pass | Room target ordering and position exchange |
| Treecko | Hero/partner | 41 | Detect | Exact guard/status admission; Protect support does not imply Detect support |
| Torchic | Hero/partner | 37 | Mirror Move | Bounded reflected dispatch |
| Skitty | Hero | 19 | Assist | Eligible active-floor move selection and one replacement dispatch |

## Evidence and admitted follow-ups

Native owners below are comparative
[`pret/pmd-red@013475aa04f5be3191e5527c186d9bfceae7cae0`](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0),
not verified Blue binary behavior. The
[immutable full audit](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-move-coverage.md)
preserves the original 32-ID/44-row rejection matrix, proposals, EXP thresholds,
source line addresses and intermediate implementation reviews. Its checkpoint
is `049af6e219f10c54bb50fe648c34c6ff77eb6e64` (2026-10-10), factual JSON SHA-256
`f83fbc0ca71d9211ba429cec1d6cd41046c22bbdecc19c0756da8d54e729bd7d`.
Those counts and the former earliest rejection (Treecko Pursuit16) are historical.

| Admitted owner | Current evidence |
| --- | --- |
| Fixed/variable passes, whole-move EXP, Bonemerang | [Move execution](blue-move-execution.md) |
| Synthesis, Rapid Spin | [Move execution](blue-move-execution.md#synthesis-and-rapid-spin) |
| Foresight, Psych Up | [Stat moves](blue-stat-moves.md) |
| Charm, Screech | [Stat multipliers](blue-stat-multipliers.md) |
| Heal Bell | [Status cure](blue-heal-bell.md) |
| Mud Sport, Water Sport | [Floor timers](blue-floor-sports.md) |
| Skull Bash, Solar Beam, Fire Spin, Whirlpool | [Mechanics](blue-mechanics.md#charges-and-constriction) |
| Thrash | [Three-pass owner](blue-thrash.md) |
| Pursuit, Light Screen, Protect, Safeguard | [Counter](blue-counter.md), [screens](blue-light-screen.md), [Protect](blue-protect.md), [Safeguard](blue-safeguard.md) |

## Direct HP, recoil and items

| Move | Required behavior | Comparative owner |
| --- | --- | --- |
| Seismic Toss | Direct HP=user level, Fighting, giveExp=true | `move_orb_actions_2.c:741-751`; `dungeon_move.c:714-716` |
| Dragon Rage | Direct HP65, Dragon, giveExp=true; corner-cut adjacent range8 | `move_orb_actions_4.c:296-303`; `dungeon_config.c:195`; `dungeon_move_util.c:908-913` |
| Endeavor | Direct HP=max(0,targetHP-userHP), Normal, giveExp=false | `move_orb_actions_1.c:719-737` |
| Take Down, Submission, Double-Edge | Ordinary damage, then max(1,floor(userMaxHP/8)) recoil; Rock Head blocks | `move_orb_actions_2.c:222-245,502-523`; `dungeon_move.c:726-729` |
| Pay Day | Ordinary damage; money only after target entity removal | `move_orb_actions_3.c:370-389` |
| Covet | Nonzero damage, then whole held-payload transfer through zero-draw secondary gate | `move_orb_actions_4.c:393-442`; `dungeon_move.c:817-820` |

Direct HP bypasses normal power/critical/variance/accuracy2 draws. Accuracy1
still belongs to the caller; the type check is only Wonder Guard's gate, with no
such species admitted (`dungeon_damage.c:1415-1454`). Zero Endeavor produces no
number, EXP mark or contact sampling. Positive damage retains nominal overkill
numbers, Bide/Rage, drops and faint handling. Recoil is self-attributed with
`giveExp=false`; Struggle separately uses maxHP/4 without Rock Head immunity.
Contact flags are sampled during damage, recoil follows, then contact activation
and whole-move EXP settle in their native order. Thus recoil uses pre-level-up HP.

Pay Day's zero-chance gate tests user validity without a probability draw. A
fainted original partner remains a valid entity, so defeating it does not produce
money (`dungeon_misc.c:489-493`). Money generation makes one `DungeonRandInt(100)`
draw, repeatedly halves its table index under the floor bound40, and performs no
sticky draw (`dungeon_items.c:59-85,708-722`; `dungeon_data.c:112-123`). Placement
uses the first eligible of25 native offsets, even if the64-item pool then refuses
it; walls/stairs/items block, actors do not (`dungeon_pos_data.c:16-42`,
`dungeon_items.c:451-529`, `structs/str_dungeon.h:23`).

Every nonleader's held drop precedes faint/EXP and Pay Day money
(`dungeon_damage.c:653-745`), including partner defeat. The slot clears even on
lost placement; no automatic pickup or wallet credit follows. Covet requires a
surviving target/active floor, checks Shield Dust/Sticky Hold, then held slots;
Alert Specs/equipment are outside the admitted surface. Successful theft marks
user EXP, refreshes native initial sleep, retains held Poké quantity without
wallet credit, and emits no pickup sound. Its transfer precedes queued contact
activation. The item group's reviewed checkpoint was
`7eab2dd885edcd56b103f3456b0a71ffdc67e6c3`; late-level manual acceptance remains open.

## Nominal damage and secondary gate corrections

- False Swipe carries nominal damage through accuracy2 and shared damage. The
  number precedes the one-HP survival clamp; the survival message follows HP
  patching before the ten-frame hit wait (`dungeon_damage.c:347-357,410-413`).
  A positive hit at1 HP still triggers Bide/Rage/contact, without faint/drop/EXP.
- Bide release joins direct-HP contact before separate EXP settlement.
  `Bide2MoveAction` passes Fighting/reactions (`move_orb_actions_1.c:658-672`);
  sampling is `dungeon_damage.c:144-211`, activation `dungeon_move.c:1305-1308`.
  Zero energy still reaches accuracy1 against a target, without hit/number/mark.
- Mud-Slap and Dynamic Punch use explicit `secondaryChanceRaw:0`, so their
  validity/Shield Dust gate consumes no percentage draw
  (`move_orb_actions_3.c:254-265,485-499`). Other100% labels do not imply this rule.

## Metal Claw user secondary

Metal Claw's ten-percent secondary passes the user twice: target KO and defender
Shield Dust do not block it. User validity, active floor and prior native
`unk158` targeting history still gate the draw. Successful accuracy1 records that
history on the recipient, including Bide release. A transient weak actor set
tracks it: native initialization/`ReadMonster` clear it and `WriteMonster` omits
it (`dungeon_serializer.c`). New actors, floor entry and same-object Continue
reset it; ordinary autosave/preferences preserve live identities. No saved field
is invented. The stat helper and user EXP mark run even at the Attack cap, before
contact and whole-move EXP. Revival/cloning/new target owners need lifetime review.

## Remaining handler requirements

Weather admission must restore the removed clear-weather-only damage inputs and
review already accepted Thunder/Solar Beam interactions (`weather.c:sub_807EAA0`,
`dungeon_move_util.c:769-777`). Agility requires `gSpeedTurns`/`BoostSpeed`, not
only a timer. Detect must retain75 accuracy and the native self-hit exception
(`dungeon_move.c:192-255`). Assist selects from up to80 eligible party/enemy slots,
excludes charging/Sketch and replaces dispatch once even if it selects itself
(`dungeon_move_util.c:130-151,1110-1141`). Baton Pass uses
`move_orb_actions_4.c:SwitcherOrbAction`; reaction/reflection owners are in
`move_orb_effects_4.c` and `dungeon_damage.c:88-137`.

Guard acceptance does not certify weather, counter/recoil order, charge
interruption, multi-hit replacement, Blue identity or manual play. Historical
lint/type/AST reviews inspected source and data only; no game module or automated
playthrough was executed.
