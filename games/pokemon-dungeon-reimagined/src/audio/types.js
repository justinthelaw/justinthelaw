/** Presentation audio never owns simulation, saved resources or game clocks. */
/** @typedef {{readonly master:number,readonly music:number,readonly effects:number,readonly muted:boolean}} AudioPreferences */
/** @typedef {'sine'|'triangle'|'square'|'sawtooth'} Wave */
/** @typedef {{readonly wave:Wave,readonly attack:number,readonly release:number,readonly gain:number,readonly glide:number}} Patch */
/** @typedef {{readonly beat:number,readonly length:number,readonly pitch:number,readonly patch:string,readonly velocity:number}} Note */
/** @typedef {{readonly id:string,readonly title:string,readonly role:string,readonly bpm:number,readonly beats:number,readonly loop:boolean,readonly notes:readonly Note[]}} Cue */
/** @typedef {{readonly revision:string,readonly authorship:Readonly<Record<string,string>>,readonly sourceQualification:{readonly repository:string,readonly commit:string,readonly edition:string,readonly blueParity:string,readonly files:readonly {readonly path:string,readonly sha256:string}[]},readonly patches:Readonly<Record<string,Patch>>,readonly music:readonly Cue[],readonly effects:readonly Cue[],readonly nativeMusic:readonly {readonly nativeId:number,readonly symbol:string,readonly cueId:string,readonly qualification:string}[],readonly dungeonMusicIds:readonly number[],readonly nativeEffects:readonly {readonly nativeId:number,readonly cueId:string,readonly source:string}[],readonly unassignedNativeMusic:readonly {readonly nativeId:number,readonly symbol:string,readonly reason:string}[],readonly futureIntegration:readonly string[]}} AudioCatalog */
/** Caller supplies IDs from committed presentation output, never a simulation timer. */
/** @typedef {{readonly epoch:string,readonly revision:number,readonly musicCue:string|null,readonly effects:readonly {readonly eventId:number,readonly cueId:string}[]}} AudioPresentation */
/** @typedef {'locked'|'ready'|'paused'|'unsupported'|'denied'|'disposed'} AudioState */
/** @typedef {{readonly state:AudioState,readonly reason:string|null,readonly epoch:string|null,readonly voices:number}} AudioStatus */
export {};
