# Browser opening application contract

This checkpoint composes the genuine available opening mechanics. It does not
complete the Blue campaign or its visual/manual acceptance gates.

| Owner | Boundary |
| --- | --- |
| `src/bootstrap.js` | Abortable startup deadline, visible retry/failure, pagehide disposal and persisted pageshow recomposition |
| `src/shell/application.js` | Renderer/input/service lifetime, three distinct epoch namespaces, command admission and fresh-floor continuation |
| `src/application/catalogs.js` | Dependency-ordered local loading; authenticated complete 240 item identities before effects/dungeons; lifecycle cancellation |
| `src/application/quiz.js`, `onboarding.js` | Sourced eight-question rejection/scoring/follow-up/circular tie/gender flow; legal ordered partner list and validated names |
| `src/application/presentation.js` | Source-owned dungeon knowledge/appearance; explicit Tiny Woods→forest binding; original meadow/NPC visual staging; detached event clips |
| `src/application/saves.js` | Canonical repository/service, exact snapshot binding identity, primary/backup previews and concrete in-app confirmations |
| `src/ui/view.js`, `styles.css` | Text-node DOM HUD, dialogue, menus, explored minimap, focus wrapping and responsive layout |

Every command resolves `service.getBinding()` and checks `canAcceptCommands()`.
`Adventure.dispatch` receives `getEpoch()` and `commandContext(getSnapshot())`;
UI callbacks never write a snapshot. Input/presentation receive a fresh string
identity per persistence binding. Async actor synchronization captures generation,
binding epoch and exact canonical snapshot identity, and readiness opens only
when all remain current. New-floor stairs and imported/loaded fresh-floor cursors
receive one canonical `advance`; animation frames never run that continuation.

Held world movement stays live across revisions. Frames flush at most one input
activation after a 240 ms presentation admission interval and current actor
assets; rejected/no-change actions explicitly rearm the existing input permit.
Menus, dialogue, typing, replacement, blur, hidden tabs and context loss cancel
or pause world input. Camera controls use the existing adapter. The website
continues to own the emulator overlay; no second touch command owner is created.

The uncommitted `onboardingQuiz` owner receives a fresh four-word browser seed
once per quiz and draws from the existing non-security `xoshiro128ss-v1` helper,
then applies the catalog's native low-16-bit product mapper. It preserves the
eight main slots, used-category rejection, special follow-up scoring and biased
circular-first-maximum tie rule.
Browser entropy/sequence is a platform adaptation; native sequence parity is
not claimed. Quiz entropy never consumes canonical campaign streams. Raw hero
and partner names, including space cells, pass unchanged to canonical validation;
the UI does not trim them or supply a second name rule. The shared
`content/state/pokemon-rules.js` name policy retains the pinned Red comparative
`naming_screen.c` END/length branch and `global.h` ten-cell limit. Hero
identity comes solely from nature/gender via `createInitialSelection`; team name
stays its initial `Pokémon` until the team-formation name is confirmed.

Browser saving uses `createIndexedDbAdapter` → `createSaveRepository` →
`createPersistenceService`. Detached `bind` constructs a new Adventure and
returns the supplied validated snapshot by exact identity. Autosave follows only
accepted changed transactions. Manual new/load/import/reset/persist show
validated previews and require the exact single-use service token. Primary and
backup are explicit choices; unavailable slots expose their reason. Memory-only
new/import preserves existing browser saves and exports independently of IDB.
Notifications check current binding; a past checkpoint cannot mark a newer
revision saved. File import uses the service's size-before-read guard.

Dungeon presentation uses `projectDungeon` and immutable snapshots. Unknown
terrain remains void; minimap enemies/actors come from the visible projection.
Original meadow placement of Butterfree/Caterpie is presentation staging, not
invented domain actors or cartridge ground-map fidelity. Exact species/form
art comes from the bounded 419-profile runtime manifest with its existing 24 MiB
decoded-page budget; no roster preload or generic body fallback is used. Shared
resource cancellation offers at most two user-triggered actor retries with
world commands blocked and without advancing a turn. Fatal display failures
retain access to saves/export. Context restoration reprojects current state.

Supported route: title/new/continue → quiz/column/partner/names → Awakening →
Tiny Woods B1F–B3F → rescue acknowledgement → reunion/reward → town checkpoint;
defeat/give-up/wind loss exposes the genuine retry entry. Move menus retain exact
slot IDs and show PP/unavailable effects; HUD shows team HP/Lv, leader Belly,
PP, money, objective and discovered stairs. Held berry use and source pickup
ownership follow [GAMEPLAY-OPENING.md](GAMEPLAY-OPENING.md).

Still open: human browser/keyboard/touch/play/visual acceptance, save/recovery/
quota/device observations, final art quality, procedural audio (this checkpoint
is silent), team naming/rescue-kit mail, later town services and campaign routes,
full move effects/AI and the other mechanics enumerated in GAMEPLAY-OPENING.
Saved camera/reduced-motion preferences are read; preference editing is not
advertised without a domain command owner. Full-campaign/release gates remain.
