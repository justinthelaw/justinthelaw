/** Presentation-only, detached records. X/Z are logical tiles; optional actor elevation is world units above the ground (default zero). */
/** @typedef {'idle'|'walk'|'turn'|'attack-physical'|'attack-special'|'cast-status'|'hit-light'|'hit-heavy'|'defeat'|'celebrate'|'rest-sleep'|'interact'} ClipId */
/** @typedef {'wall'|'floor'|'water'|'lava'|'void'} TerrainView */
/** @typedef {readonly (readonly boolean[])[]} Mask */
/** @typedef {{readonly id:string,readonly kind:string,readonly x:number,readonly z:number,readonly yaw:number}} PropView */
/** @typedef {{readonly id:string,readonly x:number,readonly z:number,readonly kind:string}} ExitView */
/** @typedef {{readonly worldId:string,readonly revision:number,readonly width:number,readonly height:number,readonly biomeId:string,readonly tiles:readonly (readonly TerrainView[])[],readonly visible:Mask,readonly explored:Mask,readonly exits:readonly ExitView[],readonly props:readonly PropView[]}} WorldView */
/** @typedef {{readonly id:string,readonly label:string}} StatusView */
/** @typedef {{readonly actorId:string,readonly speciesId:string,readonly formId:string|null,readonly name:string,readonly x:number,readonly z:number,readonly elevation?:number,readonly heading:number,readonly role:'hero'|'partner'|'boss'|'enemy'|'client'|'npc',readonly hp:number,readonly maxHp:number,readonly statuses:readonly StatusView[],readonly clip:ClipId,readonly clipToken:string,readonly tint:string,readonly bounds:{readonly width:number,readonly height:number}}} ActorView */
/** @typedef {{readonly pickupId:string,readonly x:number,readonly z:number,readonly kind:'item'|'money'|'trap',readonly label:string,readonly quantity:number,readonly color:string}} PickupView */
/** @typedef {{readonly eventId:number,readonly x:number,readonly z:number,readonly type:'hit'|'heal'|'status',readonly color:string}} EffectView */
/** @typedef {{readonly epoch:string,readonly revision:number,readonly world:WorldView,readonly actors:readonly ActorView[],readonly pickups:readonly PickupView[],readonly events:readonly EffectView[]}} RenderSnapshot */
/** Visibility is required domain output; no renderer algorithm derives it from explored state. */
/** @typedef {{readonly mapId:string,readonly revision:number,readonly visible:Mask,readonly explored:Mask,readonly actorIds:readonly string[],readonly itemIds:readonly string[],readonly trapIds:readonly string[],readonly exitIds:readonly string[]}} VisibilityView */
/** @typedef {Omit<ActorView,'actorId'|'speciesId'|'formId'|'x'|'z'|'heading'|'hp'> & {readonly appearance:{readonly speciesId:string,readonly formId:string|null}}} ActorPresentation */
/** @typedef {{readonly epoch:string,readonly biomeId:string,readonly terrain:Readonly<Record<string,TerrainView>>,readonly actors:Readonly<Record<string,ActorPresentation>>,readonly items:Readonly<Record<string,{readonly label:string,readonly color:string,readonly kind:'item'|'money'}>>,readonly traps:Readonly<Record<string,{readonly label:string,readonly color:string}>>,readonly props:readonly PropView[],readonly events:readonly EffectView[]}} PresentationCatalog */
export {};
