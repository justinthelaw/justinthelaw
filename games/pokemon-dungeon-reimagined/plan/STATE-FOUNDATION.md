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
