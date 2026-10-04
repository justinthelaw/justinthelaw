# Original Rescue Team Systems Implementation Plan

> **For agentic workers:** The user has resolved the recommendation choices, but product implementation remains paused. Execute this appendix only after the parent plan's implementation gate is released. Human play and visual review are approved under D05; all automated tests that import or execute game source remain prohibited.

**Goal:** Build a complete, source-grounded simulation of the original Nintendo DS Blue Rescue Team systems beneath a newly authored 3D presentation. Red Rescue Team supplies comparative research only.

**Architecture:** Keep immutable content catalogs, canonical campaign state, dungeon session state, deterministic simulation, browser persistence, and rendering separate. An accepted command produces one atomic state transition plus presentation events. The camera, animation clock, menus, and dialogue typing never advance dungeon time.

**Tech Stack:** Browser ES modules, local content data, the separately planned renderer, a scoped browser-storage adapter, no runtime service dependency.

**Spec:** [PLAN.md](PLAN.md), repository `AGENTS.md`, [research/systems.json](research/systems.json), [DATA.md](DATA.md), and [CAMPAIGN.md](CAMPAIGN.md). PLAN.md governs work-package order and architecture; this appendix expands its systems contracts. Earlier scratch interfaces have no specification authority.

## Global constraints

- Target the original Nintendo DS Blue Rescue Team, as resolved by the user in D01. There is no edition selector or Red-specific product scope. Retain Red differences as comparative provenance; do not silently substitute Red-only, DX or Explorers rules.
- The game folder may contain multiple local files. All runtime dependencies and assets must remain local and use relative URLs.
- Retain original floor counts, main-story order, postgame branches, and all original obtainable species. A species name in a menu is not an implemented species.
- Use original writing, models, effects, and audio. Do not extract Nintendo assets or reproduce long dialogue scripts.
- Do not add or run automated tests against `games/` source. Static syntax, lint/type checks, source review, and requested screenshots are allowed. Website integration tests must use intercepted fixture HTML.
- No product implementation is authorized in the current turn. Research, prerequisite setup, and this plan are the deliverables for review.
- D04 approves static browser codes/files, Blue extra-mode equivalents and labeled archived event expeditions. D06 omits standalone practice encounters; do not implement a practice-session owner, bonus Groudon route or practice acceptance work. D08 fixes the source language as JavaScript with JSDoc and independent strict static type checks.
- Unverified mechanics must appear in the data/provenance register, not be hidden behind plausible constants.
- General website state-management rules remain unchanged. The standalone game's persistence exception must be documented in `AGENTS.md` before implementation.

## Review focus

1. An imported or stale save must never partially overwrite a working campaign; Task S03 owns this review.
2. A second UI activation, held key, or stale dialogue acknowledgment must not charge twice or complete an objective twice; Tasks S02, S04, and S12 own this review.
3. A perfectly connected floor may still strand a party behind terrain, escorts, or a locked exit; Tasks S05 and S11 own this review.
4. A reset-level expedition must not overwrite permanent Pokémon growth, inventory, or progress outside the verified exit policy; Tasks S03 and S06 own this review.
5. Missing original data must not be filled with main-series values and then represented as faithful Rescue Team behavior; Tasks S01 and S08 own this review.

## Evidence and current limitations

The research report contains 28 source entries and a 14-system inventory. Read the original-game section of each multi-game article. The official Nintendo manuals establish controls and the player-facing loop; Bulbapedia supplies more detailed values. The report marks unresolved numerical and behavioral questions. URLs and retrieved reference IDs travel in that JSON so the final plan can cite them accurately.

An earlier implementation attempt was stopped before a simulation facade existed. Its incomplete combat, item, generation and persistence drafts are already excluded from this deliverable and are **not an approved baseline**. Their numerical approximations, incomplete catalogs and divergent roster fields must not be carried into implementation. The planned paths below describe future work only.

Main-series PokéAPI data is useful for species identity, historical types, and historical learnsets. It is insufficient for original PMD stats, level-growth tables, experience, move PP/power/accuracy/range, recruitment rates, IQ, Friend Areas, or many move effects. The proposed 354-entry move limit also misses PMD-exclusive Wide Slash and Vacuum-Cut. A complete simulation needs these facts resolved before fidelity claims or balance-dependent implementation.

## File ownership and dependency order

All paths below are relative to `games/pokemon-dungeon-reimagined/`.

| File | Sole responsibility | Must not own |
| --- | --- | --- |
| `content/catalog.js` | Validated read-only indices over species, moves, items, areas, dungeons, scenes, jobs and rules | Save state or random choices |
| `content/provenance.json` | Source, edition, extraction date, license, confidence and adaptations for each table | Game behavior |
| `src/contracts.js` | JSDoc IDs and stable state/action/event shapes; no runtime side effects | DOM, renderer, storage |
| `src/domain/ids.js` | ID construction and catalog-membership checks | Array-index identity or browser APIs |
| `src/domain/rng.js` | Serializable deterministic random streams | Global `Math.random()` during simulation |
| `src/domain/state.js` | New campaign state and canonical roster/session projection | Browser APIs |
| `src/domain/actions.js` | Input validation, transaction boundaries, command routing | Animation |
| `src/domain/turns.js` | One accepted dungeon turn and speed scheduling | UI pacing |
| `src/domain/navigation.js` | Terrain eligibility, adjacency, diagonal constraints, paths, occupancy and visibility | Rendering meshes |
| `src/domain/generation.js` | Seeded floor generation using dungeon generation profiles | Story rewards or combat |
| `src/domain/combat/index.js` | Accuracy, damage, move targeting, effects and faint results | Saving, scene text |
| `src/domain/conditions.js` | Status categories, timers, stat stages, abilities and weather hooks | Town economy |
| `src/domain/items/index.js` | Inventory transactions, use/throw/equip and floor item ownership | Shop presentation |
| `src/domain/party.js`, `recruitment.js`, `evolution.js`, `iq.js` | Roster selection and separate recruitment/advancement rules | Scene rendering |
| `src/domain/ai.js` | Legal autonomous action selection from tactics and IQ | Direct renderer or UI control |
| `src/domain/jobs.js` | Generated jobs, activation, objective resolution and rewards | Main-story prerequisites |
| `src/domain/progression.js` | Explicit unlock predicates and idempotent story/postgame transitions | Procedural floor topology |
| `src/domain/town.js` | Town/dojo/shop/bank/storage transactions using domain modules | UI dialogs |
| `src/persistence/index.js` | Save envelope, migrations, validation, browser storage and import/export | Game formulas |
| `src/domain/mail.js` | Verified mail codecs and rescue-domain transactions | Browser transport or UI prompts |
| `src/domain/adventure.js` | Domain command facade and read-only domain snapshots | Browser persistence, presentation mapping, duplicate rules |
| `src/presentation/` | Domain snapshot-to-view projections and presentation event queue | Canonical state mutation |

The P packages in PLAN.md are the only execution order: P00–P18, then P22, then P19–P21, then P23–P37. Package IDs are stable references, not numeric execution priority; the reusable P22 scene engine precedes P19 onboarding. The S labels below are detailed checklists within those packages, not a second sequence. Split a checklist when its rows map to different P packages; do not execute its later work early merely because an S heading occurs earlier. Workers may overlap only after the parent package dependencies and shared contracts permit it, with explicit file ownership.

### Crosswalk to parent work packages

| Systems checklist | Parent package(s) | Execution boundary |
| --- | --- | --- |
| S01 evidence ledger | P01, P02; closure in P33 | Resolve foundations before rules code; retain the ledger through final audit |
| S02 contracts/state/commands | P07, P12; scene acknowledgment integration in P22 | P07 owns IDs/state; P12 owns command transactions |
| S02-Q quiz/new-game subtask | P19 | Read the S02 contract at P07; implement Blue quiz and initial rescue only at P19, after P22's reusable scene engine |
| S03 save validation | P08 | No persistence implementation before canonical P07 state |
| S04 RNG and scheduler | P07, P12 | RNG contract in P07; full scheduling in P12 |
| S05 generation/navigation | P11 | Consume P01–P02 data and P07 identities/RNG |
| S06 expedition lifecycle | P16; authored transition integration in P22 | Implement run rules before applying campaign-specific continuations |
| S07 inventory/effects | P15 | Consume verified combat/effect interfaces from P13–P14 |
| S08 combat/moves | P13, P14 | Targeting/baseline arithmetic in P13; complete effect registry in P14 |
| S09 status/traps/weather/hunger | P15, P16 | Environment/condition effects in P15; hunger/recovery/failure in P16 |
| S10 AI | P17 | Use the shared legal-action and lifecycle rules |
| S11 recruitment/Friend Areas | P17; service presentation in P20 | Recruitment rules precede town-service wiring |
| S12 jobs/ranks/rewards | P21 | Consume P20 town and P16 run outcomes |
| S13 town/advancement/dojo | P14, P17, P20, P31 | Linking rules P14; IQ/evolution P17; economy P20; complete dojo content P31 |
| S14 event graph/campaign | P22, P23–P31 | Reusable engine after P18 and before P19; authored main-story and postgame content follow parent branch order |
| S15 mail/exchange | P21, P31 | Core exchange at P21; optional/event/Blue-specific coverage at P31 |
| S16 projection/input | P09, P10, P18 | D06 omits practice; P06 is an art-only preview harness with no game imports or gameplay |
| S17 final review/acceptance | P33–P37 | Data audit, polish, human acceptance, website integration and delivery remain separate parent gates |

Each worker reads this interface section, the relevant P package, and its mapped S checklist; no required decision depends on chat history.

## Authoritative domain contract

### IDs and content records

- `SpeciesId` is a stable string such as `pokemon-025`; `dexNo` is the separate numeric national-dex value, such as `25`, within 1–386. The ID may be derived from the national dex but validity is catalog membership. `FormId` handles Unown and other applicable original forms. Do not conflate the 386-species target with a 386-record cap on stored individuals/forms.
- `PokemonId` identifies one persistent individual; `ActorId` identifies one expedition/session instance and optionally references that individual through `pokemonId`. `ItemInstanceId`, `JobId`, `SceneId`, and `TransactionId` are separate opaque-string types. Never use array indices as persistent identity or substitute a species ID for an individual ID.
- `MoveId`, `ItemId`, `DungeonId`, and `FriendAreaId` are stable catalog keys. Their valid domain is catalog membership, not an assumed contiguous integer range.
- All content records include `provenanceId`. Any intentional adaptation includes `adaptationId` and a user-facing description in the credits/rules panel.
- Species records require PMD-specific growth/experience, movement permissions, body size, ability behavior, Friend Area, recruitment eligibility/rate, move learning and evolution routes. A generic biome such as `forest` cannot substitute for an original Friend Area.
- Move records require target geometry, range, blocked-by-wall/corner behavior, category, PP, accuracy stages, critical rate, effect sequence, linking restrictions, damage rules, secondary effects and per-effect conditions. A single `effect:'damage'` string cannot describe all original moves.
- Item records distinguish unique items, stackable projectiles, held items, consumables, keys, TMs/HMs, evolution items and story objects. Original story items may have special inventory rules; do not automatically move them into a slot-free flag bag.

### Canonical state

Use exactly one authoritative Pokémon record per persistent individual.

| State field | Shape / ownership |
| --- | --- |
| `schemaVersion`, `contentRevision` | Save schema and catalog revision identifiers |
| `revision` | Persisted nonnegative safe-integer domain revision; starts at zero for a new campaign, advances atomically with accepted state changes, and is restored from a validated save |
| `profile` | Hero/partner IDs, names, team name, fixed `referenceEdition: 'blue-rescue-team'`, creation data; no selectable edition |
| `roster` | Map `PokemonId -> PokemonRecord`; permanent recruited individuals only |
| `selectedPartyIds` | Ordered roster IDs selected to depart; validated against dungeon entry limits |
| `economy` | Carried Poké, banked Poké, Toolbox item instances, stored item counts, owned Friend Areas |
| `progress` | Story node, completed-dungeon records, acquired milestones, recruited-species history, seen scenes, rank points, job records and accepted-job order |
| `mode` | `town`, `scene`, `dungeon`, `awaitingRescue`, or `defeat` |
| `session` | `null` or one active expedition with dungeon/floor, actors, map, pickups, traps, shop debt, local objective state, session inventory and deterministic RNG |
| `pendingScene` | `null` or `{sceneId, cursor, continuation}`; acknowledgment references the exact scene and cursor |
| `pendingResult` | `null` or completion/defeat/rescue transaction awaiting acknowledgment |
| `options` | Audio, reduced motion, camera, controls, map and accessibility settings; no combat state |

`PokemonRecord` contains species/form, level and experience progress, permanent stat/item gains, four learned move slots, linked-group membership, IQ points and enabled skills, tactic, nickname and origin. It does not store dungeon coordinates, temporary stat stages, or a second independently writable copy of HP.

`SessionActor` contains `actorId`, optional `pokemonId`, team role, species/form, current effective level/stats, HP, move PP, position, facing, status groups, temporary stages, held item, speed state, regeneration accumulator and recruitment provenance. A temporary recruit exists here until committed on safe exit. An escort is its own role, not a reserve-roster member.

At departure, derive session actors from roster records. At safe exit, merge only explicitly persistent gains and newly retained recruits. At failed exit, apply original loss/retention rules. In level-reset dungeons, temporary level and stats never replace permanent values; preserve only the persistent changes the original game permits after verification.

### Commands and events

Domain facade in `src/domain/adventure.js`:

- `new Adventure({initialState, content})`
- `adventure.dispatch(command) -> {accepted, reason?, events, revision}`
- `adventure.getSnapshot() -> deeply read-only domain snapshot`

The composition root in `src/main.js` wires domain results to presentation and the public persistence repository. Application operations `save`, `load`, `exportSave`, `importSave`, and `resetSave` call that repository; they are not domain methods and the domain never receives a browser storage adapter. UI render models are derived in `src/presentation/`. There is no separate practice Adventure or practice application binding under resolved D06.

The revision returned by `dispatch` is the same `revision` field in the canonical state; do not maintain a second counter. `getSnapshot()` captures immutable state including that revision atomically. A loaded Adventure resumes its validated persisted revision. Rejected/free presentation actions do not fabricate a domain state change.

Convenience methods may wrap `dispatch`, but they cannot implement separate rules. There is one authoritative command path.

| Command family | Required fields | Turn rule |
| --- | --- | --- |
| `move` | `dx,dz` each −1/0/1, not both zero | Successful step/swap consumes action according to scheduler |
| `face` | `dx,dz` | Free; no enemy, timer, Belly or RNG advancement |
| `attack` | Optional target selector; default facing tile | Dungeon action |
| `useMove` | Actor ID, move-slot ID | Dungeon action after validity check; slot ID survives reordering |
| `wait` | None | One action, never an unbounded loop |
| `interact` | Target ID or current tile | Uses explicit context table: town free, dungeon original rule |
| `useItem`, `throwItem`, `equipItem`, `placeItem`, `swapGroundItem` | Item-instance ID plus target/position where needed | Per-operation original action-cost table |
| `useStairs`, `escape`, `giveUp` | Current session ID; confirmation resolved by UI | Original timing and exit policy |
| `setTactic`, `setMoveEnabled`, `setIqEnabled`, `setLinkedMoves` | Pokémon/actor ID plus validated option | Menus free unless source rule specifies otherwise |
| `service` | Service ID, operation and typed payload | Town transaction; atomic funds/inventory validation |
| `job` | Operation and Job ID | Accept/activate/delete/claim according to phase |
| `ackScene`, `ackResult` | Exact scene/result ID and cursor/revision | Free presentation acknowledgment; idempotent |

Domain events returned by `Adventure.dispatch` are immutable plain records with monotonically increasing `eventId` and `revision`. Use separate types: `message`, `actorMoved`, `attackResolved`, `conditionChanged`, `itemChanged`, `floorChanged`, `sceneRequested`, `objectiveChanged`, `recruitOffered`, `expeditionEnded`, and `rankChanged`. Renderer effects consume coordinates and identifiers, not mutable simulation objects. An event is not a second source of truth.

Storage outcomes follow a separate application notification route: the persistence repository returns its operation result to the application service wired by `src/main.js`; that service publishes a `PersistenceNotification` to `src/presentation/` and the UI. Its shape is `{notificationId, adventureEpoch, slotId, type: 'storageSucceeded' | 'storageFailed', operation: 'save' | 'load' | 'export' | 'import' | 'reset', sourceRevision?, message, errorCode?}`. `notificationId` belongs to the application notification sequence, not the domain event sequence. Messages and error codes are safe display values, without raw storage exceptions or imported HTML.

The application creates a fresh opaque `adventureEpoch` whenever it binds a new Adventure after new game, load, import or slot change. The epoch is application-owned and never accepted from an imported file or reused across instances, even when their persisted revision numbers match. Every asynchronous storage request captures `{adventureEpoch, slotId, sourceRevision}` with its immutable snapshot; every resulting notification carries that same context.

Before applying a notification, the application requires both its epoch and slot to match the active binding. Only then can a successful-save `sourceRevision` update the saved-progress indicator, and only when it matches the current domain revision. Discard results from replaced instances; an old revision or old epoch cannot mark current progress saved. Serialize writes per slot and invalidate obsolete queued operations before replacing a binding; let any already-running atomic write settle before a newer-epoch write can commit. Synchronous adapters check the active epoch immediately before committing. Never relabel an old request with the current epoch after it completes. Storage notifications never enter `Adventure.dispatch`, increment a domain revision, consume a turn, or roll back an accepted game action. A successful load/import may replace the Adventure instance only through the separately validated application operation; receiving its presentation notification cannot perform that replacement. Failed operations leave the running domain and previous valid stored save intact.

Replacement operations (`load`, `import`, `reset`, new game and slot change) capture the current `{adventureEpoch, slotId, sourceRevision}` when requested and bind user confirmation to that context. Preparation/validation must not write the imported candidate to the active slot. Before replacement, acquire an application-level exclusive transition guard, pause domain-command acceptance, drain any in-flight slot write, and invalidate obsolete queued writes. After every asynchronous preparation step, and immediately before committing, require all three captured fields to still match the active binding; otherwise discard the candidate, preserve current progress/storage and ask the player to request the operation again. No automatic retry or fresh confirmation may reuse the old context. Serialize replacement operations through this guard so two requests from the same revision cannot both commit.

For a valid replacement, keep the guard held through any required atomic storage commit, then bind the validated Adventure and rotate its epoch without an intervening `await`; release the guard on every success/failure/cancel path. A failed storage commit keeps the previous binding/save. A load without a storage write still performs the context comparison and synchronous bind under the guard. Never let a presentation notification perform replacement or relabel its captured context. This protects load/import against newer same-epoch commands as well as changes of campaign/slot.

## Task S01: Complete the original-rules evidence ledger

**Files:** `content/provenance.json`, original-data appendices; no product rules until approved.

**Consumes:** Research JSON, data plan, campaign plan and readable original manuals.

**Produces:** One reviewed `rulesRevision` with a source or explicit adaptation for every required field.

- [ ] Enumerate every numerical table and every exceptional rule required by S05–S15; assign an evidence owner and source.
- [ ] Separate identity/type/learnset data that may come from historical main-series sources from original PMD tables.
- [ ] Resolve original scheduler details from permitted primary material or a documented clean-room interpretation. Record when allies, enemies, status ticks, passive healing, Belly, spawns, stairs and recruitment execute relative to the leader.
- [ ] Resolve original damage arithmetic and integer/fixed-point rounding; do not reuse an Explorers formula solely because it appears on a shared wiki page.
- [ ] Record source discrepancies rather than averaging: move PP/power, partial final blows for experience, individual abilities, body sizes, storage semantics and evolution edge cases.
- [ ] Produce a coverage ledger with `verified`, `adapted-with-approval`, or `blocked` for every system. Any blocked mechanic prevents an exact-completeness claim.

**Static acceptance:** A reviewer can trace each rule used by later tasks to one record; no source from DX is silently applied to RB. The review explicitly accounts for Wide Slash, Vacuum-Cut, all original forms, abilities, HMs and IQ restrictions.

## Task S02: Freeze types, ownership and command lifecycle

**Files:** `src/contracts.js`, `src/domain/state.js`, `src/domain/actions.js`, `src/domain/adventure.js`.

**Consumes:** S01 catalogs and the authoritative contract above.

**Produces:** `createCampaign(input, content)`, `validateCommand(state, command, content)`, `applyCommand(state, command, dependencies)`, and the `Adventure` facade.

- [ ] Define canonical IDs and the exact state fields above in the approved JSDoc-typed JavaScript contract, with independent strict static type checks. D08 is resolved; do not introduce a TypeScript source/compilation alternative.
- [ ] Implement original Blue new-game selection as a separate pre-campaign flow with no edition-selection step: ask eight category-distinct quiz questions, handle the special follow-up rule, obtain the original gender input, resolve the scored nature with verified tie-breaking, then filter the ten-partner pool by the hero's type. Original Blue results and starter restrictions come from the quiz data; a direct species override requires an explicit adaptation label and approval.
- [ ] Validate and bound hero, partner and team names; initialize the chosen species' correct starting stats, moves, Friend Areas and inventory only once when the player confirms the completed new-game flow. Returning to an earlier selection screen must not create extra roster members or overwrite the existing save.
- [ ] Make every command validate mode, actor/item ownership, known catalog IDs and relevant revision before mutation.
- [ ] Apply changes to a transaction draft. Commit state, emit events and request saving only after all rule steps succeed.
- [ ] Reject duplicate `TransactionId` submissions and stale scene/result acknowledgments without spending an action or resources.
- [ ] Derive UI party/reserve lists from `roster` and `selectedPartyIds`; never persist duplicate Pokémon objects to satisfy different panels.
- [ ] Expose immutable domain snapshots; define `party`, `reserves`, `moves`, `inventory`, `rank`, `availableDungeons`, `objective`, `world`, `actors` and `pickups` view projections in `src/presentation/` for P18, without putting UI mapping into domain state.

**S02-Q — P19 only:** The two quiz/name-initialization checklist items above belong to P19, after the reusable P22 scene engine is accepted. P07 defines their input/result contracts; it does not implement onboarding early.

**Static acceptance:** Trace one successful move, one invalid move, one purchase with insufficient funds and two identical acknowledgments through the source. Review every nature/gender result and same-type partner exclusion against the data table. Exactly one path mutates canonical state and no animation callback can call internal mutation functions.

## Task S03: Save validation and recovery

**Files:** `src/persistence/index.js`; storage exception documented in repository `AGENTS.md`.

**Consumes:** S02 state and catalog membership indices.

**Produces:** `encodeSave(state)`, `decodeSave(text, content)`, `validateSave(state, content)`, `migrateSave(envelope)`, and injected `StorageAdapter` operations `read/write/remove`.

### Fixed browser checkpoint policy

- Use one current campaign, a versioned primary save and the previous validated durable backup. Backups are recovery artifacts, not a second independent campaign. This browser adaptation does not reproduce cartridge single-use quicksave deletion or add a selectable strict-original save mode.
- Queue an immutable snapshot after every completed domain transaction that changes canonical state: a fully resolved turn, town/service/job transaction, scene acknowledgment/reward/transition, pending-choice creation, or other accepted state change. Do not checkpoint intermediate combat effects or partially granted rewards. Rejected commands and presentation-only changes do not trigger saves.
- Serialize writes per slot. Coalesce waiting autosaves to the latest valid revision of the same epoch; preserve the previous valid primary as backup before an atomic promotion. Do not coalesce a replacement/import operation into ordinary autosaves.
- Provide explicit Save and export/import controls; Save captures the same committed state, and export may work when browser storage is unavailable. Show saved only for the exact durably committed current revision; otherwise show unsaved/saving/error. Leaving before queued work commits may resume the last durable checkpoint; do not rely on unload callbacks to finish writes.
- Continue loads the validated primary. If it is corrupt, offer the separately validated backup with its timestamp/progress and require explicit recovery confirmation. Never silently reset or roll back the running campaign, and never overwrite a valid backup with a corrupt candidate.
- Restore RNG, dungeon state and pending scene/result/choice cursors so resuming does not reroll or duplicate grants. Preserve original expedition/failure/progression rules; disclose browser checkpoint/export behavior as a platform adaptation.

- [ ] Use an envelope containing format name, schema version, content revision and canonical state including its validated `revision`. Persist RNG state and pending scene/result cursors. Application epochs are regenerated for each binding rather than restored from saves.
- [ ] Bound text size, recursion depth, object count, arrays and strings. Reject dangerous property keys, non-plain objects, nonfinite numbers, illegal positions and unknown referenced IDs.
- [ ] Validate relational invariants: all selected IDs exist once; active actors refer to legal individuals; learned slots reference known moves; HP/PP are in range; linked groups are valid; inventory capacity obeys the current session rules; progression references known milestones.
- [ ] Derive numerical limits from catalog definitions where appropriate. Do not hardcode 354 as the largest move ID, 99 as the only floor cap, or a uniform four-member departure limit.
- [ ] Decode and validate the whole import before replacing the current state. On failure, retain the existing campaign and show a specific error.
- [ ] Write a complete envelope atomically through the adapter. A quota/security failure keeps the running game and previous stored save; communicate that progress is not saved.
- [ ] Return storage results to the application service, which emits the separate `PersistenceNotification` defined above. Keep save indicators and storage-error banners in application/presentation state; do not dispatch storage outcomes back into the domain or append them to its event log.
- [ ] Resume in-progress dungeon and pending dialogue from stored state without replaying rewards. Apply the fixed browser checkpoint policy above; document its differences from original save/quicksave behavior without changing expedition/failure rules.
- [ ] Give reset an explicit UI confirmation tied to the current save revision. Follow the exclusive replacement-operation guard and epoch/slot/revision checks above for reset, load, import, new game and slot change.

**Static acceptance:** Review malformed fields, unknown IDs, duplicate identities, wrong map dimensions, invalid move references, quota exceptions and unsupported versions. Confirm none can partially apply an import. Trace successful, failed, stale-revision and stale-epoch save results through the separate application notification route, including two loaded campaigns with equal revision numbers and a delayed write from the replaced instance; none may dispatch a domain command or alter a turn/revision. Also trace a load/import requested at revision N followed by an accepted command to N+1 before completion, and two concurrent replacement requests: the stale candidate must neither bind nor write to storage. No game-source execution is required for this review.

## Task S04: Deterministic action scheduler

**Files:** `src/domain/rng.js`, `src/domain/turns.js`, `src/domain/conditions.js`.

**Consumes:** S01 reviewed turn-order trace and S02 command validation.

**Produces:** `advanceDungeonAction(session, action, context) -> Transition`, plus serializable named RNG streams.

- [ ] Use explicit saved domain streams for dungeon layout, encounters/items, and combat/recruitment (including AI weighted choices), matching PLAN.md. Define which stream owns job/reward rolls before implementation; do not add untracked global randomness. Cosmetic particles/audio use a separate presentation-only stream that cannot change game results.
- [ ] Represent an action as a finite queue of rule effects. Multi-hit and linked moves resolve inside the owning action, not as separate input frames.
- [ ] Encode original movement-speed opportunities in a scheduler table. Normal speed, slowed turns, boosted opportunities, paralysis and movement-versus-attack differences must follow verified RB behavior.
- [ ] For each turn phase, define which actors are eligible, stable processing order, what a faint cancels and whether a newly spawned/recruited actor acts immediately. Take an ID snapshot where needed to prevent mutation during iteration from skipping actors.
- [ ] Check failure, rescue and floor-transition conditions at their verified original phase; do not move stairs ahead of enemy response just for convenience.
- [ ] Treat facing, camera orbit, menu browsing and dialog progression as free actions without advancing any dungeon stream or counter.
- [ ] Cancel queued run/rest actions when an enemy becomes visible, an item/exit/condition interrupts, or the player's command revision changes.

**Static acceptance:** Draw and inspect traces for a normal step, swapping with a partner, a missed move, a two-move link, a multi-hit knockout, a speed boost, a sleeping leader, an escort faint and stepping onto stairs beside an enemy. These are review documents, not executed tests. Unknown original ordering must be resolved in S01 before this task is approved.

## Task S05: Floor generation, navigation and visibility

**Files:** `src/domain/generation.js`, `src/domain/navigation.js`, dungeon generation profiles.

**Consumes:** Dungeon floor metadata, mobility types, S04 generation stream.

**Produces:** `generateFloor(profile, seed) -> Floor`, `canEnter(actor, tile)`, `canStep(actor, from, to, occupancy)`, `findPath(...)`, `visibleTiles(...)`.

- [ ] Construct rooms first, then a connected room graph, then corridors. Carve the graph's spanning tree before optional loops; keep the graph and tile representation consistent.
- [ ] Choose spawn and exit from the same reachable ordinary-floor component. Reserve their access tiles before decorative terrain, items, traps or enemies are placed.
- [ ] Use dungeon-specific original layout families, including fixed chambers and whole-floor Monster Houses. Generic rectangular rooms for every named dungeon are an explicitly incomplete first increment.
- [ ] Encode eight-neighbor movement and the original corner rule in one function shared by the leader, allies, enemies, projectiles and paths where relevant. Do not let the renderer decide passability.
- [ ] Distinguish floor, wall, water, lava, void/cloud, unbreakable terrain, locked doors and special tiles. Put stairs, traps and items in separate layers; a four-value numeric map alone cannot represent all original interactions.
- [ ] Validate reachability as a generation invariant within the generator, with bounded regeneration and a known-safe fallback. This is runtime safety logic, not a game test harness.
- [ ] Implement explored-map memory separately from currently visible terrain and actor visibility. Apply per-floor hallway sight range and room visibility rules.
- [ ] Keep exact dungeon dimensions configurable and camera-independent. Boss exit locking is simulation state, not merely a missing stairs mesh.
- [ ] Follow PLAN.md coordinates: logical `tiles[z][x]`, north is negative z and east is positive x. Renderer tile size and camera-relative quantization belong to presentation/input and do not alter logical passability.

**Static acceptance:** Inspect the connectivity proof and placement ordering. Inspect narrow-corner, water-only, wall-mobile, locked-room and boss-exit examples by source reasoning. D05-approved human play checks cover navigation/camera clarity after implementation is authorized and available.

## Task S06: Expedition lifecycle and entry restrictions

**Files:** `src/domain/state.js`, `src/domain/progression.js`, `src/domain/adventure.js`.

**Consumes:** Dungeon requirements, canonical party/inventory and S05 floor creation.

**Produces:** `canDepart(state, dungeonId)`, `beginExpedition(...)`, `advanceFloor(...)`, `endExpedition(outcome)`.

- [ ] Validate original departure count, total body-size limit, required species/types/HMs/items, solo requirements, no-item/no-money rules, level reset, recruiting restrictions and save-before-entry conditions.
- [ ] Show every unmet entry condition before modifying party or items. Do not satisfy a missing HM merely because a similarly named story flag exists.
- [ ] Snapshot exactly the persistent values reset for special dungeons; construct effective session records from them.
- [ ] On a floor change, clear floor-scoped statuses/stat stages, reset applicable timers, restore persistent floor-independent effects, then create the next floor and place the party legally.
- [ ] On safe exit, commit retained recruits, permanent gains and completed jobs; on defeat, apply original loss rules and distinguish hero, partner, ordinary ally and escort consequences.
- [ ] Preserve intermediate rest-stop semantics, including storage access, saving and limits on jobs past a waypoint.
- [ ] Handle Escape Orb, give-up, wind timeout, boss completion and forced story exits as explicit outcomes with separate policies.

**Static acceptance:** Review normal completion, early safe exit, no Reviver Seed defeat, successful revival, reset-level departure/return, special inventory bans, and each mandatory-story party condition.

## Task S07: Inventory and item effects

**Files:** `src/domain/items/index.js`, original item data.

**Consumes:** Item definitions, session actor targets and S04 transactions.

**Produces:** `planInventoryTransaction(...)`, `applyInventoryTransaction(...)`, `resolveItemAction(...)`.

- [ ] Enforce the original 20-slot Toolbox through item instances and permitted projectile stacks. Preserve held-item ownership separately; verify original slot behavior before implementation.
- [ ] Implement pickup, floor swap, place, trash, eat/ingest/use, throw, set quick item, give/take held item and item information as distinct operations.
- [ ] Check ownership, stickiness, restrictions, targeting, capacity and counts before consuming an item. A failed preflight cannot decrement quantity.
- [ ] Implement food/Belly, healing, status cures, PP recovery, revival, thrown seeds, fixed-damage projectiles, orbs, stat drinks, Gummis, TMs/HMs, evolution items and keys from data-driven effect sequences.
- [ ] Handle original orb restrictions in boss rooms, item-catching rules, line/arc trajectories, effects on allies, wall destruction, shop-owned items and used-TM/recycling behavior after verification.
- [ ] Track temporary Belly capacity and held-item effects without modifying permanent roster stats accidentally.

**Static acceptance:** Review a full bag picking up a stackable projectile, a full bag swapping a nonstackable item, feeding an ally, missing a thrown seed, a sticky item, a held Reviver Seed, and an orb used in a restricted encounter. The exact original consumption behavior for failed effects belongs in S01's action table.

## Task S08: Combat and moves

**Files:** `src/domain/combat/index.js`, move/ability/type data.

**Consumes:** Reviewed original arithmetic, move effect grammar and S04 scheduler.

**Produces:** `resolveMove(actorId, slotId, context)`, `resolveRegularAttack(...)`, `resolveDamage(...)`, `resolveFaint(...)`.

- [ ] Keep the regular attack separate from learned moves and PP. Use original categories and the original type chart; no Fairy type or modern reclassification.
- [ ] Implement legal target acquisition for adjacency, lines, cuts, rooms, self, allies and floor-wide moves; wall/corner exceptions come from move data.
- [ ] Apply original accuracy, stat-stage, STAB, type, ability, critical, weather and damage rules in the exact documented order, including rounding and zero-damage cases.
- [ ] Decrement PP according to Pressure and move rules. A linked group resolves in defined order without enemy interleaving; depleted PP delinks according to original rules.
- [ ] Represent multi-hit, charge/recharge, recoil, drain, counters, fixed damage, one-hit moves, protection, transformations, copied moves, ability swaps and terrain-changing moves explicitly. Do not map every move name onto twelve generic effects.
- [ ] Assign experience based on the original qualifying-hit rules and party participation. Use original growth/experience tables, not a universal level-squared curve.
- [ ] Process fainting once, with revival before permanent removal and with eligibility metadata for recruitment/job completion.

**Static acceptance:** Review representative source traces for each effect family and all starter moves. Confirm the initial roster's moves cannot be empty and that PP/range/type shown by the UI are the exact records used by combat.

## Task S09: Conditions, hunger, weather and traps

**Files:** `src/domain/conditions.js`, trap/status/weather definitions.

**Consumes:** S04 scheduling hooks, item/move effect sequences and floor data.

**Produces:** `applyCondition`, `tickConditions`, `triggerTrap`, `tickWeather`, `tickHungerAndRegeneration`.

- [ ] Use separate mutually exclusive status groups where original rules require them, with concurrently active groups where allowed. Never store only one universal `status` string.
- [ ] Store timer units explicitly: actor opportunities, global turns or entire floor. Status applications specify replacement/stacking/cure policy.
- [ ] Use fixed-point Belly/regeneration counters so fractional depletion and healing do not drift. Rendering rounds only for display.
- [ ] Apply starvation, run restrictions and linked-move restrictions to the correct actor role. Track nonleader Belly where original equipment/effects require it.
- [ ] Implement all original traps, hidden/revealed state, failure chance, reusability, ownership and activation by ordinary movement versus forced placement.
- [ ] Implement Wonder Tiles, weather damage/immunity, modified move behavior, Monster House activation and the original floor-wind timeout.
- [ ] Emit condition details needed for tooltips without exposing arbitrary internal data in player-facing text.

**Static acceptance:** Inspect initial and periodic poison/burn ticks, status replacement, confusion ally targeting, hunger at a fractional boundary, Heal Ribbon/energy conservation, revealed versus hidden traps and a forced teleport onto a trap.

## Task S10: Partner and enemy AI

**Files:** `src/domain/ai.js`, `src/domain/party.js`, `src/domain/navigation.js`, and `content/` AI policy data.

**Consumes:** Legal-action queries, current visibility, enabled moves, tactics and IQ.

**Produces:** `chooseActorAction(actorId, context) -> Command` for scheduler-controlled actors.

- [ ] Implement original tactics with their unlock thresholds, including follow, wait, avoid combat and independent travel where applicable.
- [ ] Select legal actions from shared command validation; AI cannot walk through corners, spend absent PP or bypass item restrictions.
- [ ] Apply IQ restrictions to choices, including Course Checker, PP Checker, item use, status redundancy, target preference, trap avoidance and terrain avoidance.
- [ ] Define deterministic tie-breaking before random weighted choices. Use the saved combat/recruitment RNG stream for AI weighted choices; never camera position or animation timing.
- [ ] Handle blocked corridors, separated allies, immobile escorts, no usable moves, low-HP fleeing abilities and room/line attacks that might hit allies.
- [ ] Document whether verified original AI bugs are reproduced or deliberately corrected. A corrected behavior is an adaptation, not silent fidelity.

**Static acceptance:** Trace following around a corner, waiting behind an ally, rescuing an escort, refusing a shot through a teammate, selecting a linked move at low PP and returning to the leader after combat.

## Task S11: Recruitment, body limits and Friend Areas

**Files:** `src/domain/recruitment.js`, `src/domain/party.js`, and original recruitment/Friend Area data under `content/`.

**Consumes:** Faint metadata, party/body capacity, unlocked areas and dungeon rules.

**Produces:** `getRecruitmentEligibility`, `calculateRecruitmentChance`, `offerRecruitment`, `commitRecruitments`, `selectParty`.

- [ ] Evaluate original prerequisites: correct final attacker and damage cause, adjacency, allowed dungeon/floor, eligible species, correct Friend Area, party space and total body-size capacity.
- [ ] Use species base rates plus verified leader-level and held-item modifiers; do not substitute a universal eight-percent roll.
- [ ] Present a real join/decline/name decision. Freeze the appropriate action phase while waiting, without allowing duplicate rolls on reload or menu cancellation.
- [ ] Keep new recruits provisional until the required safe-exit condition. Apply original loss if the recruit/leader faints or the expedition fails.
- [ ] Handle story gifts, automatic legendary Friend Areas and first/second-visit boss distinctions through explicit content rules.
- [ ] Implement original Friend Area ownership/capacity and explorable resident management, not a list of generic habitats. Distinguish departure limits from maximum dungeon members.

**Static acceptance:** Review distant knockout, partner knockout, poison knockout, missing area, body-size overflow, full party, declined offer, accepted recruit surviving exit, accepted recruit fainting, and a special legendary exception.

## Task S12: Jobs, rank and reward transactions

**Files:** `src/domain/jobs.js`, job/reward data.

**Consumes:** Encounter history, unlocked dungeons, campaign availability and economy transactions.

**Produces:** `generateJobBoard`, `acceptJob`, `activateJob`, `resolveJobObjective`, `claimExpeditionRewards`.

- [ ] Model board, mailbox, accepted list and active jobs separately; enforce original capacities and one-job-per-floor/one-escort constraints.
- [ ] Generate only supported original job families: rescue, escort, deliver item and find item, plus authored story jobs. Do not introduce Explorers outlaws.
- [ ] Store hidden difficulty and display grade separately. Reward points use hidden difficulty, not a guessed one-value-per-letter table.
- [ ] Validate client availability, destination, escort behavior, target spawn and item ownership. Reserve target spawn space so procedural placement cannot erase the objective.
- [ ] Mark objective completion once and let the player continue or return where original rules permit. Keep reward claims idempotent across multiple jobs, save/resume and repeated clicks.
- [ ] Route overflow items to storage using original rules; apply Poké, rank points and Friend Area rewards atomically. Emit separate rank-change events without granting DX capacity upgrades.
- [ ] Refresh board/stock only on the actual original day/expedition/dojo transitions.

**Static acceptance:** Inspect two active jobs on different floors, competing same-floor jobs, an escort with no party room, delivery without its item, existing-item find request, continuing after a rescue, overflow rewards and duplicate claim attempts.

## Task S13: Town services, linking, IQ and evolution

**Files:** `src/domain/town.js`, `src/domain/party.js`, `src/domain/evolution.js`, `src/domain/iq.js`, and service/dojo data under `content/`.

**Consumes:** Economy, roster, progress and original service definitions.

**Produces:** `quoteService` and `executeService` with typed operations; no service mutates state directly from a UI button.

- [ ] Kecleon: original story-dependent stock, buy/sell prices, quantities, affordability and inventory checks. Dungeon shops maintain merchandise ownership/debt and original theft consequences separately from town stock.
- [ ] Bank/storage: amount/quantity selection, deposits/withdrawals, capacity, overflow and informative failures. Preserve deposited resources on expedition failure.
- [ ] Gulpin: choose Pokémon, remember/forget/reorder/link/delink moves, validate link restrictions and charge the original service once per successful transaction.
- [ ] IQ: type-sensitive Gummi gains, original star thresholds, skill unlocks, restriction groups and toggles. Preserve actor and roster IQ consistently after an expedition.
- [ ] Evolution: postgame solo cave access, exact route prerequisites, level/IQ/stones/multiple-item offerings, valid result, item consumption and unchanged immediate original stats. Handle experience-progress loss as verified; do not apply modern evolution stat bonuses.
- [ ] Dojo: every original maze, unlock stage, three-floor structure, boss roster, recruitment exceptions, no ordinary item spawns and first-clear/all-type rewards. The Blue-only imported-team maze is a distinct compatibility feature.
- [ ] Friend Area service: actual named areas, original prices, story availability and capacity, integrated with resident management.

**Static acceptance:** Review unaffordable quote, stale quote after an inventory change, quantity overflow, invalid link, multiple-item evolution, wrong IQ, already-evolved species, repeat dojo rewards and banked-money survival.

## Task S14: Main-story and postgame progression

**Files:** `src/domain/progression.js`, campaign/scene/unlock data.

**Consumes:** Campaign appendix's full event graph and each subsystem's completion events.

**Produces:** `evaluateRequirement`, `availableRoutes`, `applyMilestone`, `queueScene`, `acknowledgeScene`.

- [ ] Encode prerequisites as a typed expression tree: `all`, `any`, completed dungeon, recruited species, acquired story milestone, owned Friend Area, known/held HM, item ownership and explicit event state. Do not interpret arbitrary strings as executable code.
- [ ] Resolve original prerequisites through the correct subsystem. Buying an area, recruiting a legendary, possessing an HM and talking to an NPC are different transitions.
- [ ] Define unique before/after scene IDs and continuations. Acknowledgment advances only the pending cursor. Save/resume retains pending narration without relaunching an encounter or duplicating rewards.
- [ ] Retain all main-story floors/segments/bosses/rescues, fugitive restrictions, rest stops and return-to-town changes. The original chapter structure should not be shortened to fourteen generic boss buttons.
- [ ] Implement each postgame branch and optional/event dungeon with its original unlock graph. Make necessary story-object acquisitions playable; do not unlock everything automatically after Sky Tower.
- [ ] Record a clear first-visit versus repeat-visit policy for bosses, recruitment and scenes. Some first victories are narrative-only; replay rewards must not duplicate unique items or gifts.
- [ ] Review the dependency graph statically for cycles, unreachable nodes and required items that have no acquisition path.

**Static acceptance:** Walk the main-story graph and each postgame branch on paper against the campaign appendix, including the birds/Lugia/Deoxys chain, wing/beasts/Ho-Oh chain, Eon pair, Gengar/Gardevoir and optional areas. Every node has a concrete trigger and reachable completion condition.

## Task S15: Wonder Mail and Friend Rescue

**Files:** A focused `src/domain/mail.js`, mail data/protocol documentation, UI integration later.

**Consumes:** Approved D04 browser-equivalent scope, sourced Blue rescue/event semantics, jobs, deterministic floor state and rescue outcome policy. Original codec data is required only for a sourced compatibility claim.

**Produces:** Clearly versioned static browser codes/file exchange for rescue features, browser equivalents for Blue's extra modes and labeled archived event expeditions preserving their content and progression. No hosted matchmaking or required cartridge-interoperability gate. Original-compatible codes may be claimed only where their algorithm and behavior are sourced and demonstrable.

- [ ] Separate Wonder Mail job codes from SOS/A-OK/Thank-You rescue exchanges. Specify the browser format/version and once-per-save redemption. Only an explicitly supported original-code path enforces the sourced Blue regional format and verified cross-version behavior. Red format research does not add a selectable Red campaign.
- [ ] Validate format version, checksum, legal characters, destination and decoded constraints before adding a job. Archived event access must identify its browser adaptation and unlock the correct destinations without bypassing their retained content/progression.
- [ ] Capture the necessary dungeon identity/seed/rescue location when a team requests help. A rescue expedition reaches the actual rescue spot and applies the correct rules.
- [ ] Validate A-OK mail against the pending request before revival; reject replayed or mismatched acknowledgments.
- [ ] Implement the approved browser code/file equivalents for Blue wireless helper transfer and dual-slot team import, preserving the relevant extra-mode rules and labeling the adaptation. Physical DS connectivity is not required; Red cable behavior is comparative evidence only.

**Static acceptance:** Inspect the documented browser format and source-derived rescue semantics; inspect rejection paths for unsupported format versions, invalid characters, wrong request identity, redeemed codes and locked destinations, plus regional mismatches only for supported original-code paths. Include Blue extra modes and archived events in the content ledger. Cartridge interoperability is not a completion requirement and remains unclaimed without sourced, demonstrable evidence.

## Task S16: Presentation projection and input

**Files:** `src/presentation/`, `src/input/`, and `src/main.js` application wiring; renderer remains under `src/rendering/`.

**Consumes:** Approved domain APIs and renderer contract.

**Produces:** Immutable `RenderSnapshot` and clear projection to HUD/menus. P06 is separate art tooling: its preview harness may show static compositions and animation playback, but imports no game source and implements no commands, combat, state, saves or playable encounter. P10/P18 integrate production modules. Resolved D06 omits all standalone practice implementation and acceptance work; Groudon remains on the original campaign route, and the final arcade screenshot comes from actual campaign play.

- [ ] Project actors in `src/presentation/` into renderer fields `{actorId: ActorId,speciesId: SpeciesId,formId,dexNo,name,x,z,face,hp,maxHp,role,statuses}` and layers into a renderable world. `dexNo` is catalog metadata, not actor identity. `role` uses the shared presentation enum and `statuses` is a readonly array of projected status descriptors; any boss presentation metadata is separate from identity. Match RENDERING.md section 3.2 exactly; do not expose mutable session arrays.
- [ ] Keep third-person movement mapping in the input/controller layer: camera-relative input becomes a discrete world direction, then passes normal validation.
- [ ] Allow camera orbit/zoom, reduced motion and animations while domain time waits. Queue or reject inputs during visual transitions without losing accepted actions.
- [ ] Provide all documented controls through keyboard and accessible on-screen alternatives. Every town service and dungeon objective needs a visible interaction, not only an internal method.

**Static acceptance:** Review renderer/controller code for direct writes into simulation state. D05-approved manual campaign play and screenshots may demonstrate presentation; they do not alone establish campaign completeness. No standalone practice route or practice-session code belongs in this task.

## Task S17: Completion ledger and review-only acceptance

**Files:** Rules/provenance ledger, implementation status document, repository integration documentation.

- [ ] Mark every original system and content table as complete, approved adaptation or outstanding. A checklist item requires working data plus its reachable interaction.
- [ ] Run syntax checks and the approved game's static lint/type checks only; do not execute game-source tests.
- [ ] Perform a fresh static review of imports, reference integrity, state ownership, turn transactions, save migrations, finite loops, exact rules and accessibility projections.
- [ ] Run the website's required checks separately, with fixture content for the game iframe. Parent/root owns these repository checks.
- [ ] Use the D05-approved human play/visual acceptance checklist after implementation is authorized and available: quiz/partner selection, initial rescue, PP/Belly/items, job turn-in, town purchases/deposits, linking, recruitment, failure/revival, save/reload, a story boss, postgame unlock, evolution and import rejection. These are human acceptance steps; all automated tests importing or executing game source remain excluded. Practice checks are omitted under D06.
- [ ] Report current limitations in the game credits/help and PR. Do not describe an implementation as a complete exact recreation until the source/data/interaction ledger supports that claim.

## Resolved choices and execution constraints

1. **Fidelity and scheduling:** Original PMD numerical/effect data and verified Blue ordering remain engineering research obligations. Resolve gaps before rules implementation; do not make up values or choose AI quirks opportunistically.
2. **Saving:** Use S03's fixed browser checkpoint policy: one current campaign with primary/backup recovery, autosave after complete state transactions, manual save/export and explicit backup recovery. Strict cartridge quicksave is not an open choice. Preserve the revision/epoch replacement and notification contracts.
3. **Connectivity — D04:** Static browser codes/files, Blue extra-mode equivalents and labeled archived event expeditions are approved. Cartridge interoperability is not required; compatibility claims still need verified sources and demonstrable behavior.
4. **Acceptance — D05:** Human play and visual review are approved. Automated tests importing or executing game source remain prohibited; website checks use inert fixtures.
5. **Practice — D06:** Omit standalone practice, bonus Groudon encounters, practice-session implementation and practice acceptance work. Use the original campaign encounter for the final gameplay capture.
6. **Language — D08:** Use JavaScript with JSDoc and strict independent static type checks; the TypeScript alternative is closed.
7. **Delivery:** Internal milestones do not imply full-story/postgame/all-species completion. The parent plan's full-release and implementation gates remain in force; resolving these choices does not start product implementation.

Product implementation remains paused pending the parent plan's explicit execution release. Do not reopen the resolved choices as approval questions.
