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
