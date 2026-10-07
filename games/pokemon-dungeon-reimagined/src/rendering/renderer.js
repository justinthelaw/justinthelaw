import { Scene, Color, Fog, WebGLRenderer, HemisphereLight, DirectionalLight, Group, Mesh, MeshBasicMaterial, RingGeometry, OctahedronGeometry, CylinderGeometry, InstancedMesh, Object3D, SRGBColorSpace } from '../../vendor/three/three.module.min.js';
import { validateWorld, detachedPresentation } from '../presentation/projection.js';
import { ClipPageCache, loadPixelManifest } from './assets.js';
import { ActorLayer } from './actors.js';
import { FollowCamera } from './camera.js';
import { basicEnvironmentKit } from './environment.js';
import { QUALITY } from './quality.js';
/** @typedef {import('../presentation/types.js').WorldView} WorldView */
/** @typedef {import('../presentation/types.js').ActorView} ActorView */
/** @typedef {import('../presentation/types.js').PickupView} PickupView */
/** @typedef {{onError?:(error:Error)=>void,onContextState?:(state:'lost'|'restored')=>void,onAssetsPending?:(pending:boolean)=>void,reducedMotion?:boolean,quality?:import('./quality.js').QualityTier,environmentKit?:import('./environment.js').EnvironmentKit}} RendererOptions */
/** A presentation engine, never a game-loop, visibility-policy or rule owner. */
export class DungeonRenderer {
    /** @param {HTMLCanvasElement} canvas @param {RendererOptions} [options] */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = options;
        this.disposed = false;
        this.contextLost = false;
        this.generation = 0;
        this.syncGeneration = 0;
        this.reducedMotion = options.reducedMotion ?? false;
        this.quality = QUALITY[options.quality ?? (canvas.clientWidth < 768 ? 'mobile' : 'desktop')];
        this.listeners = new AbortController();
        this.assetsAbort = new AbortController();
        this.scene = new Scene();
        this.cameraRig = new FollowCamera();
        this.cache = new ClipPageCache();
        this.actors = new ActorLayer(this.cache);
        /** @type {WorldView|null} */ this.world = null;
        /** @type {import('./environment.js').EnvironmentInstance|null} */ this.environment = null;
        this.environmentKit = options.environmentKit ?? basicEnvironmentKit;
        this.scene.add(this.actors.root);
        const lighting = this.environmentKit.lighting;
        this.scene.background = new Color(lighting?.background ?? '#17222b');
        this.scene.fog = new Fog(lighting?.fog.color ?? '#17222b', lighting?.fog.near ?? 18, lighting?.fog.far ?? 60);
        const ambient = new HemisphereLight(lighting?.ambient.sky ?? '#d9e8ff', lighting?.ambient.ground ?? '#32343a', lighting?.ambient.intensity ?? 2.2);
        const key = new DirectionalLight(lighting?.key.color ?? '#ffedcb', lighting?.key.intensity ?? 2.4);
        key.position.fromArray(lighting?.key.position ?? [6, 12, 8]);
        this.ambientLight = ambient; this.keyLight = key;
        this.scene.add(ambient, key);
        this.pickupRoot = new Group();
        this.scene.add(this.pickupRoot);
        /** @type {Map<string,InstancedMesh>} */ this.pickupMeshes = new Map();
        /** @type {readonly PickupView[]} */ this.pickups = [];
        for (const kind of ['item', 'money', 'trap']) {
            const geometry = kind === 'trap' ? new CylinderGeometry(.4, .4, .05, 8) : new OctahedronGeometry(kind === 'money' ? .23 : .3);
            const material = new MeshBasicMaterial({ color: '#ffffff' });
            const mesh = new InstancedMesh(geometry, material, 4096);
            mesh.count = 0;
            mesh.frustumCulled = false;
            this.pickupRoot.add(mesh);
            this.pickupMeshes.set(kind, mesh);
        }
        this.effectRoot = new Group();
        this.scene.add(this.effectRoot);
        const effectGeometry = new RingGeometry(.15, .25, 16);
        effectGeometry.rotateX(-Math.PI / 2);
        this.effectGeometry = effectGeometry;
        /** @type {{mesh:Mesh<RingGeometry,MeshBasicMaterial>,remaining:number,duration:number,x:number,z:number}[]} */ this.effects = [];
        for (let index = 0; index < this.quality.effectLimit; index++) {
            const mesh = new Mesh(effectGeometry, new MeshBasicMaterial({ transparent: true, depthWrite: false, color: '#ffffff' }));
            mesh.visible = false;
            this.effectRoot.add(mesh);
            this.effects.push({ mesh, remaining: 0, duration: .4, x: 0, z: 0 });
        }
        this.manifestPromise = loadPixelManifest(this.assetsAbort.signal);
        // Mark a failure handled even before the first actor sync; ready still rejects to callers.
        this.ready = this.manifestPromise.then(() => { });
        void this.ready.catch(error => { if (!this.disposed)
            this.fail(error); });
        const context = canvas.getContext('webgl2', { alpha: false, antialias: this.quality.antialias });
        if (!context) {
            this.disposed = true;
            this.assetsAbort.abort();
            this.disposeResources();
            throw new Error('WebGL 2 is unavailable.');
        }
        try {
            this.gpu = new WebGLRenderer({ canvas, context, alpha: false, antialias: this.quality.antialias });
        }
        catch (error) {
            this.disposed = true;
            this.assetsAbort.abort();
            this.disposeResources();
            throw error;
        }
        this.gpu.outputColorSpace = SRGBColorSpace;
        canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); if (this.disposed)
            return; this.contextLost = true; options.onContextState?.('lost'); }, { signal: this.listeners.signal });
        // Three restores its renderer before this listener. Retained geometry, texture
        // sources and live CPU records are reuploaded without rereading domain state.
        canvas.addEventListener('webglcontextrestored', () => { if (this.disposed)
            return; try {
            this.contextLost = false;
            for (const actor of this.actors.actors.values())
                if (actor.mesh.material.map)
                    actor.mesh.material.map.needsUpdate = true;
            this.resize();
            options.onContextState?.('restored');
        }
        catch (error) {
            this.contextLost = true;
            this.fail(error);
        } }, { signal: this.listeners.signal });
        this.resize();
    }
    /** @param {unknown} error */ fail(error) { const failure = error instanceof Error ? error : new Error('Presentation failed.'); this.options.onError?.(failure); }
    /** @param {WorldView} world */
    loadWorld(world) {
        if (this.disposed)
            return;
        world = detachedPresentation(world);
        validateWorld(world);
        if (this.world && this.world.worldId === world.worldId) {
            if (world.revision < this.world.revision)
                throw new Error('Stale world presentation.');
            if (world.width !== this.world.width || world.height !== this.world.height || world.biomeId !== this.world.biomeId)
                throw new Error('World shape changed without a new identity.');
            this.environment?.syncVisibility(world);
            this.world = world;
            this.hideConcealed();
            return;
        }
        const next = this.environmentKit.create(world);
        const lighting = this.environmentKit.lightingFor?.(world) ?? this.environmentKit.lighting;
        if (lighting) {
            this.scene.background = new Color(lighting.background);
            this.scene.fog = new Fog(lighting.fog.color, lighting.fog.near, lighting.fog.far);
            this.ambientLight.color.set(lighting.ambient.sky); this.ambientLight.groundColor.set(lighting.ambient.ground); this.ambientLight.intensity = lighting.ambient.intensity;
            this.keyLight.color.set(lighting.key.color); this.keyLight.intensity = lighting.key.intensity; this.keyLight.position.fromArray(lighting.key.position);
        }
        this.generation++;
        this.syncGeneration++;
        this.options.onAssetsPending?.(false);
        this.actors.clear();
        this.environment?.dispose();
        if (this.environment)
            this.scene.remove(this.environment.root);
        this.environment = next;
        this.world = world;
        this.scene.add(next.root);
        this.cameraRig.initialized = false;
        this.pickups = [];
        for (const mesh of this.pickupMeshes.values())
            mesh.count = 0;
        for (const effect of this.effects) {
            effect.remaining = 0;
            effect.mesh.visible = false;
        }
    }
    hideConcealed() { const world = this.world; if (!world)
        return; for (const [id, actor] of this.actors.actors)
        if (!world.visible[actor.view.z]?.[actor.view.x])
            this.actors.remove(id, actor); this.syncPickups(this.pickups.filter(pickup => world.visible[pickup.z]?.[pickup.x])); for (const effect of this.effects)
        if (!world.visible[effect.z]?.[effect.x]) {
            effect.remaining = 0;
            effect.mesh.visible = false;
        } }
    /** Resolve before the application marks world input ready. Rejections are explicit;
     * unknown art is never silently replaced with another species.
     * @param {readonly ActorView[]} views @returns {Promise<void>}
     */
    async syncActors(views) {
        if (this.disposed)
            return;
        const world = this.world;
        if (!world)
            throw new Error('Load a world before actors.');
        if (views.length > 512 || new Set(views.map(actor => actor.actorId)).size !== views.length || views.some(actor => !world.visible[actor.z]?.[actor.x]))
            throw new Error('Invalid or concealed actor views.');
        views = detachedPresentation(views);
        const worldGeneration = this.generation, sync = ++this.syncGeneration;
        this.options.onAssetsPending?.(true);
        try {
            const manifest = await this.manifestPromise;
            if (this.disposed || worldGeneration !== this.generation || sync !== this.syncGeneration)
                return;
            await this.actors.sync(views, manifest);
        }
        catch (error) {
            if (!this.disposed && worldGeneration === this.generation && sync === this.syncGeneration) {
                this.fail(error);
                throw error;
            }
        }
        finally {
            if (!this.disposed && worldGeneration === this.generation && sync === this.syncGeneration)
                this.options.onAssetsPending?.(false);
        }
    }
    /** @param {readonly PickupView[]} views */
    syncPickups(views) { if (this.disposed)
        return; const world = this.world; if (!world)
        throw new Error('Load a world before pickups.'); if (views.length > 4096 || new Set(views.map(view => view.pickupId)).size !== views.length || views.some(view => !world.visible[view.z]?.[view.x]))
        throw new Error('Invalid or concealed pickups.'); this.pickups = detachedPresentation(views); const transform = new Object3D(); for (const [kind, mesh] of this.pickupMeshes) {
        let count = 0;
        for (const pickup of views) {
            if (pickup.kind !== kind)
                continue;
            transform.position.set(pickup.x * 2, kind === 'trap' ? .06 : .3, pickup.z * 2);
            transform.updateMatrix();
            mesh.setMatrixAt(count, transform.matrix);
            mesh.setColorAt(count, new Color(pickup.color));
            count++;
        }
        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor)
            mesh.instanceColor.needsUpdate = true;
    } }
    /** @param {string|null} actorId */ setFollow(actorId) { this.cameraRig.setFollow(actorId); }
    /** @param {number} deltaRadians */ rotate(deltaRadians) { this.cameraRig.rotate(deltaRadians); }
    /** @param {number} delta */ zoom(delta) { this.cameraRig.zoom(delta); }
    recenter() { this.cameraRig.recenter(); }
    /** @param {number} radians */ setPitch(radians) { this.cameraRig.setPitch(radians); }
    get cameraYaw() { return this.cameraRig.yaw; }
    /** @param {number} x @param {number} z @param {'hit'|'heal'|'status'} [type] @param {string} [color] */
    flash(x, z, type = 'hit', color) { if (this.disposed || this.reducedMotion || !this.world?.visible[z]?.[x])
        return; const effect = this.effects.find(effect => effect.remaining <= 0); if (!effect)
        return; effect.x = x; effect.z = z; effect.duration = type === 'hit' ? .24 : .45; effect.remaining = effect.duration; effect.mesh.position.set(x * 2, .05, z * 2); effect.mesh.material.color.set(color ?? (type === 'heal' ? '#a3efbb' : type === 'status' ? '#c6b8ed' : '#efd8a9')); effect.mesh.visible = true; }
    /** Composition root passes active presentation time only. @param {number} dtSeconds */
    update(dtSeconds) { if (this.disposed || this.contextLost || !this.world || this.canvas.ownerDocument.hidden)
        return; const dt = Number.isFinite(dtSeconds) ? Math.max(0, Math.min(.1, dtSeconds)) : 0; try {
        this.cameraRig.update(dt, this.actors.actors, this.world, this.reducedMotion, this.environment?.obstacles);
        this.actors.update(dt, this.cameraRig.camera, this.reducedMotion, this.world);
        for (const effect of this.effects) {
            if (effect.remaining <= 0)
                continue;
            effect.remaining = Math.max(0, effect.remaining - dt);
            effect.mesh.visible = effect.remaining > 0;
            const progress = 1 - effect.remaining / effect.duration;
            effect.mesh.scale.setScalar(1 + progress * 3);
            effect.mesh.material.opacity = (1 - progress) * .65;
        }
        this.gpu.render(this.scene, this.cameraRig.camera);
    }
    catch (error) {
        this.fail(error);
    } }
    resize() { if (this.disposed || this.contextLost)
        return; const bounds = this.canvas.getBoundingClientRect(); if (bounds.width <= 0 || bounds.height <= 0)
        return; const dpr = Math.min(this.canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1, this.quality.maxDpr, Math.sqrt(this.quality.maxPixels / (bounds.width * bounds.height))); this.gpu.setPixelRatio(dpr); this.gpu.setSize(bounds.width, bounds.height, false); this.cameraRig.resize(bounds.width, bounds.height); }
    get metrics() { return Object.freeze({ characters: this.cache.metrics, actors: this.actors.actors.size, pickups: this.pickups.length, effects: this.effects.filter(effect => effect.remaining > 0).length, drawCalls: this.gpu.info.render.calls, triangles: this.gpu.info.render.triangles, geometries: this.gpu.info.memory.geometries, textures: this.gpu.info.memory.textures, contextLost: this.contextLost }); }
    disposeResources() { this.actors.dispose(); this.cache.dispose(); this.environment?.dispose(); for (const mesh of this.pickupMeshes.values()) {
        mesh.dispose();
        mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material))
            for (const entry of material)
                entry.dispose();
        else
            material.dispose();
    } this.effectGeometry.dispose(); for (const effect of this.effects)
        effect.mesh.material.dispose(); this.scene.clear(); }
    dispose() { if (this.disposed)
        return; this.disposed = true; this.generation++; this.syncGeneration++; this.listeners.abort(); this.assetsAbort.abort(); this.disposeResources(); this.gpu.dispose(); }
}
