/** Browser audio is presentation only; it never advances a turn or a scene. */
/** @typedef {{readonly master:number,readonly music:number,readonly effects:number,readonly muted:boolean}} AudioPreferences */
/** @typedef {'sine'|'triangle'|'square'|'sawtooth'} Wave */
/** @typedef {{readonly wave:Wave,readonly attack:number,readonly release:number,readonly gain:number,readonly glide:number}} Patch */
/** @typedef {{readonly beat:number,readonly length:number,readonly pitch:number,readonly patch:string,readonly velocity:number}} Note */
/** @typedef {{readonly id:string,readonly bpm:number,readonly beats:number,readonly loop:boolean,readonly notes:readonly Note[]}} Cue */
/** @typedef {{readonly patches:Readonly<Record<string,Patch>>,readonly music:readonly Cue[],readonly effects:readonly Cue[]}} OpeningAudioBank */
/** @typedef {{readonly epoch:string,readonly revision:number,readonly musicCue:string|null,readonly effects:readonly {readonly eventId:number,readonly cueId:string}[]}} AudioPresentation */
/** @typedef {'locked'|'ready'|'paused'|'unsupported'|'denied'|'disposed'} AudioState */
/** @typedef {{readonly state:AudioState,readonly reason:string|null,readonly epoch:string|null,readonly voices:number}} AudioStatus */
/** @typedef {'opening'|'title'|'menu'|'quiz'|'awakening'|'trouble'|'dungeon'|'clearing'|'reunion'|'failure'|'complete'|'silent'} AudioScene */
/** @typedef {'cursor'|'confirm'|'cancel'|'open'|'denied'|'attack'|'regularAttack'|'hit'|'heal'|'heart'|'berryResult'|'se330'|'se331'|'se332'|'stairs'|'rescue'|'reward'|'levelUp'|'faint'|'se342'|'se343'|'se356'|'se711'|'se678'|'se809'|'se621'} AudioEffect */
export {};
