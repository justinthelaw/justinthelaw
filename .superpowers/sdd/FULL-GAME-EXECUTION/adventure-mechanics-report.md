# Adventure mechanics implementation report

Owned scope: concrete Tiny Woods opening consumer of canonical Adventure, on the
original `feat/pokemon-full-campaign` branch starting at `9062593`. No push,
merge or publish. Unrelated untracked evolution work is preserved.

## Implemented responsibility

`src/domain/gameplay/` now supplies command handlers, all15 TurnHooks, source
actor/item construction, regular and24 supported normal-damage move programs,
safe partner swaps, deterministic legal AI choices, shared XP/level growth,
passive regeneration, hunger, periodic arrivals, native spawn sleep, Static/Cute
Charm reactions, floor stairs, faint/wind/give-up settlement and original authored
request/rescue/reunion scenes. Entry applies the once-only sourced Lv1→5 boost.
Success requires all3 floors, acknowledged Caterpie rescue, and an idempotent
reunion berry grant; full bag rewards go to storage. Defeat retains permanent
growth/moves, loses all carried money and independently loses50% of bag slots.
Retry reuses canonical party ownership without repeating the initial boost.

`content/state/` admits these actual known story nodes, actor bindings, resources,
reaction sources/timers, floor counters and saved scheduler boundaries. Unknown
effect programs and unrelated campaign paths still block with named requirements.
No replacement campaign store, pass-through policy or callback receipt was added.

One foundation correction in `src/domain/turns/engine.js` is load-bearing:
`beginAction` detects session/floor replacement after the synchronous action and
does not apply its old after-stage into a newly installed scheduler. All other
turn scheduling remains the shared engine. Ordinary partner swaps use the
existing special pass: both0x8000 flags, counterpart beginning tick/reverse walk,
then0x4000 normal-pass skip.

## Source decisions and static self-review

See `plan/GAMEPLAY-OPENING.md` for pinned source locators and bounded adaptations.
Source reference is the adopted original Red comparative commit
`6bcbec4f906938c0243aa2026bcbd41b577bab85`, alongside original Blue factual catalogs;
there is no instruction-level Blue or RNG-sequence parity claim.

Catalog-only inspection joined all16 original starters to abilities. No legal
starter/partner pair is gated by the remaining reactive-ability guard. Pikachu
Static and Skitty Cute Charm now trigger at12% after surviving adjacent physical
type damage; their wild recipient timers and action/speed effects are concrete.
Meowth Pickup is explicitly excluded in Tiny Woods by source. Eevee is hero-only
and Run Away excludes the leader. Other starter abilities are damage-core handled
or have no triggering action/weather in this supported opening subset. The four
wild species retain exact source Lv1 moves/default IQ and sleep chances.

Self-review corrected normal level learning to sample ONE source move per level
(distinct from the initial boost), retained an explicit full-slot decline message,
added ordinary partner swaps, reduced all rational quantities, kept source RNG
draws at explicit named-stream sites, closed full-bag reward routing, and checked
terminal floor replacement and repeated defeat entry ownership by source reading.
These are static traces, not runtime observations.

Fresh checks all exited0:

| Command (under `tools/pokemon-dungeon`) | Evidence |
| --- | --- |
| `npm run lint` | 201 authored files, no game execution |
| `npm run typecheck` | 123 authored source files, strict static checking |
| `npm run species:check` | 386 species,419 profiles,384 numeric resources,386 learnsets |
| `npm run effects:check` | 27 resources,356 moves,413 actions,240 items,266 families,66 statuses |
| `npm run onboarding:check` | 56 questions,26 outcomes,129 pairs,16 Lv1/Lv5 loadouts |
| `npm run dungeons:check` | 25 resources,45 field+22 maze identities,1427+66 primary floors |
| `npm run campaign:check` | 1011 predicates,586 transitions,83 routes |
| `npm run navigation:check` | 424 mobility profiles,419 forms,1497 floor joins |
| `npm run rules:check` | 324 exact matchup cells and literal-table/source checks |
| `git diff --check` | No whitespace errors |

No game module was imported or executed. No test suite or automated playthrough
was created/run. No gameplay screenshot or human acceptance is claimed.

## API and next application owner

`createGameplay(catalogs)` returns `{content,authored,handlers,turns,getSceneText,
getDungeonChoices,getMoveChoices,getVisibility,getActors,getPresentation}`.
Catalogs require species/effects/onboarding/campaign/dungeons/navigation.
The application uses this content in `createCampaign` and `createAdventure`,
keeps snapshots/epoch authoritative, and dispatches typed intents through the
existing transaction context. Ground rendering consumes `authored` meadow and
town placements; dungeon rendering consumes visibility and PresentationCatalog.
Raw `getActors` includes every live actor, so UI must apply domain visibility.

Supported intents and exact handoff sequence are documented in
`plan/GAMEPLAY-OPENING.md`. In particular after a nonfinal `useStairs` installs a
fresh floor, the application dispatches `advance` before the next gameplay input.
After a defeat it presents the emitted outcome and Tiny Woods retry choice.
After reunion it presents the returned town and reward; later campaign is pending.

Next responsibility: wire sourced personality selection/partner choice, campaign
creation/save reopening, these handlers/hooks, emulator keyboard/touch intents,
scene/menu acknowledgement, HUD and event messages, existing canonical renderer
projection and exact species runtime art. Then obtain allowed human gameplay and
visual review. Root owns review/publication; this report is ready for scoped review.

## Exact unsupported requirements

- Other dungeon admissions and later campaign/ground-script progression, team
  naming, rescue-kit mail, town services, generated missions, rescue exchange,
  recruiting, bosses/fixed rooms, shops/traps and nonempty weather.
- Full native AI selection/roaming. Current deterministic policy legally chooses
  adjacent regular attacks or sight-limited movement/follow/wait; it never silently
  substitutes for a requested unsupported move. No full AI parity claim.
- Full-slot move learning UI. The legal decline policy emits
  `move-learning-declined-full-slots`; it cannot roll back an otherwise valid KO.
- Complex/ranged/linked/multi-hit/status/drain/recoil moves and general effect
  continuations. `useMove` rejects unsupported programs;24 single-hit front
  normal-damage-only catalog programs are concrete.
- Unsafe terrain swap confirmation/relocation, held-item/equip/throw/drop commands.
- Full toolbox AND per-item storage999 reward choices (`reward-storage-choice`),
  unreachable from this opening's empty storage and once-only reward route.
- Exact native retry cutscene/auto-entry and ground-script variable progression:
  authored browser staging/reset and explicit retry choice are documented.
- Application/render/input/persistence integration and human runtime evidence.

This is the real opening mechanics checkpoint, not a full-game completion claim.

## Review fix round 1 — I1

Base: `5bd53a7483d23e13eb560e9592278111b88ae9e3` (root's reconciled history,
same reviewed mechanics tree). Verified the review against the producer unions
and facade before changing code, using the receiving-code-review skill.

The exact old path was `resultShape(plan/applied)` throwing a generic TurnFault
before the later `command-plan`/`command-result` fallback: ordinary rejections
became `unavailable`, and missing-content requirements became `turn-content`.
Thus the declared codes were lost even though the kind of a wall rejection was
already retained. Both `CommandPlan` and `MutationResult` include explicit Failure.

Added a small shared facade check in `src/domain/adventure.js` to preserve each
synchronous failure's `reason` or `requirement` before the generic turn-result
checker. Existing dispatch failure formatting and safe requirement-code filtering
remain authoritative. Promise/malformed-result handling and turn-hook fallback
semantics remain unchanged. The turn engine and gameplay producers are untouched.

Static branch trace: plan failures throw before `prepareTransaction`; apply
failures throw before turn resumption, revision assignment, validation and event
numbering. The existing catch returns empty events at the current live revision;
finally seals any discarded draft. The only live snapshot/event-counter writes
remain after full successful validation, so rejected draft mutations/allocations,
random draws and emitted events cannot commit.

Fresh verification: `npm run lint` passed (201 authored files),
`npm run typecheck` passed (123 authored source files), and `git diff --check`
passed. No game imports/execution, tests or automated playthroughs. Folded only
the verification checkout's report-table whitespace normalization into this fix.
Updated `plan/TURNS-CONTRACT.md` with the command failure/atomicity contract.
Unrelated evolution work remains untouched; focused independent re-review is next.
