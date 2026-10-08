import { PerspectiveCamera, Vector3, Box3, Ray } from '../../vendor/three/three.module.min.js';
const clamp = (/** @type {number} */ value, /** @type {number} */ min, /** @type {number} */ max) => Math.min(max, Math.max(min, value));
/** Follow camera uses INPUT-CONTRACT yaw. Actual per-actor bearing selects sprite rows. */
export class FollowCamera {
    constructor() { this.camera = new PerspectiveCamera(54, 1, .08, 200); this.yaw = 0; this.wantedYaw = 0; this.distance = 7; this.wantedDistance = 7; this.pitch = .44; this.wantedPitch = .44; this.target = new Vector3(); this.initialized = false; this.followId = null; }
    /** @param {string|null} id */ setFollow(id) { this.followId = id; }
    /** @param {number} delta */ rotate(delta) { if (Number.isFinite(delta))
        this.wantedYaw = ((this.wantedYaw + delta) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); }
    /** @param {number} delta */ zoom(delta) { if (Number.isFinite(delta))
        this.wantedDistance = clamp(this.wantedDistance + delta * 3, 4.5, 12); }
    /** @param {number} radians */ setPitch(radians) { if (Number.isFinite(radians))
        this.wantedPitch = clamp(radians, .25, .85); }
    recenter() { this.wantedYaw = 0; this.wantedDistance = 7; this.wantedPitch = .44; }
    /** @param {number} dt @param {Map<string,import('./actors.js').ActorInstance>} actors @param {import('../presentation/types.js').WorldView} world @param {boolean} reducedMotion @param {readonly Box3[]} [obstacles] */
    update(dt, actors, world, reducedMotion, obstacles = []) {
        const smoothing = reducedMotion ? 1 : 1 - Math.exp(-dt * 12);
        const angle = Math.atan2(Math.sin(this.wantedYaw - this.yaw), Math.cos(this.wantedYaw - this.yaw));
        this.yaw += angle * smoothing;
        this.distance += (this.wantedDistance - this.distance) * smoothing;
        this.pitch += (this.wantedPitch - this.pitch) * smoothing;
        const follow = this.followId ? actors.get(this.followId) : undefined;
        // Explicit remembered follow identity; disappearance retains the last target.
        const desired = follow ? follow.root.position.clone().add(new Vector3(0, Math.min(follow.view.bounds.height * .5, 1.3), 0)) : this.initialized ? this.target.clone() : new Vector3((world.width - 1), .8, (world.height - 1));
        let framing = 1, look = desired;
        if (follow) {
            const bosses = [...actors.values()].filter(actor => actor.view.role === 'boss' && actor.root.position.distanceTo(follow.root.position) < 24);
            for (const boss of bosses) {
                const center = boss.root.position.clone().add(new Vector3(0, boss.view.bounds.height * .5, 0));
                look = look.clone().lerp(center, .25);
                const span = center.distanceTo(desired) + Math.max(boss.view.bounds.width, boss.view.bounds.height);
                framing = Math.max(framing, span / (this.distance * 1.15));
            }
        }
        if (!world.visible[Math.round(look.z / 2)]?.[Math.round(look.x / 2)] || world.tiles[Math.round(look.z / 2)]?.[Math.round(look.x / 2)] === 'wall') look = desired;
        if (!this.initialized || reducedMotion)
            this.target.copy(look);
        else
            this.target.lerp(look, 1 - Math.exp(-dt * 10));
        this.initialized = true;
        const distance = clamp(this.distance * Math.max(1, .85 / this.camera.aspect) * framing, 4.5, 28);
        const arm = new Vector3(Math.sin(this.yaw) * Math.cos(this.pitch) * distance, Math.sin(this.pitch) * distance, Math.cos(this.yaw) * Math.cos(this.pitch) * distance);
        // Shoulder offset is part of actual bearing, not the input yaw convention.
        arm.add(new Vector3(Math.cos(this.yaw) * .45, 0, -Math.sin(this.yaw) * .45));
        const length = arm.length(), direction = arm.clone().normalize(), ray = new Ray(this.target, direction), intersection = new Vector3();
        let safeLength = length;
        // Only projected walls/unknown cells obstruct; no hidden terrain is exposed.
        const endpoint = this.target.clone().add(arm);
        const minX = Math.max(0, Math.floor(Math.min(this.target.x, endpoint.x) / 2) - 1), maxX = Math.min(world.width - 1, Math.ceil(Math.max(this.target.x, endpoint.x) / 2) + 1);
        const minZ = Math.max(0, Math.floor(Math.min(this.target.z, endpoint.z) / 2) - 1), maxZ = Math.min(world.height - 1, Math.ceil(Math.max(this.target.z, endpoint.z) / 2) + 1);
        const box = new Box3();
        for (let z = minZ; z <= maxZ; z++)
            for (let x = minX; x <= maxX; x++) {
                const tile = world.tiles[z]?.[x];
                if (tile !== 'wall' && tile !== 'void')
                    continue;
                box.min.set(x * 2 - 1.2, -.2, z * 2 - 1.2); box.max.set(x * 2 + 1.2, 32, z * 2 + 1.2);
                if (box.containsPoint(this.target))
                    continue;
                if (ray.intersectBox(box, intersection))
                    safeLength = Math.min(safeLength, Math.max(.35, intersection.distanceTo(this.target) - .2));
            }
        for (const obstacle of obstacles) {
            if (!obstacle.containsPoint(this.target) && ray.intersectBox(obstacle, intersection)) safeLength = Math.min(safeLength, Math.max(.35, intersection.distanceTo(this.target) - .2));
        }
        const position = this.target.clone().addScaledVector(direction, safeLength);
        // Tight corridor fallback retains a readable silhouette instead of putting
        // the lens inside the follow actor; masks still conceal everything unknown.
        if (safeLength < 2.4) position.y = Math.max(position.y, this.target.y + 2.8);
        position.y = Math.max(.35, position.y);
        // Immediate obstruction shortening avoids smoothing the camera through a wall.
        this.camera.position.copy(position);
        this.camera.lookAt(this.target);
        this.camera.updateMatrixWorld();
    }
    /** @param {number} width @param {number} height */ resize(width, height) {
        this.camera.aspect = width / height;
        // Portrait world focus stays above the lower-half emulator overlay.
        if (height > width) this.camera.setViewOffset(width, height, 0, height * .18, width, height);
        else this.camera.clearViewOffset();
        this.camera.updateProjectionMatrix();
    }
}
