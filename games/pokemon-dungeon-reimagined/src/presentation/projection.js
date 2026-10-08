/** @typedef {import('./types.js').WorldView} WorldView */
/** @typedef {import('./types.js').RenderSnapshot} RenderSnapshot */
/** @typedef {import('./types.js').ActorView} ActorView */
/** @typedef {import('./types.js').PickupView} PickupView */
/** @template T @param {T} value @returns {T} */
function freeze(value) {
    if (value && typeof value === 'object') {
        for (const child of Object.values(value))
            freeze(child);
        Object.freeze(value);
    }
    return value;
}
/** Detach trusted presentation input before retaining it in a renderer.
 * @template T @param {T} input @returns {T}
 */
export function detachedPresentation(input) { return freeze(structuredClone(input)); }
/** @param {number} x @param {number} z @param {WorldView} world */
function onMap(x, z, world) { return Number.isSafeInteger(x) && Number.isSafeInteger(z) && x >= 0 && z >= 0 && x < world.width && z < world.height; }
/** @param {WorldView} world */
export function validateWorld(world) {
    if (world.props.length > 4096 || world.exits.length > world.width * world.height) throw new Error('Projected scenery exceeds its budget.');
    for (const prop of world.props) if (!onMap(prop.x, prop.z, world) || !Number.isFinite(prop.yaw) || !world.explored[prop.z]?.[prop.x]) throw new Error('Invalid or concealed prop.');
    for (const exit of world.exits) if (!onMap(exit.x, exit.z, world) || !world.explored[exit.z]?.[exit.x]) throw new Error('Invalid or concealed exit.');
    if (!world.worldId || !Number.isSafeInteger(world.revision) || world.revision < 0 || !Number.isSafeInteger(world.width) || !Number.isSafeInteger(world.height) || world.width < 1 || world.height < 1 || world.width * world.height > 65536)
        throw new Error('Invalid projected world bounds.');
    for (const layer of [world.tiles, world.visible, world.explored])
        if (layer.length !== world.height || layer.some(row => row.length !== world.width))
            throw new Error('Presentation requires rectangular tiles[z][x] and knowledge masks.');
    for (let z = 0; z < world.height; z++)
        for (let x = 0; x < world.width; x++) {
            if (typeof world.visible[z]?.[x] !== 'boolean' || typeof world.explored[z]?.[x] !== 'boolean' || (world.visible[z]?.[x] && !world.explored[z]?.[x]))
                throw new Error('Invalid required visibility mask.');
            if (!['wall', 'floor', 'water', 'lava', 'void'].includes(world.tiles[z]?.[x] ?? '') || (!world.explored[z]?.[x] && world.tiles[z]?.[x] !== 'void'))
                throw new Error('Unknown terrain must be redacted.');
        }
}
/** Required for explicit authored town/story views too; copies before exposing any record.
 * @param {RenderSnapshot} input @returns {RenderSnapshot}
 */
export function immutableRenderSnapshot(input) {
    const copy = structuredClone(input);
    validateWorld(copy.world);
    if (!copy.epoch || copy.revision !== copy.world.revision)
        throw new Error('Presentation revision mismatch.');
    const ids = new Set();
    for (const actor of copy.actors) {
        if (!onMap(actor.x, actor.z, copy.world) || actor.elevation !== undefined && (!Number.isFinite(actor.elevation) || actor.elevation < 0 || actor.elevation > 4) || !actor.actorId || !actor.clipToken || !['hero','partner','boss','enemy','client','npc'].includes(actor.role) || !Number.isFinite(actor.hp) || !Number.isFinite(actor.maxHp) || actor.hp < 0 || actor.maxHp <= 0 || actor.hp > actor.maxHp || actor.statuses.length > 80 || ids.has(actor.actorId) || !copy.world.visible[actor.z]?.[actor.x] || !Number.isFinite(actor.heading) || actor.bounds.height <= 0 || actor.bounds.width <= 0 || !Number.isFinite(actor.bounds.height + actor.bounds.width) || !/^#[0-9a-f]{6}$/i.test(actor.tint))
            throw new Error('Invalid or concealed projected actor.');
        ids.add(actor.actorId);
    }
    ids.clear();
    for (const pickup of copy.pickups) {
        if (!onMap(pickup.x, pickup.z, copy.world) || !pickup.pickupId || !['item','money','trap'].includes(pickup.kind) || !Number.isSafeInteger(pickup.quantity) || pickup.quantity < 1 || !/^#[0-9a-f]{6}$/i.test(pickup.color) || ids.has(pickup.pickupId) || !copy.world.visible[pickup.z]?.[pickup.x])
            throw new Error('Invalid or concealed projected pickup.');
        ids.add(pickup.pickupId);
    }
    let lastEvent = 0;
    for (const event of copy.events) {
        if (!onMap(event.x, event.z, copy.world) || !/^#[0-9a-f]{6}$/i.test(event.color) || !Number.isSafeInteger(event.eventId) || event.eventId <= lastEvent || !copy.world.visible[event.z]?.[event.x])
            throw new Error('Invalid or concealed presentation event.');
        lastEvent = event.eventId;
    }
    for (const prop of copy.world.props)
        if (!copy.world.explored[prop.z]?.[prop.x])
            throw new Error('Concealed prop.');
    for (const exit of copy.world.exits)
        if (!copy.world.explored[exit.z]?.[exit.x])
            throw new Error('Concealed exit.');
    return freeze(copy);
}
/** No rule inference: actor visibility, terrain appearances, roles, effective max HP,
 * concurrent status labels and clip/event identity are supplied by their owners.
 * @param {import('../contracts.js').CampaignSnapshot} snapshot
 * @param {import('./types.js').VisibilityView} visibility
 * @param {import('./types.js').PresentationCatalog} presentation
 * @returns {RenderSnapshot}
 */
export function projectDungeon(snapshot, visibility, presentation) {
    const session = snapshot.session;
    if (!session || session.floor.mapId !== visibility.mapId || snapshot.revision !== visibility.revision)
        throw new Error('A current domain visibility result is required.');
    const floor = session.floor, actorIds = new Set(visibility.actorIds), itemIds = new Set(visibility.itemIds), trapIds = new Set(visibility.trapIds), exitIds = new Set(visibility.exitIds);
    /** @type {ActorView[]} */ const actors = [];
    const headings = { s: 0, se: Math.PI / 4, e: Math.PI / 2, ne: Math.PI * 3 / 4, n: Math.PI, nw: -Math.PI * 3 / 4, w: -Math.PI / 2, sw: -Math.PI / 4 };
    for (const actor of Object.values(session.actors)) {
        if (!actorIds.has(actor.actorId) || actor.placement.kind !== 'map' || actor.placement.mapId !== floor.mapId)
            continue;
        const { x, z } = actor.placement.position;
        if (!visibility.visible[z]?.[x])
            continue;
        const art = presentation.actors[actor.actorId];
        if (!art)
            throw new Error(`Missing explicit actor presentation: ${actor.actorId}`);
        const { appearance, ...details } = art;
        actors.push({ ...details, actorId: actor.actorId, speciesId: appearance.speciesId, formId: appearance.formId, x, z, heading: headings[actor.facing], hp: actor.resources.hp });
    }
    /** @type {PickupView[]} */ const pickups = [];
    for (const container of Object.values(snapshot.containers)) {
        const owner = container.owner;
        if (owner.kind !== 'floor' || owner.sessionId !== session.sessionId || owner.mapId !== floor.mapId || owner.placement !== 'ground' || !visibility.visible[owner.position.z]?.[owner.position.x])
            continue;
        for (const id of container.itemIds) {
            if (!itemIds.has(id))
                continue;
            const item = snapshot.items[id], art = presentation.items[id];
            if (!item || !art)
                throw new Error(`Missing item presentation: ${id}`);
            pickups.push({ pickupId: id, ...owner.position, ...art, quantity: item.quantity });
        }
    }
    for (const trap of Object.values(floor.traps)) {
        if (!trap.revealed || !trapIds.has(trap.trapId) || !visibility.visible[trap.position.z]?.[trap.position.x])
            continue;
        const art = presentation.traps[trap.trapId];
        if (!art)
            throw new Error(`Missing trap presentation: ${trap.trapId}`);
        pickups.push({ pickupId: trap.trapId, ...trap.position, ...art, kind: 'trap', quantity: 1 });
    }
    const tiles = floor.tiles.map((row, z) => row.map((tile, x) => {
        if (!visibility.explored[z]?.[x])
            return /** @type {const} */ ('void');
        const terrain = presentation.terrain[tile.terrainId];
        if (!terrain)
            throw new Error(`Missing terrain presentation: ${tile.terrainId}`);
        return terrain;
    }));
    return immutableRenderSnapshot({ epoch: presentation.epoch, revision: snapshot.revision, world: { worldId: `${presentation.epoch}:${floor.mapId}`, revision: snapshot.revision, width: floor.width, height: floor.height, biomeId: presentation.biomeId, tiles, visible: visibility.visible, explored: visibility.explored, exits: Object.values(floor.exits).filter(exit => exitIds.has(exit.exitId) && visibility.explored[exit.position.z]?.[exit.position.x]).map(exit => ({ id: exit.exitId, ...exit.position, kind: exit.kind })), props: presentation.props.filter(prop => visibility.explored[prop.z]?.[prop.x]) }, actors, pickups, events: presentation.events.filter(event => visibility.visible[event.z]?.[event.x]) });
}
