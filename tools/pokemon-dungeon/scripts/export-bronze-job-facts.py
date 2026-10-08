"""Project Bronze rewards/pairs/areas from exact pinned text, never game code."""
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
files = {'src/dungeon_info.c': '704–773;2763–2782',
         'src/code_803C1B4.c': '12–139;205–238',
         'src/code_80958E8.c': '175–405;574–645;947–974',
         'src/data/pokemon_mail_pre.h': '3–20;98–106',
         'src/dungeon_data.c': 'Wonder Mail area unlock rows',
         'include/constants/friend_area.h': '10,14,35,36 identity constants',
         'include/constants/monster.h': 'six pair identities',
         'src/mission_reward.c': '192–338',
         'src/thank_you_messages.c': '55–81;135–179 client/target thanks and exclusive unlock',
         'src/exclusive_pokemon.c': '24–32 Red initializer;136–147 exclusive identity unlock',
         'include/exclusive_pokemon.h': '35–41 Blue default availability macro',
         'src/script_vars_info.c': '77 EVENT_B01P01 distinct16-bit array',
         'include/items.h': '12 inclusive threshold contract'}
texts = {name: (source / name).read_text() for name in files}

def records(folder, pattern):
    return [row for path in (content / folder).glob(pattern)
            for row in json.loads(path.read_text())['records']]

def block(text, name):
    match = re.search(r'\b' + name + r'\[[^;=]+?=\s*\{(.*?)\n\};', text, re.S)
    if not match:
        raise ValueError('Missing source table: ' + name)
    return match[1]

items = {symbol: row for row in records('effects', 'items-*.json') for symbol in row['symbols']}
moves = {row['internalId']: row['id'] for row in records('effects', 'moves-*.json')}
categories, rewards = [], []
for symbol, percent in re.findall(r'(?:FIRST_CATEGORY_CHANCE|NEXT_CHANCE)\s*\(\s*(\w+),\s*ODDS\(([\d.]+)\)', block(texts['src/dungeon_info.c'], 'sRandomItemsSet3')):
    threshold = round(float(percent) * 100)
    if symbol.startswith('CATEGORY_'):
        categories.append({'category': symbol.removeprefix('CATEGORY_').lower(), 'threshold': threshold})
    else:
        item = items[symbol]
        teaching = next((effect for effect in item['useEffects'] if effect['op'] == 'teach-move'), None)
        payload = {'kind': 'machine', 'state': 'unused', 'moveId': moves[teaching['moveId']]} if teaching else {'kind': 'none'}
        rewards.append({'itemId': item['id'], 'category': item['category'], 'threshold': threshold, 'payload': payload})
assert 'ITEM_WEAVILE_FIG' not in block(texts['src/dungeon_info.c'], 'sRandomItemsSet1')
assert 'ITEM_MIME_JR_FIG' not in block(texts['src/dungeon_info.c'], 'sRandomItemsSet1')
assert not any(row['itemId'] in ['item-weavile-fig', 'item-mime-jr-fig'] for row in rewards)
assert len(rewards) == 45 and len({row['itemId'] for row in rewards}) == 45
assert [row['threshold'] for row in categories] == [800, 3200, 8000, 9200, 10000]
monsters = {symbol: int(number) for symbol, number in re.findall(r'^#define (MONSTER_\w+) (\d+)\s*$', texts['include/constants/monster.h'], re.M)}
profiles = {row['internalId']: row for row in records('species', 'profiles-*.json')}
pairs = [[profiles[monsters[a]]['speciesId'], profiles[monsters[b]]['speciesId']] for a, b in re.findall(r'\{\s*(MONSTER_\w+),\s*(MONSTER_\w+)', block(texts['src/data/pokemon_mail_pre.h'], 'gUnknown_80E8168'))]
qualified = [row['speciesId'] for row in json.loads((root / 'tools/pokemon-dungeon/content/friends/jobs.json').read_text())['eligibleSeenCandidates']]
exclusive = {monsters[symbol] for symbol in re.findall(r'MONSTER_\w+', block(texts['src/dungeon_data.c'], 'gExclusivePokemon'))}
qualified_native = {row['native'] for row in json.loads((root / 'tools/pokemon-dungeon/content/friends/jobs.json').read_text())['eligibleSeenCandidates']}
exclusive_qualified = exclusive.intersection(qualified_native | {0x10, 0x122})
blue_available = {monsters[symbol] for symbol in re.findall(r'BLUE_EXCLUSIVE\((MONSTER_\w+)\)', block(texts['src/dungeon_data.c'], 'gExclusivePokemon'))}
blue_macro = texts['include/exclusive_pokemon.h'].split('#define BLUE_EXCLUSIVE(species)', 1)[1].split('extern ', 1)[0]
assert '.in_rrt = FALSE' in blue_macro and '.in_brt = TRUE' in blue_macro
assert exclusive_qualified == {monsters['MONSTER_MINUN']} and exclusive_qualified <= blue_available
exclusive_rows = [{'speciesId': profiles[i]['speciesId'], 'alreadyBlueAvailable': True} for i in sorted(exclusive_qualified)]
assert len(pairs) == 6 and not any(a in qualified and b in qualified for a, b in pairs)
area_numbers = {symbol: int(number) for symbol, number in re.findall(r'^#define (FRIEND_AREA_\w+)\s+(\d+)\s*$', texts['include/constants/friend_area.h'], re.M)}
area_symbols = re.findall(r'\[(FRIEND_AREA_\w+)\]\s*=\s*\{[^}]*?\.unlock_condition\s*=\s*UNLOCK_WONDER_MAIL', texts['src/dungeon_data.c'])
areas = json.loads((root / 'tools/pokemon-dungeon/content/friends/areas.json').read_text())['records']
mail_areas = [next(row for row in areas if row['nativeId'] == area_numbers[symbol]) for symbol in area_symbols]
assert [row['nativeId'] for row in mail_areas] == [10, 14, 35, 36]
assert mail_areas[-1]['id'] == 'friend-area-boulder-cave'
points = [int(value) for value in re.findall(r'\b\d+\b', block(texts['src/data/pokemon_mail_pre.h'], 'gUnknown_80E80A0'))]
assert points[1] == 5 and points[3] == 20
facts = {'commit': '6bcbec4f906938c0243aa2026bcbd41b577bab85', 'qualification': 'pinned-red-comparative-not-blue-binary-proof',
         'sourceFiles': [{'path': name, 'sha256': hashlib.sha256((source / name).read_bytes()).hexdigest(), 'locators': locators} for name, locators in files.items()],
         'difficulty': 3, 'rankIndex': 1, 'rankPoints': points[3], 'rewardCategories': categories, 'rewardItems': rewards,
         'escortPairs': pairs, 'eligiblePairCount': 0, 'eligibleExclusiveSpecies': exclusive_rows, 'mailAreas': [{key: row[key] for key in ['nativeId', 'id', 'capacity']} for row in mail_areas]}
output = "import { freezeData } from '../../src/domain/state/validate.js';\n/** Parser-only pinned Bronze facts; no native assets or executable source. */\nexport const BRONZE_JOB_FACTS = freezeData(" + json.dumps(facts, indent=2) + ");\n"
path = content / 'authored/bronze-job-facts.js'
if args.check:
    if path.read_text() != output:
        raise SystemExit('Bronze-job facts differ from pinned source projection.')
else:
    path.write_text(output)
print('Bronze facts: ordered Set3 /45 identities /20 TM payloads /6 pairs with zero eligible /4 Wonder Mail areas including Boulder36; text/data only.')
