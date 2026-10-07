/** Persistent ground owners for the ordinary early work interval. These types
 * are not admission: current content must explicitly enable their exact shape.
 * @typedef {import('./campaign.js').JobRecord & {source:Extract<import('./campaign.js').JobRecord['source'],{kind:'generated',posting:'board'|'mailbox'}>}} EarlyJob
 * @typedef {{kind:'news',newsId:number}|{kind:'job',jobId:import('../contracts.js').JobId}} MailboxSlot
 * @typedef {{
 * startedRevision:number,
 * boardJobIds:import('../contracts.js').JobId[],
 * mailbox:MailboxSlot[],
 * newsRead:number[],
 * mailPending:boolean,
 * returned:null|{sessionId:import('../contracts.js').SessionId,outcome:'success'|'fainting'|'wind-expulsion'|'give-up',jobIds:import('../contracts.js').JobId[],cursor:number},
 * reward:null|{jobId:import('../contracts.js').JobId,preparedRevision:number,nextItem:number},
 * }} EarlyWorkState
 */
export {};
