import { SHAPES } from './schema.js';
import { instanceId } from '../ids.js';

/** @typedef {import('../../contracts/campaign.js').StateIssue} StateIssue */
/** @typedef {import('../../contracts.js').JsonValue} JsonValue */
/** @typedef {import('./schema.js').Shape} Shape */
/** @typedef {(name:string, value:JsonValue, path:string)=>void} Visitor */
export const ISSUE_LIMIT = 100;

/** Escape user-controlled map keys without creating unsafe diagnostic paths.
 * @param {string} path @param {string|number} key
 */
export function pointer(path, key) {
  return `${path}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`;
}

/** @param {StateIssue[]} issues @param {StateIssue['code']} code @param {string} path @param {string} message */
export function issue(issues, code, path, message) {
  if (issues.length < ISSUE_LIMIT) issues.push({ code, path: path.slice(0, 2048), message: message.slice(0, 256) });
}

/** The registry enumerates every persisted field and every union variant.
 * Catalog predicates are intentionally deferred until this entire pass succeeds.
 * @param {JsonValue} value @param {string} name @param {StateIssue[]} issues
 * @param {Visitor} [visitor] @param {string} [path] @param {Readonly<Record<string,Shape>>} [shapes]
 * @returns {boolean}
 */
export function inspectShape(value, name, issues, visitor, path = '', shapes = SHAPES) {
  const shape = shapes[name];
  if (!shape) throw new TypeError('Unknown internal state shape.');
  return inspect(value, shape, path, issues, visitor, shapes);
}

/** @param {JsonValue} value @param {Shape} shape @param {string} path
 * @param {StateIssue[]} issues @param {Visitor|undefined} visitor
 * @param {Readonly<Record<string,Shape>>} shapes @returns {boolean}
 */
function inspect(value, shape, path, issues, visitor, shapes) {
  const fail = () => { issue(issues, 'shape', path, 'Value does not match the required state shape.'); return false; };
  switch (shape.kind) {
    case 'ref': {
      const valid = inspectShape(value, shape.name, issues, visitor, path, shapes);
      if (valid && visitor) visitor(shape.name, value, path);
      return valid;
    }
    case 'literal': return value === shape.value || fail();
    case 'integer': return (typeof value === 'number' && Number.isSafeInteger(value)) || fail();
    case 'number': return (typeof value === 'number' && Number.isFinite(value)) || fail();
    case 'boolean': return typeof value === 'boolean' || fail();
    case 'string': return typeof value === 'string' || fail();
    case 'instance':
      // Nullable IDs probe this branch before null. Reject their known type
      // mismatch without constructing/catching an exception for every tile.
      if (typeof value !== 'string') return fail();
      try { instanceId(shape.name, value); return true; } catch { return fail(); }
    case 'catalog':
      return (typeof value === 'string' && /^[a-z][a-z0-9-]{0,95}$/.test(value)) || fail();
    case 'union': {
      for (const member of shape.members) {
        // A successful isolated probe has already proved this entire member.
        // Only a visitor needs a second walk to deliver the admitted references;
        // repeating a visitorless success multiplies work at each nested union.
        if (inspect(value, member, path, [], undefined, shapes)) return visitor ? inspect(value, member, path, issues, visitor, shapes) : true;
      }
      return fail();
    }
    case 'array': case 'tuple': {
      if (!Array.isArray(value) || (shape.kind === 'tuple' && value.length !== shape.members.length)) return fail();
      let valid = true;
      for (const [index, child] of value.entries()) {
        const member = 'value' in shape ? shape.value : shape.members[index];
        if (!member || !inspect(child, member, pointer(path, index), issues, visitor, shapes)) valid = false;
        if (issues.length >= ISSUE_LIMIT) break;
      }
      return valid;
    }
    case 'object': case 'record': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
      let valid = true;
      if (shape.kind === 'object') {
        for (const key of Object.keys(value)) if (!Object.hasOwn(shape.fields, key)) {
          issue(issues, 'unknown-field', pointer(path, key), 'Unexpected state field.'); valid = false;
        }
        for (const [key, field] of Object.entries(shape.fields)) {
          const child = value[key];
          if (child === undefined) { issue(issues, 'shape', pointer(path, key), 'Required field is absent.'); valid = false; }
          else if (!inspect(child, field, pointer(path, key), issues, visitor, shapes)) valid = false;
          if (issues.length >= ISSUE_LIMIT) break;
        }
      } else {
        for (const [key, child] of Object.entries(value)) {
          if (!inspect(child, shape.value, pointer(path, key), issues, visitor, shapes)) valid = false;
          if (issues.length >= ISSUE_LIMIT) break;
        }
      }
      return valid;
    }
  }
}
