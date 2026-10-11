/** Genuine prospective end-phase history. NEW typedef only: no legacy schema
 * admission, migration, default producer or live selection is supplied here.
 * ActorId is an unreused browser generation token, including retired records.
 * InitEntityFromSpawnInfo sets the three actor counters; ResetMonEntityData does
 * not. Fresh/new-floor !r6 loop and genuine leader change reset the alert.
 * Actual move execution increments linked count capped4; only leader end resets
 * it. Warp Scarf increments only while active, caps19 and resets on activation.
 * Quicksave serializes actor counters and the whole unk644 alert block; browser
 * histories must persist both and must never be manufactured. Caller authenticates all producers and saves.
 * @typedef {{bellyEmpty:boolean; usedLinkedMovesCounter:number;
 * turnsSinceWarpScarfActivation:number;}} SinisterActorEndHistory
 * @typedef {{emptyBellyAlert:number;
 * actors:Record<string,SinisterActorEndHistory>;}} SinisterEndState
 */
export {};
