"""Parse the pinned comparative RNG text; never execute native/game code."""
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
source_path = args.source_root / 'src/random.c'
expected_sha256 = '40545e44f2a45674cc157b238e7d07a14ff9dcf952f734ee5b916809ac9f2e81'
source_bytes = source_path.read_bytes()
actual_sha256 = hashlib.sha256(source_bytes).hexdigest()
if actual_sha256 != expected_sha256:
    raise SystemExit('Native general RNG source pin mismatch: src/random.c expected '
                     + expected_sha256 + ', found ' + actual_sha256 + '. No artifact written.')
source = source_bytes.decode('utf8')

def required_number(pattern, label):
    match = re.search(pattern, source)
    if match is None:
        raise SystemExit('Native general RNG source-validation error: src/random.c missing '
                         + label + '. No artifact written.')
    return int(match[1])

multiplier = required_number(r'sPRNGState = \((\d+) \* sPRNGState\) \+ 1;', 'LCG multiplier')
seed_offset = required_number(r'sPRNGState = (\d+) \+ \(seed\[0\]', 'six-byte seed offset')
assert multiplier == 1566083941 and seed_offset == 54021
for exact in ['static s16 Rand16Bit(void)', 'return sPRNGState >> 16;',
              's32 a = Rand16Bit();', 's32 b = Rand16Bit();',
              'return (a << 16) | b;',
              'return (((Rand32Bit() & 0xFFFF) * maxExclusive) >> 16) & 0xFFFF;',
              'if (minInclusive == maxExclusive)', 'sPRNGState = Rand32Bit();']:
    assert exact in source, exact
facts = {
    'commit': '6bcbec4f906938c0243aa2026bcbd41b577bab85',
    'qualification': 'pinned-red-comparative-not-blue-binary-proof',
    'sourceFiles': [{'path': 'src/random.c',
                     'sha256': actual_sha256,
                     'locators': '6–9 SeedRng;12–23 signed Rand16Bit/Rand32Bit;26–40 RandInt/RandRange;43–52 state/reseed'}],
    'algorithm': 'red-general-lcg-v1',
    'multiplier': multiplier,
    'increment': 1,
    'seedOffset': seed_offset,
    'seedByteCount': 6,
    'transitionsPerRandom32': 2,
    'signedHalfwords': True,
    'integerScaleBits': 16,
    'equalRangeTransitions': 0,
    'reseedStoresReturnedBits': True,
}
output = ("/** Parser-only comparative general RNG facts; separate from dungeon RNG. */\n"
          "export const NATIVE_GENERAL_RANDOM_FACTS = Object.freeze(" + json.dumps(facts, indent=2) + ");\n")
path = root / 'games/pokemon-dungeon-reimagined/content/authored/native-general-rng-facts.js'
if args.check:
    if path.read_text() != output:
        raise SystemExit('Native general RNG facts differ from pinned text projection.')
else:
    path.write_text(output)
print('Native general RNG: two signed halfwords, low16 scaling, equal-range no draw and reseed result overwrite; text/data only.')
