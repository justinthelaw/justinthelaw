# Environment kit manifest v1

Original production art candidates for full-campaign biome coverage. Kits and
explicit identity assignments are not accepted scene maps or gameplay evidence.
The older `art/environment/magma-cavern.mjs` proof remains unchanged.

Runtime base: `games/pokemon-dungeon-reimagined/assets/environment/production/`.
All `texturePath` and texture record `path` values resolve relative to that base.

```ts
interface EnvironmentManifest {
  schemaVersion: 1;
  profile: 'environment-kits-v1';
  kits: EnvironmentKit[];
  textures: TextureRecord[];
  variants: EnvironmentVariant[];
  bindings: {
    dungeons: Record<string, Binding>;
    sections: Record<string, Binding>;
    friendAreas: Record<string, Binding>;
    locations: Record<string, Binding>;
  };
}
interface Binding { kitId: string; variantId: string }
interface EnvironmentKit {
  id: string;
  name: string;
  materials: {
    id: string; color: string; texturePath?: string; roughness: number;
    emissive?: string; emissiveIntensity?: number;
  }[];
  props: {
    id: string;
    parts: {
      shape: 'box' | 'cylinder' | 'cone' | 'sphere';
      size: [number, number, number];
      position: [number, number, number];
      rotation: [number, number, number];
      materialId: string;
      segments?: number;
    }[];
  }[];
  terrain: { floor: string; wall: string; water: string; lava: string };
  wallHeight: number;
  floorRepeat: [number, number];
  lighting: {
    background: string;
    fog: { color: string; near: number; far: number };
    ambient: { sky: string; ground: string; intensity: number };
    key: { color: string; intensity: number; position: [number, number, number] };
  };
}
interface TextureRecord {
  path: string; sha256: string; encodedBytes: number; width: 128; height: 128;
  colorSpace: 'srgb'; magFilter: 'nearest';
  minFilter: 'linear-mipmap-linear'; mipmaps: true; wrap: 'repeat';
}
interface EnvironmentVariant {
  id: string; kitId: string; label: string; propIds: string[];
  floorTint: string; wallTint: string; staging: 'kit-assigned-scene-unbuilt';
  artBrief: string;
}
```

The twelve kit IDs are `forest`, `cave`, `volcano`, `snow`, `sky`, `coast`,
`ruins`, `crystal`, `town`, `dojo`, `desert`, and `storm`. `WorldView.biomeId`
selects a kit. The renderer's separate adapter may resolve a canonical dungeon,
section, location or Friend Area binding to its kit/variant. Unknown IDs must
fail explicitly, never silently become a forest.

Primitive sizes are full bounding dimensions in tile/world units; rotations
are XYZ Euler radians. Boxes are unit cubes. Cylinders use equal top/bottom
radius 0.5 and unit height; cones use bottom radius 0.5 and unit height; spheres
use radius 0.5. Then apply `size`. Radial segments default to six; sphere height
segments are `max(3,floor(segments/2))`. All materials are nonmetallic,
flat-shaded, opaque and depth-writing. Most props meet or slightly overlap local ground Y=0. The floating-island prop is centered around its suspended rock tip/body, with its upper platform at Y=1.85; it is deliberately staged below the walkable island surface.
Logical collision, legal tiles and visibility remain domain owned.

Renderer owner supplies asynchronous local asset loading, then synchronous
`EnvironmentKit.create(WorldView)` returning `{root,syncVisibility,dispose}`.
Explicit `world.props[].kind` selects one kit prop ID. Terrain types remain
`wall|floor|water|lava|void`. The adapter must honor exploration/visibility;
a material or prop never changes tile rules. Authoring preview/capture never
imports or executes this runtime bridge or other game source.
