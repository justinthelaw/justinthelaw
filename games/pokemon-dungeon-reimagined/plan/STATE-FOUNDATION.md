# P07-A: identity and serializable state primitives

## Scope and dependency ruling

Justin's 2026-10-05 continuation resumes implementation. P01 and the full P02
inventory remain incomplete. This bounded responsibility consumes only the
approved identity, plain-state and separate-random-stream contracts in PLAN
sections 5–7 and SYSTEMS's authoritative domain contract. A focused interface
review found these independent of the blocked scheduler and damage rules.
P02 authoring inventories are not runtime catalogs; no game module imports them.

| Producer | Consumer | Accepted boundary |
| --- | --- | --- |
| DATA identities | `domain/ids.js` | Separate opaque individual/session IDs; catalog membership must be provided by a later accepted catalog |
| SYSTEMS state ownership | `domain/state.js` | Bounded plain JSON copies and immutable snapshots, not complete game/save validation |
| PLAN random-stream separation | `domain/rng.js` | Versioned browser PRNG state, no original-cartridge sequence or call-order claim |
| SYSTEMS command/revision contract | `contracts.js` | Typed command/result envelopes, no dispatch or transaction execution |

`createCampaign`, the Adventure facade, numerical Pokémon records, expedition
projection/merge, scheduler, RNG draw sites and persistence stay with their
dependency-gated packages. This does not complete P07 or authorize a fabricated
starting campaign. P19 owns initialization after sourced quiz/results and P22.

## Implementation brief

1. Define branded IDs and narrow result/state contracts with strict JSDoc.
   Allocate save-local IDs from an explicit persisted counter, never time,
   display names or the gameplay RNG. Reject malformed IDs and collisions.
2. In `domain/state.js`, copy only finite, bounded JSON data. Reject cycles, sparse arrays, dangerous
   keys, accessors, non-plain prototypes and excessive depth/size. Snapshot
   copies are deeply frozen; callers never retain writable authority.
3. Implement xoshiro128** 1.1 using unsigned 32-bit operations and a four-word
   nonzero seed. Retain the authors' public-domain permission notice. Version
   the browser algorithm; it is an engineering choice, not a Blue rules fact.
   Separate layout, encounters/items and combat/recruitment streams with the
   published jump operation. Cosmetic state is separately owned and is never
   part of this domain stream bundle. Job/reward ownership remains unresolved,
   and no such draws are implemented. Preserve all words and draw counts.
4. Define narrow immutable command/result/event envelopes supported by the
   SYSTEMS table. Leave unspecified service/job payloads and complete state
   validation to their reviewed owners. Do not add dispatch, reducers or a
   second revision/event counter in a utility module.
5. Review source paths for ID collision/exhaustion, snapshot aliasing,
   malformed JSON and stream isolation. Run static lint/types only
   for game modules. The user's no-game-source-test instruction overrides the
   TDD skill's normal execution requirement.

## PRNG reference

- David Blackman and Sebastiano Vigna, [xoshiro128** 1.1 reference](https://prng.di.unimi.it/xoshiro128starstar.c), retrieved 2026-10-05.
- The source's `next` and `jump` functions define the transition and stream
  separation. Preserve explicit zero-state rejection and unsigned conversion.
- This is not cryptography and is not an implementation of the DS random
  generator. Future original-fidelity claims still require P01's original call
  sites/distributions; no such claim is made by these utilities.

## Acceptance status

Interface review accepted this bounded scope. Independent implementation
review found no blocking issue; a second static RNG review agreed with the
reference transition and jump. Lint and strict JSDoc checks pass. A stale
module name in this document was corrected. No runtime consumer, saved
campaign, game-source execution or manual gameplay acceptance exists at this
checkpoint.

## Complete P07 structural interface

The bounded P07-A history above is superseded for canonical campaign structure by
[CAMPAIGN-STATE.md](CAMPAIGN-STATE.md) and `src/contracts/campaign.js`. The full
root/session/ownership/conditions/scheduler/progression/scene/rescue records now
have exact structural and relational validation and required version-matched
semantic-policy call sites. Source-dependent rule readiness remains separate.

The campaign owns four streams; `jobsRewards` starts at the next jump after
`combatRecruitment`. The existing three-stream API and sequences are preserved.
Campaign loading requires four streams and never fabricates a missing stream.
One global ID allocator includes transactions, with exact-next transaction
preparation and one persisted revision. Events remain epoch-scoped runtime state.

`createCampaign` now exists as a pure catalog-injected constructor, but cannot
succeed without the sourced P19 profile and all required policies. It does not
invent a starting town, scene, stat or move. Read the complete API, scope,
engineering-budget and policy obligations in CAMPAIGN-STATE before consuming it.

## V19 exact turn-continuation boundary — 2026-10-08

The exact trusted `v19-turn-continuation-opening` factory composes frozen v18
and selects an immutable successor shape registry. Frozen schema.js bytes and
all historical pins remain unchanged; recursive union preflight, three shape
passes and both identity/catalog visitor lookups share the selected registry.
Only scheduler kind `continuing` is added; no event backlog, player decision or
active effect is fabricated. Graph/semantic validation owns an exact completed
unit whitelist while old ready/real-prompt/terminal policy remains delegated.

Exact v18 import compatibility validates its original envelope/state before
prospective metadata conversion, as every earlier predecessor already does.
Conversion draws no RNG, allocates no actor/ID and performs no gameplay/status
replay. All slots, histories, inventories, Leech links, Water Sport and prior
item provenance remain intact. New continuing round-trips retain the exact PC.
See [TURN-CONTINUATION.md](TURN-CONTINUATION.md) for checkpoint ownership, narrow
pending safe-swap validation and the admission/review gates. Static verification
is not interrupted-save/reload or human gameplay acceptance.
