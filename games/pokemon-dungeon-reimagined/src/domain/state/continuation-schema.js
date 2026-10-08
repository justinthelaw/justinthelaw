import { SHAPES } from './schema.js';
/** @typedef {import('./schema.js').Shape} Shape */

const scheduler = SHAPES.SchedulerState;
if (scheduler?.kind !== 'union' || scheduler.members[0]?.kind !== 'object') throw new TypeError('Missing frozen scheduler shape.');

/** Keep every historical shape/name intact. Only this exact successor registry
 * adds a scheduler variant; continuing PCs use existing fields, not a backlog or
 * extra discriminator node in a potentially near-limit imported campaign.
 * @type {Readonly<Record<string,Shape>>} */
export const CONTINUATION_SHAPES = Object.freeze({ ...SHAPES,
  SchedulerState: { kind: 'union', members: [...scheduler.members,
    { kind: 'object', fields: { ...scheduler.members[0].fields, kind: { kind: 'literal', value: 'continuing' } } },
  ] },
});

/** Shape data is immutable, including the shared unchanged predecessor shapes.
 * @param {unknown} value */
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
}
for (const shape of Object.values(CONTINUATION_SHAPES)) freeze(shape);
