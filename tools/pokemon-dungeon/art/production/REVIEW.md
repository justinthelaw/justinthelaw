# Starter wave visual review

**Implemented art candidates; human acceptance remains open.** The 16 species
have dedicated anatomy sources, eight authored views and twelve four-frame
clips. This review records direct image inspection, not acceptance inferred
from static checks or asset counts.

## Inspection performed

All sixteen `evidence/<species>-directions.png` strips were viewed together at
native 96-pixel cells. Every front, side, back and diagonal silhouette was
compared for anatomy, face visibility, appendage continuity and ground contact.
All sixteen `evidence/<species>-clips.png` sheets were inspected at native cell
size: twelve rows in contract clip order, four temporal columns, front-right
view. Full pages retain the other seven animated views for interactive review.
Representative actual 3D captures were then checked at close inspection and
ordinary three-character composition scale, including the 390×844 frame.

| Species | Observed distinguishing anatomy and motion |
| --- | --- |
| Bulbasaur | Four squat legs, broad frog muzzle, blue-green spots, red eyes, raised green bulb with rear seam; diagonal leg pairing and low headbutt/collapse |
| Charmander | Rounded muzzle, cream belly, separate toes and tapered attached flame tail; arm contact, tail/flame variation, tucked rest |
| Squirtle | Brown rear shell, pale rim, front belly divisions and curled tail; distinct shell front/back, arm extension and crouch |
| Chikorita | Pear body with four feet, neck buds, large rear-curved leaf and red eyes; head/leaf lead, forepaw greeting and lowered rest |
| Cyndaquil | Teal arched back, long cream muzzle, narrow eyes and dorsal flame quills; four-limb gait, back quill changes and extinguished sleeping quills |
| Totodile | Projecting jaw, small teeth, yellow chest marking and red back spikes; jaw lunge and heavy low recoil |
| Treecko | Broad gecko head, yellow slit eyes, red belly and twin tail lobes; thin gripping limbs, tail balance and arm projection |
| Torchic | Orange chick volume, head tuft, small yellow wings/beak and separate bird toes; alternating bird steps and wing-raised hop |
| Mudkip | Four feet, large upright fin, orange gills and pale broad tail fin; amphibian lunge/forepaw lift and lowered sleep |
| Pikachu | Dark ear tips, cheek discs, broad angular tail and two back stripes; paw reach, ear/tail changes and raised-arm hop |
| Meowth | Forehead coin, dark ear backs, three whiskers per side and brown curl tail; slim arms, greeting and tucked posture |
| Psyduck | Broad bill, three dark hairs, large white eyes and webbed feet; arm-to-head recoil, duck steps, closed sleeping lids |
| Machop | Three head ridges, broad shoulder/upper-arm masses and rib lines; heavier fist extension, brace and collapse |
| Cubone | Ivory skull, two horns, sockets, projecting snout and separately held bone; wrist/club swing changes with contact |
| Eevee | Four paws, broad cream ruff, dark-inner long ears and cream tail tip; quadruped gait, lowered head/ears for rest |
| Skitty | Pink feline body, cream face, curved eyes, thin tail ending in bulb/three knobs; paw greeting and low tucked sleep |

## Defects corrected during direct review

- Profile eyes initially sat too far toward the nose. Surface projection now
  places each visible eye on its side plane; the far eye is culled.
- Treecko/Psyduck eye bases initially floated past profile silhouettes. Their
  bases and pupils now share the same surface and closed-lid positions.
- Repeated dark limb-tip outlines initially read as disconnected mechanical
  joints. Limb strokes now join flattened paw shapes without internal rings.
- High ear/hop combinations and low collapse/tail strokes initially breached
  cell gutters. Authored ear limits, low-volume posture and paw stroke ends
  were corrected; every exported cell passes the two-pixel boundary audit.
- The Chikorita leaf stalk was hidden by depth sorting. Its attachment is now
  visible above the forehead. Bulbasaur gained a dark rear bulb seam.
- Quadrupeds now extend the front contact paw during physical actions and lift
  a forepaw in greetings/casts; Cubone's club changes angle with its wrist.
- Inspection found the shared low-volume clamp lifting paw ellipses. It now
  applies only to body/head/tail volumes; feet retain their grounded endpoints.

## Remaining review limits

The stylized outlines, limb joins, four-frame timing and anatomy still need
human art approval. Some fine whiskers, claws, shell lines and ridges become
small at distant scene scale. Diagonal/side facial features are readable in
inspection; no claim is made that every tiny feature survives the farthest
composition character. The sleeping holds deliberately differ mainly in
breathing. Long-form fluid animation and species-specific move effects are not
part of this compact clip vocabulary.

Characters use authored unlit palette ramps and simple ground contact ellipses;
the real 3D cavern is textured and lit. This is not dynamic character relighting,
a completed campaign biome or a physical shadow system. Camera/ground contact
and final texel scale need review in actual P10/P19 gameplay. Browser captures
use Chromium/SwiftShader held poses, not measured frame pacing or a physical
phone. 390×844 verifies framing and control layout only.

No portraits, evolution lines, NPCs, remaining species/forms, game renderer,
runtime cache, onboarding or playable campaign is completed by this wave.
