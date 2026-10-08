"""Authenticated comparative numeric placement/movement/Pickup facts; text only."""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--source-root', type=pathlib.Path, required=True)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[3]
pins = {
    'src/dungeon_pos_data.c': '53de480e4f3c8ba403a7565e4b42c0198d74875b10eaf076dc26454db580a202',
    'src/dungeon_ai_movement.c': '7bedc85d8c1d114490db5931ba21167b97b3b987e94687f464af730b87b737ba',
    'src/dungeon_ai_leader.c': 'ff2ad426a6177d3a591f9957d088ae87b3f548938a9f9d897b8209abe6e10bda',
    'src/dungeon_logic.c': '662b79a226f4e76a5b7c4e84553477e1e310c28e2483c80b702f4bbe35d9ced9',
    'src/dungeon_util.c': '700a2c7c7f52b71cc463e5e7cb4b7b5c4ec69b7cfd5e4c57dd185e696470b126',
    'src/dungeon_range.c': '4cf668f24108cde6be39bc79abf2718c21243e9e5ed2f3e44436e0a7f1b6bfa7',
    'src/dungeon_misc.c': '9f5de68c48737bb3b9aadd0b92a9ae2069a53349383d125174e7b2aeca04d90d',
    'src/dungeon_generation.c': '62b3f027fdcc44431fe2aa71a77a4e5b95a9cc5da3e36d8c5bc39664f304055c',
    'src/dungeon_map_access.c': '65dea90a651fcbb15b70b142bde9bad0d352b24ed658dd563bc9f8cddfb02707',
    'src/position_util.c': 'cb8c80b2b482bd4e7dab501c1c919f00e92f344bff9a625fc534d140baba2e72',
    'include/constants/direction.h': '209f6a841294ad9e896434902033946261c489dd3e1f322e2936a7f2d841c71f',
    'src/items.c': 'b7fb55af3420e0afd9df767d0abda097e91c171882f3374672867afe17d16d5c',
    'src/dungeon_mon_spawn.c': '96f868db765eecfca6730929bee5c00debb913d5f4ec0699b74000f589922ab3',
    'src/dungeon_floor_spawns.c': '24b3fc7534d24429dbf6b208376106611960d8a36a9e5b48313863756ed4e124',
    'include/items.h': '4cf80c488631b8adacd21e8d8eff57ba07c408ec2ef59763cea430075e3e3c5d',
    'include/constants/item.h': '8786b3352a0cb539a150ae887b2ad8282e5315d80bde21d728094648261dcc03',
    'src/dungeon_info.c': '6ccf672c31673187bb796aa3efba549b4c7fcfedef4c306702340d111597a871',
    'src/dungeon_ai_attack.c': 'ceb6873aeff5ae73872b654fa6e64c971c89027d391294a7baa8a5c03745c6e0',
    'src/dungeon_ai.c': '717eb69e533c8b5edbc1d77d324645553c54cc4d21829cf767d9a0e8f8b2e68d',
    'src/status_checks.c': 'b5f9c2081cdce9fb50500d2ef918a504c7a0039b1c66b9f0c5e897a1cc955b1b',
    'src/dungeon_action_execution.c': 'a1c974ab7811d990f06cfe1a7376ddeb4c283b51bec092179cd88436d100dd11',
    'src/dungeon_jobs.c': 'c8e7c115988fdd1d9f328d9fe3b69a927660405afd89199a236d43dd11d60a54',
    'src/dungeon_move_util.c': '0b69f36c9e8c497acdfef2c06566fe84ccb4549390d53293dc24347e57af9d53',
}
texts = {}
for path, expected in pins.items():
    data = (args.source_root / path).read_bytes()
    actual = hashlib.sha256(data).hexdigest()
    if actual != expected:
        raise SystemExit(f'Escort spatial source pin mismatch: {path}; expected {expected}, found {actual}. No artifact written.')
    texts[path] = data.decode('utf8')
positions = re.search(r'gUnknown_80F4598\[158\]\s*=\s*\{(.*?)\n\};', texts['src/dungeon_pos_data.c'], re.S)
if positions is None:
    raise SystemExit('Escort spatial source-validation error: placement array absent. No artifact written.')
all_offsets = [[int(x), int(y)] for x, y in re.findall(r'\{\s*(-?\d+)\s*,\s*(-?\d+)\s*\}', positions[1])]
assert len(all_offsets) == 158
sentinel = next(i for i, pair in enumerate(all_offsets) if pair[0] == 99)
entry_offsets = all_offsets[:sentinel]
increments = re.search(r'gFaceDirectionIncrements\[\]\s*=\s*\{([^}]+)', texts['src/dungeon_pos_data.c'])
assert increments is not None
face_increments = [int(value.strip()) for value in increments[1].split(',') if value.strip()]
assert face_increments == [0, 1, -1, 2, -2, 3, -3, 4, 0, -1, 1, -2, 2, -3, 3, 4]
direction_enum = re.search(r'enum Direction\s*\{([^}]+)', texts['include/constants/direction.h'])
assert direction_enum is not None
assert re.findall(r'DIRECTION_\w+', direction_enum[1]) == ['DIRECTION_'+name for name in ['SOUTH','SOUTHEAST','EAST','NORTHEAST','NORTH','NORTHWEST','WEST','SOUTHWEST']]
assert 'item->quantity = RandRange(min, max);' in texts['src/items.c']
assert texts['src/dungeon_floor_spawns.c'].count('DungeonRandInt(ITEM_SETS_RANDOM_CAP + 1)') == 2
item_cap = re.search(r'^#define ITEM_SETS_RANDOM_CAP (\d+)$', texts['include/items.h'], re.M)
assert item_cap is not None
no_hm_cap = re.search(r'if \(!requireHm && maxPartyMembers > (\d+)\) \{\s*maxPartyMembers = (\d+);', texts['src/dungeon_info.c'])
assert no_hm_cap is not None and no_hm_cap[1] == no_hm_cap[2]
assert 'counter > maxPartyMembers' in texts['src/dungeon_info.c']
pickup_cap = int(item_cap[1]) + 1
assert pickup_cap == 10000
item_path = 'data/item/item_data.json'
item_sha = '3b69628c8c61c567d600e47d6c52a9e649153ceb8e016cb0d0c35a6438d2d586'
item_bytes = subprocess.check_output(['git', '-C', str(args.source_root), 'show', '6bcbec4f906938c0243aa2026bcbd41b577bab85:'+item_path])
if hashlib.sha256(item_bytes).hexdigest() != item_sha:
    raise SystemExit('Escort spatial item blob pin mismatch. No artifact written.')
item_data = json.loads(item_bytes)
assert item_data[7]['name'] == 'ItemNameGravelerock' and item_data[7]['spawnAmountRange'] == [3, 5] and item_data[7]['category'] == 'CATEGORY_THROWN_ARC'
facts = {
    'commit': '6bcbec4f906938c0243aa2026bcbd41b577bab85',
    'qualification': 'pinned-red-comparative-not-blue-binary-proof',
    'sourceFiles': [{'path': path, 'sha256': sha} for path, sha in pins.items()] + [{'path': item_path, 'sha256': item_sha}],
    'entryOffsets': entry_offsets,
    'entryOffsetBoundary': 'first-99-sentinel-only-preserve-duplicates',
    'directions': [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]],
    'faceIncrements': face_increments,
    'leaderHistoryLength': 4,
    'ordinaryNoHmRosterMaximum': int(no_hm_cap[1]),
    'roomExitLimit': 32,
    'roomExitOrder': 'x-major-then-z',
    'wanderExitAttempts': 10,
    'corridorJunctionMasks': [0x54,0x51,0x45,0x15,0x55],
    'pickupDrawCap': pickup_cap,
    'gravelerockNativeId': 7,
    'gravelerockSpawnAmountRange': item_data[7]['spawnAmountRange'],
    'pickupQuantityPolicy': 'native-general-max-exclusive-thrown-else-canonical-one',
    'pokeHasNoHeldLot': True,
}
output = ("import { freezeData } from '../../src/domain/state/validate.js';\n"
          "/** Authenticated comparative numeric movement/entry/Pickup facts; text only. */\n"
          "export const ESCORT_SPATIAL_FACTS = freezeData(" + json.dumps(facts, indent=2) + ");\n")
path = root / 'games/pokemon-dungeon-reimagined/content/authored/escort-spatial-facts.js'
if args.check:
    if path.read_text() != output:
        raise SystemExit('Escort spatial facts differ from authenticated numeric source projection.')
else:
    path.write_text(output)
print(f'Escort spatial facts: {len(pins)+1} complete native byte pins; {len(entry_offsets)} source entry offsets before first sentinel; actual direction/face/history/junction/Pickup caps. Text/data only.')
