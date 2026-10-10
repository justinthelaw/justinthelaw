/** Original name-entry state machine using the qualified Rescue Team layout.
 * Adjacency and editing rules come from comparative naming_screen.c; Blue video
 * confirms the 13-column, six-row keyboard with three left-side commands.
 * Raw key positions below are Red window-relative facts, not Blue coordinates.
 */
/** @typedef {'overwrite'|'insert'} NamingMode */
/** @typedef {{text:string,caret:number,selected:number,mode:NamingMode}} NamingState */
/** @typedef {'north'|'south'|'west'|'east'} NamingDirection */
/** @typedef {{index:number,up:number,down:number,left:number,right:number,x:number,y:number,kind:'character'|'mode'|'delete'|'end',character:string}} NamingKey */

export const NAMING_LIMIT = 10;
export const NAMING_END_KEY = 2;
export const NAMING_INITIAL_KEY = 3;
const SYMBOLS = '\u22ef\u2018\u2019\u201c\u201d\u2642\u2640';
/** @type {Readonly<Record<NamingDirection,'up'|'down'|'left'|'right'>>} */
const NAVIGATION = Object.freeze({ north: 'up', south: 'down', west: 'left', east: 'right' });
/** Source IDs3..83 exclude three nonselectable blanks. Each tuple retains its
 * explicit up/down/left/right links rather than assuming rectangular wrapping.
 * @type {readonly (readonly [number,number,number,number,number,number,string])[]} */
const LAYOUT = [
  [5,4,81,9,8,36,"mode"],
  [3,5,82,10,8,47,"delete"],
  [4,3,83,11,8,58,"end"],
  [11,7,78,12,36,3,"a"],
  [6,8,79,13,36,14,"n"],
  [7,9,80,14,36,25,"A"],
  [8,10,3,15,36,36,"N"],
  [9,11,4,16,36,47,"\u00e9"],
  [10,6,5,17,36,58,"+"],
  [17,13,6,18,50,3,"b"],
  [12,14,7,19,50,14,"o"],
  [13,15,8,20,50,25,"B"],
  [14,16,9,21,50,36,"O"],
  [15,17,10,22,50,47,"1"],
  [16,12,11,23,50,58,"-"],
  [23,19,12,24,64,3,"c"],
  [18,20,13,25,64,14,"p"],
  [19,21,14,26,64,25,"C"],
  [20,22,15,27,64,36,"P"],
  [21,23,16,28,64,47,"2"],
  [22,18,17,29,64,58,","],
  [29,25,18,30,78,3,"d"],
  [24,26,19,31,78,14,"q"],
  [25,27,20,32,78,25,"D"],
  [26,28,21,33,78,36,"Q"],
  [27,29,22,34,78,47,"3"],
  [28,24,23,35,78,58,"."],
  [35,31,24,36,92,3,"e"],
  [30,32,25,37,92,14,"r"],
  [31,33,26,38,92,25,"E"],
  [32,34,27,39,92,36,"R"],
  [33,35,28,40,92,47,"4"],
  [34,30,29,41,92,58,"!"],
  [41,37,30,42,106,3,"f"],
  [36,38,31,43,106,14,"s"],
  [37,39,32,44,106,25,"F"],
  [38,40,33,45,106,36,"S"],
  [39,41,34,46,106,47,"5"],
  [40,36,35,47,106,58,"?"],
  [47,43,36,48,120,3,"g"],
  [42,44,37,49,120,14,"t"],
  [43,45,38,50,120,25,"G"],
  [44,46,39,51,120,36,"T"],
  [45,47,40,52,120,47,"6"],
  [46,42,41,53,120,58,"\u2018"],
  [53,49,42,54,134,3,"h"],
  [48,50,43,55,134,14,"u"],
  [49,51,44,56,134,25,"H"],
  [50,52,45,57,134,36,"U"],
  [51,53,46,58,134,47,"7"],
  [52,48,47,59,134,58,"\u2019"],
  [59,55,48,60,148,3,"i"],
  [54,56,49,61,148,14,"v"],
  [55,57,50,62,148,25,"I"],
  [56,58,51,63,148,36,"V"],
  [57,59,52,64,148,47,"8"],
  [58,54,53,65,148,58,"\u201c"],
  [65,61,54,66,162,3,"j"],
  [60,62,55,67,162,14,"w"],
  [61,63,56,68,162,25,"J"],
  [62,64,57,69,162,36,"W"],
  [63,65,58,70,162,47,"9"],
  [64,60,59,71,162,58,"\u201d"],
  [71,67,60,72,176,3,"k"],
  [66,68,61,73,176,14,"x"],
  [67,69,62,74,176,25,"K"],
  [68,70,63,75,176,36,"X"],
  [69,71,64,76,176,47,"0"],
  [70,66,65,77,176,58,"\u2642"],
  [77,73,66,78,190,3,"l"],
  [72,74,67,79,190,14,"y"],
  [73,75,68,80,190,25,"L"],
  [74,76,69,81,190,36,"Y"],
  [75,77,70,82,190,47,":"],
  [76,72,71,83,190,58,"\u2640"],
  [83,79,72,6,204,3,"m"],
  [78,80,73,7,204,14,"z"],
  [79,81,74,8,204,25,"M"],
  [80,82,75,3,204,36,"Z"],
  [81,83,76,4,204,47,"\u22ef"],
  [82,78,77,5,204,58," "],
 ];
/** @type {readonly NamingKey[]} */
export const NAMING_KEYS = Object.freeze(LAYOUT.map(([up,down,left,right,x,y,value],index) => Object.freeze({
  index,up:up-3,down:down-3,left:left-3,right:right-3,x,y,
  kind: index===0?'mode':index===1?'delete':index===2?'end':'character',
  character:index<3?'':value,
})));

/** Preserve the previous printable alphabet and add the native keypad symbols.
 * @param {string} character */
export function isNamingCharacter(character) {
  const code=character.codePointAt(0)??0;
  return code>=32&&code<=126||character==='é'||SYMBOLS.includes(character)&&character.length===1;
}
/** @param {unknown} value @returns {value is string} */
export function isNamingText(value) {
  return typeof value==='string'&&Array.from(value).length<=NAMING_LIMIT&&Array.from(value).every(isNamingCharacter);
}
/** @param {string} value */
export function sanitizeNamingText(value) {
  return Array.from(value.normalize('NFC')).filter(isNamingCharacter).slice(0,NAMING_LIMIT).join('');
}
/** Every native re-entry resets OVR and selects lowercase a.
 * @param {string} value @returns {NamingState} */
export function createNamingState(value) {
  const text=sanitizeNamingText(value);
  return {text,caret:Math.min(Array.from(text).length,NAMING_LIMIT-1),selected:NAMING_INITIAL_KEY,mode:'overwrite'};
}
/** Optional save extension; old checkpoints without it remain valid.
 * @param {unknown} value @returns {value is NamingState} */
export function validateNamingState(value) {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const state=/** @type {Record<string,unknown>} */(value);
  return Object.keys(state).sort().join(',')==='caret,mode,selected,text'&&isNamingText(state.text)&&
    typeof state.caret==='number'&&Number.isInteger(state.caret)&&state.caret>=0&&state.caret<=Math.min(Array.from(state.text).length,9)&&
    typeof state.selected==='number'&&Number.isInteger(state.selected)&&state.selected>=0&&state.selected<NAMING_KEYS.length&&
    (state.mode==='overwrite'||state.mode==='insert');
}
/** @param {NamingState} state */
export function namingLabels(state) {
  return NAMING_KEYS.map(key=>key.kind==='mode'?state.mode==='overwrite'?'OVR':'INS':key.kind==='delete'?'DEL':key.kind==='end'?'END':key.character===' '?'Space':key.character);
}
/** @param {NamingState} state @param {NamingDirection} direction */
export function moveNamingSelection(state,direction) {
  const key=NAMING_KEYS[state.selected];if(!key)return false;
  const next=key[NAVIGATION[direction]];
  if(typeof next!=='number'||next===state.selected)return false;
  state.selected=next;return true;
}
/** @param {NamingState} state @param {-1|1} delta */
export function moveNamingCaret(state,delta) {
  const next=Math.max(0,Math.min(9,Array.from(state.text).length,state.caret+delta));
  if(next===state.caret)return false;
  state.caret=next;return true;
}
/** Native DEL deletes at the caret; it backspaces only at the terminator.
 * @param {NamingState} state */
export function deleteNamingCharacter(state) {
  const letters=Array.from(state.text);
  if(state.caret===letters.length){if(state.caret===0)return false;state.caret--;}
  letters.splice(state.caret,1);state.text=letters.join('');return true;
}
/** @param {NamingState} state @param {number} [selected]
 * @returns {'changed'|'end'|'denied'} */
export function activateNamingKey(state,selected=state.selected) {
  const key=NAMING_KEYS[selected];if(!key)return 'denied';
  state.selected=selected;
  if(key.kind==='mode'){state.mode=state.mode==='overwrite'?'insert':'overwrite';return 'changed';}
  if(key.kind==='delete')return deleteNamingCharacter(state)?'changed':'denied';
  if(key.kind==='end')return state.text.length?'end':'denied';
  const letters=Array.from(state.text);
  if(state.mode==='insert')letters.splice(state.caret,0,key.character);
  else letters[state.caret]=key.character;
  state.text=letters.slice(0,NAMING_LIMIT).join('');
  if(state.caret<9)state.caret++;else state.selected=NAMING_END_KEY;
  return 'changed';
}
/** Browser text entry remains an accessible alternative to the native keypad.
 * @param {NamingState} state @param {string} value @param {number} [caret] */
export function replaceNamingText(state,value,caret=Array.from(value).length) {
  state.text=sanitizeNamingText(value);
  state.caret=Math.max(0,Math.min(9,Array.from(state.text).length,Math.floor(caret)));
}
/** Confirmation preserves spaces; it never substitutes a fallback name.
 * @param {string} value @param {(value:string)=>number} width
 * @returns {'empty'|'too-wide'|null} */
export function namingError(value,width) {
  if(!value.length||Array.from(value).every(character=>character===' '))return 'empty';
  return width(value)>60?'too-wide':null;
}
