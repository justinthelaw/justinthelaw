import { BoxGeometry, PlaneGeometry, RingGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial, Group, InstancedMesh, Object3D, Matrix4, Color, DataTexture, RGBAFormat, RepeatWrapping, SRGBColorSpace, NearestFilter, Texture, LinearMipmapLinearFilter } from '../../vendor/three/three.module.min.js';
import { readLocalBytes, sha256 } from './assets.js';
/** @typedef {import('../presentation/types.js').WorldView} WorldView */
/** @typedef {import('../../vendor/three/three.module.min.js').Box3} Box3 */
/** @typedef {{root:Group,obstacles:readonly Box3[],syncVisibility:(world:WorldView)=>void,dispose:()=>void}} EnvironmentInstance */
/** @typedef {{background:string,fog:{color:string,near:number,far:number},ambient:{sky:string,ground:string,intensity:number},key:{color:string,intensity:number,position:number[]}}} Lighting */
/** @typedef {{create:(world:WorldView)=>EnvironmentInstance,lighting?:Lighting,dispose?:()=>void}} EnvironmentKit */
/** @typedef {{id:string,color:string,texturePath?:string,roughness:number,emissive?:string,emissiveIntensity?:number}} MaterialDef */
/** @typedef {{shape:'box'|'cylinder'|'cone'|'sphere',size:number[],position:number[],rotation:number[],materialId:string,segments?:number}} Part */
/** @typedef {{id:string,name:string,materials:MaterialDef[],props:{id:string,parts:Part[]}[],terrain:{floor:string,wall:string,water:string,lava:string},lighting:Lighting,wallHeight:number,floorRepeat:number[]}} KitDef */
/** @typedef {{schemaVersion:number,profile:string,kits:KitDef[],textures:{path:string,sha256:string,encodedBytes:number,width:number,height:number,colorSpace:string,magFilter:string,minFilter:string,mipmaps:boolean,wrap:string}[]}} EnvironmentManifest */
const base = new URL('../../assets/environment/production/', import.meta.url);
/** A small original neutral stone material for the bounded fallback environment.
 * It is deliberately not presented as finished biome production art.
 */
function basicTexture() {
    const pixels = new Uint8Array(16 * 16 * 4);
    for (let z = 0; z < 16; z++)
        for (let x = 0; x < 16; x++) {
            const i = (z * 16 + x) * 4, v = (x === 0 || z === 0) ? 95 : 140 + ((x * 17 + z * 29) % 5) * 7;
            pixels.set([v, v, v, 255], i);
        }
    const texture = new DataTexture(pixels, 16, 16, RGBAFormat);
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
}
/** @param {Part} part */
function geometryFor(part) { const [x = 1, y = 1, z = 1] = part.size, s = part.segments ?? 6; switch (part.shape) {
    case 'box': return new BoxGeometry(x, y, z);
    case 'cylinder': {
        const geometry = new CylinderGeometry(.5, .5, 1, s);
        geometry.scale(x, y, z);
        return geometry;
    }
    case 'cone': {
        const geometry = new ConeGeometry(.5, 1, s);
        geometry.scale(x, y, z);
        return geometry;
    }
    case 'sphere': {
        const geometry = new SphereGeometry(.5, s, Math.max(3, Math.floor(s / 2)));
        geometry.scale(x, y, z);
        return geometry;
    }
} }
/** @param {WorldView} initial @param {KitDef|null} definition @param {Map<string,Texture>} textures @returns {EnvironmentInstance} */
function createTerrain(initial, definition, textures) {
    if (initial.props.length > 4096 || initial.exits.length > initial.width * initial.height) throw new Error('Environment instance budget exceeded.');
    if (definition && initial.props.some(prop => !definition.props.some(candidate => candidate.id === prop.kind))) throw new Error('Missing authored environment prop.');
    const root = new Group(), transform = new Object3D(), count = initial.width * initial.height;
    const propParent = new Object3D(), propMatrix = new Matrix4();
    const localTexture = definition ? null : basicTexture();
    /** @type {Map<string,MeshStandardMaterial>} */ const materials = new Map();
    if (definition)
        for (const def of definition.materials)
            materials.set(def.id, new MeshStandardMaterial({ color: def.color, map: def.texturePath ? textures.get(def.texturePath) : null, roughness: def.roughness, flatShading: true, emissive: def.emissive ?? '#000000', emissiveIntensity: def.emissiveIntensity ?? 0 }));
    else
        for (const [id, color] of Object.entries({ floor: '#717a71', wall: '#495359', water: '#376b85', lava: '#db6238', stairs: '#e2d8ae' }))
            materials.set(id, new MeshStandardMaterial({ color, map: localTexture, roughness: .9 }));
    const terrain = definition?.terrain ?? { floor: 'floor', wall: 'wall', water: 'water', lava: 'lava' };
    const wallHeight = definition?.wallHeight ?? 2.5;
    /** @type {Map<string,InstancedMesh>} */ const meshes = new Map();
    /** @type {import('../../vendor/three/three.module.min.js').BufferGeometry[]} */ const geometries = [];
    for (const kind of ['floor', 'wall', 'water', 'lava', 'stairs']) {
        const geometry = kind === 'wall' ? new BoxGeometry(2, wallHeight, 2) : new PlaneGeometry(2, 2);
        if (kind !== 'wall') {
            geometry.rotateX(-Math.PI / 2);
            const uv = geometry.getAttribute('uv');
            for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (definition?.floorRepeat[0] ?? 1), uv.getY(i) * (definition?.floorRepeat[1] ?? 1));
        }
        geometries.push(geometry);
        const material = materials.get(kind === 'stairs' ? (definition?.terrain.floor ?? 'stairs') : terrain[ /** @type {keyof typeof terrain} */(kind)]);
        if (!material)
            throw new Error(`Environment material absent: ${kind}`);
        const mesh = new InstancedMesh(geometry, material, count);
        mesh.frustumCulled = false;
        mesh.receiveShadow = true;
        root.add(mesh);
        meshes.set(kind, mesh);
    }
    // Stairs remain physical readable steps on every quality tier.
    const stepGeometry = new BoxGeometry(1.3, .16, .3);
    geometries.push(stepGeometry);
    const steps = new InstancedMesh(stepGeometry, materials.get(terrain.floor), count * 4);
    steps.frustumCulled = false;
    root.add(steps);
    const markerGeometry = new RingGeometry(.42, .58, 16); markerGeometry.rotateX(-Math.PI / 2); geometries.push(markerGeometry);
    const markers = new InstancedMesh(markerGeometry, materials.get(terrain.floor), count); markers.frustumCulled = false; root.add(markers);
    /** @type {{mesh:InstancedMesh,kind:string,part:Part}[]} */ const props = [];
    if (definition)
        for (const prop of definition.props)
            for (const part of prop.parts) {
                const geometry = geometryFor(part);
                geometries.push(geometry);
                const mesh = new InstancedMesh(geometry, materials.get(part.materialId), Math.max(16, initial.props.filter(view => view.kind === prop.id).length));
                mesh.frustumCulled = false;
                root.add(mesh);
                props.push({ mesh, kind: prop.id, part });
            }
    /** @type {Box3[]} */ const obstacles = [];
    let disposed = false;
    /** @param {WorldView} world */
    function syncVisibility(world) {
        if (disposed)
            return;
        if (world.props.length > 4096 || world.exits.length > count)
            throw new Error('Environment instance budget exceeded.');
        if (definition && world.props.some(prop => !definition.props.some(candidate => candidate.id === prop.kind)))
            throw new Error('Missing authored environment prop.');
        if (world.width !== initial.width || world.height !== initial.height || world.worldId !== initial.worldId)
            throw new Error('Environment world identity mismatch.');
        obstacles.length = 0;
        const amounts = new Map([...meshes.keys()].map(key => [key, 0]));
        for (let z = 0; z < world.height; z++)
            for (let x = 0; x < world.width; x++) {
                if (!world.explored[z]?.[x])
                    continue;
                const kind = world.tiles[z]?.[x];
                if (!kind || kind === 'void')
                    continue;
                const mesh = meshes.get(kind);
                if (!mesh)
                    continue;
                const i = amounts.get(kind) ?? 0;
                amounts.set(kind, i + 1);
                transform.position.set(x * 2, kind === 'wall' ? wallHeight / 2 : kind === 'water' ? -.08 : 0, z * 2);
                transform.rotation.set(0, 0, 0);
                transform.scale.set(1, 1, 1);
                transform.updateMatrix();
                mesh.setMatrixAt(i, transform.matrix);
                mesh.setColorAt(i, new Color(world.visible[z]?.[x] ? 1 : 0.24, world.visible[z]?.[x] ? 1 : 0.28, world.visible[z]?.[x] ? 1 : 0.32));
            }
        for (const [kind, mesh] of meshes) {
            mesh.count = amounts.get(kind) ?? 0;
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor)
                mesh.instanceColor.needsUpdate = true;
        }
        let markerCount = 0;
        for (const exit of world.exits) {
            if (['stairs-up', 'stairs-down'].includes(exit.kind) || !world.explored[exit.z]?.[exit.x]) continue;
            transform.position.set(exit.x * 2, .025, exit.z * 2); transform.rotation.set(0, 0, 0); transform.scale.set(1, 1, 1); transform.updateMatrix();
            markers.setMatrixAt(markerCount, transform.matrix); markers.setColorAt(markerCount, new Color(world.visible[exit.z]?.[exit.x] ? (exit.kind === 'rescue-spot' ? '#a5efbd' : '#b6dbff') : '#454a50')); markerCount++;
        }
        markers.count = markerCount; markers.instanceMatrix.needsUpdate = true; if (markers.instanceColor) markers.instanceColor.needsUpdate = true;
        let stepCount = 0;
        for (const exit of world.exits) {
            if (!['stairs-up', 'stairs-down'].includes(exit.kind) || !world.explored[exit.z]?.[exit.x])
                continue;
            for (let step = 0; step < 4; step++) {
                transform.position.set(exit.x * 2, .08 + step * .16, exit.z * 2 + (step - 1.5) * .3);
                transform.rotation.set(0, 0, 0);
                transform.scale.set(1, 1, 1);
                transform.updateMatrix();
                steps.setMatrixAt(stepCount, transform.matrix);
                steps.setColorAt(stepCount, new Color(world.visible[exit.z]?.[exit.x] ? '#f4e1aa' : '#56534a'));
                stepCount++;
            }
        }
        steps.count = stepCount;
        steps.instanceMatrix.needsUpdate = true;
        if (steps.instanceColor)
            steps.instanceColor.needsUpdate = true;
        for (const record of props) {
            const {kind, part} = record;
            let mesh = record.mesh;
            const required = world.props.filter(prop => prop.kind === kind).length;
            if (required > mesh.instanceMatrix.count) {
                const replacement = new InstancedMesh(mesh.geometry, mesh.material, Math.min(4096, Math.max(required, mesh.instanceMatrix.count * 2)));
                replacement.frustumCulled = false;
                root.remove(mesh); mesh.dispose(); root.add(replacement); record.mesh = replacement; mesh = replacement;
            }
            let n = 0;
            for (const prop of world.props) {
                if (prop.kind !== kind || !world.explored[prop.z]?.[prop.x])
                    continue;
                const [px = 0, py = 0, pz = 0] = part.position;
                propParent.position.set(prop.x * 2, 0, prop.z * 2);
                propParent.rotation.set(0, prop.yaw, 0);
                propParent.scale.set(1, 1, 1);
                propParent.updateMatrix();
                transform.position.set(px, py, pz);
                transform.rotation.set(part.rotation[0] ?? 0, part.rotation[1] ?? 0, part.rotation[2] ?? 0, 'XYZ');
                // geometryFor already bakes part.size into vertices. Parent and
                // local instance scales remain one, so dimensions apply once.
                transform.scale.set(1, 1, 1);
                transform.updateMatrix();
                propMatrix.multiplyMatrices(propParent.matrix, transform.matrix);
                mesh.setMatrixAt(n, propMatrix);
                if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
                if (mesh.geometry.boundingBox) obstacles.push(mesh.geometry.boundingBox.clone().applyMatrix4(propMatrix));
                mesh.setColorAt(n, new Color(world.visible[prop.z]?.[prop.x] ? '#ffffff' : '#41474e'));
                n++;
            }
            mesh.count = n;
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor)
                mesh.instanceColor.needsUpdate = true;
        }
    }
    syncVisibility(initial);
    return { root, obstacles, syncVisibility, dispose() { if (disposed)
            return; disposed = true; for (const mesh of [...meshes.values(), steps, markers, ...props.map(prop => prop.mesh)])
            mesh.dispose(); for (const geometry of geometries)
            geometry.dispose(); for (const material of materials.values())
            material.dispose(); localTexture?.dispose(); root.clear(); } };
}
/** @type {EnvironmentKit} */
export const basicEnvironmentKit = { create: world => createTerrain(world, null, new Map()) };
/** Load just one explicit kit. All URLs stay local; kit owns decoded maps until dispose.
 * Caller owns returned kit and disposes it after all instances using it.
 * @param {string} kitId @param {AbortSignal} signal @returns {Promise<EnvironmentKit>}
 */
export async function loadEnvironmentKit(kitId, signal) {
    /** @type {EnvironmentManifest} */ const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readLocalBytes(new URL('manifest.json', base), 1048576, signal)));
    if (manifest.schemaVersion !== 1 || manifest.profile !== 'environment-kits-v1' || !Array.isArray(manifest.kits) || !Array.isArray(manifest.textures))
        throw new Error('Invalid environment manifest.');
    const definition = manifest.kits.find(kit => kit.id === kitId);
    if (!definition)
        throw new Error(`Missing environment kit: ${kitId}`);
    if (definition.materials.length > 32 || definition.props.length > 64 || definition.wallHeight <= 0 || definition.wallHeight > 16)
        throw new Error('Environment kit exceeds budget.');
    const materialIds = new Set(definition.materials.map(material => material.id));
    if (materialIds.size !== definition.materials.length || definition.materials.some(material => !/^#[0-9a-f]{6}$/i.test(material.color) || !Number.isFinite(material.roughness) || material.roughness < 0 || material.roughness > 1 || (material.emissive !== undefined && !/^#[0-9a-f]{6}$/i.test(material.emissive)) || (material.emissiveIntensity !== undefined && (!Number.isFinite(material.emissiveIntensity) || material.emissiveIntensity < 0 || material.emissiveIntensity > 10)))) throw new Error('Invalid environment material.');
    for (const prop of definition.props) {
        if (prop.parts.length > 32)
            throw new Error('Environment part budget exceeded.');
        for (const part of prop.parts)
            if (!['box', 'cylinder', 'cone', 'sphere'].includes(part.shape) || !materialIds.has(part.materialId) || [part.size, part.position, part.rotation].some(values => values.length !== 3 || values.some(value => !Number.isFinite(value) || Math.abs(value) > 128)) || part.size.some(value => value <= 0) || (part.segments !== undefined && (!Number.isInteger(part.segments) || part.segments < 3 || part.segments > 32)))
                throw new Error('Invalid environment geometry.');
    }
    for (const id of Object.values(definition.terrain))
        if (!materialIds.has(id))
            throw new Error('Missing terrain material.');
    const paths = new Set(definition.materials.flatMap(material => material.texturePath ? [material.texturePath] : []));
    /** @type {Map<string,Texture>} */ const textures = new Map();
    /** @type {ImageBitmap[]} */
    const bitmaps = [];
    let disposed = false, total = 0;
    function dispose() { if (disposed)
        return; disposed = true; for (const texture of textures.values())
        texture.dispose(); for (const bitmap of bitmaps)
        bitmap.close(); textures.clear(); bitmaps.length = 0; }
    try {
        for (const path of paths) {
            const def = manifest.textures.find(texture => texture.path === path);
            if (!def || !/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.png$/.test(path) || !Number.isSafeInteger(def.width) || !Number.isSafeInteger(def.height) || def.width < 1 || def.height < 1 || def.width > 1024 || def.height > 1024 || def.encodedBytes < 1 || def.encodedBytes >= 1048576 || !/^[a-f0-9]{64}$/.test(def.sha256) || def.colorSpace !== 'srgb' || def.magFilter !== 'nearest' || def.minFilter !== 'linear-mipmap-linear' || !def.mipmaps || def.wrap !== 'repeat')
                throw new Error('Invalid environment texture declaration.');
            total += def.width * def.height * 4 * 4 / 3;
            if (total > 16 * 1024 * 1024)
                throw new Error('Environment textures exceed 16 MiB budget.');
            const bytes = await readLocalBytes(new URL(path, base), def.encodedBytes, signal);
            if (bytes.length !== def.encodedBytes || await sha256(bytes) !== def.sha256)
                throw new Error('Environment texture integrity failed.');
            signal.throwIfAborted();
            const header = new DataView(bytes.buffer);
            if (bytes.length < 33 || header.getUint32(0) !== 0x89504e47 || header.getUint32(4) !== 0x0d0a1a0a || header.getUint32(16) !== def.width || header.getUint32(20) !== def.height) throw new Error('Environment PNG dimensions differ.');
            const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }), { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
            bitmaps.push(bitmap);
            signal.throwIfAborted();
            if (bitmap.width !== def.width || bitmap.height !== def.height)
                throw new Error('Environment texture dimensions differ.');
            const texture = new Texture(bitmap);
            texture.flipY = false;
            texture.colorSpace = SRGBColorSpace;
            texture.magFilter = NearestFilter;
            texture.minFilter = LinearMipmapLinearFilter;
            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.needsUpdate = true;
            textures.set(path, texture);
        }
        return { lighting: definition.lighting, create(world) { if (disposed || world.biomeId !== kitId)
                throw new Error('Environment kit unavailable or wrong biome.'); return createTerrain(world, definition, textures); }, dispose };
    }
    catch (error) {
        dispose();
        throw error;
    }
}
