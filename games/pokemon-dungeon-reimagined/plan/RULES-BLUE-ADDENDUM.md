# Blue rules revision 2 addendum

## Scope and composition

- **Package:** P01 continuation, recorded 2026-10-04; implementation remains
  authorized after planning PR #387. Package dependencies and release gates apply.
- **Base:** [Blue rules revision 1](RULES-BLUE.md) and
  [blue-rules-v1.json](research/blue-rules-v1.json), preserved unchanged.
- **Addendum:** [blue-rules-v2.json](research/blue-rules-v2.json), an
  `additive-evidence-overlay` with `runtimeReady: false` and
  `packageComplete: false`.
- **State:** 31 added records: 18 supported narrow fields or reported occurrences
  and 13 blocked contracts; 11 inherited blockers receive clearer evidence.
  P01 and all 26 inherited system families remain incomplete.
- **Edition:** original Nintendo DS Blue Rescue Team; each source retains its
  edition, region and retrieval limitations. Red is comparative evidence only.

The v2 file is a partial documentation overlay. Read its `baseFile`, check
`baseRevision` and `baseSha256`, then follow `compositionContract`. Inherit every
v1 fact, source, coverage family, policy and correction. Append new sources and
rules by unique ID; apply only the listed source-array additions and rule-field
updates. No verified v1 value is replaced, and every inherited blocked rule
stays blocked. Updated limitations retain labeled v1 research context before
the new clarification, normalizing legacy strings to arrays. Runtime modules
must not import either profile from `plan/`.

| Field | Meaning |
| --- | --- |
| `addedSources` | New source register entries, with stable locators and retrieval outcomes |
| `sourceUpdates` | Additional locators, limitations and retrieval attempts for existing source IDs |
| `addedRules` | Narrow additions using the v1 status/value contract |
| `ruleUpdates` | Explicit clarification of inherited blockers; only `set` fields are replaced and `append` arrays extended |
| `supportingRuleIds` | Links from an inherited blocker to its narrower new evidence records |
| `schemaBoundaryAssessment` | Whether a reported fact supports representing a boundary; it does not declare a package ready |
| `reported-single-run` | A player's reported occurrence, not a universal outcome rule or independently inspected playthrough |

## Mechanics evidence

[Peter O.'s original-game landing page](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon.html)
explicitly covers Red/GBA and Blue/NDS. Its named guide pages support the narrow
fields below. They identify neither a Blue region/build nor machine-level edge
semantics. The guide index's Stats and Other Values link resolves to an
Explorers page; that destination is excluded.

| Subject | New supported scope | Records |
| --- | --- | --- |
| Local turn phases | Beginning, after-action and zero-HP sequences; listed free commands | `P01-MECH-TURN-03/04/05/07` |
| Actor decisions | Team-list order, team before wild actors, conditional ally movement retry | `P01-MECH-TURN-06` |
| Speed Boost | Documented after-action counter and indefinite-increase category | `P01-MECH-SPEED-03` |
| Damage | Equation, representation, explicit stat floors/clamps and modifier order | `P01-MECH-TYPE-04/05/06` |
| RNG domains | Blue researcher identifies main versus dungeon RNG and floor reseeding | `P01-MECH-RNG-01` |

The [Timing Notes](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-timing-notes.html)
describe local phases. The
[AI researcher transcript](https://gist.github.com/AnonymousRandomPerson/2750861734184be79561ee88d065abb8)
adds conditional movement ordering. Neither specifies the complete speed
schedule, new-actor eligibility or every transition interruption.

The [detailed damage guide](https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-damage-calculation.html)
provides stronger arithmetic evidence than nominal decimal factors. The
simplified companion declares itself explanatory and gives a conflicting
power-addition order; the detailed order is the supported field. Fixed-point
quantization, signed behavior, nearest-rounding ties and conflicting modifier
details remain unresolved. Exact arithmetic acceptance is separate from
accepting the documented equation.

The [Blue TAS discussion](https://tasvideos.org/Forum/Topics/15137) supplies
original Blue RNG research. Its later Agility experiment explicitly concerns
Explorers and is excluded from Blue scheduling evidence. The
[pmd-red project](https://github.com/pret/pmd-red) declares a Red/GBA build;
its existence does not establish Blue scheduler or event equivalence.

## Campaign evidence

| Subject | New supported scope | Records |
| --- | --- | --- |
| Defeat boundaries | Give Up returns as defeat; bank/storage protection; generic EXP retention | `P01B-CAMPAIGN-DEFEAT-GIVE-UP`, `-ACCOUNT-SCOPE`, `-EXP-GENERAL` |
| Rescue boundaries | Documented rescue-pending save path and resume at defeat location | `P01B-CAMPAIGN-RESCUE-PENDING-SAVE`, `-RESUME` |
| Escape and topology | Escape Orb exit exists; ordinary layouts can vary | `P01B-CAMPAIGN-ESCAPE-ORB-BOUNDARY`, `-PROCEDURAL-BASELINE` |
| Purity clear report | One Blue player reports retaining acquired Warp Scarves | `P01B-CAMPAIGN-PURITY-SUCCESS-OBSERVATION` |

The [official Blue UKV manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf)
supports the generic boundaries above. Its rescue-save statement is explicitly
qualified to the documented dual-slot flow. These facts do not supply item-loss
selection, every held-slot policy or the challenge-reset restoration matrix.
The Purity report is an individual outcome, with no inspected full inventory
trace. Its scope does not resolve the existing held-item entry conflict.

Blue-authored guide leads narrow Howling's counting question, while Pitfall's
new lead lacks authenticated edition provenance. Existing accepted counts stay
in force; exact terminal labels, geometry, controls and revisit rules stay open.

Explicit-Blue player reports add a Spinda/Gengar interaction and one ordinary
relative-day path. They do not isolate necessary and sufficient event flags,
dialogue requirements, minimum delays or retry transitions. The new Stormy Sea
resolution report has no verified edition. The illustrated Wish narrative
uses imprecise intervals and disclaims chronological ordering.

## Remaining consumer gates

| Inherited blocker | New records that narrow it | Still required |
| --- | --- | --- |
| `P01-MECH-TURN-02` | `P01-MECH-TURN-03` through `-08` | Speed interleaving, abort conditions, spawn/recruit eligibility and transition preemption |
| `P01-MECH-SPEED-02` | `P01-MECH-SPEED-03/04/05` | Opportunity rules, counter units, leader refreshes and mid-turn updates |
| `P01-MECH-TYPE-03` | `P01-MECH-TYPE-04/05/06/07` | Exact machine arithmetic and remaining modifier discrepancies |
| `P01-RESET-OUTCOME-MATRIX`, `P01-RESET-PURITY-HELD-ITEMS` | Outcome boundaries and Purity observation | Complete field-by-field challenge policies and order |
| Terminal-label, Howling and Pitfall blockers | `P01B-CAMPAIGN-*-LEAD`, `-TERMINAL-SCENES-STILL-OPEN` | Original Blue scene fields and initial/repeat transitions |
| Gengar/Wish prerequisite and day blockers | `P01B-GENGAR-*`, `P01B-WISH-EXACT-UNLOCK` | Exact Blue predicates, event priority, day and retry edges |

Source retrieval is separate from fidelity acceptance. Failed and successful
attempts at the same URL remain recorded; mirrors and shared prose do not count
as independent corroboration. An inherited `retrievalStatus` describes the v1
audit; appended `retrievalAttempts` describe this audit.
Unretrieved attachments, unidentified editions,
Red tools and Explorers statements supply no Blue runtime defaults.

## Verification boundary

- Static checks cover JSON composition, base integrity, IDs, source joins,
  blocked null values, stable locators and Markdown links/whitespace.
- No game source, automated game tests, cartridge or emulator was executed;
  no commercial implementation, script or asset was copied.
- Implementation authorization continues. This addendum does not complete P01,
  waive dependency gates, approve P06/P10 visual slices, or grant P37
  merge/deployment permission.
