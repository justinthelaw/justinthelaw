# Escort dependency: native general random state

The first independently reviewable escort prerequisite supplies the comparative
native **general** RNG primitive. It does not open MAIN5,7 departures or refresh,
construct a guest in canonical state, or claim the second work interval/Caterpie.
The live campaign remains exact v23. Existing four xoshiro streams and all
historical revisions/envelopes remain unchanged.

## Exact source and numeric interface

`content/authored/native-general-rng-facts.js` records Red
`6bcbec4f906938c0243aa2026bcbd41b577bab85`, `src/random.c`, SHA256
`40545e44f2a45674cc157b238e7d07a14ff9dcf952f734ee5b916809ac9f2e81`.
Locators6–9,12–23,26–40 and43–52 cover seeding, generation, bounded/range sampling
and reseeding. Red evidence is comparative; Blue seed/binary parity is unproved.
The exact parser-only projection and AST audit never execute native/game code.

`src/domain/native-general-rng.js` supplies pure seed, validate,32-bit integer,
bounded integer, range and reseed functions. Every returned state is explicit and
immutable; the caller commits it alongside the actual consumer in one draft.

| Operation | Exact ownership |
| --- | --- |
| SeedRng | Caller supplies six actual bytes; state54021 plus three byte products. No clock, entropy, old-save repair or implicit seed. |
| Rand16Bit | Wrapped32 LCG `1566083941*state+1`; signed high16. |
| Rand32Bit | Two ordered transitions; both signed16 values retain sign extension when ORed. Negative second halfwords must not be masked into unsigned16. |
| RandInt | Always the two-transition Rand32Bit call, including bound0; low16 multiplication wraps32 before signed right shift16 and final16-bit mask. No rejection/modulo. |
| RandRange | Equal endpoints consume0; reversed endpoints use the same absolute difference and lower endpoint. Signed32 endpoint/difference domain is explicit. |
| SetRNGSeed | After two transitions, overwrite state with returned Rand32Bit bits rather than retaining the intermediate second LCG word. |

The serialized primitive type is `red-general-lcg-v1`, unsigned32 `word` and
nonnegative safe-integer `transitions`. Zero is valid. The counter counts LCG
transitions, not browser samples; every32-bit/bounded draw consumes2. Overflow
rejects before transition. This type has **not** been added to any saved campaign
shape: its future owner must provide exact successor recognition, source receipt,
seed-origin qualification and original-envelope admission before conversion.
Neither the general stream nor a guest may be inferred during old-save conversion.

## Next genuine guest owner

Native CreateLevel1Pokemon uses the client's species, base stats, level1/EXP0,
IQ1, Let's go together, default IQ and empty held item, joined location74/floor1.
Level1 candidates are source ordered, with Item Toss only on actual zero candidates;
the factory stores zero PP before dungeon conversion resets it. The temporary
dungeon conversion raises IQ to26, creates Hidden Power on the **general** stream,
and inserts the first free existing team slot subject to the real body-size check.
It does not allocate a persistent roster member or a wild/client surrogate.
These inspected facts identify the next responsibility; the whole guest constructor,
slot/PP/Hidden Power proof, Pickup and native following/AI/loss/cleanup remain open.

The next exact successor must carry v23 learning/candidate/award/retired-slot and
terminal PCs, original Pidgey/mail ownership, v22 applied prefix versus authenticated
unpaid debt, resources/RNG/queue/item cursors and independent raw proofs before
all predecessor projections. Canonical bounds stay four team plus128 wild. No
consumer is widened in this prerequisite; zero events are emitted, so the current
3798/2300/1946 arithmetic and3800/2300/1950 allowances under4096 remain valid.
Guests, additional growing entry identities, movement/AI/effects/Pickup/output
require a fresh whole-chunk proof before live activation. Frame pump, presentation,
autosave, menu/learning pauses and every saved native PC remain unchanged.

## Review and acceptance

The live PR at published03459a9 records completed scoped independent v23
specification PASS/quality APPROVE after ML-R001 terminal prompt, ML-R002 retired
slot ownership and ML-R003 foreign-pass corrections; its reviewed tree is local
c2e1f700. This is scoped prerequisite review, with human/device/visual/interrupted
save, Blue parity and full campaign/release acceptance still pending.
The general-RNG prerequisite needs its own scoped independent review.
