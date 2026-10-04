# Original Rescue Team Campaign Content Implementation Plan

**Product baseline: original Nintendo DS Blue Rescue Team**, explicitly selected by Justin on 2026-10-04. Shared Red/Blue references remain useful research, but Red-only behavior does not create a second product edition or a version selector. Preserve Blue's documented cross-version unlock mechanisms where relevant; do not silently discard roster scope.

> **For agentic workers:** This is a planning appendix, not authorization to implement. The current user instruction is to stop after the extensive plan and prerequisite setup for review. After explicit authorization, use `superpowers:subagent-driven-development` or `superpowers:executing-plans` task by task. Do not execute the future product tasks below during the planning turn.

**Goal:** Produce a fully playable, source-traceable third-person reinterpretation of the original *Pokémon Mystery Dungeon: Red Rescue Team / Blue Rescue Team* campaign, postgame stories, optional expeditions, and progression, while clearly identifying every deliberate adaptation and unfinished item.

**Architecture:** Separate factual dungeon records, scene scripts, objective state machines, town population schedules, recruitment gates, and content provenance. A story chapter may traverse several scenes and expeditions; a dungeon clear is an event consumed by a quest, not proof that the quest is complete. Save facts about what happened rather than deriving every feature from a single chapter number.

**Tech stack:** Planned static browser ES modules inside `games/pokemon-dungeon-reimagined/`, coordinated with the parent implementation plan. This appendix specifies content and its runtime contracts, not product code.

**Spec:** [PLAN.md](PLAN.md) governs authority, architecture, execution order and review gates; [SYSTEMS.md](SYSTEMS.md) governs canonical domain identities and state/action contracts. The factual input is [research/campaign.json](research/campaign.json), with source confidence and outstanding research coordinated through [RESEARCH.md](RESEARCH.md). This appendix refines campaign content within those contracts. It does not establish a separate execution sequence or authorize implementation.

## Global constraints

- Target the 2005/2006 original pair. Do not import DX floor counts, Pokémon availability, recruitment guarantees, boss transformations, rare qualities, Mystery Houses, camps, or level-5 challenge resets.
- Preserve original dungeon lengths in the default faithful route. Any shortened or accelerated expedition is a separately labeled adaptation with independent completion tracking.
- Author all dialogue, narration, visual staging, music, portraits, and models anew. Names and factual plot structure can guide content; original script passages, extracted assets, and reconstructed shot-for-shot cutscenes are not deliverables.
- Preserve the user's restriction: no tests against game source. Future validation must follow the approved static-review and screenshot/manual-review boundaries in the parent plan. Website integration checks use substitute iframe content. This planning work runs no game tests.
- Current task ends at reviewable planning and permitted setup. Do not create campaign product modules, gameplay, scene scripts in executable form, generated game assets, or commits that imply implementation was approved.
- Maintain relative local assets, project-base-path compatibility, and offline runtime operation when implementation is authorized.
- Do not call a list of chapters, a dataset of Pokémon, or reachable boss arenas a complete game. Completion requires the playable transitions, failure/retry states, scene triggers, persistence, and content coverage described here.

## Review focus

1. A saved expedition resumes during an escort, midpoint, boss encounter, or ending scene without skipping its rescue condition or duplicating its reward.
2. Interleaved postgame arcs do not overwrite each other's NPCs, consume permanent prerequisites twice, or deadlock because one dialogue outranks another forever.
3. Unnumbered story clearings are not accidentally generated as extra random floors; true numbered boss floors still count toward canonical totals.
4. Losing, selling, storing, breaking, or consuming an HM or quest item produces the original gate behavior or an explicitly documented adaptation, with a recovery route.
5. Recruiting, declining, dismissing, evolving, or leading with a story species does not confuse the named NPC with an ordinary recruit of the same species.

Future review must examine those five conditions directly. They are not assertions that any runtime currently handles them.

## 1. Evidence and fidelity policy

### 1.1 Source hierarchy

Use the original game's observable behavior or an official original manual for a disputed rule, then a specific Bulbapedia dungeon/character page explicitly scoped to Generation III, then the user-provided original walkthrough. The walkthrough is useful for sequence but has several inconsistent counts. The official Nintendo and Pokémon catalog URLs were located; their current extracts did not provide a detailed English campaign guide. Accordingly, the research is well-supported community reference work, not fully primary-source-verified documentation.

Every future content record must carry at least one `sourceKey`, an original-game scope marker, and one confidence value:

| Confidence | Meaning | Implementation rule |
| --- | --- | --- |
| A | Specific original-game page and sequence source agree | Implement the stated fact; retain source linkage |
| B | One explicit original-game source, no known conflict | Implement but include in targeted human fidelity review |
| C | Conflicting sources, unclear timing, mixed edition text, or unverified detail | Resolve before presenting as faithful; do not silently choose DX behavior |
| D | Deliberate reimagining decision | Describe as adaptation, not research fact |

Confidence concerns the evidence, not how appealing a design choice is. A beautifully staged scene can still have unresolved source timing.

### 1.2 Confirmed corrections to preserve

| Detail | Required interpretation | Evidence |
| --- | --- | --- |
| Tiny Woods | 3 exploration floors; Caterpie clearing is a terminal scene map | Specific Tiny Woods page; walkthrough calls clearing a fourth floor |
| Thunderwave Cave | 5 exploration floors; Magnemite scene follows | Specific Thunderwave Cave page; walkthrough counts 6 |
| Great Canyon | 12 exploration floors; Hill of the Ancients follows | Specific Great Canyon page; walkthrough counts Xatu as 13 |
| Silent Chasm | 9 exploration floors; Zapdos encounter is a story scene, not a boss fight | Specific Silent Chasm page |
| Mt. Freeze | 15 + 4 exploration floors = 19; Ninetales summit is separate | Specific original-game page; 20 is DX or clearing-inclusive prose |
| Murky Cave | 19 exploration floors; judgment/Gardevoir scene follows | Specific Murky Cave page; walkthrough prose calls it 20 |
| Uproar Forest | 10 floors; Mankey on 10; two extra Chestnuts finish reconstruction | Specific original-game section; DX has 4 floors and three extra Chestnuts |
| Mt. Faraway | 40 floors; Friend Bow locked on 30 | Original-game section; DX has 60 floors and moves the bow |
| Purity/Wish/Joyous | Temporary level 1 reset in originals | Original sections; DX uses level 5 |
| Evolution location | Luminous Cave | Walkthrough's Luminous Spring wording is incorrect for this pair |
| Groudon first battle | Level 27 if implementing original encounter values | Specific Magma Cavern page; walkthrough table also contains 37 |
| Return to Sky Tower | Fly required after the Teleport Gem is damaged | Original Sky Tower section |
| Gengar redemption | Require Stormy Sea clear as well as Medicham rescue unless direct verification disproves | Team Meanies article states both; broad walkthrough omits Stormy Sea |

Do not solve these discrepancies by adding one to every dungeon total. A terminal map is sometimes a numbered boss floor and sometimes an external narrative clearing. Each entry needs its own topology.

## 2. Proposed content file responsibilities

These are future files, not files to write in this planning task. Keep the module boundary compatible with the parent plan; a smaller implementer must not put every scene and every gameplay rule in one controller.

| Planned file | Responsibility | Must not contain |
| --- | --- | --- |
| `content/campaign.js` | Public campaign exports and stable IDs | DOM mutation, combat, persistence side effects |
| `content/dungeons.js` | Original dungeon topologies, unlock predicates, encounter references, treasures and restrictions | Cutscene presentation logic |
| `content/main-story.js` | Main-story quest stages, ordered scenes, objective/effect declarations | Procedural map generation |
| `content/postgame.js` | Independent postgame quest graphs, recruitment and return-visit distinctions | A fake single linear postgame chapter counter |
| `content/town.js` | NPC schedules, location variants, service unlocks, recurring conversational topics | Species-wide personality assumptions |
| `content/quiz.js` | Newly written quiz, original starter mapping, partner eligibility | Copied question text |
| `content/sources.js` | Source ledger, confidence, adaptation declarations and unresolved fidelity items | Unattributed copied articles |
| [COVERAGE.csv](COVERAGE.csv) | Repository campaign acceptance inventory, updated under the parent plan | Claims based only on data presence |

If the parent plan chooses fewer files, retain these ownership boundaries as separately named exports. If it chooses more, do not split individual scene paragraphs into dozens of tiny modules.

## 3. Content interfaces and persistent facts

All planned `content/` paths above are relative to `games/pokemon-dungeon-reimagined/`; the coverage ledger remains under `games/pokemon-dungeon-reimagined/plan/`. The canonical identity contracts come from [SYSTEMS.md](SYSTEMS.md):

| Identity | Required representation | Campaign use |
| --- | --- | --- |
| `SpeciesId` | Stable species string such as `pokemon-025`; separate numeric `dexNo: 25` | Encounter definitions, species recruitment predicates and species lookups |
| `FormId` | Separate original-form identity under the species contract | Unown and other applicable original forms without creating extra species |
| `PokemonId` | Persistent opaque identity of one individual Pokémon | Hero, partner, named recruits and ordinary recruits; never derived from species or array position |
| `storyActorId` | Stable named story-character identity distinct from `SpeciesId` and `PokemonId` | Scene cast, NPC schedule and named rescue identity |
| `ActorId` | Domain actor-instance identity defined by SYSTEMS | References to a deployed participant or encounter actor; not a substitute for roster or story identity |

A recruitable named character needs an explicit mapping from its `storyActorId` to the resulting persistent `PokemonId`. A nonrecruited NPC has no implicit roster member merely because its species is recruitable. A defeated boss species, a named boss character and a recruited individual are separate facts. Scene casts must declare which identity they reference; never resolve a named NPC by selecting the first roster member with the same species.

Numeric species entries in the research report and the Dojo table below are National Dex reference values (`dexNo`), not runtime IDs. Normalize them to canonical `SpeciesId` strings during parent tasks P01–P02; keep the research report as evidence rather than importing its provisional keys directly into runtime content.

### 3.1 Dungeon topology

A future dungeon record needs more than `floors: number`. Specify:

- Stable slug, display name, original version scope, theme sequence, direction of descent/ascent, canonical numbered floor total, and segment list.
- For each segment: name, first global floor, count, original local floor labels, palette/terrain regime, and midpoint transition.
- A `terminalScene` reference for unnumbered rescue/summit maps; this scene never increments the numbered-floor total.
- `fixedFloors` for numbered boss arenas and event floors. A fixed story floor must suppress random enemies/items unless documented otherwise.
- A list of all bosses on the same floor, not one boss species per dungeon. Team Meanies, Mankey and Dojo teams are simultaneous groups.
- Entrance requirements, initial-entry restrictions, repeat-entry requirements, first-clear and repeat-clear conditions, and recruitment eligibility separately.
- Per-floor encounter bands, item bands, weather, visibility, traps, shops, Monster Houses and fixed treasure rooms sourced independently. Do not use one arbitrary resident list for every floor of a 99-floor dungeon.
- A source record for each unusual mechanic. Reimagined geometry can be procedural while the underlying floor content remains faithful.

### 3.2 Scene record

Each authored scene needs a stable ID, triggering event, location, present named actors, predicate, one-time/repeat policy, original prose, choices if any, visual/audio staging intents, checkpoint boundary, and effects. Commit the completed scene ID, grant receipts and resulting inventory/roster changes in one atomic saved transition. If an adapter requires staged writes, persist a durable pending-grant receipt and recover it idempotently before marking completion. A crash must neither lose the only reward nor grant a second legendary recruit.

Choices can personalize the hero or partner response while converging on a canonical objective. Do not invent a branching route in which the player defeats Ninetales, permanently joins Team Meanies, or abandons Caterpie unless such a route is explicitly labeled a new optional fiction mode.

### 3.3 Quest record

Use a staged state machine with entry prerequisites, stage objective, completion event, exit effects, and presentation. Stage keys should be meaningful (`latias-rescue-requested`, `medicham-rescued`), not indices that change when a new line of dialogue is inserted. Distinguish:

| Fact family | Proposed persisted representation | Example |
| --- | --- | --- |
| Story scene | Set of completed scene IDs | `ninetales-vindication` |
| Dungeon visitation | Per-dungeon attempt and clear counts | `mt-thunder.clearCount = 2` |
| Boss encounter | Seen, defeated, and recruited facts separately | Rayquaza story defeat vs later recruit |
| Quest stage | Per-quest stage key | `mirage:rainbow-wing` |
| Named rescue | `storyActorId`, objective identity and rescue outcome | Named Medicham's `medicham-wish-cave` objective |
| Physical item | Inventory/storage instance and quantity | `music-box` |
| Permanent knowledge | Discovery/unlock flags that survive losing an item | `knows-stormy-sea` |
| Habitat | Owned Friend Area IDs | `southern-island` |
| Recruitment | Persistent `PokemonId`, canonical `SpeciesId`, optional linked `storyActorId` | Named Absol versus another individual of the same species |
| Town time | Day counter and last event day | Ekans/Medicham conversation sequence |
| Base progress | Renovation stage and supplied Chestnuts | `base-work:awaiting-second-chestnut` |
| Challenge result | Dungeon, rules mode, entrant, clear/fail result | Purity Forest faithful clear |

Internal flag names below are proposed software identifiers, not original game names. They can be adopted literally by a smaller implementer; changing them requires updating every dependent content record together.

### 3.4 Event arbitration

At morning, after expedition, entering town, interacting with a named actor, and returning from a special scene, evaluate eligible story events. Choose deterministic priority: mandatory continuation of an active scene chain, active escort/client return, main-story milestone, explicitly tracked quest step, new postgame discovery, ambient dialogue. Queue rather than discard other eligible events. Display pending objectives in a journal so a player can find a temporarily displaced NPC.

Do not make all conversations automatic. Important original interactions—Whiscash's explanation, Shiftry's relic access, Alakazam's island hint, Spinda's debrief, and Gardevoir's recruitment—need player-facing locations and interaction prompts.

## 4. Main campaign topology and content packages

The sequence below has 14 main expeditions plus opening, town, dream, travel, and ending scenes. It is not a 14-scene story. The future team must produce and integrate each named scene group.

### 4.1 Canonical expedition table

| Stable ID | Original numbered exploration topology | Fixed encounter | Terminal scene / midpoint |
| --- | --- | --- | --- |
| `tiny-woods` | 3 | None | Caterpie rescue clearing after floor 3 |
| `thunderwave-cave` | 5 | None | Magnemite rescue clearing after floor 5 |
| `mt-steel` | 9 | Skarmory at 9, first visit | Diglett rescue and gap crossing |
| `sinister-woods` | 13 | Gengar, Ekans, Medicham at 13, first visit | Metapod rescue |
| `silent-chasm` | 9 | None | Jumpluff/Shiftry/Zapdos clearing |
| `mt-thunder` | 10 + Peak 3 = 13 | Zapdos at global 13 / Peak 3 | Rest after global 10 |
| `great-canyon` | 12 | None | Hill of the Ancients / Xatu |
| `lapis-cave` | 14 | None | Fugitive travel continuation |
| `mt-blaze` | 12 + Peak 3 = 15 | Moltres at global 15 / Peak 3 | Rest after 12; Rock Path junction before entry |
| `frosty-forest` | 9 + Grotto 5 = 14 | Articuno at global 14 / Grotto 5 | Rest after 9; Snow Path junction before entry |
| `mt-freeze` | 15 + Peak 4 = 19 | None | Rest after 15; Snow Path junction before entry; external Ninetales summit |
| `uproar-forest` | 10 | Three Mankey at 10, first visit | Chestnuts on 9; base renovation continues in town |
| `magma-cavern` | 23 + Pit 3 = 26 | Groudon at global 26 / Pit 3 | Rest after 23; Pit 2 fallen A.C.T. scene |
| `sky-tower` | 25 + Summit 9 = 34 | Rayquaza at global 34 / Summit 9 | Rest after 25; meteor/ending after boss |

Main sources: original walkthrough chapters 1–5, with specific dungeon pages overriding clearing-inclusive floor prose. True boss arenas remain numbered. Story-only revisits can reuse a summit map without relabeling the original dungeon length.

### 4.2 Opening and first rescues: content package M01

**Prerequisite:** New save with the player-selected language/accessibility options, original-compatible hero result and eligible partner.

| Scene ID | Trigger and actors | Required purpose | State outcome |
| --- | --- | --- | --- |
| `opening-awakening` | New game; hero, partner | Establish lost human memory, changed body, partner's concern; permit hero naming | Hero/partner identities locked for main story |
| `butterfree-request` | Opening continuation; Butterfree | Urgent first rescue gives a concrete purpose before broader exposition | `rescue-caterpie:accepted` |
| `caterpie-clearing` | Exit Tiny Woods; Caterpie | Rescue client through interaction; do not turn Caterpie into an enemy | Rescue acknowledged |
| `butterfree-reunion` | Return scene | Reunite family; award original berries once | `rescued-caterpie`; first-clear reward |
| `team-base-offer` | Partner guides hero home | Introduce shelter, rescue-team concept and naming | `team-founded`; base access |
| `first-mail-delivery` | Next morning; partner, Pelipper | Introduce badge/toolbox/mailbox through usable objects | `starter-kit-received`; Thunderwave request |
| `magnemite-clearing` | Exit Thunderwave | Resolve fused Magnemite problem and show rescue badge extraction | `rescued-magnemite`; reward |
| `town-introduction` | Following morning | Partner introduces Square and bulletin-board work | Town and ordinary jobs enabled |

**Production tasks:** Write each conversation in an original voice; author brief animations for noticing one's body, worried parent, rescue recognition and team-name celebration. New prose must be readable with any of 16 hero species and 10 partner species. Avoid a universal running animation that makes fish-like future leaders impossible. Create rescue-map staging separately from generated floor generation.

**Content acceptance:** The story can be followed without reading a lore codex; the player understands who needs rescuing, where to go, and why the mailbox is initially empty. A failed first expedition does not grant the team-founding reward. A resumed naming screen cannot create a second team.

### 4.3 Becoming a team: package M02

After ordinary work, Dugtrio requests Diglett's rescue. Mt. Steel culminates in Skarmory and a gap that Magnemite helps cross. Returning to town introduces Wigglytuff's Friend Areas and the first recruited Magnemite. Team Meanies later interferes with mail, then competes over Caterpie's request to save Metapod; their three-member encounter ends the Sinister Woods mission.

Required original scene IDs: `dugtrio-night-request`, `steel-summit-threat`, `magnemite-gap-rescue`, `friend-area-introduction`, `magnemite-joins`, `meanies-mailbox-invasion`, `caterpie-metapod-request`, `meanies-race-challenge`, `sinister-rivals-defeated`, `metapod-reunion`.

**Production decisions:** Skarmory's claim should convey disaster-driven fear without excusing the abduction. Magnemite's help must be visible rather than a reward-screen sentence. Friend Areas need an actual onboarding journey and recruitment explanation. Distinguish the named Magnemite helper from procedurally recruited Magnemite. Team Meanies requires three individual voices and readable battle identities.

**Flags/gates:** `steel-first-clear`, `friend-areas-open`, `magnemite-story-recruited`, `meanies-introduced`, `metapod-rescued`. Keep ordinary-job thresholds configurable and sourced. Walkthrough gives at least two jobs before Diglett, then at least three before the mailbox event and two more before Metapod; direct original play verification should resolve exactly which actions increment those counters.

### 4.4 Shiftry, Zapdos, and Xatu: package M03

Jumpluff's distress introduces reluctant Shiftry and respected Team A.C.T. The missing rescue team leads to Silent Chasm; Zapdos takes Shiftry, prompting the Mt. Thunder expedition. The successful rescue earns A.C.T.'s attention and sends the hero toward Xatu at the Hill of the Ancients.

Required scene IDs: `jumpluff-appeal`, `act-persuades-shiftry`, `shiftry-overdue`, `silent-chasm-entrance`, `zapdos-abduction`, `thunder-preparation`, `zapdos-warning`, `shiftry-freed`, `act-recognition`, `journey-to-xatu`, `xatu-vision`, `gengar-overhears`.

**Production decisions:** Silent Chasm has no boss; a cinematic lightning effect must not silently become a winnable Zapdos fight. Show why the partner is anxious but still willing to attempt Mt. Thunder. Introduce A.C.T. as named Alakazam/Charizard/Tyranitar rather than interchangeable elite enemy models. The Xatu scene raises a question; it must not reveal Gengar's identity or the meteor solution early.

**Flags:** `shiftry-missing`, `shiftry-taken`, `zapdos-story-defeated`, `shiftry-safe`, `xatu-consulted`. A replay of Mt. Thunder before credits does not recruit Zapdos or replay the abduction.

### 4.5 Legend, accusation, and flight: package M04

Whiscash relates the old human/Gardevoir/Ninetales story. Gardevoir's dream presence becomes clearer. Gengar uses partial information to accuse the hero; the partner refuses to abandon them, and the team leaves town under pursuit. This changes access to town, ordinary recruits and available routes.

Required scene IDs: `whiscash-legend`, `dream-garden-voice`, `uneasy-morning`, `gengar-public-accusation`, `act-warning`, `partner-loyalty`, `night-before-flight`, `fugitive-departure`, `lapis-refuge`, `pursuit-at-junction`.

**Narrative fact budget and tone:** The legend concerns a human who mistreated Ninetales, Gardevoir taking the curse, abandonment, and a foretold transformation/disaster connection. Tell it in fresh compact language. Avoid pasting the in-game legend. Town fear should have clear consequences while preserving the possibility of later remorse. The partner's trust is a pivotal scene, not a generic quest acceptance line.

**State transition:** `town-access = fugitive-locked`; preserve money/storage ownership and future job state. Retain named hero/partner story protection. Put the story route in the journal without offering an impossible "return to town" exit. If adding accessibility replenishment during this difficult arc, label it as an adaptation and preserve a faithful preset.

### 4.6 Fire, snow, Absol, and vindication: package M05

The fugitive route traverses Lapis Cave, Mt. Blaze and Frosty Forest. Rock Path and Snow Path are repeatable four-floor preparation loops returning to their originating junctions. Snow Path is available before both Frosty Forest and Mt. Freeze and closes after the latter peak ([specific Snow Path source](https://bulbapedia.bulbagarden.net/wiki/Snow_Path)); preserve Absol in the later expedition. Moltres and Articuno confront the travelers; Absol intervenes after Articuno and joins. Ninetales stops the A.C.T. confrontation at Mt. Freeze and clears the hero.

Required scene IDs: `blaze-camp`, `rock-path-return`, `moltres-confrontation`, `moltres-passage`, `snow-travel`, `absol-distant-sighting`, `frosty-camp`, `snow-path-frosty-return`, `articuno-confrontation`, `absol-intervention`, `absol-joins`, `freeze-camp`, `snow-path-freeze-return`, `act-catches-up`, `ninetales-vindication`, `groudon-awakening-news`, `act-departs-underground`.

**Scene topology:** Freeze has no player-controlled boss against A.C.T. or Ninetales. Model the interrupted clash as staging, then explanatory conversation. Absol's story recruit is level 20 in the original reference, with Darkness Ridge granted; releasing Absol while town remains inaccessible has distinct consequences that need faithful handling or disclosure.

**Production tasks:** Give volcanic and snowy travel different pacing, weather and visibility without importing DX weather mechanics. Make each path junction navigable after defeat. The ending of the pursuit must restore town access atomically; do not revive inaccessible fugitive quests after reload.

### 4.7 Homecoming and reconstruction: package M06

Homecoming needs a public exoneration scene, not merely a cleared flag. Pelipper's news and townsfolk reactions discredit Gengar. Wynaut/Wobbuffet's Mankey request then leads to base reconstruction. The original reward Chestnut starts the work; two additional Chestnuts from Uproar Forest's ninth floor finish it.

Required scene IDs: `homecoming-doubt`, `pelipper-vindication-news`, `town-apology`, `wynaut-job-hint`, `mankey-clearing`, `chestnut-bargain`, `base-work-begins`, `mankey-work-stoppage`, `first-extra-chestnut`, `second-extra-chestnut`, `base-reveal`, `interior-world-map`.

**Production tasks:** Author pre-renovation, work-in-progress, and hero-specific renovated base models for all 16 starting forms. Store the original hero's base identity independently of later evolution/leader switching. Make the renovation task journal expose remaining Chestnuts and the relevant floor without auto-completing the gathering through dialogue. Allow ordinary rescues between trips.

**Completion flags:** `hero-exonerated`, `uproar-first-clear`, `base-renovation-started`, `base-chestnuts-delivered` (0–2), `base-renovated`. "All main dungeon clears" without the completed base task must not unlock the next story prematurely.

### 4.8 Missing heroes and Groudon: package M07

The town worries about A.C.T.; Blastoise, Octillery and Golem attempt a rescue and return defeated. Gengar spreads discouragement, and the partner rallies the teams. In Magma Cavern Pit, the hero finds fallen A.C.T. members before confronting Groudon and saving the team.

Required scene IDs: `act-overdue`, `town-rescue-council`, `second-team-departs`, `second-team-returns`, `gengar-discourages`, `partner-rallies-town`, `magma-descent`, `fallen-charizard-tyranitar`, `alakazam-last-stand`, `groudon-awakens`, `groudon-subdued`, `act-rescue-return`.

**Topology/data requirements:** Global floors 1–23 are the main segment; 24 is Pit 1; 25 is the fixed fallen-team scene; 26 is Pit 3/Groudon. Do not populate Pit 2 with ordinary random encounters. Preserve the three documented magma visual bands. Drought belongs to original mechanics; Primal Reversion and DX moving lava boss tiles do not.

**Timing:** Specific Magma Cavern reference states at least four missions after Uproar before the rescue council, then at least two after that and the completed base before unlock. These should remain a source-backed configurable schedule, subject to original-game confirmation of mission/day semantics.

### 4.9 Meteor, dreams, sky, farewell, return: package M08

Xatu identifies the falling meteor. Gardevoir explains the hero's chosen purpose, and Gengar secretly learns of her loyalty before helping behind the scenes. The team reaches Sky Tower using the Teleport Gem, persuades Rayquaza through battle, and the meteor is destroyed. Gengar guides the lost spirits back. Celebration becomes farewell, then the hero returns after wishing to stay.

Required scene IDs: `xatu-meteor-warning`, `last-night-reflection`, `gengar-dream-intrusion`, `gardevoir-purpose-revealed`, `gengar-remorse-awakens`, `teleport-gem-preparation`, `hill-of-ancients-sendoff`, `sky-arrival`, `rayquaza-challenge`, `rayquaza-sees-meteor`, `meteor-destruction`, `spirit-drift`, `gengar-hidden-rescue`, `hill-celebration`, `gardevoir-farewell-call`, `hero-farewell`, `partner-grief`, `credits`, `hero-wishes-to-return`, `base-reunion`.

**Production tasks:** Author this as a full ending sequence with readable emotional pauses, newly composed music transitions, reduced-motion equivalents, and skip/replay behavior. A "Rayquaza defeated—postgame unlocked" toast is unacceptable. The player may skip presentation, but the state machine must still apply each final result exactly once. Credits need actual original-work attributions and adaptation disclosure rather than copied Nintendo credits.

**Persistent outcome:** `meteor-destroyed`, `main-story-complete`, `hero-returned`, `teleport-gem-damaged`, `postgame-open`. Keep a separate `credits-seen` presentation flag. Postgame unlock must not depend on the player watching the credits animation to its last frame.

## 5. Postgame dependency graph

Postgame is not chapters 15–25 in one forced chain. The journal should expose parallel quest cards and name unmet prerequisites. "Own item" and "ever obtained item" are different predicates; verify the original gate at each location.

| Route | Entry predicates | Internal dependencies | Terminal content |
| --- | --- | --- | --- |
| Evolution | Main story complete | Granbull explanation; solo cave entry; species eligibility | Luminous Cave services |
| Ocean / relic | Main story complete; Medicham→Lombre→Whiscash interaction | Dive; Stormy Sea clear; relic mail; Lombre/Shiftry | Kyogre; Regis; Mew exploration |
| Eon siblings | Surf obtained; Southern Island owned | Theft scene; Northern Range defeat; Latias request | Pitfall Valley rescue; both siblings join |
| Mirage quest | Surf obtained; Spinda collapse and Clear Wing; Xatu consultation | Fiery→Lightning→Northwind→Faraway | Ho-Oh reveal; Spinda debrief; return recruitment |
| Western Cave | Ho-Oh recruited | Blastoise/Charizard discovery scene; Surf entry | Mewtwo defeat then recruitment revisit |
| Sea guardian | Birds recruited; Stormy Sea and Pitfall Valley cleared | Alakazam hint; Legendary Island; Vortex Stone; Water member + Dive | Lugia recruited |
| Meteor fragment | Lugia recruited | Xatu/Blastoise discovery | Meteor Cave Deoxys |
| Wishes | Pitfall Valley clear; Sky Blue Plains owned | Multi-day Ekans/Medicham sequence; rescue notice | Medicham at 20; Jirachi at 99 on later/full expedition |
| Redemption | Medicham rescued; Stormy Sea cleared | Post-office conversation; Square conversation; Gengar request; Mt. Freeze escort | Murky Cave judgment; Gardevoir restored |
| Challenge pair | Pitfall Valley clear; Sky Blue Plains owned | Individual dungeon restrictions | Joyous rare recruitment; Purity Celebi |

### 5.1 Ocean and buried history: package PG01

**Required stages:** `ocean-rumor`, `lombre-account`, `whiscash-dive-gift`, `stormy-sea-known`, `kyogre-first-defeated`, `relic-news-arrived`, `relic-shiftry-permission`, `relic-parts-collected`, `music-box-assembled`, `mew-recruited`.

Stormy Sea has 40 floors and Kyogre on 40; Dive is an entry requirement. Buried Relic has 99 floors, Regirock/Regice/Registeel on 15/25/35, and the Parts combine into Music Box. In originals, carry the box for possible Mew appearances on 36–98; using it destroys it. Mew is an exploration recruitment target, not a guaranteed final-floor boss. Its successful recruitment exits the dungeon.

**Authored scenes:** Three rumor conversations, Whiscash's practical entry explanation, Kyogre introduction/debrief, news delivery, Shiftry's permission, short distinct Regi guardians, box assembly, Mew discovery/recruitment reaction. These must not claim that all 99 floors are required to meet Mew or that a single deterministic spawn is faithful.

**Treasure production:** Floor 45 Rock Smash/key; 60 Strength/wall access; 70 Flash/key; 80 Cut/key, water and wall access. Implement duplicate-HM replacement with Link Cable where source says so. Prevent puzzle chambers being generated without their required traversable access method.

**Recovery content:** Returning without one Part, breaking Music Box, failing before Mew, declining a recruit, or completing 99 without Mew requires informative journal text and repeat-entry content. Do not delete the entire quest because a physical item was lost.

### 5.2 Latios and Latias: package PG02

Northern Range is 25 floors with Latios at 25. Pitfall Valley is 25 floors with a rescue outcome, no Latias battle. The Surf/Southern Island gate introduces a fast visitor and stolen TMs; the explanation is a sibling rescue motivated by meteor damage. Success reunites and recruits both Eon Pokémon.

Required scenes: `night-flight`, `kecleon-theft-report`, `alakazam-traces-thief`, `latios-confrontation`, `latios-explanation`, `pitfall-rescue-promise`, `latias-found`, `eon-reunion`, `eon-recruit-offer`.

**State:** `eon-theft-reported`, `latios-defeated`, `latias-rescue-accepted`, `latias-rescued`, `eon-reunion-complete`. Named siblings are deterministic story recruits; do not reuse the generic boss-probability roll. Store acceptance/decline outcomes explicitly and verify original behavior for declined invitations before implementing an irreversible branch.

**Presentation:** The player's team uses rescue capability to solve an apparent crime, not a moral choice to keep stolen goods. Kecleon Wares needs normal service behavior before and after the theft; exact temporary stock availability during the story requires verification.

### 5.3 Spinda, the wing, and the mirage: package PG03

Spinda's collapsed traveler scene leads to a Clear Wing and Xatu consultation. Fiery Field, Lightning Field and Northwind Field are 30 floors each, ending in Entei, Raikou and Suicune respectively. Wing state advances Clear→Red→Sunset→Rainbow. Mt. Faraway is 40 floors with Ho-Oh at 40; return to Spinda completes the traveler's arc.

Required scenes: `spinda-collapse`, `spinda-base-recovery`, `clear-wing-gift`, `xatu-three-fields`, `entei-wing-trial`, `red-wing-granted`, `raikou-wing-trial`, `sunset-wing-granted`, `suicune-wing-trial`, `rainbow-wing-granted`, `ho-oh-revealed`, `spinda-inspired`, plus an optional original-written response when Ho-Oh is team leader.

**Gates:** Surf is needed for the Fields/Faraway. First encounters advance the quest; recruitment becomes available on revisits after the mirage quest condition, with appropriate Friend Areas. Do not make all four join automatically on first clear. The exact recruit-eligibility predicate for each beast must be recorded explicitly from the recruitment reference before final content acceptance.

**Treasures:** Fire/Thunder/Water Stones on field 29; Northwind locked Lunar Ribbon at 20; Faraway locked Friend Bow at 30. These are actual rooms and pickups, not automatically granted chapter rewards.

### 5.4 Western Cave: package PG04

Recruiting Ho-Oh triggers Blastoise and Charizard's encounter with an overwhelming opponent; their report opens Western Cave. The original dungeon is 99 floors, requires Surf, and ends with Mewtwo. The first defeat does not recruit Mewtwo. A subsequent encounter with Cryptic Cave owned is the recruitment route.

Required scenes: `western-cave-discovery`, `western-cave-town-report`, `mewtwo-first-challenge`, `mewtwo-first-defeat`, `mewtwo-rematch`, `mewtwo-recruitment`. Keep the two climactic visits distinct. Floor 59's locked Beauty Scarf is part of exploration production.

**Completion states:** `western-cave-known`, `mewtwo-defeated`, `mewtwo-recruited`; winning once does not satisfy collection completion. Newly written Mewtwo dialogue should emphasize its role here rather than import movie dialogue or a different game's origin story.

### 5.5 Birds, Lugia, and Deoxys: package PG05

Require recruited Articuno/Moltres/Zapdos, cleared Stormy Sea, and cleared Pitfall Valley before the Alakazam/Legendary Island sequence. Silver Trench is 99 floors with Lugia at 99, and whole-floor Monster Houses on 15/35/55/75. Entry needs a Water Pokémon and Dive. Recruiting Lugia opens the Xatu/Blastoise meteor-fragment discovery.

Meteor Cave is 20 floors. Originals permit one entrant and three bag items plus a held item. Defeat a Deoxys mirage on each of floors 1–19 to unlock stairs; the recruitable Normal Forme encounter is on 20. Do not carry DX's three-member party and unconstrained inventory into this challenge.

Required scenes: `birds-reunited`, `alakazam-island-hint`, `vortex-stone-gift`, `lugia-depths-challenge`, `lugia-alliance`, `meteor-fragment-report`, `meteor-cave-rules`, `deoxys-core-encounter`, `deoxys-recruitment`.

**Production:** Three original bird recruitment returns, an actual Legendary Island visit, deep-ocean visibility progression, the four fixed Monster House layouts, readable mirage forms, a locked-stair state and a final arena. The mirage defeated flag resets per floor, not per entire dungeon. Show why stairs remain locked without using an opaque failure sound.

### 5.6 Medicham and Jirachi: package PG06

Pitfall Valley and Sky Blue Plains open the multi-day Ekans/Medicham rumors. Their failed expedition creates a real bulletin request. Rescue Medicham on Wish Cave floor 20; reward Wish Stone. A full 99-floor expedition reaches Jirachi. Surf, compulsory save, zeroed carried money and temporary level 1 are original restrictions.

Required scenes: `wishes-secret-day-one`, `wishes-secret-day-two`, `ekans-alone`, `medicham-notice`, `medicham-rescue`, `wish-stone-reward`, `jirachi-awakens`, `jirachi-choice`, `wish-resolution`.

**Important separation:** Medicham rescue is enough for the later redemption route; Jirachi recruitment is not its prerequisite. Store the rescue objective separately from full-dungeon completion. If the first rescue exits at 20, that must not grant `wish-cave-cleared-99`.

**Wish behavior:** With Wish Stone and without accepting Jirachi as a member, grant the original categories: money, dungeon items, missing Friend Area, growth items, or rank/eligible recruit outcome. Source original quantity/eligibility rules into a separate reward table. Wish Stone's replacement on 50, exclusion of legendary recruits, already-unlocked opposite-version eligibility, and full-rank fallback must be handled; do not implement the DX reward system.

### 5.7 Gengar and Gardevoir: package PG07

After Medicham rescue and Stormy Sea, Ekans/Medicham's changing town locations introduce Gengar's change. Escort Gengar to the Ninetales summit, receive 9-Tail Crest, then escort him through Murky Cave's 19 floors to an external judgment scene. The resolution is remorse and gratitude, not a boss fight. Gardevoir returns without memories of her past with Gengar; the player receives Mobile Scarf and can later recruit her.

Required scenes: `meanies-worry-at-post-office`, `meanies-gengar-freeze-hint`, `gengar-escort-request`, `ninetales-gengar-revelation`, `nine-tail-crest`, `murky-escort-request`, `crest-on-dais`, `judgment-questions`, `gengar-confession`, `curse-lifted`, `gardevoir-reawakens`, `gengar-thanks`, `gardevoir-square-invitation`.

**Production:** Author a fresh question sequence that serves the same character-development function without copying the original questions. Do not make guessed "correct answers" a permanent fail state unless verified. The named escort must have actual escort protection/failure/retry behavior; a companion merely appearing in post-battle dialogue is insufficient.

**Facts requiring separate persistence:** `gengar-escort-freeze-complete`, `nine-tail-crest-received`, `gengar-escort-murky-complete`, `gardevoir-restored`, `mobile-scarf-received`, `gardevoir-story-recruited`. Mark Team Meanies' concluding NPC departure so ambient dialogue does not resurrect the old villain state afterward.

### 5.8 Ultimate challenge and recruitment tower: package PG08

Both Joyous Tower and Purity Forest unlock with Pitfall Valley clear and Sky Blue Plains. Each has 99 floors and level-1 rules. Joyous permits items and up to three entrants in the originals, clears carried money, has no legendary boss, and supplies rare recruits. Purity is solo, strips carried money/items, resets IQ for the expedition, forbids ordinary recruitment, and awards Celebi automatically on 99 without a battle.

**Production:** Pre-entry review must state what will be lost and what is temporarily reset. This is a direct consequence of a real game rule, not a generic warning. Preserve pre-entry stats separately from expedition growth; death, escape and successful exit all restore the correct baseline. Decide explicitly whether destructive item loss is faithful default or a disclosed quality-of-life adaptation before implementing.

**Completion:** Record faithful clears separately from assisted/shortened runs. Celebi should not be reachable by a fabricated boss fight. Joyous completion and obtaining its rare species are separate achievements.

## 6. Optional, event, and version-specific content catalog

All entries below need real per-floor population/item work after this planning stage. A name, floor count and generic procedural cave is not completed dungeon content.

| ID | Floors | Original access | Required distinctive content |
| --- | ---: | --- | --- |
| `rock-path` | 4 | Fugitive Mt. Blaze junction | Training loop back to junction; does not advance story |
| `snow-path` | 4 | Fugitive junctions before both Frosty Forest and Mt. Freeze | Return to the same originating junction, preserving the later party including Absol; closes after Mt. Freeze peak; no story advance |
| `howling-forest` | 15 | Renovated base + Sky Blue Plains + Smeargle rescue job | Precredits availability; named Smeargle rescue/recruit; flag painting |
| `desert-region` | 20 | Furnace Desert Friend Area | Keys at 19–20; original sandstorm schedule |
| `southern-cavern` | 50 | Boulder Cave mission reward | Metal Coat at 49–50; long descent |
| `wyvern-hill` | 30 | Dragon Cave mission reward | Locked Sun Ribbon20/Fly30; Dragon Scale29–30; Dragon Claw source |
| `solar-cave` | 20 | Postgame ocean conversations | Dive10/Waterfall15/Surf20; keys and water-access puzzles |
| `darknight-relic` | 15 | Secretive Forest purchase after story | Short sight range, ghost theme, wall treasures |
| `grand-sea` | 30 | Serene Sea purchase + Dive | DeepSeaScale15/DeepSeaTooth25 and water traversal |
| `waterfall-pond` | 19 | Postgame + Waterfall | Water-starter recruitment; no Monster Houses |
| `unown-relic` | 11 | Both Aged Chamber AN and Aged Chamber O? | All 28 Unown forms, not only one base species model |
| `far-off-sea` | 75 | Serene Sea + Water member + Dive | No leader switching; locked Wide Slash50/Vacuum-Cut72; Lapras |
| `oddity-cave` | 15 | Event / Wonder Mail | Original event access; no Monster Houses |
| `remains-island` | 20 | Event / Wonder Mail / original distribution | Event access and distinct original population table |
| `marvelous-sea` | 20 | Event / Wonder Mail / original distribution | Event access; source population relationship to Fantasy Strait |
| `fantasy-strait` | 30 | Event / Wonder Mail | Whole-floor Monster House15; original final-floor money possibility |

The event pages do not establish ordinary original story unlocks for the four event dungeons; they say official release of the example codes outside Japan is not currently known. Do not copy DX unlocks. A browser game can provide a clearly labeled "archived event expeditions" feature, but unlocking them through a new menu is an adaptation requiring plan approval. Do not present fabricated Wonder Mail as original distributed codes.

Blue species availability governs the encounter catalog and rescue jobs. The roster appendix owns the fixed Blue product matrix and its sourced cross-version unlock mechanisms; retain Red differences as comparative provenance only. D01 is resolved: do not combine edition defaults, add Red-specific content rules or present an edition selector.

### 6.1 Smeargle and base personalization

Produce the rescue request, forest rescue scene, invitation, Friend Area visit, and once-per-day flag painting interaction. Original Smeargle is not a postgame-only DX addition. Flag painting is an actual persistent visual outcome, not a text-only reward. Keep new flag designs original; do not extract the cartridge's flag pixel art.

### 6.2 Dojo scope

Original Makuhita Dojo is a set of three-floor mazes, not a timed DX ticket drill. It has 17 type mazes and four preset team mazes; Blue also has a linked Rescue Team Maze. No ordinary item/shop/Monster House spawning; team mazes alone use traps. Dojo completion refreshes town shop/job availability. Clearing all type mazes yields Bonsly figure and Ginseng; first clear of each team maze yields Ginseng.

| Unlock milestone | Type mazes |
| --- | --- |
| Friend Areas opened | Grass, Electric, Flying, Fighting, Dark, Steel |
| Team Meanies mailbox invasion | Water, Poison, Bug, Rock |
| Return from Mt. Freeze | Normal, Fire, Ice, Ground, Psychic, Dragon |
| Credits | Ghost and four team mazes |

Canonical boss species, always floor B3F; duplicates are deliberate. These are `dexNo` reference values. Runtime content uses the corresponding canonical `SpeciesId` strings, for example `25` becomes `pokemon-025`; each spawned individual also receives its own actor identity.

| Maze | Boss `dexNo` values |
| --- | --- |
| Normal | 83, 162, 263 |
| Fire | 77, 218, 240 |
| Water | 60, 60, 60 |
| Grass | 102, 191, 285, 331 |
| Electric | 100, 100, 309, 309 |
| Ice | 220, 221, 361 |
| Fighting | 106, 236, 307 |
| Ground | 50, 50, 231, 231 |
| Flying | 16, 83, 84 |
| Psychic | 202, 202, 202 |
| Poison | 29, 29, 32, 32 |
| Bug | 13, 15, 127 |
| Rock | 74, 185, 247 |
| Ghost | 92, 92, 92 |
| Dragon | 371, 371, 372, 372 |
| Dark | 261, 261, 198, 198 |
| Steel | 304, 304, 374, 374 |
| Team Shifty | 274, 274, 275 |
| Team Constrictor | 73, 224, 346 |
| Team Hydro | 9, 160, 260 |
| Team Rumblerock | 75, 75, 76 |

Boss recruitment in team mazes has specific high-level/Friend Bow conditions; ordinary enemies never recruit. Treat those conditions as a systems implementation dependency, not guaranteed team rewards.

Rescue Team Maze originally receives a Red cartridge team through Blue on DS/DS Lite dual-slot hardware. Its imported team bosses and later recruitment gates differ from the fixed mazes. The browser cannot claim hardware compatibility; a separately approved import/share-team format would be a new adaptation. Until designed, list this feature as researched but not implemented, rather than populate it with a fabricated fixed enemy team.

## 7. Town and recurring character coverage

### 7.1 Population schedule layers

For each named actor, author a baseline presence, milestone overrides, quest overrides, and terminal departure state. When two schedules collide, use the event arbitration policy and keep the displaced conversation discoverable. The town must change after rescues, the accusation, homecoming, the failed rescue, the meteor ending, and the postgame arcs.

| Actor/group | Required milestones and conversational roles | Implementation caution |
| --- | --- | --- |
| Partner | Opening trust; new-team excitement; rivalry; fear; loyalty; encouragement; farewell; reunion; postgame autonomy | Story identity persists after becoming an ordinary selectable teammate |
| Caterpie/Metapod/Butterfree | First rescue; Metapod request/reunion; support and base work | Client version cannot be confused with a wild recruit |
| Magnemite | First rescue, gap assistance, Friend Area onboarding, team invitation | Track named recruit once |
| Dugtrio/Diglett | Mt. Steel request and result; later gratitude | Do not invent a repeat kidnapping |
| Team A.C.T. | Shiftry intervention; Zapdos recognition; pursuit; Ninetales witness; failed Groudon expedition; restored allies | Three named actors with changing roles |
| Team Meanies | Mail interference; Sinister rivalry; accusation; discredit; discouragement; dream/remorse; postgame wishes; redemption/departure | No late ambient accusation after exoneration |
| Shiftry | Reluctant rescuer, rescued captive, town organizer, Buried Relic access | Distinguish Team Shifty Dojo encounter from narrative scene |
| Jumpluff pair | Initial request, Silent Chasm rescue and Shiftry concern | Use separate NPC identities |
| Whiscash | Legend; ocean/Dive information; evolution location | Distinct dialogue topics should remain selectable |
| Xatu | Identity crisis, meteor vision, Teleport Gem, Three Fields, Meteor Cave | Revisit scenes depend on active quest, not always first prophecy |
| Ninetales | Hero vindication and Gengar's later personal reckoning | Two different summit interactions; no canonical boss battle |
| Absol | Distant sightings, intervention, story recruit | Dark warning tone without declaring Absol causes disasters |
| Wynaut/Wobbuffet/Mankey | Uproar request, bargain, work stoppage, completion | Physical reconstruction state visible |
| Blastoise/Octillery/Golem | Rescue council and defeat report | Their Dojo identities coexist without duplicating story rewards |
| Spinda | Collapse, recovery, quest handoff, waiting, renewed travel | Departure after debrief; optional Ho-Oh-leader response |
| Ekans/Medicham | Ocean rumor, wish secrecy, failed expedition, rescue, Gengar concern | Day/location sequence independent of other postgame branches |
| Snubbull/Granbull | Postcredits visible evolution demonstration | Same NPC identity, changed species, not two simultaneous NPCs |
| Gardevoir | Gradually clearer dreams, mission revelation, farewell, restored physical NPC, recruitment | Dream form and recruit form are separate presentation states |
| Lombre/Bellsprout and townsfolk | Disaster commentary, exoneration, new dungeon rumors, contextual postgame reactions | Author bounded milestone topic pools, not one repeated line |
| Munchlax | Rare visiting food interaction and Munch Belt | NPC cameo only; do not silently add a Gen IV recruit |

The character list source supports optional reactions such as Bellsprout responding to a recruited Chansey or Chansey leader. These are completionist content tasks; do not block main story on them. Exact random visitor frequency and all ambient wording require additional original-game observation.

### 7.2 Town services as story-connected content

Square contains Kecleon items/wares, Persian's bank, Kangaskhan storage, Wigglytuff Club and Gulpin's Link Shop. Whiscash Pond, Pelipper Post Office and Makuhita Dojo are distinct destinations. Base exits lead toward Square, Friend Areas and dungeons; preserve comprehensible spatial relationships in the new 3D layout.

Research checkpoints for systems/content coordination: Kecleon stock changes after Great Canyon and Sky Tower; Gulpin's original service price is 150 Poké; Deoxys forgotten-move behavior differs from DX. Do not import DX daily bank gifts or postgame move tutoring. Implement useful newly written service onboarding and concise failure reasons: no funds, no inventory room, missing habitat, incompatible move link, absent HM, ineligible evolution.

### 7.3 Collection and decorations

Plan separately for Bonsly, Mime Jr., Weavile and Lucario figures at Team Base; these are original-game decorations/cameos, not proof that those Gen IV species are recruitable. Source the mission-reward/rank conditions precisely. Base map, species-specific facade, flag state and figures must persist across leader swaps and evolution.

## 8. Difficulty, recruitment, evolution and completion gates

### 8.1 Difficulty fidelity

The roster/systems appendix owns exact numeric rules. This appendix requires those rules to be represented at the content boundary:

- Boss encounters need original stats, moves, abilities, immunities and recruitment variants for first fight versus rematch; a global level scalar cannot replace them without adaptation disclosure.
- Every long dungeon needs original floor encounter bands, not all residents uniformly sampled from floor 1 to 99. Native level ranges can be much lower or higher than apparent story difficulty.
- Original hunger, move PP, party body size, capacity, darkness, weather and limited supplies make floor count meaningful. Do not claim fidelity by preserving "99" while auto-refilling everything each floor.
- Midpoints are explicit safe-state transitions with original storage/save/heal behavior verified separately. Do not add midpoint rest stops to every 10th floor of a no-rest dungeon.
- Main hero/partner failure conditions differ from ordinary recruit loss and postgame leadership. Escort objectives add client survival conditions.
- Challenge dungeons require temporary-stat and restoration semantics, inventory restrictions, compulsory entry saves where applicable, and honest clear-mode labels.

Difficulty options can exist, but their effects on floor count, item loss, revival, enemy stats, recruitment, hunger, PP, and completion badges must be spelled out. "Story mode" should not silently alter the save into a faithful-clear record.

### 8.2 Recruitment matrix requirements

Separate ordinary chance recruitment, deterministic story invitations, legendary rematches, automatic finish rewards, and Dojo-only exceptions. Minimum authored cases:

| Case | Required distinction |
| --- | --- |
| Magnemite / Absol / Smeargle / Eon siblings / restored Gardevoir | Named story invitation and once-only identity |
| Zapdos / Moltres / Articuno / Groudon / Rayquaza | Main-story defeat before later recruit eligibility |
| Kyogre | First encounter may recruit; team capacity still matters |
| Regirock / Regice / Registeel | Matching Part or Music Box and appropriate habitat constraints |
| Mew | Random eligible floor presence while carrying Music Box; recruitment ends expedition |
| Entei / Raikou / Suicune / Ho-Oh | Quest progression and revisit eligibility separately |
| Mewtwo | Initial defeat then later recruitable visit and Cryptic Cave |
| Lugia | High original recruitment probability plus eligibility/capacity; not blanket DX guarantee |
| Deoxys | Normal-form final encounter versus nonrecruitable mirages |
| Jirachi | Invitation choice competes with original wish outcome |
| Celebi | Automatic floor-99 reward without battle |
| Tiny Woods / Purity / ordinary Dojo enemies | Recruitment disabled in originals |

The implementation must expose missing habitat or capacity before a player invests a long run when that information is available. Whether this extra guidance is default or optional is a presentation adaptation; it must not change the underlying condition without disclosure.

### 8.3 Evolution

Evolution opens after the meteor ending via Luminous Cave, with one entrant. Implement actual species eligibility, required items and consumption, IQ/friendship substitutions, linked evolution items and special branching cases from the systems/roster research. Do not implement only "level ≥ 16" and call the evolution system complete. Preserve named member identity, moves, story references, inventory and base appearance intentionally when species changes.

Content tasks include Granbull's reveal, Alakazam's explanation, partner party-management introduction, cave entry/eligibility/success/failure scenes, and newly written confirmation text for irreversible species changes. Verify whether original evolution conditions require level, IQ, paired items, or stat comparison per species; version-specific type assumptions remain Generation III.

### 8.4 Completion definitions

| Milestone label | Evidence required before claiming it |
| --- | --- |
| Main-story playable | Every required scene/objective, full original route topology, ending/return, failure/retry and save transitions work |
| Main-story faithful content | Above plus reviewed encounter/treasure/rule data and documented adaptations |
| Postgame stories complete | Ocean/relic, Eon, mirage, Western, sea guardian, meteor, wishes and redemption all have complete playable state machines |
| All dungeons represented | All 45 named regular/side/event expeditions plus Dojo/link-mode disposition accounted for |
| All dungeons playable | Per-floor encounter and restriction content, terminals, rewards and replays implemented; no menu-only stubs |
| Recruitment complete | Every original species/form acquisition route and exception accounted for, including evolution and version policy |
| Whole-game complete | All above plus town services, ordinary rescues, item economy, persistence, permitted validation and declared handling of original connectivity |

The future UI and release notes must use the narrowest true label. Do not inflate a source-data coverage number into a gameplay-completion claim.

## 9. Work packages for a smaller implementer

Each package should receive only its exact ownership files, prerequisite records and source ledger. Do not ask a small model to improvise the entire postgame from a one-line chapter title.

### 9.1 Crosswalk to the governing execution plan

The `C` labels below are campaign checklists, the `M` labels identify main-story content, and the `PG` labels identify postgame content. Only [PLAN.md](PLAN.md)'s `P00`–`P37` packages define execution order, dependencies, ownership and review gates. Do not run C01–C10 as a second sequential plan, or confuse PG01 with parent P01. A checklist spanning several parent packages is completed in the relevant parent sub-batches; its later steps remain parked until their parent dependencies and approval gates are satisfied.

| Campaign checklist | Governing parent package(s) | Scheduling and ownership boundary |
| --- | --- | --- |
| C01: evidence and topology | P01 source audit; P02 inventories/traceability | Finish the relevant factual/schema prerequisites before dependent runtime content; preserve blocked research explicitly |
| C02: events and persistence | P07 IDs/state; P08 saves; P22 story engine | Define canonical identities in P07, persistence guarantees in P08, and scene/quest transitions in P22; no parallel replacement state contract |
| C03: opening through Metapod | P19 onboarding/Tiny Woods; P20 town; P21 jobs; P23 Thunderwave/Steel/Sinister content | Integrate each scene in its parent package; P23 inherits P22 rather than bypassing the story engine |
| C04: Shiftry through exile | P23 Silent Chasm/Mt. Thunder; P24 Xatu/accusation | Split at the parent arc boundary; Great Canyon and town-lock work belong to P24 |
| C05: fugitive route | P24 | Includes side paths, birds, Absol and Ninetales; inherits all P24 dependencies |
| C06: reconstruction and Groudon | P25 | Uses existing services/jobs; detailed asset production coordinates with P32 without changing P25's narrative acceptance |
| C07: ending | P26 | Includes departure, credits and return; use P08/P22 checkpoint contracts |
| C08: postgame branches | P27 = PG01; P28 = PG02 + PG05; P29 = PG03 + PG04; P30 = PG06 + PG07; P31 = PG08 | Parent dependencies govern implementation; the in-game unlock graph in §5 governs player progression and remains nonlinear |
| C09: optional/event/Dojo | P31 content; P20 service shell; P21 exchange contracts | Implement final optional content in P31 using earlier service/mail contracts; preserve original precredits availability of Howling Forest even if authored later |
| C10: town continuity/audit | P20 initial schedules; P22 event arbitration; P23–P31 route-specific updates; P33 full audit; P35 manual sign-off | Update town records with each owning arc, then audit globally; asset completeness belongs to P32 and release integration to P36–P37 |

All product checkboxes remain unstarted under the current planning hold. Record authorized progress in [PROGRESS.md](PROGRESS.md) and [COVERAGE.csv](COVERAGE.csv), not by treating this appendix's descriptive scope as completed work.

### C01 — Lock original-game evidence and topology

- [ ] Create the source ledger with stable keys, original/DX section markers, confidence and retrieval date.
- [ ] Resolve the floor/clearing discrepancies listed in §1.2 and encode both topology concepts in the approved schema.
- [ ] Enumerate all 45 normal/side/event expeditions, 21 preset Dojo mazes, and linked-maze disposition; assign stable slugs.
- [ ] Review every numeric total and each segment sum against its specific source. This is a content review, not execution of game source.
- [ ] Record unresolved original observations as explicit blocked fidelity tasks; do not fill them with invented numbers.

**Deliverable:** Source-linked factual records and a reviewer-readable coverage table. No claim of playable story yet.

### C02 — Define event and quest persistence contracts

- [ ] Agree exact persisted scene/quest/dungeon/item/NPC identifiers with simulation and save owners.
- [ ] Specify first-clear, repeat-clear, defeat, escape, rescue and recruit event payloads.
- [ ] Specify event priority and queue semantics from §3.4.
- [ ] Document restore points for mid-scene save, escort failure and ending skip.
- [ ] Have a fresh reviewer trace the five Review Focus conditions on paper through proposed state transitions.

**Deliverable:** A consistent non-executable interface spec, then implementation only after approval. Reject accidental reliance on a single `chapter` integer for all postgame state.

### C03 — Author and integrate opening through Metapod

- [ ] Complete M01 and M02 scene manuscripts with new prose and concise staging directions.
- [ ] Assign every scene a predicate, one-time effect and next objective.
- [ ] Produce client and named-recruit identity records.
- [ ] Integrate the first four dungeons and town/Friend Area onboarding after implementation approval.
- [ ] Complete allowed static and human presentation review; mark manuscript, integration and review columns separately.

### C04 — Author and integrate Shiftry through exile

- [ ] Complete M03 and M04 without early revelation of Gengar's identity.
- [ ] Produce A.C.T./Meanies individual actor records and town-state overrides.
- [ ] Specify Silent Chasm's noncombat abduction map and Great Canyon's external Xatu map.
- [ ] Integrate the town-lock transition and fugitive inventory/storage rules after approval.
- [ ] Review continuity from accusation to departure with all optional-town actions closed or safely deferred.

### C05 — Author and integrate fugitive route

- [ ] Complete M05's two training loops, bird encounters, Absol and Ninetales scenes.
- [ ] Build separate junction/midpoint/summit content requirements for environment owner.
- [ ] Verify original first-visit recruitment and party-management restrictions.
- [ ] Define failure-return locations for each fugitive dungeon.
- [ ] Review that vindication restores services and that no player-controlled Ninetales/A.C.T. boss was added accidentally.

### C06 — Author and integrate reconstruction and Groudon

- [ ] Complete M06/M07 manuscripts and the Chestnut task state machine.
- [ ] Produce all hero-base appearance requirements, work stages and flag/figure attachment points.
- [ ] Source original day/job thresholds and fixed Magma Pit event topology.
- [ ] Integrate Mankey gathering and A.C.T. rescue as playable objectives after approval.
- [ ] Review the timeline with Chestnut gathering, ordinary jobs and optional Howling Forest interleaved.

### C07 — Produce the full ending

- [ ] Complete every M08 scene with new writing, staging, original music requests and accessible alternatives.
- [ ] Specify skip, replay, checkpoint and credits transitions.
- [ ] Separate main-story completion from credits presentation and hero-return state.
- [ ] Review Gengar's foreshadowing against the later redemption story.
- [ ] Obtain explicit content review of the ending before describing the main campaign as complete.

### C08 — Build postgame route pairs

- [ ] Coordinate PG01 under parent P27 with PG02 under parent P28 through their shared HM/Solar Cave dependencies; retain the parent's separate ownership and review gates.
- [ ] Implement PG03/PG04 within parent P29 with wing progression and Ho-Oh recruitment gates.
- [ ] Implement PG05 within parent P28 after its bird/Pitfall/Stormy prerequisites are represented.
- [ ] Implement PG06/PG07 within parent P30 so Medicham rescue and Gengar redemption never depend incorrectly on Jirachi.
- [ ] Implement PG08 within parent P31 using the approved systems/content contracts for challenge restrictions.
- [ ] For each package, review all first/repeat/recruit/decline/fail variants before checking its completion box.

### C09 — Fill optional/event/Dojo content

- [ ] Populate source-specific encounter, treasure, weather and visibility bands for every §6 dungeon.
- [ ] Author short new discovery/debrief text for optional dungeons without inventing mandatory canon quests.
- [ ] Integrate Smeargle, flag painting and decorations.
- [ ] Produce all original Dojo groups, duplicates, unlocks and rewards.
- [ ] Resolve user-approved event access and linked-maze adaptation; keep unimplemented connectivity explicitly listed until then.

### C10 — Town continuity and completion audit

- [ ] Author milestone dialogue/topic pools and interaction placement for §7 actors.
- [ ] Check NPC priority collisions for every pair of simultaneously eligible postgame routes.
- [ ] Compare manuscript IDs, integrated scene IDs, quest nodes, journal entries and source records; list each absent item.
- [ ] Review original/DX contamination across floor counts, items, types, recruitment and services.
- [ ] Produce the final content coverage document with factual gaps and adaptations plainly stated.
- [ ] Stop at the parent plan's review gate; do not infer deployment or merge authorization from this appendix.

## 10. Outstanding evidence work before a faithful implementation claim

The current research covers the full structural route graph, not every cartridge event flag or original script variant. All 13 records below are **open**. Their IDs are durable references for [RESEARCH.md](RESEARCH.md), [PROGRESS.md](PROGRESS.md) and [COVERAGE.csv](COVERAGE.csv); keep the IDs when a record is resolved or split into finer research tasks. Resolve these tasks only during authorized preparation under [PLAN.md](PLAN.md). Assigning an owner here neither starts a package nor changes its dependencies.

Each record names the parent package that owns evidence resolution, the packages that consume the result, affected planned records, the exact question, candidate sources and a blocking gate. Candidate sources are investigation targets, not claims that those sources already answer the question. Source names and chapter numbers refer to the durable URLs in §11; original-game observation, manuals and script review remain proposed evidence methods, subject to the parent plan's authorization rules. No new source execution or gameplay observation was performed to add these fields.

To close a record, attach edition/region-specific evidence, affected field/scene IDs, the resolved rule or approved adaptation, and the review outcome in the shared ledgers. An explicitly approved omission must remain visible in coverage and release claims. Merely adding a source URL or a runtime field does not resolve a gap. All dependent gates below also feed the whole-game audit in P33 and content sign-off in P35; they cannot be bypassed by the later P36 public integration step.

### CAMPAIGN-GAP-01 — Day advancement and event arbitration

- **Unresolved scope:** Verify exact ordinary-job/day counters, which unsuccessful outings advance time, and event arbitration in the original games. Current walkthrough counters are useful but not sufficient to reproduce engine timing precisely.
- **Owner and consumers:** P01 owns evidence resolution; P20 owns town schedules, P21 expedition/job outcomes and P22 story-event integration. P23–P31 consume the relevant route timing.
- **Affected records:** `content/town.js` day/location predicates; `content/main-story.js` and `content/postgame.js` delay/priority predicates; §3.3 town-time facts and §3.4 event arbitration; Wish Cave rumor and Medicham/Ekans sequence stages.
- **Resolution question:** Which successful, failed, abandoned or rescued expedition outcomes advance each counter, which conversations are required, and how are simultaneously eligible original story events ordered or deferred? Which parts of §3.4 are faithful rules and which require an adaptation label?
- **Candidate sources:** Walkthrough Chapters 1–11 for stated waits; Team Meanies and Pokémon Square for location transitions; authorized observation of original Red/Blue event sequences with edition, outcome and day recorded.
- **Dependent gate:** Block affected timing rules at P01's rules freeze and P20–P22 record acceptance until resolved. Main-story timing blocks M3 acceptance; postgame timing blocks M4 acceptance. Independent content research may continue without treating the proposed priority order as verified.

### CAMPAIGN-GAP-02 — Floor labels, terminal maps and fixed scenes

- **Unresolved scope:** Observe all main-story terminal maps and original numbered floor labels directly, particularly Howling Forest/Pitfall Valley scene placement and Magma Pit2 behavior. The corrected totals above should remain fixed unless direct evidence contradicts them.
- **Owner and consumers:** P01 owns evidence resolution and P02 the topology inventory; P11 consumes fixed-floor/segment rules, with P19, P23–P26, P28 and P31 owning their affected scenes.
- **Affected records:** `content/dungeons.js` segment counts, original local labels, `terminalScene` and `fixedFloors`; all main-story terminal-map references in §4; Howling Forest's rescue, Pitfall Valley's rescue and Magma Cavern Pit2's fallen-team scene.
- **Resolution question:** For each named terminal or fixed map, is it a numbered floor or an external scene, what exact floor label is shown, and which transitions, encounters and objects occur there? Does direct original evidence contradict any corrected total in §1.2?
- **Candidate sources:** The individual Tiny Woods, Thunderwave Cave, Silent Chasm, Great Canyon, Mt. Freeze, Magma Cavern, Sky Tower, Howling Forest and Pitfall Valley pages; corresponding walkthrough chapters; authorized original map/floor-label observation.
- **Dependent gate:** Block unverified topology fields in P02's accepted inventory and their P11 map records. Affected main-story scenes block M3; Howling Forest/Pitfall Valley content blocks the relevant P28/P31 and M4 acceptance. Preserve existing corrections until contrary direct evidence is reviewed.

### CAMPAIGN-GAP-03 — Gengar arc prerequisites and town sequence

- **Unresolved scope:** Verify the Stormy Sea condition on Gengar's postgame arc and the exact timing/order of Medicham/Ekans locations.
- **Owner and consumers:** P01 owns evidence resolution; P30 owns the redemption route, with P20/P22 consuming NPC-location and event predicates and P27 supplying the Stormy Sea clear fact.
- **Affected records:** PG06/PG07 prerequisites in `content/postgame.js`; `meanies-worry-at-post-office`, `meanies-gengar-freeze-hint`, `gengar-escort-request`; corresponding Medicham/Ekans schedules in `content/town.js`.
- **Resolution question:** Is Stormy Sea completion required in each original edition, alongside Medicham's rescue, and what exact conversations, day advances and Post Office/Square location changes lead to Gengar's request? Reconcile the Team Meanies page's stated condition with the broader walkthrough's omission rather than silently choosing one.
- **Candidate sources:** Team Meanies, walkthrough Chapter 11, Murky Cave and Gardevoir; authorized original saves/observations that distinguish Stormy Sea cleared from uncleared while recording the other prerequisites.
- **Dependent gate:** Block PG07's final unlock predicate and dependent P30/P20/P22 scenes until resolved; this blocks P30 route acceptance and M4 postgame completeness. The currently documented Stormy Sea condition remains provisional, not newly confirmed.

### CAMPAIGN-GAP-04 — Legendary recruitment and rematch records

- **Unresolved scope:** Verify legendary recruitment prerequisites, first/rematch stats and habitat grants against specific original recruitment data; do not transplant DX guarantees.
- **Owner and consumers:** P01 owns evidence resolution and P02 the record inventory; P17 owns recruitment/habitat semantics, with P23–P31 consuming boss, revisit and recruitment content.
- **Affected records:** Each legendary boss's first/rematch encounter templates, recruitment predicates and Friend Area grants; PG01–PG08 recruit/revisit distinctions; `content/dungeons.js` boss references and `content/postgame.js` recruit effects. Species, named story actor and persistent recruited individual remain separate identities under §3.
- **Resolution question:** For every original legendary encounter, what quest facts, owned habitats, party conditions and first-versus-repeat state permit recruitment; what are the verified encounter stats; and when is a habitat granted rather than required beforehand?
- **Candidate sources:** The original-game overview and its original recruitment references; individual dungeon pages listed in §11; walkthrough Chapters 5–11; the source candidates indexed by [DATA.md](DATA.md), followed by edition-specific original evidence where they disagree.
- **Dependent gate:** Block unsupported recruitment/stat/habitat fields at P01/P02 acceptance and their dependent P17/content records. Unresolved main-story boss stats block M3; unresolved revisit/recruitment rules block M4 and any full-roster completion claim.

### CAMPAIGN-GAP-05 — Complete per-floor content and restrictions

- **Unresolved scope:** Source every dungeon's full original encounter tables, weather schedules, trap/shop/Monster House floors, item probabilities, fixed rooms and entry restrictions. The short `residents` lists proposed earlier were insufficient for whole-game fidelity.
- **Owner and consumers:** P01 owns evidence resolution and P02 the coverage inventory; P11 owns structural floor data, P14/P15 the relevant battle/item/environment rules, P16 entry restrictions and P23–P31 dungeon content.
- **Affected records:** Every §4–§6 dungeon's encounter/item/weather/visibility bands, trap/shop/Monster House eligibility, fixed rooms and entry rules in `content/dungeons.js` and its referenced tables; original-edition/region provenance for every numeric field.
- **Resolution question:** What is the complete original table for every floor band and conditional room or entrance, including probabilities and edition differences, and which fields remain unknown after the available sources are compared?
- **Candidate sources:** Each specific dungeon page in §11 and its original Red/Blue sections; corresponding walkthrough chapters for fixed-story context; [DATA.md](DATA.md)'s numerical-data source candidates and authorized original evidence for remaining table gaps. A broad walkthrough is not a substitute for missing probability tables.
- **Dependent gate:** Block unknown factual fields at P01/P02 and their P11/P14–P16 consumers; only independently verified batches can proceed after authorization. Missing main-story tables block M3; missing postgame/optional tables block M4. P33 cannot accept dungeon-label or short-resident-list coverage as complete.

### CAMPAIGN-GAP-06 — HM possession and knowledge predicates

- **Unresolved scope:** Verify whether HM checks inspect bag, known moves, storage or prior acquisition at each gate; separate Solar Cave discovery from obtaining Surf.
- **Owner and consumers:** P01 owns evidence resolution; P15 owns item/known-move semantics, P22 the predicate contract and P26–P31 the affected dungeon and discovery records.
- **Affected records:** HM-dependent entrance/revisit predicates in `content/dungeons.js`; Sky Tower's Fly revisit; ocean/sea/Fields/Western/Wish routes; Solar Cave discovery and Surf-obtained flags in `content/postgame.js`.
- **Resolution question:** For each individual entrance and discovery trigger, which of carried HM, learned move, stored HM or historical acquisition satisfies the original check, and when exactly does obtaining Surf enable a route compared with merely discovering Solar Cave?
- **Candidate sources:** Sky Tower, Solar Cave, Silver Trench, Wish Cave and other relevant dungeon pages already listed in §11; walkthrough Chapters 6–11; authorized original observations varying one possession/knowledge condition at a time.
- **Dependent gate:** Block unverified HM predicates in P15/P22 and their P26–P31 content records; affected original-rules foundation fields cannot be frozen as confirmed. All gated revisit/postgame routes remain blocked for M4 acceptance until their separate checks are resolved.

### CAMPAIGN-GAP-07 — Recovery of physical quest prerequisites

- **Unresolved scope:** Document the exact recovery path after losing Parts, Music Box, Wish Stone, Fly or other physical prerequisites.
- **Owner and consumers:** P01 owns evidence resolution; P15/P16 own loss and replacement rules, P08 persistence integration and P26–P31 the affected route recovery content.
- **Affected records:** Inventory-instance versus permanent-knowledge predicates; Buried Relic Part/`music-box` recovery, Wish Stone replacement, Fly reacquisition and other prerequisite recovery tables; journal/return-visit scenes and one-time grant receipts.
- **Resolution question:** After each documented use, loss, defeat or entry restriction removes a prerequisite, what exact original source, floor, NPC or repeat encounter replaces it, under what conditions, and can any route become permanently inaccessible? Do not invent a replacement grant to hide an unknown.
- **Candidate sources:** Buried Relic, Wish Cave, Sky Tower, Solar Cave and corresponding walkthrough chapters; original item/reward references reachable through those existing sources; authorized original recovery-path observation.
- **Dependent gate:** Block affected P15/P16 replacement rules and P08/P26–P31 recovery integrations until evidenced or explicitly adapted. M4 acceptance requires the affected routes' repeat/recovery coverage; P35 cannot sign off on a route whose only progression item has an unresolved loss path.

### CAMPAIGN-GAP-08 — Named invitation retries and postgame party rules

- **Unresolved scope:** Verify named recruitment invitation decline/retry behavior, postgame partner/leader rules, and Gardevoir's original recruit level/moves.
- **Owner and consumers:** P01 owns evidence resolution; P17 owns party/recruitment rules, P26 the post-ending transition, P28 the Eon invitation and P30 Gardevoir's invitation/data.
- **Affected records:** Named recruitment acceptance/decline/reoffer state; `eon-recruit-offer`, `gardevoir-square-invitation`, `gardevoir-story-recruited`; Gardevoir's initial individual record and move set; postgame leader/partner eligibility and return-to-town presentation.
- **Resolution question:** Which named offers can be declined, when/how are they offered again, what changes in partner and leader control after the ending, and what exact level/moves does original Gardevoir have when recruited? Keep deterministic invitation handling separate from generic recruitment rolls.
- **Candidate sources:** Gardevoir, the original named-character list, walkthrough Chapters 5, 7 and 11; [DATA.md](DATA.md)'s original recruitment/roster references; authorized original invitation and post-ending observations.
- **Dependent gate:** Block unsupported P17 rules and P26/P28/P30 named-recruit transitions/data. Post-ending party control blocks P26/M3 acceptance; unresolved invitation or Gardevoir records block M4 and full named-recruit completion claims.

### CAMPAIGN-GAP-09 — Ambient NPCs, decorations and base flags

- **Unresolved scope:** Observe original presentation of Munchlax, Chansey-specific ambient conversations, decoration rewards, and once-per-day Smeargle flag changes.
- **Owner and consumers:** P01 owns evidence resolution; P20 owns recurring town records, P31 optional rewards/Smeargle content and P32 corresponding visual/narrative assets.
- **Affected records:** Munchlax and Chansey `storyActorId` topics, appearances and interaction predicates; Team Base decoration/reward records; Smeargle flag-painting choices and last-change-day state; scene/asset provenance in `content/town.js` and optional content.
- **Resolution question:** When and where do these NPC interactions occur, what original actions/rewards and ambient variants exist, how are decorations earned/displayed, and exactly when does Smeargle's daily flag-change allowance reset?
- **Candidate sources:** Team Base, Pokémon Square, named-character list, Howling Forest and Makuhita Dojo; original-edition observations of these interactions. Existing sources may establish existence without resolving all presentation or timing variants.
- **Dependent gate:** Block affected P20/P31 records and their P32 asset acceptance until observed or explicitly adapted; missing optional/ambient variants remain open at M4 and P35 content sign-off rather than being treated as cosmetic completion.

### CAMPAIGN-GAP-10 — Exchange, hardware and version-mode disposition

- **Unresolved scope:** Decide whether original Friend Rescue, Wonder Mail, dual-slot Rescue Team Maze and version-exclusive unlocking will be implemented, adapted, or explicitly omitted. A full-content offline browser game must still disclose connectivity omissions.
- **Owner and consumers:** P01/P02 own the original capability inventory; P21 owns rescue/mail/exchange contracts and P31 linked/event/version content. Justin's decisions D01 and D04 in [PLAN.md](PLAN.md) govern the allowed adaptation/disposition.
- **Affected records:** Edition-scoped availability and unlock predicates; Friend Rescue and Wonder Mail feature records; linked Rescue Team Maze scope; optional/event access records; coverage exclusions and player-facing compatibility statements.
- **Resolution question:** For each feature and supported edition/region, what does the original require, what behavior/data can the approved browser mode preserve, and which exact browser equivalent or omission is authorized? Record code compatibility separately from content accessibility.
- **Candidate sources:** The original-game overview, Makuhita Dojo and optional/event pages in §11; original manuals/hardware documentation located through the official catalog sites; [DATA.md](DATA.md)'s version research. D01/D04 review supplies product decisions, not historical evidence.
- **Dependent gate:** Block corresponding P21/P31 implementation assumptions until original scope is inventoried and D01/D04 disposition is recorded. M4 requires no unapproved missing-scope rows; P35/P36 must disclose any approved connectivity or compatibility omissions in the accepted release scope.

### CAMPAIGN-GAP-11 — Original quiz, gender mapping and partner eligibility

- **Unresolved scope:** Determine exact main-story quiz mapping, original gender constraints and partner exclusions from the roster appendix. Any modernized identity/selection flow must be a stated adaptation while preserving an original-compatible choice.
- **Owner and consumers:** P01/P02 own source and roster-mapping verification; P19 owns the quiz/identity flow, with P17 consuming valid hero/partner identity and eligibility records.
- **Affected records:** `content/quiz.js` original scoring/result mappings, gender-dependent starter eligibility and partner exclusions; hero/partner initialization references; mode/adaptation metadata. The starter list alone does not resolve the full mapping.
- **Resolution question:** What are the original question/result scoring and tie rules, gender-to-starter mappings and partner exclusion predicates, and how will newly authored questions preserve a verified original-compatible selection path? Which optional identity or free-selection changes require explicit adaptation approval?
- **Candidate sources:** [DATA.md](DATA.md)'s starter/partner discussion and source ledger, original-game overview and walkthrough Chapter 1; original quiz/result references identified from those candidates and authorized original selection observations.
- **Dependent gate:** Block unsupported P01/P02 mapping fields and P19 quiz/eligibility acceptance; M3 onboarding cannot be accepted with guessed mappings or silently modernized exclusions. New prose may be drafted only within approved scope while factual mapping fields remain blocked.

### CAMPAIGN-GAP-12 — Failure loss and challenge reset semantics

- **Unresolved scope:** Verify failure item/money loss, challenge entry destruction, reset-stat restoration and permanent-stat item behavior; these materially affect long-form campaign balance.
- **Owner and consumers:** P01 owns evidence resolution; P15 owns stat/item effects, P16 failure/reset rules and P08 persistence/recovery, with P30/P31 consuming Wish Cave, Joyous Tower and Purity Forest restrictions.
- **Affected records:** Failure/escape/rescue outcome loss tables; challenge entry rules; pre-entry individual-stat snapshots versus expedition state; money/items/IQ/level restoration; permanent-stat item effects during reset expeditions and their exit handling.
- **Resolution question:** For each original exit outcome and challenge, what is lost, retained, temporarily reset or restored, and do permanent-stat items used during the expedition affect the restored baseline? Distinguish entry destruction from temporary stat reset and distinguish failure from successful exit.
- **Candidate sources:** Wish Cave, Joyous Tower, Purity Forest and their original-edition sections; [SYSTEMS.md](SYSTEMS.md) and [DATA.md](DATA.md)'s cited original failure/item references; authorized original entry/exit observations for unresolved combinations.
- **Dependent gate:** Block unsupported P15/P16 rules and P08 recovery semantics before M2 kernel acceptance; challenge-specific content also blocks P30/P31 and M4 acceptance. Any approved convenience adaptation needs separate mode/coverage treatment before P35 sign-off.

### CAMPAIGN-GAP-13 — Newly written dialogue and source-distance review

- **Unresolved scope:** Review newly written dialogue against source scripts for accidental close paraphrase; remove distinctive copied wording even if factual events are retained.
- **Owner and consumers:** P22 owns the scene-authoring/review contract; P19–P31 own their individual manuscripts, P32 associated narrative assets and P33 the whole-campaign coverage audit.
- **Affected records:** Every authored quiz question, scene utterance, judgment question, NPC topic, journal/debrief line and narrative asset in `content/quiz.js`, `content/main-story.js`, `content/postgame.js` and `content/town.js`; manuscript provenance and review receipts.
- **Resolution question:** Does each manuscript communicate the required researched event in newly written language without retaining distinctive original wording, dialogue structure or close paraphrase? Which lines need rewriting, and which content IDs have actually received review? No manuscript exists yet whose review could close this record.
- **Candidate sources:** Scene-specific walkthrough chapters and character pages in §11 to check factual beats; lawfully available original dialogue/script evidence for source-distance comparison; the future authored manuscript itself. Keep the review record factual and concise rather than copying original scripts into the repository.
- **Dependent gate:** Block each affected manuscript's P19–P31 acceptance until its review is recorded; main-story manuscripts block M3 and postgame/ambient manuscripts block M4. P33/P35 require complete review coverage, not a blanket declaration that all dialogue is original.

None of these unresolved tasks should be concealed by calling a mode "reimagined." That label permits approved creative differences; it does not excuse unidentified bugs or silently missing content.

## 11. Source ledger

All listed pages were consulted directly or by the delegated read-only optional-dungeon researcher. Root should open a child's source before using its web citation reference in a final user-facing factual claim. The artifact itself uses ordinary URLs for durable traceability.

### Sequence sources

- [User-supplied original walkthrough index](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team)
- [Chapter 1: early rescues](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_1)
- [Chapter 2: rivals and Zapdos](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_2)
- [Chapter 3: Xatu and flight](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_3)
- [Chapter 4: snow, vindication and Uproar](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_4)
- [Chapter 5: Groudon and Rayquaza](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_5)
- [Chapter 6: Stormy Sea and Buried Relic](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_6)
- [Chapter 7: Eon siblings](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_7)
- [Chapter 8: Lugia and Deoxys](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_8)
- [Chapter 9: Three Fields](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_9)
- [Chapter 10: Ho-Oh and Mewtwo](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_10)
- [Chapter 11: wishes and redemption](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team/Chapter_11)

### Specific original-game correction and story sources

- [Original game overview](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team)
- [Tiny Woods](https://bulbapedia.bulbagarden.net/wiki/Tiny_Woods), [Thunderwave Cave](https://bulbapedia.bulbagarden.net/wiki/Thunderwave_Cave), [Silent Chasm](https://bulbapedia.bulbagarden.net/wiki/Silent_Chasm), [Great Canyon](https://bulbapedia.bulbagarden.net/wiki/Great_Canyon)
- [Mt. Freeze](https://bulbapedia.bulbagarden.net/wiki/Mt._Freeze), [Uproar Forest](https://bulbapedia.bulbagarden.net/wiki/Uproar_Forest), [Magma Cavern](https://bulbapedia.bulbagarden.net/wiki/Magma_Cavern), [Sky Tower](https://bulbapedia.bulbagarden.net/wiki/Sky_Tower)
- [Buried Relic](https://bulbapedia.bulbagarden.net/wiki/Buried_Relic), [Silver Trench](https://bulbapedia.bulbagarden.net/wiki/Silver_Trench), [Mt. Faraway](https://bulbapedia.bulbagarden.net/wiki/Mt._Faraway), [Wish Cave](https://bulbapedia.bulbagarden.net/wiki/Wish_Cave), [Murky Cave](https://bulbapedia.bulbagarden.net/wiki/Murky_Cave), [Pitfall Valley](https://bulbapedia.bulbagarden.net/wiki/Pitfall_Valley)
- [Team Meanies](https://bulbapedia.bulbagarden.net/wiki/Team_Meanies), [Gardevoir](https://bulbapedia.bulbagarden.net/wiki/Gardevoir_(Red_and_Blue_Rescue_Team)), [Ninetales legend](https://bulbapedia.bulbagarden.net/wiki/Ninetales_legend)
- [Team Base](https://bulbapedia.bulbagarden.net/wiki/Team_Base), [Pokémon Square](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Square), [Named character list](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Mystery_Dungeon:_Red_Rescue_Team_and_Blue_Rescue_Team_characters)

### Optional, challenge and Dojo sources

- [Howling Forest](https://bulbapedia.bulbagarden.net/wiki/Howling_Forest), [Joyous Tower](https://bulbapedia.bulbagarden.net/wiki/Joyous_Tower), [Purity Forest](https://bulbapedia.bulbagarden.net/wiki/Purity_Forest)
- [Desert Region](https://bulbapedia.bulbagarden.net/wiki/Desert_Region), [Southern Cavern](https://bulbapedia.bulbagarden.net/wiki/Southern_Cavern), [Wyvern Hill](https://bulbapedia.bulbagarden.net/wiki/Wyvern_Hill), [Solar Cave](https://bulbapedia.bulbagarden.net/wiki/Solar_Cave)
- [Darknight Relic](https://bulbapedia.bulbagarden.net/wiki/Darknight_Relic), [Grand Sea](https://bulbapedia.bulbagarden.net/wiki/Grand_Sea), [Waterfall Pond](https://bulbapedia.bulbagarden.net/wiki/Waterfall_Pond), [Unown Relic](https://bulbapedia.bulbagarden.net/wiki/Unown_Relic), [Far-off Sea](https://bulbapedia.bulbagarden.net/wiki/Far-off_Sea)
- [Oddity Cave](https://bulbapedia.bulbagarden.net/wiki/Oddity_Cave), [Remains Island](https://bulbapedia.bulbagarden.net/wiki/Remains_Island), [Marvelous Sea](https://bulbapedia.bulbagarden.net/wiki/Marvelous_Sea), [Fantasy Strait](https://bulbapedia.bulbagarden.net/wiki/Fantasy_Strait)
- [Makuhita Dojo](https://bulbapedia.bulbagarden.net/wiki/Makuhita_Dojo)

### Primary-source catalog locations

- [Nintendo original Japanese game site](https://www.nintendo.co.jp/ds/aphjb24j/index.html)
- [Pokémon original-game catalog](https://www.pokemon.com/us/pokemon-video-games/pokemon-mystery-dungeon-blue-rescue-team-and-pokemon-mystery-dungeon-red-rescue-team/)

These two official locations establish the original product context but did not provide detailed extractable campaign rules in this research session. Do not cite them as if they independently verified the dungeon tables above.

## 12. Current work inventory and handoff

- Available research: [research/campaign.json](research/campaign.json), containing source URLs/refs, corrected floor conventions, main-story structure, postgame branches, optional dungeons and Dojo notes. It is factual input, not accepted runtime data.
- Available planning: this [CAMPAIGN.md](CAMPAIGN.md), the governing [PLAN.md](PLAN.md), canonical contracts in [SYSTEMS.md](SYSTEMS.md), and the shared [RESEARCH.md](RESEARCH.md) ledger.
- Current project status is recorded in [PROGRESS.md](PROGRESS.md) and [COVERAGE.csv](COVERAGE.csv). The game directory is reserved for future work; unreviewed implementation drafts were already removed/parked as described by parent P00. They must not be revived as accepted architecture or validation evidence.
- Campaign runtime files, including `content/campaign.js`, remain unimplemented. Main-story manuscripts, postgame integration, asset production and gameplay acceptance are future product work.
- No game-source tests or gameplay acceptance were performed for this campaign research/planning appendix. Documentation reconciliation does not change that status.

The next authorized step is review of the combined parent plan. Follow its authority order, dependencies and explicit approval gates before any implementation, game execution, release claim, merge or deployment.
