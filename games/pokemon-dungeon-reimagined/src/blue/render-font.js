/** Native Rescue Team glyph masks and advances, verified against Blue imagery. */
import {NATIVE_GLYPHS} from './render-native-ui-data.js';
import {nativeMoveIcon} from './render-native-ui.js';
export {panel,cursor,dialogueArrow,nativeHud,nativeDamage,nativeTouchToolbar,touchToolbarBounds,nativeMenuFrame,nativeMoveIcon,nativeHeart,nativeNamingCursor,nativeNamingCaret,nativeNamingFrame,nativeNamingUnderline,disposeNativeUi} from './render-native-ui.js';

/** @type {Map<string,HTMLCanvasElement>} */
const TINTS=new Map();
const KEYS=Object.keys(NATIVE_GLYPHS),INDEX=new Map(KEYS.map((key,index)=>[key,index]));
const MAX_TINTS=16,GLYPH_WIDTH=12,GLYPH_HEIGHT=11;

/** @param {string} character */
function normalize(character){
  if(NATIVE_GLYPHS[character])return character;
  if(character==='\u2019'||character==='\u2018')return "'";
  if(character==='\u201c'||character==='\u201d')return '"';
  if(character==='\u2014'||character==='\u2013')return '-';
  if(character==='\u2026')return '.';
  return character;
}

/** @param {string} character */
function characterGlyph(character){return NATIVE_GLYPHS[normalize(character)]??NATIVE_GLYPHS['?'];}

/** Native advance includes spacing; there is no extra trailing-pixel deduction.
 * @param {string} value @param {number} [scale] */
export function textWidth(value,scale=1){return Array.from(value).reduce((width,character)=>width+(character==='★'?8:characterGlyph(character)?.advance??6),0)*scale;}

/** @param {string} color @param {boolean} shadow */
function glyphAtlas(color,shadow){
  const key=`${shadow?'shadow':'ink'}:${color}`,existing=TINTS.get(key);
  if(existing){TINTS.delete(key);TINTS.set(key,existing);return existing;}
  const canvas=document.createElement('canvas');canvas.width=KEYS.length*GLYPH_WIDTH;canvas.height=GLYPH_HEIGHT;
  const context=canvas.getContext('2d');if(!context)throw Error('A 2D canvas is required for text.');
  context.fillStyle=color;
  KEYS.forEach((character,index)=>{
    const glyph=NATIVE_GLYPHS[character];if(!glyph)return;
    const rows=shadow?glyph.shadow:glyph.rows;
    rows.forEach((row,y)=>{for(let x=0;x<GLYPH_WIDTH;x++)if((row>>x)&1)context.fillRect(index*GLYPH_WIDTH+x,y,1,1);});
  });
  TINTS.set(key,canvas);
  while(TINTS.size>MAX_TINTS){const oldest=TINTS.entries().next().value;if(!oldest)break;oldest[1].width=0;oldest[1].height=0;TINTS.delete(oldest[0]);}
  return canvas;
}

/** @param {CanvasRenderingContext2D} context @param {string} value @param {number} x @param {number} y
 * @param {{color?:string,shadow?:boolean,scale?:number,align?:'left'|'center'|'right',maxWidth?:number}} [options] */
export function text(context,value,x,y,options={}){
  const scale=options.scale??1;
  let left=Math.round(x-(options.align==='center'?textWidth(value,scale)/2:options.align==='right'?textWidth(value,scale):0));
  const top=Math.round(y),start=left,image=glyphAtlas(options.color??'#fbfbfb',false);
  const shadow=options.shadow===false?null:glyphAtlas('#000000',true);
  for(const character of Array.from(value)){
    const glyph=characterGlyph(character),advance=character==='★'?8:glyph?.advance??6;
    if(options.maxWidth!==undefined&&left-start+advance*scale>options.maxWidth)break;
    if(character==='★')nativeMoveIcon(context,'star',left,top,scale);
    else if(character!==' '){
      const index=INDEX.get(normalize(character))??INDEX.get('?')??0;
      if(shadow)context.drawImage(shadow,index*GLYPH_WIDTH,0,GLYPH_WIDTH,GLYPH_HEIGHT,left,top,GLYPH_WIDTH*scale,GLYPH_HEIGHT*scale);
      context.drawImage(image,index*GLYPH_WIDTH,0,GLYPH_WIDTH,GLYPH_HEIGHT,left,top,GLYPH_WIDTH*scale,GLYPH_HEIGHT*scale);
    }
    left+=advance*scale;
  }
  return left-start;
}

/** Bounded lazy tint canvases need no async loading; release them on teardown. */
export function disposeFont(){for(const image of TINTS.values()){image.width=0;image.height=0;}TINTS.clear();}

/** Preserve explicit paragraph breaks and wrap whole words at pixel widths.
 * @param {string} value @param {number} width */
export function wrapText(value, width) {
  /** @type {string[]} */ const lines = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(candidate) > width) { lines.push(line); line = ''; }
      if (textWidth(word) > width) {
        for (const character of Array.from(word)) {
          if (line && textWidth(line + character) > width) { lines.push(line); line = ''; }
          line += character;
        }
      } else line = line ? `${line} ${word}` : word;
    }
    lines.push(line);
  }
  return lines;
}

/** Native story portraits sit above the window, leaving three full-width text
 * lines. Reserve the speaker label only on each page's first line.
 * @param {string} value @param {string} [speaker] @returns {string[]} */
export function paginateDialogue(value, speaker = '') {
  const prefixWidth=speaker?textWidth(`${speaker}: `):0;
  /** @type {string[]} */const pages=[];
  /** @type {string[]} */let lines=[];
  let line='';
  const available=()=>Math.max(32,204-(lines.length===0?prefixWidth:0));
  function finishLine(){lines.push(line);line='';if(lines.length===3){pages.push(lines.join('\n'));lines=[];}}
  const paragraphs=value.split('\n');
  paragraphs.forEach((paragraph,paragraphIndex)=>{
    for(const word of paragraph.split(/\s+/).filter(Boolean)){
      const candidate=line?`${line} ${word}`:word;
      if(line&&textWidth(candidate)>available())finishLine();
      if(textWidth(word)>available()){
        for(const character of Array.from(word)){if(line&&textWidth(line+character)>available())finishLine();line+=character;}
      }else line=line?`${line} ${word}`:word;
    }
    if(paragraphIndex<paragraphs.length-1)finishLine();
  });
  if(line||(!lines.length&&!pages.length))finishLine();
  if(lines.length)pages.push(lines.join('\n'));
  return pages;
}
