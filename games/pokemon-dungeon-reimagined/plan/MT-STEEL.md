# Mt. Steel continuation

The target is original Blue Rescue Team. Native instruction traces in this
document use original Red comparative source at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`; they do not establish Blue binary
parity. Mt. Steel remains gated until its shared consumers, route and save
admission are integrated. Original dialogue and tactical geometry are authored
independently; native dialogue and art are not imported.

## AI factual prerequisite

`content/ai-facts.js` projects all413 native action records' AI weights,
target flags, conditional probabilities, frozen-target restriction and Taunt
exemption. AI range flags are distinct from actual move execution range.
The source data and six file hashes/Git blobs are recorded in
`tools/pokemon-dungeon/content/steel/ai-facts.json`. The independent exporter
checks identities, numeric/boolean ranges and exact generated source without
importing or executing game code. `npm run ai:check` is part of the game static
gate. Missing native boolean members are zero-initialized false values.

The source `ChooseAIMove` selects enabled usable slots by weight before checking
actual targets unless Weak Type Picker is active. Regular-attack weight is
`[100,20,30,40,50]` indexed by enabled slot count, including enabled zero-PP
slots; it is not the regular-attack record's own weight. The cumulative check
is `>=` against a zero-based draw. Failed chosen targeting falls back to a
regular attack, without resampling a different legal skill. All-zero total PP
uses the separate Struggle path. Linked continuations cannot be chosen as heads;
PP Checker additionally avoids chains with any member at one PP.

`LoadIQSkills` gives wild actors Status Checker, PP Checker and Item Catcher;
Self Curer depends on the actual bossFlag, and Item Master starts at level16.
The Skarmory cutscene does not set bossFlag through `SetupBossFightHP`, so a
story boss role alone must not confer it. These facts do not change prior save
admission or yet replace the existing regular-attack AI. Runtime integration,
status checks, targeting, PP/link execution and complete move coverage remain
separate prerequisites.

## Confirmed route constraints

The original dungeon has eight exploration floors and the9F Skarmory/Diglett
fixed encounter. Skarmory's native level10 growth yields65HP; its scene does
not call the later-boss HP override. Clear requires that specific Skarmory's
faint during the first/retry event. Diglett is a separate neutral rescue actor.
The fixed-room cutscene flag changes eaten Blast Seed damage from45 to30,
independently of which actor it hits.

Script2 return sets MAIN(4,7), then script3 has `unk11=false`. The main-loop
resolver converts this into a won-return without entering the dungeon runner;
it advances MAIN(4,8), then the rescue/return scene reaches MAIN(5,0) and save.
It is not another nine-floor run. First/retry/loss staging and visible Magnemite
crossing assistance remain mandatory. Rewards are500Poké, Pecha Scarf and
Ginseng, in order. Cash is rejected as a whole if it exceeds capacity; items
use recoverable inventory overflow and durable receipts.

## Rapid Spin evidence correction required by the consumer

The predecessor effect projection's adjacent-trap removal and partial cures
are unclosed candidate facts. Audited `move_orb_actions_1.c:961-974` and
`dungeon_move_util.c:385,457-461,1212-1223` instead queue cleanup after a
successful nonzero damage chain. Chance zero does not draw. The helpers clear
the entire frozen class and leech-seed class, including linked wrap counterpart
cleanup where applicable; this path contains no trap-removal call. The new
consumer must explicitly override the old candidate while retaining its exact
old resource hash for save verification. No Blue-specific trap difference has
been established. Unsupported wrap/status consumers stay explicit.

## Shared stat effects and execution targeting

Harden, Defense Curl and Meditate now target the user; Tail Whip and Leer use
front melee geometry, Sand Attack uses the separate corner-cutting position
predicate, and Growl visits active team/wild slots in native room order. Neutral
client targets are excluded before hit RNG. Original room sight includes the
one-cell room border and corridor visibility range. These execution predicates
are reusable and do not substitute for AI consideration flags.

Stat drops apply Mist, Clear Body/White Smoke first. Offensive drops additionally
check a real nonsticky held Twist Band, then physical Hyper Cutter; accuracy
checks Keen Eye after the shared guard. Stages clamp to0-20. Growl checks
Soundproof before accuracy. Boosts target self and still consume the source
first accuracy draw with guaranteed self-hit. Non-damage effects do not run the
second damage-only accuracy check. For damage, `CalcDamage` randomness precedes
`TryHitTarget_Async`'s second accuracy draw. `UseMoveAgainstTargets` raises wild
experience credit after the first hit check before dispatch, including capped
or protected stat effects and self boosts. Damaging dispatch restores only its
provisional credit when the damage-only accuracy check misses or returns zero
damage, preserving prior credit. Each eligible target wakes from indefinite
spawn sleep before protection/Soundproof/accuracy; finite sleep is retained.

Source: `dungeon_move.c:189,239-315,1290-1294,1345-1400`,
`move_orb_effects_5.c:541-554`,
`dungeon_move_util.c:738-815,819-991`, `dungeon_misc.c:727-769`,
`move_orb_effects_1.c:848-1046,1219-1256`,
`dungeon_logic.c:241-280,1216-1239`, `dungeon_items.c:692-705`, and the
individual effect dispatchers in `move_orb_actions_1.c`, `move_orb_actions_3.c`
and `move_orb_actions_4.c`. Existing Wonder Tile and floor-reset owners restore
stat stages. Stage fields were already admitted by the unchanged v8 policy;
no prior save validator, hash or content revision is rewritten by this batch.

Only the seven named stat moves are newly admitted. Complete status, copied,
linked and multihit consumers remain open; learnsets are retained without
level caps, dropped slots or generic-damage substitutions. Human play and
visual acceptance of the additional effects remain open.
