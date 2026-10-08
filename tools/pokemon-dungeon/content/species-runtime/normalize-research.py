"""Normalize factual research caches; never import or execute game code.

Optional re-authoring tool: python normalize-research.py /path/to/research-cache.
The normal export/check chain uses only the checked-in normalized records.
"""
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
CACHE = Path(sys.argv[1])
CONTENT = ROOT.parent

def read(name):
    return json.loads((CACHE / name).read_text())

def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))

def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()

def write(name, value):
    text = json.dumps(value, ensure_ascii=False, indent=2)
    # Keep a single numeric row on one line, while preserving resource structure.
    text = re.sub(r'\[\s+(-?\d+(?:,\s+-?\d+)*)\s+\]', lambda m: '[' + re.sub(r'\s+', ' ', m[1]) + ']', text)
    (ROOT / name).write_text(text + '\n')

def norm(value):
    return re.sub('[^a-z0-9]', '', value.lower())

def constants(filename, prefix):
    return {s: int(n, 0) for s, n in re.findall(r'#define\s+(' + prefix + r'\w+)\s+(0x[0-9a-fA-F]+|\d+)\b', (CACHE / filename).read_text())}

species = json.loads((CONTENT / 'species.json').read_text())['records']
forms = json.loads((CONTENT / 'forms.json').read_text())['records']
systems = json.loads((CONTENT / 'systems.json').read_text())['records']
by_kind = {kind: {norm(r['name']): r for r in systems if r['recordKind'] == kind} for kind in ['move', 'ability', 'friend-area']}
blue = read('blue-pokemons.json')
blue_moves = {r['id']: r for r in read('blue-moves.json') if 'id' in r}
blue_learn = {r['pokemon_id']: r for r in read('blue-pokemon-moves.json')}
red_learn = read('species-learnset-data.json')
red = read('red-monster-data.json')
levels = read('rescue-team-level-profiles.json')
level_by_id = {r['identity']['internalId']: r for r in levels['profiles']}
red_levels = {r['redInternalId']: r for r in read('red-level-exp-decoded.json')['tables']}
crosswalk = read('rescue-team-profile-crosswalk.json')
types = constants('species-type.h', 'TYPE_')
abilities = constants('species-ability.h', 'ABILITY_')
areas = constants('red-friend-area-constants.h', 'FRIEND_AREA_')
move_ids = constants('effect-move_id.h', 'MOVE_')
source_commit = '6bcbec4f906938c0243aa2026bcbd41b577bab85'
blue_commit = 'f8890eb4ae9867c380381b3b95349092076fa4a6'
red_url = f'https://github.com/pret/pmd-red/blob/{source_commit}/'
blue_url = f'https://github.com/diegogliarte/tools.diegogliarte.com/tree/{blue_commit}/src/lib/data/pmd-blue/'
upc_url = 'https://upcarchive.playker.info/0/upokecenter/'
source_specs = [
    ('blue-species', blue_url, 'blue-pokemons.json', 'Blue-reported researcher stats/growth and ability identities; no identified binary'),
    ('blue-learning', blue_url, 'blue-pokemon-moves.json', 'Blue-reported researcher learning resources; exact pinned Red table agreement'),
    ('blue-moves', blue_url, 'blue-moves.json', 'Original move indices and English names'),
    ('red-monsters', red_url + 'data/monster/monster_data.json', 'red-monster-data.json', 'Red comparative monster numerical facts and identities'),
    ('red-levels', red_url + 'data/system_sbin.s', 'red-system-sbin.s', 'Red comparative numerical level maps; independently decoded'),
    ('red-learning', red_url + 'data/monster/learnset/learnset_data.json', 'species-learnset-data.json', 'Red comparative level-up and HMTMMoves compatibility lists'),
    ('red-move-ids', red_url + 'include/constants/move_id.h', 'effect-move_id.h', 'Red original move index constants'),
    ('red-monster-ids', red_url + 'include/constants/monster.h', 'species-monster.h', 'Original internal identity constants; Castform 377 snowy, 378 sunny, 379 rainy'),
    ('red-types', red_url + 'include/constants/type.h', 'species-type.h', 'Red original type index constants'),
    ('red-abilities', red_url + 'include/constants/ability.h', 'species-ability.h', 'Red original ability index constants'),
    ('red-areas', red_url + 'include/constants/friend_area.h', 'red-friend-area-constants.h', 'Red original Friend Area index constants'),
    ('red-learning-access', red_url + 'src/moves.c', 'effect-moves.c', 'GetLevelUpMoves and GetHMTMMoves resource semantics; source read only'),
    ('red-learning-consumer', red_url + 'src/pokemon.c', 'red-pokemon.c', 'CanMonLearnMove union and separate level/IQ gating; source read only'),
    ('upc-levels', upc_url + 'games/dungeon/guides/stats.php.html', 'upc-level-exp-corpus.json', '256 shared-original researcher numerical tables; hashes are normalized data, not raw HTML'),
    ('upc-body', upc_url + 'content/pokemon-mystery-dungeon-various-notes.html#body-size', None, 'Shared-original body sizes; independent report comparison to Red'),
    ('upc-areas', upc_url + 'content/pokemon-mystery-dungeon-friend-areas.html', None, '57 shared-original areas and memberships; Slaking correction'),
    ('upc-recruit', upc_url + 'content/pokemon-mystery-dungeon-recruiting.html', None, 'Shared-original raw base rates in tenths of percent; Sentret correction'),
]
sources = []
for sid, url, filename, scope in source_specs:
    entry = {'id': sid, 'url': url, 'scope': scope}
    if filename:
        payload = (CACHE / filename).read_bytes()
        entry['artifact'] = {'filename': filename, 'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)}
    sources.append(entry)

profiles, level_resources, learn_resources = [], {}, {}
move_records, ability_records, type_records, area_records = {}, {}, {}, {}
for identity in crosswalk['profiles']:
    internal = identity['internalId']
    dex = identity['nationalDexId']
    species_id = f'pokemon-{dex:03}'
    raw_form = identity['form']
    form = None
    if dex == 201:
        form = 'unown-' + {'!': 'exclamation', '?': 'question'}.get(raw_form, raw_form.lower())
    elif dex in [351, 386]:
        form = ('castform-' if dex == 351 else 'deoxys-') + {'hail': 'snowy', 'sun': 'sunny', 'rain': 'rainy'}.get(raw_form, raw_form)
    assert form is None or any(r['id'] == form and r['speciesId'] == species_id for r in forms)
    profile_id = form or species_id
    row = red[internal]
    persistent = internal in level_by_id
    raw_levels = level_by_id.get(internal)
    red_level = red_levels[internal]
    if persistent:
        base = [raw_levels['baseStats'][k] for k in levels['statKeyOrder']]
        gains = [[raw_levels['statGrowth'][k][i] for k in levels['statKeyOrder']] for i in range(100)]
        exp = raw_levels['cumulativeExp']
        exp_evidence = raw_levels['provenance']['exp']
    else:
        base = red_level['rows'][0][1:6]
        gains = red_level['statGains']
        exp = [r[-1] for r in red_level['rows']]
        exp_evidence = 'red-comparative-only'
    values = {'baseStats': base, 'rows': [[exp[i], *gains[i]] for i in range(100)]}
    level_hash = digest(values)
    level_id = 'level-' + level_hash
    level_resources[level_id] = {'id': level_id, **values}
    learn = blue_learn[internal]
    comparative = red_learn[internal - 1]
    assert learn['levelup_moves'] == [{'move_id': move_ids[m['move']], 'level': m['level']} for m in comparative['levelUpMoves']]
    assert learn['aux_moves'] == [move_ids[m] for m in comparative['HMTMMoves']]
    used_moves = [m['move_id'] for m in learn['levelup_moves']] + learn['aux_moves']
    for mid in used_moves:
        canonical_move = by_kind['move'][norm(blue_moves[mid]['name'])]
        move_records[mid] = {'originalId': mid, 'id': canonical_move['id'], 'name': canonical_move['name']}
    learning = {'levelUp': [[m['level'], m['move_id']] for m in learn['levelup_moves']], 'auxiliary': learn['aux_moves']}
    learn_id = 'learn-' + digest(learning)
    learn_resources[learn_id] = {'id': learn_id, **learning}
    type_numbers = []
    for symbol in row['types']:
        number = types[symbol]
        type_records[number] = {'originalId': number, 'name': symbol.removeprefix('TYPE_').title()}
        type_numbers.append(number)
    ability_numbers = []
    for symbol in row['abilities']:
        number = abilities[symbol]
        canonical_ability = by_kind['ability'][norm(symbol.removeprefix('ABILITY_'))]
        ability_records[number] = {'originalId': number, 'id': canonical_ability['id'], 'name': canonical_ability['name']}
        ability_numbers.append(number)
    ability_numbers += [None] * (2 - len(ability_numbers))
    if persistent:
        brow = blue[identity['blueRowIndex']]
        assert [brow['ability_1_id'], brow['ability_2_id']] == ability_numbers
    area_symbol = row['friendArea']
    area_name_key = norm(area_symbol.removeprefix('FRIEND_AREA_'))
    if area_symbol == 'FRIEND_AREA_AGED_CHAMBER_O_EXCLAIM':
        area_name_key = norm('Aged Chamber O?')
    canonical_area = by_kind['friend-area'][area_name_key]
    area_number = areas[area_symbol]
    area_records[area_number] = {'originalId': area_number, 'id': canonical_area['id'], 'name': canonical_area['name'], 'sourceSymbol': area_symbol}
    profiles.append({
        'id': profile_id, 'speciesId': species_id, 'formId': form,
        'persistence': 'persistent' if persistent else 'temporary',
        'internalId': internal,
        'resources': {'blueGrowthResourceId': identity['blueSharedResourceId'], 'redGrowthResourceId': internal, 'blueLearnsetResourceId': internal, 'redLearnsetResourceId': internal},
        'levelResourceId': level_id, 'learnsetResourceId': learn_id,
        'typeIds': type_numbers, 'abilityIds': ability_numbers,
        'bodySize': row['bodySize'], 'baseMovementSpeed': row['movementSpeed'], 'regenerationRate': row['regenSpeed'], 'experienceYield': row['expYield'],
        'friendAreaId': canonical_area['id'], 'recruitment': {'baseRateTenthsPercent': row['recruitRate'], 'eligibility': None, 'scriptedAcquisition': None},
        'evidence': {'identity': 'crosswalk', 'stats': 'blue-red-stats' if persistent else 'red-only-levels', 'experience': exp_evidence, 'types': 'red-only-metadata', 'abilities': 'blue-red-abilities' if persistent else 'red-only-metadata', 'bodySize': 'shared-body' if persistent else 'red-only-metadata', 'friendArea': 'shared-area' if persistent else 'red-only-metadata', 'recruitment': 'shared-recruit' if persistent else 'red-only-metadata', 'mechanicalValues': 'red-only-metadata', 'learnset': 'blue-red-learning'},
        'levelEvidence': {'redResource': red_level['resourceName'], 'redNumericTableSha256': red_level['numericTableSha256'], 'redDecodedPayloadSha256': red_level['decodedPayloadSha256'], 'upcUrl': raw_levels['provenance']['upcUrl'] if persistent else None, 'upcNumericTableSha256': raw_levels['provenance']['upcNumericTableSha256'] if persistent else None},
    })

assert len(profiles) == 419
roster = []
for row in species:
    if row['recordKind'] != 'species':
        continue
    matching = [p for p in profiles if p['speciesId'] == row['id']]
    default = next((p['id'] for p in matching if p['formId'] is None or p['formId'].endswith('-normal')), None)
    roster.append({'id': row['id'], 'dexNo': row['dexNo'], 'name': row['name'], 'profileIds': [p['id'] for p in matching], 'defaultProfileId': default})
assert len(roster) == 386
header = {'schemaVersion': 1, 'catalogId': 'original-blue-species-profiles', 'edition': 'blue-rescue-team-qualified-facts'}
def document(kind, records):
    return {**header, 'kind': kind, 'records': records}
write('species.json', document('species', roster))
for i in range(5):
    write(f'profiles-{i+1}.json', document('profiles', profiles[i*100:(i+1)*100]))
for i in range(4):
    write(f'levels-{i+1}.json', document('levels', list(level_resources.values())[i*100:(i+1)*100]))
write('learnsets.json', document('learnsets', list(learn_resources.values())))
write('identities.json', {**header, 'kind': 'identities', 'moves': list(move_records.values()), 'abilities': list(ability_records.values()), 'types': list(type_records.values()), 'friendAreas': list(area_records.values())})
evidence = {
    'crosswalk': {'qualification': 'Red comparative internal indices; Blue-reported persistent identity matched by dex/name; Unown explicitly crosswalked', 'sourceIds': ['blue-species', 'red-monsters', 'red-monster-ids']},
    'blue-red-stats': {'qualification': 'Blue-reported base/growth; all 413 profiles agree with pinned Red', 'sourceIds': ['blue-species', 'red-monsters', 'red-levels']},
    'red-only-levels': {'qualification': 'Red comparative temporary form base/growth only', 'sourceIds': ['red-monsters', 'red-levels']},
    'upc-shared-original-corroborated-red': {'qualification': 'Shared-original UPC table agrees with pinned Red EXP', 'sourceIds': ['upc-levels', 'red-levels']},
    'red-comparative-only': {'qualification': 'Pinned Red EXP; UPC table not retrieved; no specific Blue binary verification', 'sourceIds': ['red-levels']},
    'red-only-metadata': {'qualification': 'Pinned Red comparative numeric/identity metadata only', 'sourceIds': ['red-monsters', 'red-types', 'red-abilities', 'red-areas']},
    'blue-red-abilities': {'qualification': 'Both Blue-reported ability slots agree with Red', 'sourceIds': ['blue-species', 'red-monsters', 'red-abilities']},
    'shared-body': {'qualification': 'Shared-original UPC body-size facts agree with Red', 'sourceIds': ['upc-body', 'red-monsters']},
    'shared-area': {'qualification': 'Shared-original UPC memberships and Red; corrected Slaking/Raticate annotations', 'sourceIds': ['upc-areas', 'red-areas', 'red-monsters']},
    'shared-recruit': {'qualification': 'Shared-original raw base values and Red; corrected Sentret; eligibility and autojoin not represented by rates', 'sourceIds': ['upc-recruit', 'red-monsters']},
    'blue-red-learning': {'qualification': 'All 419 Blue-reported level-up/auxiliary tables agree with Red; auxiliary is HMTMMoves compatibility, not machine availability', 'sourceIds': ['blue-learning', 'blue-moves', 'red-learning', 'red-learning-access', 'red-learning-consumer', 'red-move-ids']},
}
write('sources.json', {**header, 'kind': 'sources', 'createdAt': '2026-10-05', 'sources': sources, 'evidence': evidence, 'blueBinaryBuildVerified': False, 'statOrder': ['hp', 'attack', 'specialAttack', 'defense', 'specialDefense'], 'levelRowOrder': ['cumulativeExp', 'hp', 'attack', 'specialAttack', 'defense', 'specialDefense'], 'levelIndexing': 'Index 0 is level 1; rows store growth increments, not cumulative stats; EXP is cumulative.', 'learnsetInterpretation': 'Raw ordered level-up records and HMTMMoves compatibility. Repeated levels retained. Does not authorize learning without level/IQ/form/state/availability rules.', 'capabilities': {'numericProfileLookup': True, 'rawLearnsetLookup': True, 'metadataLookup': True, 'gameplayRules': []}, 'excluded': [{'internalId': 420, 'identity': 'Munchlax', 'reason': 'NPC-only; unused Munchlax to Snorlax evolution excluded'}, {'internalId': 421, 'identity': 'Decoy', 'reason': 'Special internal record'}, {'internalId': 422, 'identity': 'Statue', 'reason': 'Special internal record'}, {'internalId': 423, 'identity': 'Rayquaza duplicate', 'reason': 'Duplicate internal record'}], 'reconciliation': levels['summary'], 'researchArtifacts': read('level-research-manifest.json')['artifacts'], 'distribution': 'Independently structured numerical facts and identity/source references only. Public accessibility is not distribution permission for source prose, code, art or commercial content; none is reproduced here.'})
print(f'Normalized {len(roster)} species, {len(profiles)} profiles, {len(level_resources)} complete numeric resources, {len(learn_resources)} learnsets.')
