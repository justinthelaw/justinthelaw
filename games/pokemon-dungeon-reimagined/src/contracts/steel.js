/** Persisted route receipts; no duplicate combat or inventory state.
 * Boss defeat is deliberately independent of a successful return: native
 * completion flags survive a same-hit recoil loss and select poststory next time.
 * @typedef {{startedRevision:number,requestDay:number,priorExpeditions:number,attempts:number,bossVisits:number,bossDefeated:boolean,phase:'travel'|'exploration'|'battle-intro'|'battle'|'departure'|'bridge'|'crossing'|'thanks'|'home'|'complete'|'loss'|'ready'|'poststory',rewardCursor:number,rewardChoice:boolean,lastSessionId:import('../contracts.js').SessionId|null,winRevision:number|null}} SteelState */
export {};
