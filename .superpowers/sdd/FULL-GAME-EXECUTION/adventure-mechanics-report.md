# Archived adventure-mechanics report

Historical checkpoint on `feat/pokemon-full-campaign`, base `9062593`, with review
repair based on `5bd53a7483d23e13eb560e9592278111b88ae9e3`. That branch is no longer
an active task. The selected [Blue opening](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md)
supersedes this retired domain/application architecture.
[Original report](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/.superpowers/sdd/FULL-GAME-EXECUTION/adventure-mechanics-report.md).
Paths below refer to the historical game tree, not current commands or handoffs.

## Recorded implementation and source

`src/domain/gameplay/` supplied 15 turn hooks, actor/item construction, regular
attacks and 24 normal-damage move programs, partner swaps, bounded deterministic
AI, XP/growth, regeneration/hunger, arrivals/sleep, reactions, stairs and defeat
settlement. Its opening applied a once-only Lv1-to-Lv5 boost, three Tiny Woods
floors, acknowledged Caterpie rescue and an idempotent reunion berry reward
(storage when the bag was full). Defeat retained growth/moves, lost all carried
money and independently removed 50% of bag slots; retry retained party ownership.

Comparative Red source was `6bcbec4f906938c0243aa2026bcbd41b577bab85`, alongside
Blue factual catalogs; no instruction-level Blue or RNG-sequence parity was claimed.
Static catalog joins covered all 16 starters. Pikachu Static/Skitty Cute Charm
used 12% surviving-adjacent-physical-hit reactions; Tiny Woods excluded Pickup,
Eevee was hero-only and Run Away excluded the leader. Four wild species retained
source Lv1 moves, default IQ and sleep chances. Level learning sampled one source
move per level, with explicit full-slot decline; rational quantities and named RNG
streams were retained.

The shared turn engine detected synchronous floor/session replacement before
applying old after-stages. Partner swaps used both `0x8000` flags, counterpart
beginning tick/reverse walk, then `0x4000` normal-pass skip. `createGameplay`
returned content, authored placements, handlers, turns and scene/choice/visibility/
actor/presentation getters from species/effects/onboarding/campaign/dungeon/
navigation catalogs. Raw actors still required visibility filtering. Nonfinal
stairs required `advance` before the next gameplay input. Retired contracts were
`plan/GAMEPLAY-OPENING.md` and `plan/TURNS-CONTRACT.md`.

## Recorded static checks

All listed checks exited zero under the historical `tools/pokemon-dungeon` package:

| Check | Historical evidence |
| --- | --- |
| Lint / typecheck | 201 authored files / 123 authored source files |
| Species | 386 species, 419 profiles, 384 numeric resources, 386 learnsets |
| Effects | 27 resources, 356 moves, 413 actions, 240 items, 266 families, 66 statuses |
| Onboarding | 56 questions, 26 outcomes, 129 pairs, 16 Lv1/Lv5 loadouts |
| Dungeons | 25 resources, 45 field + 22 maze identities, 1,427 + 66 primary floors |
| Campaign | 1,011 predicates, 586 transitions, 83 routes |
| Navigation | 424 mobility profiles, 419 forms, 1,497 floor joins |
| Rules | 324 exact matchup cells and source/table checks |
| Diff hygiene | No whitespace errors |

No game module execution, game test, automated playthrough, gameplay screenshot
or human acceptance was recorded.

## Review repair and limits

Review I1 found generic `resultShape(plan/applied)` TurnFault handling discarded
explicit failure codes, mapping rejections to `unavailable` and requirements to
`turn-content`. The facade in `src/domain/adventure.js` preserved synchronous
`reason`/`requirement` before the generic checker. Static tracing showed plan
failures before transaction preparation and apply failures before resumption,
revision assignment and event numbering. Rejected drafts returned empty events
at the live revision; only validated success committed snapshot/counter changes.
Promise/malformed-result and turn-hook semantics were unchanged. Lint (201),
types (123) and diff hygiene passed again without game execution.

The checkpoint explicitly excluded later dungeons/campaign, team naming/mail,
town services/missions/rescue exchange, recruiting/bosses/fixed rooms, shops/traps/
weather, full native AI, full-slot learning UI, complex/ranged/linked/multi-hit/
status/drain/recoil moves, unsafe-terrain swaps and held/equip/throw/drop commands.
The full-toolbox plus storage-999 reward choice was blocked by
`reward-storage-choice`; full-slot decline emitted `move-learning-declined-full-slots`.
Retry staging was adapted. Application/render/input/persistence integration and
human runtime review remained pending then; this is not current scope or a
full-game completion claim.
