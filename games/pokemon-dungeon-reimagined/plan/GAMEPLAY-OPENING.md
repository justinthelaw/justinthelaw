# Concrete opening mechanics checkpoint

This package composes canonical Adventure commands and all fifteen TurnHooks for
the authored rescue request, Tiny Woods B1F–B3F, Caterpie rescue, return reunion,
and source berry reward. Application, persistence and renderer wiring follows.
This is not full-campaign completion or observed human playability.

## Public integration

Import `createGameplay` from `src/domain/gameplay/index.js` and provide the loaded
species, effects, onboarding, campaign, dungeons and navigation catalogs. It
returns `content`, `authored`, `handlers`, `turns` and read-only view helpers.
Use that same `content` with canonical `createCampaign`/`validateCampaign`, then
pass the resulting snapshot, content, handlers and turns to `createAdventure`.
All mutation must use `Adventure.dispatch` with its epoch and current command
context. Do not mutate view data or maintain a second gameplay state.

| Helper | Consumer |
| --- | --- |
| `getSceneText(snapshot)` | Current original authored dialogue line or null; acknowledge using the canonical scene instance/cursor/revision |
| `getDungeonChoices(snapshot)` | Tiny Woods entry choice and concrete availability requirement; dispatch `enterDungeon` |
| `getMoveChoices(snapshot)` | Exact leader move slots, names, PP and unsupported/unavailable reason; dispatch `useMove` |
| `getVisibility(snapshot)` | Canonical sight projection or null outside dungeon |
| `getActors(snapshot)` | Raw on-map actor facts with exact species/form identity; apply domain visibility when displaying |
| `getPresentation(snapshot, epoch)` | PresentationCatalog for existing `projectDungeon`; application owns epoch and event-driven animation |
| `authored` | Meadow geometry bounds, town placements and three scene definitions |

Commands: `ackScene`, `enterDungeon`, `advance`, `face`, `move`, `wait`, `attack`,
`useMove`, `useItem`, `useStairs`, `giveUp`, `presentation`. Stairs atomically
install a new floor and initial scheduler; after the accepted `floorChanged`
event, dispatch `advance` before another movement/combat command. Entry already
advances to leader input. Final stairs open the rescue scene; its acknowledgement
settles success and opens reunion. Reunion acknowledgement grants one Oran,
Pecha and Rawst Berry once, routing overflow to storage. Failure settles retained
growth/items immediately, emits `expeditionEnded`, and exposes typed retry entry.

## Source and deliberate browser policies

The adopted source qualification is [RULES-BROWSER-CONTRACT.md](RULES-BROWSER-CONTRACT.md):
original Blue catalogs plus pinned original Red comparative source commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85`. No native RNG sequence parity is claimed.
Canonical named browser streams are the sole random authority.

| Behavior | Pinned comparative source |
| --- | --- |
| Once-only first entry Lv1→5 boost and filled empty move slots | `run_dungeon.c:sub_8043FD0`, `exclusive_pokemon.c:sub_80980A4` |
| Wild initialization, default IQ, Tiny Woods Pickup exclusion | `dungeon_mon_spawn.c`, especially Pickup guard near619; `data/monster/monster_data.json` |
| Attack accuracy and physical-type damage | `dungeon_move_util.c:sub_8057070` and accuracy helper; `dungeon_config.c:gAccEvsStatStageMultipliers`; accepted rules core |
| Static/Cute Charm12%, physical type, adjacent surviving target | `dungeon_damage.c:HandleDealingDamage_Async`; `dungeon_config.c`; `dungeon_move.c:TriggerTargetAbilityEffect` |
| Paralysis1+1 and infatuation4/5+1 turns, beginning decrement | `dungeon_random.c:CalculateStatusTurns`, `dungeon_turn_effects.c:TickStatusAndHealthRegen`, `dungeon_range.c:sub_80838EC` |
| Safe partner swap and special beginning/action pass | `dungeon_main.c:sub_805EC4C`, `dungeon_engine.c:sub_8044454`; both0x8000 flags are ordinary swap flags despite canonical field name `petrifiedSwap` |
| Hunger6554/65536 per leader end, passive regeneration, arrivals36, wind1000 | `dungeon_turn_effects.c`, `dungeon_mon_spawn.c`, `dungeon_wind.c`; floor restriction catalog |
| Shared XP and one sampled level move | `dungeon_damage.c`, `dungeon_leveling.c:sub_8072778`, `pokemon.c:GetMovesLearnedAtLevel` |
| Defeat50% inventory-slot loss, all carried money loss, permanent growth retained | `main_loops.c:RemoveMoneyAndRandomItems`, `dungeon_misc.c:sub_8068BDC`, `pokemon.c:DungeonMonToRecruitedPokemon` |
| Reward only after reunion; full bag routes to storage | `ground_data_d01p01_station.h` group3; `textbox.c`; `code_801B60C.c` |

The browser AI is an explicit deterministic source-legal choice policy: adjacent
regular attack; otherwise legal sight-limited chase or partner follow; otherwise
wait. It does not emulate original move selection, weighted decisions or roaming.
Unsupported move effects are not replaced by different attacks when requested.
The normal level-learning full-four-slot path explicitly chooses the legal decline
and emits a message. A move-choice UI remains open; normal level-up samples one
source candidate, while the initial boost uses its distinct source algorithm.

Original dialogue and meadow/clearing staging are authored browser adaptations.
Native campaign variables retain the explicit initial reset; these scenes do not
claim cartridge ground-script cursor parity. Retry is exposed as a choice rather
than replaying the native automatic-entry cutscene.

## Admission and remaining scope

All16 original starter profiles and129 legal pairs remain admissible. Static and
Cute Charm are implemented. Pickup is explicitly disabled by source in Tiny
Woods. Eevee's Run Away excludes the leader, and Eevee is hero-only. The remaining
starter abilities are handled by the damage core or have no trigger under this
clear-weather, regular-AI, no-recoil/no-explosion supported subset. The four
wild species retain exact Lv1 moves and sleep chances: Pidgey8%, Sunkern5%,
Wurmple5%, Exeggcute40% (B3F only).

Supported actual moves are the24 single-hit front normal-damage-only programs
selected directly from accepted effect records; other moves expose an explicit
requirement. Berry self-use, floor pickup, regular attacks, team shared XP,
safe swaps, hunger, regeneration, arrivals, stairs and atomic settlement are concrete.
The three effect-cursor hooks explicitly reject unsupported cursors: all admitted
effects finish synchronously, and saved continuations admit only the actual input,
fresh-floor and final-rescue boundaries.

Still unsupported: other dungeon/campaign admissions; team naming/rescue-kit
mail and later town services; full original AI; move selection at full slots;
linked/multiple-hit/ranged/status/drain/recoil and other complex effects;
unsafe terrain swap confirmation/relocation; held-item commands, throw/equip/drop;
traps/shops/recruitment/fixed rooms/bosses/missions/rescue exchange; nonempty
weather and general persistent effect programs. Full storage plus full toolbox
reward choices are also unsupported, but unreachable through this opening's
empty-storage, once-only reward path. Application/controls/persistence/runtime art
and human play/visual review are the next responsibility and are not evidenced by
static checks.
