# Persisted native move learning — bounded v23 prerequisite

This development successor closes actual compact-layout dungeon move learning;
MAIN5,7 departure/refresh, escort guests, the second work interval and Caterpie
remain held. Full original Blue main/postgame/optional content,386/forms, native
party AI, human play/visual review and release approval remain open. No game or
native module was executed for implementation or checks.

The published PR at03459a9 records completed scoped independent specification
PASS/quality APPROVE after ML-R001/ML-R002/ML-R003 fixes, with clean scoped
re-review and the identical reviewed localc2e1f700 tree. This does not close
human, Blue parity or full-release acceptance. The next prerequisite is tracked in
[ESCORT-GUEST.md](ESCORT-GUEST.md).

## Comparative source and inherited qualifications

`content/authored/move-learning-facts.js` pins five full source files at Red
`6bcbec4f906938c0243aa2026bcbd41b577bab85`. Their actual byte hashes and locators
are recorded, and the exact v23 identity appends this artifact's SHA256 to the
unchanged seven v22 factual digests. Red evidence is comparative; browser seeded
RNG is qualified separately and does not establish Blue binary/RNG-byte parity.

| Source | Binding behavior |
| --- | --- |
| dungeon_leveling.c49–66,89–132 | AddExpPoints queues the capped actual delta; EnemyEvolution traverses active Pokémon in slot order, excludes zero HP, applies EXP and its feedback before eligible growth. Current owned EXP recipients are the actual roster team. |
| dungeon_leveling.c369–466,558–626 | Update level/stats/HP before learning; draw one DungeonRandInt when this level has candidates. |
| pokemon.c1062–1104; dungeon_data.c504–507 | Source-ordered level candidates, cap16; four ultimate moves require IQ333. Known moves remain candidates. All386 factual learnsets have333 multi-candidate levels and maximum4. |
| moves.c114–121,1419–1439 | New move is enabled, full base PP, no boost; temporary copies retain only the contiguous four-slot prefix and clear the temporary learning flag. |
| dungeon_menu_moves.c1047–1078 | Confirmed forgetting deletes the selected move and its subsequent linked tail, then compacts retained moves. Declining the temporary candidate keeps all four old moves. |

Frozen v22 directly credited total EXP at damage and reconciled growth later.
Conversion carries those authenticated totals/levels/choices verbatim: it never
infers pending awards or rewinds historical EXP. Prospective new damage has an
explicit `pendingExperience` ledger: exact pre-award total/gains, capped delta,
level, each defeated hostile/team attacker/award revision/source round and full
actual interrupted frame. Explicit phase/round arithmetic bounds unconsumed
awards within the next24-phase native hook cycle, including otherwise empty
phase yields and rollover; no frame or consumed growth is inferred. Native source feedback occurs only when this new award
is consumed after immediate and forced-loss Reviver arbitration. An unrecovered
casualty restores only its exact new, unconsumed award, emits no EXP feedback for
that discarded credit, and retains the pending defeat. Already consumed growth
cannot be restored. The inherited old direct-credit reconciliation remains a
qualified compatibility behavior, including any old casualty's retained growth;
a saved defeat records its original casualty level and retains its outcome.

Frozen original admission permits internal empty move-slot gaps, while actual
current producers are compact. Conversion preserves every such authenticated
slot, PP, link and order. If genuine growth reaches an inherited internal gap,
`learning-noncompact-inherited-slots` blocks before level/stat/candidate/RNG
mutation with atomic rollback. Trailing null slots and ordinary1–3 move layouts
are valid. A real legacy layout/reorder owner is an open full-game dependency;
there is no truncation, metadata repair, entry hold or candidate/level filter.
Town, Suspend and file save/import/export preserve the unchanged checkpoint.
LevelUp calls the copy helper unconditionally for each attained level at
dungeon_leveling.c442; even a zero-candidate level copies at571 and writes/clears
at597/606. Thus the hold applies only after EXP reaches a real next level, including
those zero-candidate helper calls. No pending EXP/no attainable level hooks and
unrelated completed units remain unaffected.

## Actual producers and paused PCs

| Owner | Saved native position and resumption |
| --- | --- |
| Before decision | Real active team/wild source ref, complete team recipient traversal; decision/step0, beginning discharged, no action or replan. Wild-triggered growth does not confuse source and recipient. |
| After action | after/step4, completed end/movement obligations; acknowledgment resumes refresh, never repeats the attack/end/EXP hook. |
| Flush | Actual ordered flush recipient, step4, native leader-begin or boundary owner; all earlier/suffix movement obligations and generation refs remain exact. |
| Boundary | boundary/select/step2, actual null source, after field upkeep; acknowledgment continues to forced loss. |
| Direct settlement | Before any roster/session/items/job/resource copyback, preserve success/give-up/wind/fainting and the actual exit, ordinary client-confirmation, wind or forced-loss PC. No automatic decline, fabricated input PC or second settlement. |
| Terminal scene acknowledgment | Opening rescue, Thunderwave rescue, Steel departure/quiet summit or ordinary Steel summit only; preserve the actual final cursor, scene instance, scene-paused tag and dungeon-exit frame before any scene receipt or grant changes. Later acknowledgment resumes that already authorized scene cursor. Battle intro is not intercepted. |

A prompt stores the one selected candidate, pre-draw browser state, actual prior
level/stats/HP, exact current unchanged move/PP and native frame fingerprints,
source origin, complete team-slot order and recipient index. Level/stat updates
are already committed before the input. Real `move-learn-choice` result and
`choice-paused` scheduler own pause; hooks return `prompt`, preserving the runtime
prompt assertion. A transient completed-terminal `prompt` result installs and
seals its actual after/step0 frame before the normal prompt guard observes it;
only actual exit/give-up settlement uses this result. Cursor prompts and ordinary
`done` retain their existing checks. No invented performance yield or effect cursor.

Acknowledgment uses canonical result ID/cursor/revision/epoch/slot checks. It
resolves only the chosen deletion or legal decline, then continues the same
recipient for further levels, followed by the remaining actual recipients. Earlier
recipients cannot retain unconsumed EXP/unresolved growth. Each later full-slot
candidate is another actual prompt. Only then does the saved turn, terminal scene
or settlement owner continue. Draft failure rolls back resources, awards,
messages, IDs, stats, RNG, frames and settlement together.

## Resources, possession and UI

Until explicit confirmation, all four identities/order/enabled/power/base capacity,
current PP/seal/use-for-EXP flags, link groups and SET resources remain unchanged.
Confirmation removes exactly the selected linked tail; unrelated slots/PP remain,
retained links compact, removed SET/obsolete last-used references and move-boost
entries lose their deleted slots. The fresh slot has a new stable identity and
native full PP/enabled/zero boost. Duplicate move identities remain legal.

Retired source slots remain historical witnesses in `forgottenMoves`, bounded by
four team ×99 levels ×four deleted slots. They permit already executed action and
existing condition-source references to survive forgetting. They are never active
moves, PP/AI candidates or command choices. The complete raw proof independently
checks each actual roster owner, distinct retired ID, source acquisition and
committed choice revision before condition provenance projection. After complete
structural preflight, exact v23 admission repeats the trusted factory raw proof on
frozen input before global MoveSlot ownership comparison. Only the exact retired
row path resolves its proved actor to the actual unsettled roster/entry owner;
original and newly allocated linked-tail slots share that same owner. Allocation
marks, identity uniqueness and all original roster/actor ownership checks remain.

Each turn prompt proves the actual source generation, side and pass cursor:
leader uses team side; team/wild use their own side and consumed slot index;
followers retain their exact team-side captured ref and round/index. Special work
retains its real team leader and scanned side/offset. Flush and settlement pauses
prove their real parent PC and movement/end obligations; removed wild generations
are allowed only as actual newly fainted, cleared-slot loss references. A recomputed
frame fingerprint cannot authorize a foreign pass.

Move possession is independent of effect execution. Every actual source candidate
is retained without an effect filter, regular-attack substitution or default
decline. Existing permanent/actor catalog policies admit ordinary source-learned
moves. Unsupported manual effects/link execution remain explicitly blocked by
`move-effect-not-supported`; wild AI validates its complete finite profile before
selection. Existing team AI remains its documented partial regular-attack policy;
this prerequisite does not implement native party move/item selection. The precise
finite effect frontier remains in MT-STEEL-MOVE-COVERAGE.md.

The priority panel names the candidate, each old move/current PP, and every move
in the selected linked tail before a separate confirmation; decline also confirms.
All actions use existing keyboard/touch/focus panel controls and canonical ack.
Panel tokens and shell snapshot/binding epochs reject stale callbacks. Opening the
panel cancels buffered input and pauses the automatic pump. Menus, Suspend,
hidden tabs and save/import/rebinding return to the same pending owner; no UI,
presentation, reload or save path draws, allocates, mutates resources or synthesizes
a new decision. Human device/interruption/visual evidence remains pending.

## Exact save closure and validation-only views

Original envelope/hash/exact original v2–v22 factory admission occurs first.
V22 conversion changes only content identity and conversion revision; source
prefix/debt/sourceRevision/conversionRevision/queueFingerprint/resources are
carried verbatim. Older authentic debt metadata retains its original ownership.
No new learning, slots, EXP ledger, debt, guest, RNG draw or posting history is
inferred during conversion. Original v22 factory, policies, revision, schema,
prefix and Bronze source producer/facts are pinned; exact field/continuation
recognizers are copied byte-for-byte into v22 modules before live successor joins.
All95 prior pins,14 predecessor shape bodies, frozen whole schema and two factual
manifests/resources are preserved;8 original v22 modules plus2 copied recognizers
make105 checked frozen dependencies.

Every state-owning policy callback first runs the complete raw new producer proof:
exclusive live result, exact actor/source/recipient order, candidate/IQ/sole browser
sample, prior/new stats/HP/EXP, unchanged slots/PP, exact frame/final outcome,
actual scene/cursor, bounded historical slots and each new award's source/PC/cap.
Conditions now receive the actual complete state as an optional fourth dispatcher
argument; frozen callbacks ignore it, while v23 requires it and independently proves
its raw owner. Admission never relies on callback order or cached side effects.

Only then may the pure predecessor view change content identity to exact v22,
omit the proved new learning/forgotten/award fields, temporarily omit the owned
learning result and restore its genuine ready/scene-paused scheduler tag. It does
not alter history, claims, prefix/debt, resources, counters, floor/session epochs or
scene cursors. A proved pending zero-HP casualty's actor placement is projected
only for the old live-HP guard; the actual actor stays on its map/slot until atomic
settlement. Existing `pendingSpecialSwap` proves any genuine special co-location
before its prior floor view. Condition-only views append proved retired historical
source slots solely for frozen provenance checks. No view is written to gameplay.

| Exact revision consumer | Successor ownership |
| --- | --- |
| validate.js | Exact trusted factory/data agreement selects disjoint v23 shapes first; original v22 and historical shapes unchanged. |
| field-moves.js; continuation-registry.js | Frozen v22 recognizer plus literal exact v23, including complete new source digest. |
| campaign.js; move-learning-campaign.js | Select v23 factory; join exact frozen v22 plus the pinned new source artifact. |
| work.js chapterWorkReady and selection | Carry exact original source interval, Bronze selection/escort Take hold and original input owners. |
| steel-meanies-scenes.js exit/mailbox | Carry exact MAIN5,6/5,7/news/dialogue owners; no departure/refresh extension. |
| work.js deliverPreparedReward | Same source prefix-before-items and authenticated debt; no fall-through to earlier after-items payment. |
| move-learning-prefix.js | Pure exact v22 validation view; v22 conversion preserves existing markers; only original admitted older source can receive original prospective debt. |
| growth.js; native-learning.js; damage-resolution.js | Exact v23 alone produces genuine choices and new-only awards; old growth/direct-credit branches retain their qualified semantics. |
| graph.js; session.js; policies.js | Exclusive new scene/result gate, historical source-slot references and complete-state condition proof; absent new fields leave old meaning unchanged. |

## Complete132-actor event allowance

The accepted TURN-CONTINUATION.md A1500/E340×5 or×4/begin+AI12/forcedLoss48/
link133/tile0-or2/wind+field2/final2 terms remain unchanged. Current actual entry
still has exactly two growing roster identities, each at most99 levels and
level+learning feedback: shared396 across every normal/flush/scene/settlement call,
including inherited historical growth. A conservative additional four eligible
EXP notices and one already pending choice acknowledgment gives shared401. A
native input stops at the first full-slot choice; remainder resumes in its own
transaction without duplicating prior messages. Award creation/restoration emits
no extra EXP notice, and repeated hook traversal cannot regrow consumed levels.

| Whole completed chunk | Exact sum | Retained rounded allowance |
| --- | ---: | ---: |
| Opportunity | 1500+1700+12+48+133+401+0+2+2 =3798 | 3800 |
| Flush recipient | 1700+12+48+133+401+2+2+2 =2300 | 2300 |
| Otherwise empty phase | 1360+48+133+401+0+2+2 =1946 | 1950 |

Largest allowance remains296 below4096. All132 actor slots, stale generations,
four older deferred end hooks, saved special traversal, new award interrupted
frames and genuine terminal owners are retained. These are conservative source/
static facts, not measured latency or executed-game evidence. Future guest XP
locks/extra entry/AI/effects/output must reprove the full allowance before opening
MAIN5,7 or broadening any source consumer.
