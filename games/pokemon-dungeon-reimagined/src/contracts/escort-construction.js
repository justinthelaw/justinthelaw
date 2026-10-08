/** Exact fresh-construction witness. The caller supplies a previously validated
 * canonical draft; all pre-existing generated numbers are below beforeNext.
 * This record authenticates this constructor's newly emitted allocation range,
 * not historical guest admission, native source slots or later saved lifecycle.
 * @typedef {{kind:'move-slot'|'actor'|'container',id:string}} EscortAllocation
 * @typedef {{prepared:import('./escort-work.js').PreparedGuest,allocation:{beforeNext:number,afterNext:number,allocated:EscortAllocation[]}}} EscortConstructionWitness
 */
export {};
