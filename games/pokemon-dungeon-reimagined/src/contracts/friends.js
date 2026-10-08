/** Native stage transitions own CLEAR_COUNT resets; the chapter owner stores
 * historical boundaries, not a duplicate roster, inventory or expedition.
 * @typedef {{startedRevision:number;startedDay:number;priorExpeditions:number;priorJobs:number;
 * phase:'dream'|'morning-ready'|'morning'|'tour'|'welcome'|'encounter-ready'|'encounter'|'rest'|'work-three'|'meanies-morning'|'meanies-ready'|'meanies'|'work-two'|'caterpie-morning'|'sinister-ready'|'sinister';
 * magnemiteId:import('../contracts.js').PokemonId|null;
 * nicknamePrompt:'ask'|'edit'|null;
 * missionAreaRewards?:import('./bronze-jobs.js').MissionAreaReceipt[];
 * purchases:{areaId:import('./campaign.js').FriendAreaId;revision:number;price:number;}[];
 * }} FriendsState */
export {};
