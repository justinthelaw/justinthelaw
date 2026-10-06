# Browser scheduler and bounded damage contract

Date: 2026-10-05. Target: original Blue Rescue Team browser reimagining. Contract ID: `rescue-team-browser-rules/1`.

This is an independently authored behavioral/numeric contract, not copied program code and not a binary-emulation claim. It selects original Rescue Team behavior from joint Red/Blue researcher documentation and, where that is incomplete or conflicts, the pinned original Red matching-decomp artifact. Each Red-derived choice is comparative evidence for the browser game; it is not mislabeled as a Blue cartridge observation. Unspecified machine-overflow identity is outside the supported numeric domain. No repository/game source was edited or executed to prepare this document.

## 1. Adoption and evidence rules

**Adopted core contract for P12 scheduling and P13 normal/fixed damage.** These consumers need not wait for a universal Red/Blue machine-code equivalence proof. They still require separately supplied complete move, ability, item, terrain, AI, and campaign contracts; a missing effect must never become a generic attack or silent no-op.

Source short names below resolve to:
- **R**: `pret/pmd-red` commit `6bcbec4f906938c0243aa2026bcbd41b577bab85`, matching original Red/GBA artifact; [root](https://github.com/pret/pmd-red/tree/6bcbec4f906938c0243aa2026bcbd41b577bab85).
- **U**: Peter O.'s joint-original-Rescue-Team [timing](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-timing-notes.html), [damage](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-damage-calculation.html), [moves](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-moves.html), [various notes](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-various-notes.html).
- **A**: AnonymousRandomPerson's original [Red/Blue AI research](https://gist.github.com/AnonymousRandomPerson/2750861734184be79561ee88d065abb8).

R paths in this document are relative to that pinned commit. Source names are locators, not dependencies. The source is inspected as reference material only; the runtime has no upstream dependency.

Use three evidence labels in the new ledger:
1. `edition-scoped-researcher-documentation`: U/A original Red+Blue scope.
2. `original-red-engine-comparative`: factual behavior from R chosen for this browser contract.
3. `browser-engineering-contract`: pause/resume, stable references and validation architecture; no original-edition factual claim.

The supported arithmetic domain is normal finite gameplay values whose original fixed-point intermediate products fit the original helper's retained 64-bit product. Use exact integer arithmetic in the browser. Reject corrupted/out-of-contract state at save/data boundaries. Do not wrap a giant invalid imported stat and call the resulting behavior cartridge fidelity.

## Scheduler

## 2. State required by the scheduler

Keep this state in the authoritative simulation, separate from rendering/input repeat timers:

- Floor phase `p`, integer 0–23; start a newly generated floor at 0 (R `src/run_dungeon.c:290`). Restored floors preserve their serialized phase.
- Four ordered team slots and ordered wild slots. Empty slots remain meaningful. Allocate the first eligible free slot, with a monotonically increasing entity generation ID; never retain an old entity reference merely because its slot was reused (R `src/dungeon_util.c` allocation functions).
- Each actor: current species/apparent form, leader/team flags, positive and negative speed timer arrays of five entries, cached speed, `attackLocked`, `speedRaisedThisAction`, movement-commit/deferred-follow flags, statuses and counters.
- Continuation: current phase, pass, slot cursor, whether actor beginning effects ran, whether movement completion remains, linked move/hit cursors, pending prompt and terminal outcome.
- Terminal outcome latch: none, floor transition, dungeon exit, rescue pending, or failure. Once latched, ordinary action handlers do not run on the old floor.

An entity reference is `(slot, generation)`. Validate it before each deferred callback/hit/reaction. Render animations consume emitted events and cannot advance simulation. Opening a menu, leaving the tab idle, or hiding touch controls consumes no turns. Save only an internally consistent continuation; user-facing suspend can serialize that continuation or await the next safe command boundary.

## 3. Speed and opportunities

Evidence: R `src/dungeon_engine.c:36`, `src/dungeon_logic.c:CalcSpeedStage`, `src/move_orb_effects_1.c:1348–1437`, `src/dungeon_turn_effects.c:546–573`, `src/dungeon_random.c:CalculateStatusTurns`, `src/dungeon_config.c:98–100`.

### 3.1 Eligibility table

| Stage | Eligible phase p |
| --- | --- |
| 0 | 7, 15, 23 |
| 1 | 3, 7, 11, 15, 19, 23 |
| 2 | all odd p |
| 3 | p modulo 4 is 1, 2, or 3 |
| 4 | every p |

Stage 1 is ordinary speed. These are opportunities, not a global number of attacks. Stage computation:

```text
speed(actor):
  n = species.baseMovementSpeed
      + count(nonzero positive timers)
      - count(nonzero negative timers)
  if paralyzed: n -= 1
  if actor currently has Ice type and its apparent weather is snow: n += 1
  if apparent form is Deoxys Speed: n += 1
  if original species is Kecleon, it is wild, and theft mode is active: n += 1
  return clamp(n, 0, 4)
```

Swift Swim/Chlorophyll action repetition belongs to the move-action contract, not this stage formula. Do not replace it with a speed-stage increment.

### 3.2 Attack lock

A committed wait/pass or ordinary walk does not set `attackLocked`. A committed attack, move, item use/throw, give/take/place/swap item, or other turn-consuming non-walk operation does. Source action ID 4 is unnamed and excluded by R; do not expose an invented player command for it.

At each stage-1 phase, before actor passes, clear `attackLocked` for every current actor. Skip an otherwise eligible actor whose lock is still true. This is why extra movement does not mean unlimited extra attacks. Successful speed raising explicitly clears the target's lock; that exception matters.

Free operations bypass the scheduler entirely: facing, setting/deselecting moves/items, choosing ally moves, tactics/IQ changes, dismissing a partner, and partner conversation (U). Browser menu navigation/cancel and invalid UI selections are also non-committing engineering operations. A valid in-world attempted action that fails because of a game condition must use its sourced failure/turn-cost rule; it is not automatically a free UI error.

### 3.3 Timer construction and decrement

`randRange(low, high)` is low-inclusive/high-exclusive. R's [8,10] range produces 8 or 9, not 10.

- Default speed raise: generate 8 or 9, then store 9 or 10 after adding the entry-boundary offset 1.
- Default speed lower: generate 6 or 7; apply Self-Curer integer halving, then Natural Cure cap-to-5 if applicable; enforce at least 1; then add 1.
- Explicit indefinite increase stores 127. The timer decrement helper leaves 127 unchanged.
- Fill the first empty timer slot. A raise when already at effective stage 4 adds nothing. Lowering at stage 0 adds nothing. Safeguard can block lowering.
- At an actor's beginning-of-opportunity status pass, decrement each nonzero finite positive/negative timer once. Recompute the stage after expiration. The actor already qualified for this opportunity using its pre-tick speed; expiration does not retroactively cancel that admitted opportunity.
- On an effective increase, set `speedRaisedThisAction=true` and clear `attackLocked`. An effective decrease does not set the refresh flag.
- Speed Boost increments its separate ability counter after actions; at 250, reset it and request one indefinite increase (U/R).
- Do not convert source countdown values into wall-clock seconds or divide them by the current speed.

## 4. Fractional-phase transaction

Evidence: R `src/dungeon_engine.c:44–478`; beginning/end hooks retain existing `P01-MECH-TURN-03/04` records, with R ordering where a precise mutation boundary is needed.

```text
advance:
  while floor has no terminal outcome:
    if p is a normal-speed phase:
      attempt periodic wild spawn
      rebuild side Plus/Minus flags and Lightningrod selection from current actors
      clear every current actor's attack lock
      resolve any forced loss
      stop if terminal

    admitted = leader exists and eligible(speed(leader), p) and not attackLocked
    if admitted:
      processLeaderOpportunity()
      stop if terminal
      advance wind countdown once for this leader phase invocation
      stop if terminal

    processTeamSlots()
    stop if terminal
    processWildSlots()
    stop if terminal

    if p+1 is a normal-speed phase:
      commit pending movement and its tile/end effects
      resolve evolution/pending forced loss
      stop if terminal

    p = (p + 1) modulo 24
```

This routine runs until it needs a player command/prompt, finishes the requested work, or reaches an outcome. It does not run repeatedly from requestAnimationFrame. A normal speed party first becomes eligible at phase 3, after initial empty phases.

### 4.1 Leader opportunity and refresh

```text
processLeaderOpportunity:
  repeat:
    flush pending movement and its tile/end effects before the next leader decision
    stop if terminal or leader absent
    currentLeader.speedRaisedThisAction = false
    run beginning effects unless this is the immediate leader-change continuation
    stop if terminal
    resolve queued experience/evolution
    suspend for player command; free UI commands remain inside this suspension
    commit one valid turn-consuming action
    resolve forced loss and any petrified-swap special continuation
    stop if terminal

    if leader-change was committed:
      install new leader
      continue, skipping its beginning effects once
    if the acting leader had an effective speed raise:
      p = 0
      continue, with normal beginning effects
    return
```

The repeat is not gated again by the original phase table or attack lock. A speed raise can consequently grant an immediate leader opportunity. A speed change partway through a linked action takes effect in state immediately, but the scheduler refresh is considered after that committed action's own link/reaction processing.

### 4.2 Allies, wild actors, and movement completion

Team slots are read live in increasing slot order, excluding the leader. At each slot: confirm identity/existence, floor state, speed eligibility, attack lock and swap-skip flags; then run the actor beginning pass once and AI/evolution/action sequence. A special movement-driven replan may repeat the AI/action attempt up to three times, without another beginning pass.

After the first team pass, retry deferred followers in three rounds. In each round group them by Chebyshev distance to the leader, clamped to buckets 0, 1, 2; visit nearer buckets first and, within a bucket, reverse slot order (R head insertion). Only followers still marked deferred participate. Set the replan flag, clear deferred, then reconsider movement. An actor that already chose an attack is not retried as a follower. Remaining deferred actors receive their one end-of-action pass after retry rounds.

Wild slots are read live in increasing slot order, with equivalent validity, phase, attack-lock and swap-skip checks. Wild actors do not receive the follower retry traversal.

Walking mutates grid positions in decision order, but defers tile and after-action effects to movement completion. At completion process the leader first, then other moved actors in active slot order. For each: tile interaction/pickup/trap, forced-loss boundary, end effects, evolution, relevant room/monster-house trigger. Recheck terminal/identity between those steps. Non-movement actions normally perform their own end effects immediately. **Do not call after-action hooks twice for walkers or deferred followers.**

The visual implementation may animate moves together after logical positions change, as long as the above logical commit boundaries remain intact. Keep explicit `endEffectsPending` state instead of inferring it from whether a sprite is moving.

### 4.3 New actor eligibility

R evidence: `dungeon_util.c` allocation; `dungeon_mon_spawn.c` initialization; `dungeon_mon_recruit.c` joining; live loops in `dungeon_engine.c`.

- A periodic wild spawn occurs before the leader/team/wild passes on a normal-speed phase, so it can act in that phase if its new slot is reached and normal eligibility holds.
- A newly recruited member uses the first free team slot, starts with no attack lock, and is eligible if that slot has not yet been visited in the current team pass. Recruitment during the leader action can therefore be followed by its ally action.
- A spawn into a slot already passed waits until a later eligible traversal; do not restart the whole pass.
- No blanket "new actors wait one complete turn" delay is added.
- Successful recruitment sets an action-local stop flag: remaining linked moves/hits from the action stop, preventing attacks on the newly joined member.

## 5. Interruption and death contract

Evidence: R `dungeon_action_execution.c`, `dungeon_move_util.c:88–179,388–450`, `dungeon_damage.c:HandleDealingDamageInternal`, `dungeon_misc.c:HandleFaint`; U zero-HP ordering.

| Trigger | Required scheduler result |
| --- | --- |
| Confirm usable stairs | Latch floor transition during the leader action. No ally/enemy response or old-floor residual pass. Meteor Cave rejects stairs while its required Deoxys condition is unmet. |
| Successful Escape Orb/equivalent mission exit | Latch dungeon exit at its defined action handler boundary. No later ordinary floor handlers. A failed/forbidden escape uses the item rule and does not latch exit. |
| HP reaches zero | Resolve survival/revival synchronously before scheduling any other actor. |
| Leader cannot revive | Stop ordinary processing; hand off to failure/rescue policy. Do not wait until all enemies finish. |
| Mandatory early-story partner/client defeated | Record forced-loss reason, then resolve it at the immediate action/hit boundary before another ordinary actor. |
| Actor vanishes, changes generation, or floor ends | Stop its queued reactions/hits/links/end effects. |
| Target faints | Revalidate target before another hit. A multi-target move may continue with other valid targets while its attacker/floor remain valid. |
| Recruitment succeeds | Stop remaining hits and links for this committed action, then continue the live scheduler if no terminal event was also raised. |
| Actor revives | Revival is not defeat; continue only branches whose actor/target predicates are still valid. Do not automatically advance a new turn. |

Ordered HP handling for the ordinary supported path:

```text
applyHpLoss:
  handle target protections, absorption, set-damage overrides
  deduct HP, respecting Endure / False Swipe survival floors
  if HP > 0: record damage/experience effects and return ALIVE

  if a valid revival effect succeeds:
    consume/transform revival item
    restore HP and Belly and perform the revival status-reset contract
    return REVIVED

  drop applicable held item
  compute/queue earned EXP when the defeat permits it
  if leader-caused eligible wild defeat and recruitment succeeds:
    replace defeated wild entity with a new team entity/generation
    flag recruitmentStop for current hit/link chain
    return RECRUITED

  finalize faint, remove target references, release its slot
  if leader/mandatory partner/client outcome requires exit:
    latch failure or rescue handoff
  return DEFEATED
```

Reviver Seed selection: Item Master must be enabled; usable nonsticky held seed first, then usable bag seed in inventory order for a team member. Wild actors cannot use the team's bag. Replace seed with Plain Seed. R also contains unused/developer item IDs such as Reviver Orb and Possess Orb; do not silently expose these as normal obtainable campaign items. The item catalog must declare whether an internal item is playable.

**Reaction ordering is a separate action effect chain**, not the next actor's turn: damage-dependent responses, recoil/drain, queued contact-status abilities, Trace, Color Change, Conversion 2 (existing U record). Every nested HP event uses the same synchronous zero-HP resolution. A foe revived by a seed is still a valid foe; successful recruitment is a distinct stop reason.

Linked action contract:
1. Capture the consecutive selected link chain in move-slot order, preserving move identities.
2. Before each constituent move and each repeated hit, verify attacker identity, floor state, recruitment-stop and action-blocking status.
3. Check each constituent move's PP/use predicate independently; do not invent "one PP for the whole chain."
4. Rebuild/validate target references per hit as required by its target rule.
5. Stop when attacker is invalid/incapacitated, outcome is latched, recruitment succeeds, an effect explicitly stops repetition, or the link ends.
6. Apply link Belly/PP/link-break bookkeeping using move/item rules once at their documented stage. The core scheduler does not guess those tables.

## Damage

## 6. Exact bounded integer arithmetic

Evidence: R `src/math.c`; `include/number_util.h`. Use raw scaled integers (`BigInt` is suitable); no floating-point 0.9 or continuous random values.

```text
Q8 = 256
Q16 = 65536

mulQ(a, b, fractionBits):
  magnitude = abs(a) * abs(b)
  quantized = floor((magnitude + 2^(fractionBits-1)) / 2^fractionBits)
  return sign(a*b) * quantized

divQ16(a, b):
  require b != 0
  if a == 0: return 0
  magnitude = floor((abs(a)*65536 + 32768) / abs(b))
  return sign(a*b) * magnitude

integerToQ16(n) = n * 65536
Q8toQ16(n) = n * 256
integerPartQ8(n) = truncateTowardZero(n / 256)
roundFinalQ16(n) = floor((n + 32768) / 65536)
```

These formulas describe the helpers for supported non-overflow inputs. Notice division's added 32768 is in the numerator before division; it is **not** generic nearest rounding of the quotient. Multiplication ties restore sign after rounding magnitude, whereas final conversion ties go toward positive infinity.

Do not reproduce the R integer-to-fixed sign-bit bug for out-of-domain imported values. Document this as a browser arithmetic limit; it does not block correct bounded combat. Do not add an undocumented final 32767 cap. R damage storage is signed 32-bit, and base damage clamping is separate from final damage.

## 7. Combat constants and stat preparation

### 7.1 Q8 stat-stage arrays

Indices 0–20 represent stages -10 through +10. Raw integer numerators over 256, derived statically from R `dungeon_config.c` and its `IntToF248` macro:

```text
attack:
[64,69,74,79,84,89,102,115,128,179,256,332,384,409,422,435,448,460,473,486,512]

defense:
[64,69,74,79,84,89,102,140,179,222,256,332,384,409,422,435,448,460,473,486,512]
```

Physical types: None, Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost, Steel. Special types: Fire, Water, Grass, Electric, Ice, Psychic, Dragon, Dark. There is no modern per-move physical/special split and no Fairy type.

### 7.2 Working stats

Evidence: R `dungeon_damage.c:1018–1278`; selected R behavior resolves source conflicts. Input move power includes its sourced Ginseng boost; move-specific power changes happen before this procedure.

```text
offStage = attacker's selected offensive stage
  + Flash Fire boost when using Fire and target-dependent effects apply
  + Deoxys attack-form 2 OR defense/speed-form -2
defStage = defender's selected defensive stage
  + 1 for physical Skull Bash protection
  + Deoxys defense-form 2 OR attack/speed-form -2
clamp both stages to 0..20

A = integerPartQ8(mulQ(mulQ((rawOffense+movePower)*256,
                           attackStage[offStage],8),
                      offensiveMultiplierQ8,8))
C = integerPartQ8(mulQ(mulQ(rawDefense*256,
                           defenseStage[defStage],8),
                      defensiveMultiplierQ8,8))

apply held item to corresponding selected stat:
  Power Band / Special Band: A += 12
  Munch Belt: A += 8
  Def. Scarf / Zinc Band: C += 8 only when targetEffectsApply

A = clamp(A,0,999)  // exact selected R branch, before abilities
(A,C) = abilityAdjusted(A,C, sharedPowerRoll)
```

The inspected R function does not apply UPC's asserted symmetric 1–999 clamp to both working stats. Adopt the explicit R order above; retain UPC discrepancy in the ledger. Valid underlying stats/multipliers remain subject to their own catalog bounds.

`abilityAdjusted`: accumulate integer numerators/denominators, then truncate division once for A and once for C.
- Guts plus qualifying negative status: offensive numerator ×2. **R's helper does not restrict this to physical attacks**, unlike U's prose; record this deliberate R comparative choice.
- Huge Power or Pure Power: offensive ×3/2 when the shared integer roll 0–99 is <33 and attack is physical. Both ability names together do not multiply twice.
- Hustle physical: offensive ×3/2.
- Plus special with same-side Minus present: ×15/10; Minus special with same-side Plus present: another ×15/10 if both predicates hold.
- Defender Intimidate physical: offensive ×4/5.
- Defender Marvel Scale physical with negative status: defensive ×3/2.

Draw `sharedPowerRoll=randInt(100)` once in ordinary damage calculation, even when no corresponding power ability is active. Reuse the same value for both the working-stat adjustment and wild raw-offense branch. This avoids incorrectly double-rolling Huge/Pure Power.

## 8. Normal damage formula and order

Evidence: R `src/dungeon_damage.c:CalcDamage`. U corroborates the literal base coefficients and final random interval. All variables below carrying Q16 suffix are raw integers.

Early exceptions: a nonleader attacker with empty integer Belly deals 1 normal damage; a regular attack against Wonder Guard deals 1. These bypass ordinary critical/type computation. Fixed-damage moves use section 10 instead.

```text
if attacker is a team member:
  Lq = mulQ(integerToQ16(level), 43690, 16)
else:
  rawAdjusted = abilityAdjusted(rawOffense,1,sharedPowerRoll).offense
  Lq = divQ16(integerToQ16(rawAdjusted), integerToQ16(3))

Dq = divQ16(integerToQ16(A-C), integerToQ16(8)) + Lq
quadratic = mulQ(mulQ(Dq,Dq,16),3276,16)
linear = 2*Dq - integerToQ16(C) + integerToQ16(10)
baseQ16 = clamp(quadratic+linear, integerToQ16(1), integerToQ16(999))

modifierQ16, matchupClass = buildTypeAndContextModifier(...)
apply Reflect or Light Screen ×32768 to modifierQ16 when its category matches
  and targetEffectsApply is true
apply critical modifier to modifierQ16 if critical check succeeds

damageQ16 = mulQ(baseQ16,modifierQ16,16)
damageQ16 = mulQ(damageQ16,Q8toQ16(moveEffectMultiplierQ8),16)
damageQ16 = mulQ(damageQ16,57344+randInt(16384),16)
damage = roundFinalQ16(damageQ16)
if damage == 0: clear critical flag
```

Normal attacks/projectiles and moves with situational scaling supply their own sourced Q8 effect multiplier; do not assume all are 256. **No additional generic wild ×340/256 multiplier is applied.** The raw-offense/3 branch above is the selected original-engine rule.

### 8.1 Critical check

If defender has Battle Armor or Shell Armor, critical is false and skip its random check. Otherwise:
- Initial chance = move critical chance for team attacker, **0 for wild attacker**.
- Focus Energy sets chance to 999.
- Otherwise add 40 for attacker Scope Lens; add 40 for defender Patsy Band; if matchup class is super-effective and Type-Advantage Master is enabled, replace chance with 40.
- Critical when `randInt(100) < chance`. Multiply context modifier by Q16 98304 (1.5) if true.
- Do not clamp chance to 100 before comparison; 999 is a valid always-success threshold.

## 9. Type/context modifier

Evidence: R `dungeon_config.c:gTypeEffectivenessChart/gEffectivenessChart`, `dungeon_damage.c:sub_806E100`. Missing second type is None/neutral. Type classification is distinct from the numeric product.

Raw Q16 factors: little effect 32768; resisted 58982; neutral 65536; super-effective 98304.

For each defender type slot in order, lookup effectiveness and multiply the running modifier with `mulQ(...,16)`. For Normal/Fighting against unexposed Ghost use little effect; exposing removes that exception (the base table's Ghost cell is neutral).

Combine the two symbolic labels using this table for Wonder Guard, messages and Type-Advantage Master:

| first/second | little | resist | neutral | super |
| --- | --- | --- | --- | --- |
| little | little | little | little | resist |
| resist | little | resist | resist | neutral |
| neutral | little | resist | neutral | super |
| super | resist | neutral | super | super |

Therefore a resisted+super pairing numerically multiplies to approximately 1.35 but is classified neutral. Do not infer the symbolic class by comparing the resulting factor with 1.

The complete original type matrix can be represented by the following sparse rows, independently normalized from R's named 18×18 table. Every omitted pairing is neutral; None is neutral against everything and as a defender. There is no duplicate type slot for a single-typed monster. Normal/Fighting-to-Ghost is supplied by the exposed-state override above, not repeated in these base rows. Steel still resists Ghost and Dark.

| Attacking type | Super against | Resisted by | Little effect against |
| --- | --- | --- | --- |
| Normal | — | Rock, Steel | — |
| Fire | Grass, Ice, Bug, Steel | Fire, Water, Rock, Dragon | — |
| Water | Fire, Ground, Rock | Water, Grass, Dragon | — |
| Grass | Water, Ground, Rock | Fire, Grass, Poison, Flying, Bug, Dragon, Steel | — |
| Electric | Water, Flying | Grass, Electric, Dragon | Ground |
| Ice | Grass, Ground, Flying, Dragon | Fire, Water, Ice, Steel | — |
| Fighting | Normal, Ice, Rock, Dark, Steel | Poison, Flying, Psychic, Bug | — |
| Poison | Grass | Poison, Ground, Rock, Ghost | Steel |
| Ground | Fire, Electric, Poison, Rock, Steel | Grass, Bug | Flying |
| Flying | Grass, Fighting, Bug | Electric, Rock, Steel | — |
| Psychic | Fighting, Poison | Psychic, Steel | Dark |
| Bug | Grass, Psychic, Dark | Fire, Fighting, Poison, Flying, Ghost, Steel | — |
| Rock | Fire, Ice, Flying, Bug | Fighting, Ground, Steel | — |
| Ghost | Psychic, Ghost | Dark, Steel | Normal |
| Dragon | Dragon | Steel | — |
| Dark | Psychic, Ghost | Fighting, Dark, Steel | — |
| Steel | Ice, Rock | Fire, Water, Electric, Steel | — |

Then apply in order:
1. Wonder Guard: zero modifier unless move is typeless or symbolic matchup is super.
2. Thick Fat on Fire/Ice: ×32768.
3. Defender Flash Fire on Fire: zero; defender Levitate on Ground: zero; adjust effectiveness/crit metadata accordingly.
4. Attacker Torrent/Overgrow/Swarm/Blaze matching Water/Grass/Bug/Fire with `HP <= floor(maxHP/4)`: ×131072.
5. Attacker shares a non-None move type and modifier not zero: ×98304.
6. Apparent weather: sunny Fire ×98304 / Water ×32768; rainy Water ×98304 / Fire ×32768; cloudy non-Normal ×49152.
7. Electric with Mud Sport OR fog: ×32768 once, not twice.
8. Fire with Water Sport: ×32768.
9. Electric while Charging: ×131072.
10. Return to section 8 for screens, critical, base multiplication, move-specific multiplier and randomness.

Flash Fire's boost increment occurs once per target turn for the first qualifying Fire hit, capped at 2, and resets when leaving the floor. Its mutation is not a second type-multiplier pass.

## 10. Fixed damage versus direct HP changes

Keep three explicit effect kinds:
- `normalDamage`: sections 7–9 and full normal randomness/critical processing.
- `fixedDamage`: clamp its supplied base amount 1–999, multiply by the type/context modifier from section 9, round final Q16. No normal level/stat equation, screens/crit/random roll unless a particular effect contract explicitly calls another route.
- `directHpReduction`: move-specific HP operation, not the generic fixed-damage pipeline. Dragon Rage reduces 65; Sonicboom reduces 55. Do not mistake their catalog power 2 for their damage.

The HP application layer (not implemented in these pure calculators) still handles valid target/protection/absorption/revival behavior according to each effect's flags. Status moves are not given fake 1 damage.

## 11. Implementation domain and interfaces

The four calculation ES modules and their `index.js` export boundary under `src/domain/rules/` implement calculations,
not a runnable dungeon. No module imports this document/profile, a content
inventory, campaign state, UI clock, upstream source, or an RNG. Results contain
Numbers, strings, booleans and arrays/objects; transient BigInts never escape.
All caller facts are mandatory. `StatContext` contains the offense/defense
pair already selected for the move type's original physical/special category. Inputs are readonly snapshots; mutation,
abilities being active, held items being usable, and target validity are the
calling action layer's responsibility. Invalid numerical/enum/boolean facts
throw rather than acquire guessed defaults.

| Module | Public calculations |
| --- | --- |
| `fixed-point.js` | `mulQ(a,b,8\|16)`, `divQ16(a,b)`, `integerToQ16(n)`, `q8ToQ16(n)`, `integerPartQ8(n)`, `roundFinalQ16(n)`; validation helpers and Q8/Q16 constants |
| `speed.js` | `calculateSpeedStage(context)`, `hasSpeedOpportunity(stage,phase)`, `makeRaisedSpeedTimer(sample)`, `makeLoweredSpeedTimer(sample,selfCurer,naturalCure)`, `tickSpeedTimers(context)`, `applySpeedTimers(context,direction,timers,safeguardBlocks)`, `advanceSpeedBoostCounter(counter)` |
| `type-context.js` | `isPhysicalType(type)`, `lookupTypeMatchup(attack,defense,exposed)`, `combineTypeMatchups(first,second)`, `buildTypeContextModifier(context)`, `validateTypeContext(context)`, `neutralTypeModifier()`; exact type constants |
| `damage.js` | `calculateNormalDamage(input)`, `calculateFixedDamage({baseAmount,type})`; exact attack/defense stage constants |

### Accepted numeric domain

- All public numerical inputs/outputs are safe-integer Numbers. Q8 operands
  and results fit signed 32-bit raw storage; Q16 operands/results fit exact
  Number integers. Multiplication's unscaled magnitude product must fit
  unsigned 64-bit; division's shifted, biased numerator must fit unsigned
  64-bit. Products use BigInt and are range-checked before conversion.
- Integer-to-Q16 accepts -32768 through 32767. This intentionally excludes
  the original sign-bit defect's problematic conversion domain. It does not
  introduce a final damage cap: final rounding accepts signed-32-bit results.
- Damage inputs: raw offense/defense 0–999; stages 0–20; level 1–100; boosted
  move power 0 through 32767 minus raw offense; Flash Fire boost 0–2; Belly's
  integer part 0–32767; nonnegative raw Q8 stat/effect multipliers through
  2147483647. Internal range guards remain applicable: these outer bounds are
  necessary, not a promise that every Cartesian combination is supported.
- A living attacker supplies HP 1 through maxHP, maxHP 1–32767. The HP layer
  must resolve zero HP synchronously before invoking another attack. Selected
  stats after abilities must fit 0–32767 and their difference signed16.
- Critical move chance is 0–100. Focus Energy's internally constructed 999
  threshold stays exact. Normal shared-power/critical rolls are 0–99;
  variance roll is 0–16383. Armor requires `criticalRoll:null`; early empty
  Belly/regular-versus-Wonder-Guard exceptions require `rolls:null`. Ordinary
  damage requires all remaining samples even when their ability is absent.
- The action RNG adapter must inspect the same early/armor predicates before
  sampling, then draw shared power, optional critical, variance in that order.
  Injected samples are validated, not generated or resampled by the helper.
- Fixed base amount accepts signed32, clamps to 1–999, and uses type/context
  only. A zero amount is not a status/no-op encoding. Direct HP changes do
  not use either damage calculator.
- Speed requires five counters per sign, each 0–127; 127 is indefinite.
  Base movement stage is 0–4. Phase is 0–23. Speed Boost counter is 0–249.
  A raise inserts one timer; a lower batch inserts up to five supplied timers.
  Timer results carry **operation-local** refresh/unlock flags: the caller
  ORs these with action state and never erases an earlier effective raise.
  Recompute cached stage from returned timers; do not cancel an opportunity
  already admitted using the pre-tick stage. Duration sampling belongs to
  the action: default raise samples even at cap; lower samples only available
  slots after its initial stage/Safeguard gate.

### Precise source refinements found during implementation

1. R `math.c:F48_16_SDiv/F48_16_UDiv` special-cases zero dividend before the
   biased quotient. Section 6 includes that guard; the draft's algebra alone
   was incomplete for a zero numerator and small fractional denominator.
2. R `CalcDamage`'s `arg_10` gates the offensive Flash Fire stage bonus,
   defensive Scarf/Zinc bonus and matching screen. `targetEffectsApply`
   exposes exactly those gates; it does not disable the entire type pipeline
   or stat abilities. Skull Bash's physical stage bonus remains independent.
3. R `dungeon_logic.c:MonsterIsType` explicitly excludes TYPE_NONE, so an
   absent second type does not give a typeless move STAB.
4. R `LowerSpeed` checks stage zero before its requested-stage loop. A batch
   fills remaining empty slots without a new effective-stage check between
   insertions. `applySpeedTimers` preserves that distinction from separate
   lower actions. Full slots can prevent a requested change.

These refinements retain **original-red-engine-comparative** confidence.
Damage reports separate per-slot/type-only classification from the final
classification changed by Flash Fire/Levitate, plus nullification cause.
A resisted+super pair retains neutral symbolic class despite factor >1.
Critical is cleared when final damage rounds to zero. Numerical intermediate
facts aid future logs/review; they are not persisted simulation authority.

## 12. Evidence composition, licensing and remaining work

[blue-rules-v3.json](research/blue-rules-v3.json) composes v1 then v2, checks
both historical hashes, then applies only its explicit listed replacements.
The v2 historical restriction that every inherited blocker stays blocked is
replaced **only for listed v3 fields**. Historical conflicting values remain
in the prior files and in per-update snapshots. Exact-Blue universal parity
and complete ability order stay blocked. Capability `runtimeReady:true`
means a consumable specification; it does not mean integrated gameplay.
P01/package/system-family completion and top-level runtime readiness remain
false. Production wiring waits for independent review and later integration.

Six move numerical corrections are supporting evidence only: Dragon Rage
power 2; Sonicboom power 2; Refresh PP 17; Refresh first accuracy 100; String Shot
critical 12; Thrash power 18. The two accuracy columns have distinct checks.
Dragon Rage/Sonicboom's direct HP reductions are 65/55. Blue dataset `game_id`
is a resource key that repeats for Unown forms, not unique canonical/form
identity; original internal monster IDs and growth/learnset keys remain
separate. A Slaking Friend Area discrepancy remains for catalog review.

The pinned decompilation provides factual research, not copied runtime code,
assets or commercial scripts. Its repository availability/license cannot
license Nintendo/Chunsoft/The Pokémon Company's characters, original game
implementation or extracted data/art wholesale. This browser code is newly
authored from the stated behavioral contract. Distribution, branding and
third-party asset permissions require their own provenance; this source
qualification is not a commercial-rights clearance.

Remaining full-game consumers: complete 356 move effects/targets/two accuracy
checks/PP/link and hit rules; all ability/status/item precedence; AI/pathfinding;
floor generation/encounters/traps/shops/boss restrictions; reset/restoration
matrices/rescue policy/terminal scenes/Gengar/Wish predicates; browser save
validation and connectivity equivalents; complete runtime catalogs and form
crosswalks. None may become generic attacks, silent no-ops, or invented state.
The complete Blue campaign and postgame remain the delivery goal. Scheduler
loop, HP/revival/recruitment/effect chains and scenes are documented boundaries,
not implemented by this calculation-only sub-batch.

Verification is static lint/type/source and corpus inspection only. No game
module was executed/imported, no automated game test was run, and no manual
campaign acceptance or playable-completion claim follows from these helpers.
