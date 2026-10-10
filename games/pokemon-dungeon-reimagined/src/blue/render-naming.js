import { text, textWidth, nativeNamingFrame, nativeNamingUnderline, nativeNamingCursor, nativeNamingCaret } from './render-font.js';
import { NAMING_KEYS, namingLabels } from './naming.js';
/** @typedef {import('./renderer.js').View} View */
/** @typedef {import('./naming.js').NamingState} NamingState */
/** @typedef {{index:number,label:string,x:number,y:number,width:number,height:number}} NamingChoice */

const FRAME_MS = 1000 / 60;
/** Blue footage fixes these outer panels. Key offsets and cursor placement use
 * the comparative Red layout centered within the larger Blue panels; these
 * interior positions remain visually qualified, not a DS binary-coordinate claim.
 */
const NAME_PANEL = { x: 32, y: 16, width: 192, height: 56 };
const KEY_PANEL = { x: 8, y: 88, width: 240, height: 88 };
const KEY_ORIGIN = { x: 16, y: 96 };
/** @type {NamingState|null} */ let currentEditor = null;
let enteredAt = 0, selectedAt = 0, lastSelected = -1, selectionOffset = 1;

/** Native 81-key naming screen. The renderer owns the animated aura behind it.
 * @param {CanvasRenderingContext2D} context @param {View} view @param {number} time
 * @returns {NamingChoice[]}
 */
export function renderNaming(context, view, time) {
  const editor = view.naming;
  if (!editor || view.dialogue) return [];
  if (currentEditor !== editor) {
    currentEditor = editor; enteredAt = time; selectedAt = time;
    lastSelected = editor.selected; selectionOffset = 1;
  } else if (lastSelected !== editor.selected) {
    lastSelected = editor.selected; selectedAt = time; selectionOffset = 8;
  }
  const pink = view.gender === 'female';
  nativeNamingFrame(context, NAME_PANEL.x, NAME_PANEL.y, NAME_PANEL.width, NAME_PANEL.height, pink);
  nativeNamingFrame(context, KEY_PANEL.x, KEY_PANEL.y, KEY_PANEL.width, KEY_PANEL.height, pink);
  text(context, view.nameTarget === 'hero' ? 'What is your name?' : "What is your partner's nickname?", 40, 22, { maxWidth: 176 });
  const letters = Array.from(editor.text), nameX = 78, nameY = 44;
  const width = textWidth(editor.text);
  nativeNamingUnderline(context, nameX, nameY + 11, 60);
  text(context, editor.text, nameX, nameY, { color: width > 60 ? '#fb0000' : letters.length === 10 ? '#00fbfb' : '#fbfbfb' });
  if (view.reducedMotion || ((Math.floor((time - enteredAt) / FRAME_MS) + 5) & 8)) {
    const before = textWidth(letters.slice(0, editor.caret).join(''));
    const caretWidth = letters[editor.caret] ? textWidth(letters[editor.caret] ?? '') : 8;
    nativeNamingCaret(context, Math.round(nameX + before + caretWidth / 2 - 8), nameY + 12);
  }
  const labels = namingLabels(editor);
  /** @type {NamingChoice[]} */ const bounds = [];
  for (const key of NAMING_KEYS) {
    const x = KEY_ORIGIN.x + key.x, y = KEY_ORIGIN.y + key.y;
    const command = key.kind !== 'character';
    const label = labels[key.index] ?? '';
    const glyph = key.character === ' ' ? '\u2423' : label;
    const color = key.kind === 'mode' ? editor.mode === 'overwrite' ? '#00fb00' : '#fbfb00' : '#fbfbfb';
    // Native characters occupy a 12-pixel cell; command labels use proportional
    // text, and Space uses the distinct source0x8159 display glyph.
    const left = command ? x + 3 : key.character === ' ' ? x + 1 : x + Math.floor((12 - textWidth(glyph)) / 2);
    text(context, glyph, left, y, { color });
    // Character targets cover the 12-pixel glyph cell. The cursor's x - 5
    // placement would route a wide glyph's right edge into the next key.
    bounds.push({ index: key.index, label, x: command ? x - 5 : x - 1, y: y - 1, width: command ? 28 : 14, height: 11 });
    if (key.index === editor.selected && (view.reducedMotion || ((Math.floor((time - selectedAt) / FRAME_MS) + selectionOffset) & 8))) {
      nativeNamingCursor(context, x - 5, y + 1);
    }
  }
  return bounds;
}
