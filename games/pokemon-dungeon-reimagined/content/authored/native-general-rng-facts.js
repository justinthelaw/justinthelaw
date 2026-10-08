/** Parser-only comparative general RNG facts; separate from dungeon RNG. */
export const NATIVE_GENERAL_RANDOM_FACTS = Object.freeze({
  "commit": "6bcbec4f906938c0243aa2026bcbd41b577bab85",
  "qualification": "pinned-red-comparative-not-blue-binary-proof",
  "sourceFiles": [
    {
      "path": "src/random.c",
      "sha256": "40545e44f2a45674cc157b238e7d07a14ff9dcf952f734ee5b916809ac9f2e81",
      "locators": "6\u20139 SeedRng;12\u201323 signed Rand16Bit/Rand32Bit;26\u201340 RandInt/RandRange;43\u201352 state/reseed"
    }
  ],
  "algorithm": "red-general-lcg-v1",
  "multiplier": 1566083941,
  "increment": 1,
  "seedOffset": 54021,
  "seedByteCount": 6,
  "transitionsPerRandom32": 2,
  "signedHalfwords": true,
  "integerScaleBits": 16,
  "equalRangeTransitions": 0,
  "reseedStoresReturnedBits": true
});
