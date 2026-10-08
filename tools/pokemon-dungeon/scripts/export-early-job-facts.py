"""Project native early-job facts from pinned text/data; no game execution."""
import argparse
import hashlib
import json
import pathlib
import re

parser = argparse.ArgumentParser()
parser.add_argument('--source-root', type=pathlib.Path, required=True)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[3]
content = root / 'games/pokemon-dungeon-reimagined/content'
source = args.source_root


def records(folder, pattern):
    return [row for path in (content / folder).glob(pattern)
            for row in json.loads(path.read_text())['records']]


def block(text, name):
    match = re.search(r'\b' + name + r'\[[^;=]+?=\s*\{(.*?)\n\};', text, re.S)
    if not match:
        raise ValueError('Missing source table: ' + name)
    return match[1]


files = ['src/items.c', 'src/dungeon_info.c', 'src/data/pokemon_mail_pre.h',
         'src/data/pokemon_mail.h', 'include/constants/monster.h',
         'src/pokemon_3.c', 'src/code_803C1B4.c', 'src/code_80958E8.c',
         'src/dungeon_data.c', 'src/friend_area.c', 'include/constants/friend_area.h']
texts = {name: (source / name).read_text() for name in files}
items = records('effects', 'items-*.json')
item_by_id = {row['internalId']: row for row in items}
item_by_symbol = {symbol: row for row in items for symbol in row['symbols']}
profiles = {row['internalId']: row for row in records('species', 'profiles-*.json')}
monsters = {symbol: int(number) for symbol, number in re.findall(
    r'^#define (MONSTER_\w+) (\d+)\s*$', texts['include/constants/monster.h'], re.M)}
floors = {row['id']: row for row in records('dungeons', 'floors-*.json')}
encounters = {row['id']: row for row in records('dungeons', 'encounters-*.json')}
sections = {row['id']: row for row in records('dungeons', 'sections-*.json')}
dungeons = {row['id']: row for row in records('dungeons', 'dungeons-*.json')}
mask_rows = re.findall(r'\{([^{}]+)\}', block(texts['src/items.c'], 'gUnknown_8108F64'))
routes = []
candidate_ids = set()
for native_id, dungeon in enumerate(['tiny-woods', 'thunderwave-cave']):
    mask = [int(value, 16) for value in re.findall(r'0x[0-9a-fA-F]+', mask_rows[native_id])]
    targets = [item_by_id[i]['id'] for i in range(1, 240)
               if mask[i // 8] & (1 << (i % 8))
               and item_by_id[i]['category'] not in ['thrown_line', 'thrown_arc', 'poke', 'used_tms']]
    floor_ids = [floor for section in dungeons[dungeon]['sectionIds']
                 for variant in sections[section]['variants'] for floor in variant['floorIds']]
    for floor_id in floor_ids:
        for row in encounters[floors[floor_id]['encounterPoolId']]['rows']:
            if (row['entryRole'] == 'weighted-candidate' and row['speciesId'] is not None
                    and row['blueGate'] == 'default-available'
                    and row['applicabilityPredicate'] == 'ordinary-floor-candidate'):
                assert row['formId'] is None
                candidate_ids.add(row['speciesId'])
    native_count = int(re.search(r'\[DUNGEON_' + dungeon.upper().replace('-', '_') + r'\]\s*=\s*(\d+)', texts['src/dungeon_info.c'])[1])
    assert len(floor_ids) + 1 == native_count
    difficulty_name = 'sFloorMissionDifficulty_' + ''.join(part.title() for part in dungeon.split('-'))
    difficulty_body = block(texts['src/dungeon_info.c'], difficulty_name)
    assert re.search(r'\[1 \.\.\. ' + str(native_count - 1) + r'\] = 1', difficulty_body)
    routes.append({'dungeonId': dungeon, 'nativeDungeonId': native_id,
                   'floorNumbers': list(range(native_count // 2, native_count)),
                   'missionDifficulty': 1, 'rankPoints': 5,
                   'targetItemIds': targets})
# Prove finite eligibility/subtype boundaries, rather than silently pruning them.
pre = texts['src/data/pokemon_mail_pre.h']
rank_points = [int(value) for value in re.findall(r'\b\d+\b', block(pre, 'gUnknown_80E80A0'))]
assert rank_points[1] == 5
native_candidates = {row['internalId'] for row in profiles.values() if row['speciesId'] in candidate_ids and row['formId'] is None}
assert len(candidate_ids) == len(native_candidates) == 10
for table in ['gUnknown_80E80E0', 'gUnknown_80E8126']:
    bans = {monsters[s] for s in re.findall(r'MONSTER_\w+', block(pre, table))}
    assert native_candidates.isdisjoint(bans)
base_body = texts['src/pokemon_3.c'].split('s16 GetBaseSpecies(s16 index)', 1)[1].split('s16 GetBaseSpeciesNoUnown', 1)[0]
changed_forms = {monsters[s] for s in re.findall(r'index == (MONSTER_\w+)', base_body)}
assert native_candidates.isdisjoint(changed_forms)
for table, text in [('gUnknown_80E9920', texts['src/data/pokemon_mail.h']),
                    ('gUnknown_80E9F8C', texts['src/data/pokemon_mail.h']),
                    ('gUnknown_80E8168', pre)]:
    pairs = re.findall(r'\{\s*(MONSTER_\w+),\s*(MONSTER_\w+)', block(text, table))
    assert not any(monsters[a] in native_candidates and monsters[b] in native_candidates for a, b in pairs)
favorite_items = {item_by_symbol[s]['id'] for s in re.findall(r'ITEM_\w+', block(pre, 'gUnknown_80E81D4'))}
assert favorite_items.isdisjoint(item for route in routes for item in route['targetItemIds'])
reward_body = block(texts['src/dungeon_info.c'], 'sRandomItemsSet1')
reward_categories = []
reward_items = []
for symbol, percent in re.findall(r'(?:FIRST_CATEGORY_CHANCE|NEXT_CHANCE)\s*\(\s*(\w+),\s*ODDS\(([\d.]+)\)', reward_body):
    threshold = round(float(percent) * 100)
    if symbol.startswith('CATEGORY_'):
        reward_categories.append({'category': symbol.removeprefix('CATEGORY_').lower(), 'threshold': threshold})
    else:
        item = item_by_symbol[symbol]
        reward_items.append({'itemId': item['id'], 'category': item['category'], 'threshold': threshold})
area_symbols = re.findall(r'\[(FRIEND_AREA_\w+)\]\s*=\s*\{[^}]*?\.unlock_condition\s*=\s*UNLOCK_WONDER_MAIL', texts['src/dungeon_data.c'])
area_numbers = {symbol: int(number) for symbol, number in re.findall(
    r'^#define (FRIEND_AREA_\w+)\s+(\d+)\s*$', texts['include/constants/friend_area.h'], re.M)}
mail_areas = [area_numbers[symbol] for symbol in area_symbols]
assert mail_areas == [10, 14, 35, 36]
assert 'gFriendAreas[i] = FALSE;' in texts['src/friend_area.c'].split('void InitializeFriendAreas(void)', 1)[1].split('\n}', 1)[0]
facts = {'routes': routes, 'eligibleSeenSpecies': [profiles[i]['speciesId'] for i in sorted(native_candidates)],
         'fallbackClient': profiles[0x10]['speciesId'], 'fallbackTarget': profiles[0x122]['speciesId'],
         'rewardCategories': reward_categories, 'rewardItems': reward_items,
         'unownedNativeMailAreaIds': mail_areas}
header = '\n'.join(' * ' + name + ' SHA-256 ' + hashlib.sha256((source / name).read_bytes()).hexdigest() for name in files)
output = "import { freezeData } from '../../src/domain/state/validate.js';\n\n/** Early ordinary-job facts; Red comparative6bcbec4f, not Blue binary proof.\n" + header + "\n * Static exporter proves no eligible pair/favorite-item substitution in this\n * finite seen pool. Generation still consumes the native subtype sample.\n */\nexport const EARLY_JOB_FACTS = freezeData(" + json.dumps(facts, indent=2) + ");\n"
path = content / 'authored/early-job-facts.js'
if args.check:
    if path.read_text() != output:
        raise SystemExit('Early-job facts differ from pinned source projection.')
else:
    path.write_text(output)
print('Early-job facts: 2 routes / 10 eligible seen identities / 4 reward items; zero pair/favorite substitutions; source/data only.')
