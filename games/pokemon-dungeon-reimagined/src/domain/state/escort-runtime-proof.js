import { NATIVE_GENERAL_RANDOM_FACTS as FACTS } from '../../../content/authored/native-general-rng-facts.js';
import { ESCORT_WORK_REVISION } from './escort-work-revision.js';
import { createProspectiveNativeGeneralRandom } from '../gameplay/native-escort-entry.js';
import { validateNativeGeneralRandomState } from '../native-general-rng.js';
/** Independent logarithmic affine LCG composition proves the retained bit pattern
 * against explicit prospective adoption. It neither executes entry consumers nor
 * introduces a historical native seed/reseed witness. No global state is read.
 * @param {number} seed @param {number} transitions */
function prospectiveWord(seed,transitions) {
  let word = seed,multiplier = FACTS.multiplier,increment = FACTS.increment,remaining = transitions;
  while (remaining > 0) {
    if (remaining % 2 === 1) word = (Math.imul(word,multiplier)+increment) >>> 0;
    increment = Math.imul(increment,(multiplier+1) >>> 0) >>> 0;
    multiplier = Math.imul(multiplier,multiplier) >>> 0;
    remaining = Math.floor(remaining/2);
  }
  return word;
}
/** @param {unknown} input @returns {string|null} */
export function escortGeneralStateProblem(input) {
  let stream; try { stream = validateNativeGeneralRandomState(input); } catch { return 'Invalid prospective native general state.'; }
  if (stream.transitions % 2 !== 0 || stream.word !== prospectiveWord(createProspectiveNativeGeneralRandom().word,stream.transitions)) return 'The retained prospective conversion stream must follow its explicit source boot seed and actual two-transition steps.';
  return null;
}
/** @param {import('../../contracts/campaign.js').CampaignState} state @param {number} [revision] @returns {string|null} */
export function escortRuntimeProblem(state,revision = state.revision) {
  if (!Number.isSafeInteger(revision) || revision < state.revision || revision > state.revision+1) return 'General adoption requires an independently bounded actual committed/private-entry revision.';
  if (state.contentRevision !== ESCORT_WORK_REVISION || state.escortRuntime === undefined) return 'Unknown exact prospective escort/general owner.';
  const runtime = state.escortRuntime;
  if (runtime === null) return state.session?.entry.nativeEscort || state.session?.escortGuest || Object.values(state.session?.actors ?? {}).some(actor => actor.binding.kind === 'escort-guest') ? 'An unadopted campaign cannot invent guest or native conversion history.' : null;
  if (runtime.policyId !== 'native-general-prospective-conversions-and-pickup-v1' || !Number.isSafeInteger(runtime.adoptedRevision) || runtime.adoptedRevision < 1 || runtime.adoptedRevision > revision) return 'Explicit prospective general adoption needs its actual committed revision and mapping.';
  if (runtime.adoptedRevision > state.revision && (!state.session || state.session.entry.entryRevision !== revision || !state.session.entry.nativeEscort || state.session.entry.nativeEscort.input.generalRandom.transitions !== 0)) return 'Private first adoption requires its actual fresh entry and initial source conversion witness.';
  return escortGeneralStateProblem(runtime.generalRandom);
}
