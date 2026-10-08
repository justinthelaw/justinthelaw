"""Pinned text and qualified catalog joins for temporary guest preparation."""
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
files = {
    'src/main.c': '83–85 explicit native six-byte boot seed (prospective use only)',
    'src/code_80958E8.c': '1009–1037 taken2/client species/join74/floor1',
    'src/pokemon.c': '131–169 base stats/level1;932–970 conversion;1254–1278 source-ordered moves',
    'src/pokemon_3.c': '38–52 Hidden Power;465–478 default IQ menu',
    'src/dungeon_misc.c': '185–282 roster conversion before first-free guest/body admission',
    'src/run_dungeon.c': '198–223 selected conversion before guest; held clear',
    'src/moves.c': '136–141 initial PP0;1389–1405 dungeon basePP/ginseng',
    'src/dungeon_data.c': '503 Hidden Power power table',
    'include/constants/type.h': '3–22 actual18 types and Fire fallback',
    'include/constants/dungeon.h': '119–126 guest join/EXP lock',
}
native_pins = {
    'src/main.c': '2b0018020c973b3552285b61a665e45e7a537d309178f86cdd22517a1b08be74',
    'src/code_80958E8.c': '00669bfa30bdd675360b2134063ed1528f63f62e06291a4d331c3a12f46a8c9a',
    'src/pokemon.c': 'ca46804becf408ad3a3a8cad21d7ac16309b2e43fd80bf4945a29951b66aa58b',
    'src/pokemon_3.c': '4198a6531fe283e0a13aba9cb613c7425f778072098647cad8b9d37d3bf2155b',
    'src/dungeon_misc.c': '9f5de68c48737bb3b9aadd0b92a9ae2069a53349383d125174e7b2aeca04d90d',
    'src/run_dungeon.c': '6cc792aa349add7f72cd04694d703c1612cacef8681ef7fae840f392908a5d90',
    'src/moves.c': 'bc1ed7fe1cbdeb2fd294c1329913b158b9c1365538f547f177877968dd345916',
    'src/dungeon_data.c': 'ca56c6807cb1a2918e9fee4bf4f8410fbde21ad52e3bcbfdffaa6d5766af66b4',
    'include/constants/type.h': '9d56a046e511fdc6bb7a9af2af978d7a34aba4cd741ef2d4f7f32ac64ee6ead8',
    'include/constants/dungeon.h': 'dbcc8c729ba4df3b8e9edbb67ef5464a3b59d87ba0293f509f0467ccb2f2f8c7',
}
catalog_pins = {
    'games/pokemon-dungeon-reimagined/content/species/profiles-1.json': '2e0e84f4fd2885171e5ae0583c531020d1dbffb4ded9d74757ccc1589810398f',
    'games/pokemon-dungeon-reimagined/content/species/profiles-2.json': 'a0b6e1adbaf2b2533cfe1ccca1e33d49e14927af14f5093245dcc19b58ce4786',
    'games/pokemon-dungeon-reimagined/content/species/profiles-3.json': '3413404543b449d1d832c516e4e7a4c1f7af3e0902cfe8ba9f239226b838c767',
    'games/pokemon-dungeon-reimagined/content/species/profiles-4.json': '76b98dacda234ada56ae6351bbb9bbf8660297ae17fb5ccb675d3e41809f94d7',
    'games/pokemon-dungeon-reimagined/content/species/profiles-5.json': 'dd2795b0070a7164a2072bd9193ca5a935c1d87c308f8e5e85e17bf21082bb36',
    'games/pokemon-dungeon-reimagined/content/species/levels-1.json': '5c97ac5f806180bb8cdb91770315c37a3b01e423dcf4675bb3f13c7cf79e0309',
    'games/pokemon-dungeon-reimagined/content/species/levels-2.json': 'a956061b6c2fee2509215cc76fad04a84ca8dc5f96dcf53128bc39cd92e71a97',
    'games/pokemon-dungeon-reimagined/content/species/levels-3.json': '83c9827e290fce8ae88a33392e98ebf42c069e1e29c4472f4cb22a0a710caa6a',
    'games/pokemon-dungeon-reimagined/content/species/levels-4.json': '58d38066f53debe603ccb8b6e53adea93bc09735125b6ed510af3f2b78f5c3b8',
    'games/pokemon-dungeon-reimagined/content/species/learnsets.json': 'dae2136c4459b65cc88f238f82df34ccf2b93443cb02e5288d98ff679bcc0c02',
    'games/pokemon-dungeon-reimagined/content/effects/actions-01.json': '57f8523b07576437b3a388259fe820b0270ed2185e5e063ffc9a8353efed4d8d',
    'games/pokemon-dungeon-reimagined/content/effects/actions-02.json': 'e7af139947f43581839a1fe2684b470bff5cf4e6e0a4c7ef472f5a60050946dd',
    'tools/pokemon-dungeon/content/friends/jobs.json': 'c34f32789908d69dc870d5243b0ef9129e99ebcf21b8551232104579df1561e8',
}
def authenticated_text(path, expected):
    data = path.read_bytes()
    actual = hashlib.sha256(data).hexdigest()
    if actual != expected:
        raise SystemExit('Escort entry source pin mismatch: ' + str(path) + ' expected '
                         + expected + ', found ' + actual + '. No artifact written.')
    return data.decode('utf8')

texts = {name: authenticated_text(args.source_root / name, native_pins[name]) for name in files}
catalog_texts = {name: authenticated_text(root / name, expected) for name, expected in catalog_pins.items()}
seed_match = re.search(r'u8 seed\[\] = \{([^}]+)', texts['src/main.c'])
if seed_match is None:
    raise SystemExit('Escort entry source-validation error: src/main.c boot seed missing. No artifact written.')
seed = [int(value.strip(), 0) for value in seed_match[1].split(',')]
assert seed == [0x36, 0x27, 0x46, 0x01, 0xb9, 0x48]
power_text = re.search(r'gUnknown_810AC90\[10\] = \{([^}]+)', texts['src/dungeon_data.c'])[1]
powers = [int(value.strip(), 0) for value in power_text.split(',')]
type_count = int(re.search(r'#define NUM_TYPES (\w+)', texts['include/constants/type.h'])[1], 0)
fire = int(re.search(r'#define TYPE_FIRE (\w+)', texts['include/constants/type.h'])[1], 0)
assert powers == [2, 4, 6, 7, 8, 9, 10, 13, 15, 17] and type_count == 18 and fire == 2
for path, expected in {
    'src/pokemon_3.c': ['RandInt(10)', 'RandInt(NUM_TYPES)', 'i < 100', 'TYPE_FIRE'],
    'src/dungeon_misc.c': ['totalBodySize >= 7', 'PokemonToDungeonMon(monPtr,pokemon,0x55aa)', 'monPtr->IQ = 0x1a;', 'ZeroOutItem(&monPtr->itemSlot);'],
    'src/pokemon.c': ['pokemon->level = 1;', 'pokemon->currExp = 0;', 'pokemon->IQ = 1;', 'GetMovesLearnedAtLevel(buffer, species, 1, 999)'],
    'src/moves.c': ['destMoves->moves[i].PP = sMovesData[srcMoves[i].id].basePP;', 'destMoves->moves[i].ginseng = srcMoves[i].PP;'],
}.items():
    for exact in expected:
        assert exact in texts[path], (path, exact)

catalog_paths = sorted((content / 'species').glob('profiles-*.json')) + sorted((content / 'species').glob('levels-*.json')) + [content / 'species/learnsets.json'] + sorted((content / 'effects').glob('actions-*.json'))
def records(pattern):
    return [row for path in content.glob(pattern) for row in json.loads(catalog_texts[path.relative_to(root).as_posix()])['records']]
profiles = {row['internalId']: row for row in records('species/profiles-*.json')}
levels = {row['id']: row for row in records('species/levels-*.json')}
learnsets = {row['id']: row for row in records('species/learnsets.json')}
actions = {row['internalId']: row for row in records('effects/actions-*.json')}
clients = []
eligible_path = root / 'tools/pokemon-dungeon/content/friends/jobs.json'
assert {path.relative_to(root).as_posix() for path in catalog_paths + [eligible_path]} == set(catalog_pins)
for qualified in json.loads(catalog_texts[eligible_path.relative_to(root).as_posix()])['eligibleSeenCandidates']:
    profile = profiles[qualified['native']]
    level = levels[profile['levelResourceId']]
    stats = [base + gain for base, gain in zip(level['baseStats'], level['rows'][0][1:])]
    assert level['rows'][0] == [0, 0, 0, 0, 0, 0], 'Level1 guest base stats have no additional growth.'
    moves = [move for at_level, move in learnsets[profile['learnsetResourceId']]['levelUp'] if at_level == 1]
    assert 1 <= len(moves) <= 4, 'Current finite clients need no absent Item Toss profile or source overflow.'
    clients.append({'speciesId': profile['speciesId'], 'formId': profile['formId'], 'nativeSpeciesId': profile['internalId'],
                    'bodySize': profile['bodySize'],
                    'stats': dict(zip(['hp', 'attack', 'specialAttack', 'defense', 'specialDefense'], stats)),
                    'moves': [{'nativeMoveId': move, 'moveId': actions[move]['moveId'], 'basePp': actions[move]['numeric']['pp']} for move in moves],
                    'evidence': {'stats': profile['evidence']['stats'], 'learnset': profile['evidence']['learnset'], 'movePp': 'red-comparative-with-blue-metadata'}})
assert len(clients) == 19 and all(row['bodySize'] == 1 for row in clients)
facts = {
    'commit': '6bcbec4f906938c0243aa2026bcbd41b577bab85',
    'qualification': 'pinned-red-comparative-not-blue-binary-proof',
    'sourceFiles': [{'path': path, 'sha256': native_pins[path], 'locators': locators} for path, locators in files.items()],
    'catalogFiles': [{'path': path, 'sha256': expected} for path, expected in catalog_pins.items()],
    'prospectiveSeedBytes': seed,
    'hiddenPowerPowers': powers, 'typeCount': type_count, 'hiddenPowerTypeAttempts': 100, 'fallbackType': fire,
    'joinLocation': 74, 'joinFloor': 1, 'temporaryRecruitedId': 0x55aa, 'minimumDungeonIq': 26,
    'maxTeamSlots': 4, 'maximumBodySize': 6, 'clients': clients,
}
output = ("import { freezeData } from '../../src/domain/state/validate.js';\n"
          "/** Parser-only comparative guest entry facts, with qualified Blue/catalog joins. */\n"
          "export const ESCORT_ENTRY_FACTS = freezeData(" + json.dumps(facts, indent=2) + ");\n")
path = content / 'authored/escort-entry-facts.js'
if args.check:
    if path.read_text() != output:
        raise SystemExit('Escort entry facts differ from pinned text/catalog projection.')
else:
    path.write_text(output)
print('Escort entry facts:19 actual client base-stat/level1 source-ordered move/PP joins; Hidden Power general draws; real four-slot/body6 admission. Text/data only.')
