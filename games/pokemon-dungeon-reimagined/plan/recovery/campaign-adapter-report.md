# P07-B campaign adapter sub-batch report

Status: supported independent joins implemented; complete CampaignContent and
initial campaign construction remain blocked. This is not completion of P07-B,
Task 3, any playable opening, or the full-game requirement.

## Changed paths

- `games/pokemon-dungeon-reimagined/content/state.js`
- `games/pokemon-dungeon-reimagined/content/state/identities.js`
- `games/pokemon-dungeon-reimagined/content/state/starters.js`
- `games/pokemon-dungeon-reimagined/content/state/options.js`
- `games/pokemon-dungeon-reimagined/plan/STATE-CATALOG-JOINS.md`
- `.superpowers/sdd/FULL-GAME-EXECUTION/campaign-adapter-report.md`

All files are new. No existing factual loader, schema, contract, validator,
bootstrap, README, shared ledger or unrelated WIP was edited. No commit was made.
Parent retains recovery/publication/independent-review ownership.

## Implemented API

`content/state.js` exports three independent responsibilities:

1. `createCatalogIdentityJoins({species,dungeons,effects})`: a frozen lookup
   implementing exact species/form, complete effect-move/item, dungeon/section/
   floor, Friend Area and ability membership. The three relational checks
   implement explicit persistent/session form context and complete floor/section
   ownership joins. Unsupported identity namespaces throw, producing the
   canonical validator's existing unresolved lookup requirement rather than
   universal success or false unknown-ID diagnoses.
2. `joinStartingPair({onboarding,species,effects},natureId,column,partnerSpeciesId)`:
   immutable original result/pair lookup plus cross-catalog validation of both
   distinct starting records. It joins profile/resource identities, both stages'
   exact stats/EXP, move internal IDs/learnset entries/initial PP, and the ordered
   deduplicated initial area union. It returns original initialization facts and
   evidence without creating a campaign, selecting a profile stage implicitly,
   drawing RNG, granting the first-mail kit, or applying the Tiny Woods boost.
3. `validateCampaignOptions` plus `OPTION_BOUNDS`: a real semantic policy for
   volume, sensitivity, zoom and text scale. The canonical structural validator
   continues to own booleans/enums/exact shape. Documented browser UI bounds are
   0-1 volume, 0.1-4 sensitivity, 4.5-12 camera distance and 0.75-2 text scale;
   camera distance matches the renderer contract. No load-time clamping/defaults.

These modules consume validated catalogs by reference, retaining loader lifecycle
ownership. They do not load catalog files, import DOM/rendering/storage/simulation,
or present a partial object as CampaignContent. There is intentionally no
`initialCampaign`, invented content revision, or unresolved sixteen-policy shell.

## Source and design decisions

- Read root/game AGENTS, PLAN authority/scope, recovery notes, CAMPAIGN-STATE,
  TURNS-CONTRACT, onboarding/campaign/species/effects catalog contracts, and
  relevant runtime contracts/validators/loaders. No entire research corpus read.
- Original Red comparative qualifications are preserved and accepted within the
  supplied catalog scope; lack of Blue binary parity is not used as a blanket
  blocker.
- Use the 356-move effects catalog for membership, not the species catalog's
  355 moves referenced by learnsets. Item membership is separate from availability.
- Non-form profile IDs cannot masquerade as form IDs; implicit default profile
  lookup cannot erase explicit Castform/Deoxys form identity. Persistent context
  rejects the six temporary forms. Session membership does not approve the
  transformation mechanics.
- Do not coerce factual campaign scene/ground-map identities into fully authored
  runtime scene/map definitions. Source operation responsibilities are not scene
  scripts or geometry.
- Preserve level-one creation versus level-five first-playable records. Initial
  items/money are empty/zero in source, and the first-mail kit is later.
- Only a catalog's unknown-row RangeError becomes absent membership. Unavailable/
  disposed catalogs continue to throw. Retained lists check the species catalog
  is live through its guaranteed Bulbasaur row, never a fallback for requested IDs.

## Precise remaining requirements

The contract document includes a sixteen-policy obligation table. Only `options`
is complete as a semantic policy; the other fifteen require their actual domain
and content definitions. Identity membership is not substituted for these rules.

The first blocking contract join is `ProgressState`: its current closed shape
has story node, branches, milestones, clears and histories, but no accepted
lossless representation for MAIN/SUB1-SUB9/SELECT two-component pairs, CLEAR_COUNT,
entry frequency, persistent versus pending native flags and scalar projections.
Campaign facts already source their behavior. `statistics.jobsCompleted` cannot
replace CLEAR_COUNT because pair changes reset it and same-pair writes preserve
it; pending flags have their own flush boundary. Extending the contracts, exact
schema and validation together needs controller review and was not authorized
within this agent's owned paths. This was reported to the controller before edits.

The initial profile is independently blocked by explicit null joins in
`onboarding/initialization.json`: accepted IQ/tactic identities/behavior, scene
and map IDs, boost consumed guard, inventory predicate, name policy, RNG stream
selection and reward/kit grant identities. The profile also needs actual opening
script cursor/bindings/awaiting/continuation, town/day/placements/stock, branch and
milestone decisions and recruited-history semantics. The input requires a
team-name string before the opening, while source naming occurs after the rescue;
no accepted unnamed representation or staging adaptation exists yet.

Other concrete gaps: entry/outcome/retention policies; authored scenes/results;
town service/day/population semantics; jobs/rewards/mail; rescue exchange and
imported-team lifecycle; permanent growth/evolution/recruitment/capacity; item
payload/scope rules; terrain/weather/trap/map joins; status duration policy IDs;
effect-program and scheduler cursor semantics tied to real TurnHooks. Several
effect-specific subfields remain unresolved in EFFECT-CATALOG; newer accepted
scoped contracts must be consulted individually before blocking an operation.

A full content revision must bind the resulting accepted definitions and catalog
versions together. A schema number or this partial join module is not that
revision. No fake ready initial profile is returned.

## Static validation and self-review

From `tools/pokemon-dungeon/`:

| Command | Result |
| --- | --- |
| `npm run lint` | Passed on final rerun; 166 authored files, static module-path review |
| `npm run typecheck` | Passed; 90 authored game source files, strict static JSDoc |
| `npm run onboarding:check` | Passed; 56 questions, 26 outcomes, 129 pairs, 16 two-stage loadouts; closed schemas/source fingerprints/catalog joins |
| `npm run species:check` | Passed; 386 species, 419 profiles, 384 numeric resources, 386 learnsets |
| `npm run effects:check` | Passed; 27 deterministic resources, 356 moves, 413 actions, 240 items, 266 families, 66 statuses |
| `npm run dungeons:check` | Passed; 25 deterministic resources, complete dungeon/floor/variant memberships |
| `git diff --check` | Passed for the tracked shared worktree diff; new module formatting also covered by lint |

An additional one-off read-only Python JSON review independently compared all
65 starting move positions with effects internal IDs, species learning levels
and first-playable PP; all agreed. It imported no game source. No automated
game tests, simulations or playthroughs were created or run.

Self-review traced unknown row versus unavailable loader errors, normal versus
explicit forms, temporary persistence, wrong-dungeon/section/floor joins,
unsupported namespaces, first-playable/roster separation, exact pair-area order,
full move identity coverage and non-finite/out-of-bounds options. Frozen result
wrappers retain only already immutable catalog records. New options policy is a
semantic companion, not a replacement for canonical exact shape validation.

Parent owns full-site fixture checks, publication, and independent review. No
manual gameplay or visual acceptance evidence exists for this bounded work.
