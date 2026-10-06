import { Group, PlaneGeometry, CircleGeometry, Mesh, MeshBasicMaterial } from '../../vendor/three/three.module.min.js';
/** @typedef {import('../presentation/types.js').ActorView} ActorView */
/** @typedef {import('./assets.js').Manifest} Manifest */
/** @typedef {import('./assets.js').PageLease} PageLease */
/** @typedef {import('../../vendor/three/three.module.min.js').Vector3} Vector3 */
/** @typedef {{view:ActorView,root:Group,mesh:Mesh<PlaneGeometry,MeshBasicMaterial>,shadow:Mesh<CircleGeometry,MeshBasicMaterial>,lease:PageLease|null,key:string,generation:number,clock:number,target:Vector3,clip:import('./assets.js').Clip|null,pending:Promise<void>|null}} ActorInstance */
/** Owns per-instance UVs and materials; shared page texture transforms never change. */
export class ActorLayer {
    /** @param {import('./assets.js').ClipPageCache} cache */
    constructor(cache) {
        this.cache = cache;
        this.root = new Group();
        /** @type {Map<string,ActorInstance>} */
        this.actors = new Map();
        this.disposed = false;
    }
    /** @param {readonly ActorView[]} views @param {Manifest} manifest @returns {Promise<void>} */
    async sync(views, manifest) {
        if (this.disposed)
            return;
        for (const view of views) {
            if (!manifest.characters.some(character => character.speciesId === view.speciesId && character.formId === view.formId) || !manifest.pages.some(page => page.speciesId === view.speciesId && page.clip === view.clip)) throw new Error(`No reviewed pixel art for ${view.speciesId}/${view.formId ?? 'default'}/${view.clip}.`);
        }
        const ids = new Set(views.map(view => view.actorId));
        for (const [id, actor] of this.actors)
            if (!ids.has(id))
                this.remove(id, actor);
        /** @type {Promise<void>[]} */ const pending = [];
        for (const view of views) {
            const character = manifest.characters.find(character => character.speciesId === view.speciesId && character.formId === view.formId);
            const page = manifest.pages.find(page => page.speciesId === view.speciesId && page.clip === view.clip), clip = manifest.clips.find(clip => clip.id === view.clip);
            if (!character || !page || !clip)
                throw new Error(`No reviewed pixel art for ${view.speciesId}/${view.formId ?? 'default'}/${view.clip}.`);
            let actor = this.actors.get(view.actorId);
            if (!actor) {
                const root = new Group(), geometry = new PlaneGeometry(1, 1);
                geometry.translate(0, 92 / 96 - .5, 0);
                const mesh = new Mesh(geometry, new MeshBasicMaterial({ alphaTest: .5, transparent: false, depthTest: true, depthWrite: true, toneMapped: false }));
                mesh.visible = false;
                root.add(mesh);
                const shadowGeometry = new CircleGeometry(.34, 16);
                shadowGeometry.rotateX(-Math.PI / 2);
                const shadow = new Mesh(shadowGeometry, new MeshBasicMaterial({ color: '#161b24', transparent: true, opacity: .28, depthWrite: false }));
                shadow.position.y = .012;
                root.add(shadow);
                root.position.set(view.x * 2, 0, view.z * 2);
                this.root.add(root);
                actor = { view, root, mesh, shadow, lease: null, key: '', generation: 0, clock: 0, target: root.position.clone(), clip: null, pending: null };
                this.actors.set(view.actorId, actor);
            }
            if (actor.view.clipToken !== view.clipToken || actor.view.clip !== view.clip)
                actor.clock = 0;
            actor.view = view;
            actor.clip = clip;
            actor.target.set(view.x * 2, 0, view.z * 2);
            actor.mesh.scale.setScalar(character.worldHeight);
            actor.mesh.material.color.set(view.tint);
            if (actor.root.position.distanceToSquared(actor.target) > 16)
                actor.root.position.copy(actor.target);
            const key = `${page.path}:${view.formId ?? 'default'}`;
            if (actor.key !== key) {
                actor.generation++;
                actor.lease?.release();
                actor.lease = null;
                actor.key = key;
                actor.mesh.visible = false;
                actor.shadow.visible = false;
                actor.mesh.material.map = null;
                actor.mesh.material.needsUpdate = true;
                const owned = actor, token = actor.generation;
                try {
                    const lease = this.cache.acquire(page);
                    actor.lease = lease;
                    actor.pending = lease.promise.then(({ texture }) => { if (this.disposed || owned.generation !== token || this.actors.get(view.actorId) !== owned)
                        return; owned.mesh.material.map = texture; owned.mesh.material.needsUpdate = true; owned.mesh.visible = true; owned.shadow.visible = true; }).catch(error => { if (!this.disposed && owned.generation === token && this.actors.get(view.actorId) === owned) {
                        owned.key = '';
                        throw error;
                    } }).finally(() => { if (owned.generation === token)
                        owned.pending = null; });
                }
                catch (error) {
                    actor.key = '';
                    throw error;
                }
            }
            if (actor.pending) {
                void actor.pending.catch(() => {});
                pending.push(actor.pending);
            }
        }
        await Promise.all(pending);
    }
    /** @param {number} dt @param {import('../../vendor/three/three.module.min.js').PerspectiveCamera} camera @param {boolean} reducedMotion @param {import('../presentation/types.js').WorldView} world */
    update(dt, camera, reducedMotion, world) {
        for (const actor of this.actors.values()) {
            const fraction = reducedMotion ? 1 : 1 - Math.exp(-dt * 16);
            actor.root.position.lerp(actor.target, fraction);
            if (!world.visible[Math.round(actor.root.position.z / 2)]?.[Math.round(actor.root.position.x / 2)])
                actor.root.position.copy(actor.target);
            const bearing = Math.atan2(camera.position.x - actor.root.position.x, camera.position.z - actor.root.position.z);
            actor.mesh.rotation.y = bearing;
            const row = ((Math.round((actor.view.heading - bearing) / (Math.PI / 4)) % 8) + 8) % 8;
            if (!actor.clip)
                continue;
            if (actor.mesh.visible)
                actor.clock += dt * 1000;
            const total = actor.clip.durationsMs.reduce((sum, value) => sum + value, 0);
            let elapsed = actor.clip.loop ? actor.clock % total : Math.min(actor.clock, total - 1), frame = 0;
            while (frame < 3 && elapsed >= (actor.clip.durationsMs[frame] ?? 1)) {
                elapsed -= actor.clip.durationsMs[frame] ?? 1;
                frame++;
            }
            if (reducedMotion)
                frame = actor.clip.loop ? 0 : 3;
            const uv = actor.mesh.geometry.getAttribute('uv'), u = frame / 4, v = 1 - row / 8;
            uv.setXY(0, u, v);
            uv.setXY(1, u + .25, v);
            uv.setXY(2, u, v - .125);
            uv.setXY(3, u + .25, v - .125);
            uv.needsUpdate = true;
        }
    }
    /** @param {string} id @param {ActorInstance} actor */
    remove(id, actor) { actor.generation++; actor.lease?.release(); actor.lease = null; this.root.remove(actor.root); actor.mesh.geometry.dispose(); actor.mesh.material.dispose(); actor.shadow.geometry.dispose(); actor.shadow.material.dispose(); this.actors.delete(id); }
    clear() { for (const [id, actor] of this.actors)
        this.remove(id, actor); }
    dispose() { if (this.disposed)
        return; this.disposed = true; this.clear(); }
}
