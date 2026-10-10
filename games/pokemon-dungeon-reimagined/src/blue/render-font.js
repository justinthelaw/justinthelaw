/** Original small bitmap lettering. No platform font or commercial font file. */
const GLYPHS = {
  A:'01110/10001/10001/11111/10001/10001/10001',B:'11110/10001/10001/11110/10001/10001/11110',
  C:'01111/10000/10000/10000/10000/10000/01111',D:'11110/10001/10001/10001/10001/10001/11110',
  E:'11111/10000/10000/11110/10000/10000/11111',F:'11111/10000/10000/11110/10000/10000/10000',
  G:'01111/10000/10000/10111/10001/10001/01111',H:'10001/10001/10001/11111/10001/10001/10001',
  I:'111/010/010/010/010/010/111',J:'00111/00010/00010/00010/10010/10010/01100',
  K:'10001/10010/10100/11000/10100/10010/10001',L:'1000/1000/1000/1000/1000/1000/1111',
  M:'10001/11011/10101/10101/10001/10001/10001',N:'10001/11001/11001/10101/10011/10011/10001',
  O:'01110/10001/10001/10001/10001/10001/01110',P:'11110/10001/10001/11110/10000/10000/10000',
  Q:'01110/10001/10001/10001/10101/10010/01101',R:'11110/10001/10001/11110/10100/10010/10001',
  S:'01111/10000/10000/01110/00001/00001/11110',T:'11111/00100/00100/00100/00100/00100/00100',
  U:'10001/10001/10001/10001/10001/10001/01110',V:'10001/10001/10001/10001/10001/01010/00100',
  W:'10001/10001/10001/10101/10101/11011/10001',X:'10001/10001/01010/00100/01010/10001/10001',
  Y:'10001/10001/01010/00100/00100/00100/00100',Z:'11111/00001/00010/00100/01000/10000/11111',
  a:'0000/0000/0110/0001/0111/1001/0111',b:'1000/1000/1110/1001/1001/1001/1110',
  c:'0000/0000/0111/1000/1000/1000/0111',d:'0001/0001/0111/1001/1001/1001/0111',
  e:'0000/0000/0110/1001/1111/1000/0111',f:'0011/0100/1110/0100/0100/0100/0100',
  g:'0000/0000/0111/1001/1001/0111/0001/1110',h:'1000/1000/1110/1001/1001/1001/1001',
  i:'1/0/1/1/1/1/1',j:'01/00/01/01/01/01/01/10',
  k:'1000/1000/1001/1010/1100/1010/1001',l:'1/1/1/1/1/1/1',
  m:'00000/00000/11010/10101/10101/10101/10101',n:'0000/0000/1110/1001/1001/1001/1001',
  o:'0000/0000/0110/1001/1001/1001/0110',p:'0000/0000/1110/1001/1001/1110/1000/1000',
  q:'0000/0000/0111/1001/1001/0111/0001/0001',r:'0000/0000/1011/1100/1000/1000/1000',
  s:'0000/0000/0111/1000/0110/0001/1110',t:'0100/0100/1110/0100/0100/0101/0010',
  u:'0000/0000/1001/1001/1001/1001/0111',v:'00000/00000/10001/10001/10001/01010/00100',
  w:'00000/00000/10001/10001/10101/10101/01010',x:'0000/0000/1001/1001/0110/1001/1001',
  y:'0000/0000/1001/1001/1001/0111/0001/1110',z:'0000/0000/1111/0001/0110/1000/1111',
  '0':'01110/10001/10011/10101/11001/10001/01110','1':'010/110/010/010/010/010/111',
  '2':'01110/10001/00001/00010/00100/01000/11111','3':'11110/00001/00001/01110/00001/00001/11110',
  '4':'00010/00110/01010/10010/11111/00010/00010','5':'11111/10000/10000/11110/00001/00001/11110',
  '6':'01110/10000/10000/11110/10001/10001/01110','7':'11111/00001/00010/00100/01000/01000/01000',
  '8':'01110/10001/10001/01110/10001/10001/01110','9':'01110/10001/10001/01111/00001/00001/01110',
  '.':'0/0/0/0/0/1/1',',':'00/00/00/00/00/01/01/10',':':'0/1/1/0/1/1/0',
  ';':'00/01/01/00/01/01/10','!':'1/1/1/1/1/0/1','?':'01110/10001/00001/00010/00100/00000/00100',
  '-':'0000/0000/0000/1111/0000/0000/0000','+':'00000/00100/00100/11111/00100/00100/00000',
  '/':'00001/00001/00010/00100/01000/10000/10000',"'":'1/1/1/0/0/0/0','"':'101/101/101/000/000/000/000',
  '(':'001/010/100/100/100/010/001',')':'100/010/001/001/001/010/100',
  '[':'11/10/10/10/10/10/11',']':'11/01/01/01/01/01/11',
  '=':'0000/0000/1111/0000/1111/0000/0000','_':'00000/00000/00000/00000/00000/00000/11111',
  '%':'11001/11010/00100/00100/01000/10110/00110','*':'00000/10101/01110/11111/01110/10101/00000',
  '<':'0001/0010/0100/1000/0100/0010/0001','>':'1000/0100/0010/0001/0010/0100/1000',
  '^':'00100/01010/10001/00000/00000/00000/00000',
  'é':'0010/0100/0110/1001/1111/1000/0111','É':'00010/00100/11111/10000/11110/10000/11111',
  '♥':'00000/01010/11111/11111/01110/00100/00000',
  '♂':'00111/00011/00101/01000/10100/01000/00000','♀':'01110/10001/10001/01110/00100/01110/00100',
};

/** @type {Map<string,HTMLCanvasElement>} */
const TINTS = new Map();
const KEYS = Object.keys(GLYPHS);
const ROWS = KEYS.map(key => GLYPHS[/** @type {keyof typeof GLYPHS} */ (key)].split('/'));
const INDEX = new Map(KEYS.map((key, index) => [key, index]));

/** @param {string} character */
function normalize(character) {
  if (character === '’' || character === '‘') return "'";
  if (character === '“' || character === '”') return '"';
  if (character === '—' || character === '–') return '-';
  if (character === '…') return '.';
  return character;
}

/** @param {string} character */
function characterWidth(character) {
  if (character === ' ') return 3;
  const index = INDEX.get(normalize(character)) ?? INDEX.get('?') ?? 0;
  return (ROWS[index]?.[0]?.length ?? 5) + 1;
}

/** @param {string} value @param {number} [scale] */
export function textWidth(value, scale = 1) {
  return Math.max(0, Array.from(value).reduce((width, character) => width + characterWidth(character), 0) - 1) * scale;
}

/** @param {string} color */
function glyphAtlas(color) {
  const existing = TINTS.get(color);
  if (existing) return existing;
  const canvas = document.createElement('canvas');
  canvas.width = KEYS.length * 6; canvas.height = 9;
  const context = canvas.getContext('2d');
  if (!context) throw Error('A 2D canvas is required for text.');
  context.fillStyle = color;
  ROWS.forEach((rows, index) => rows.forEach((row, y) => Array.from(row).forEach((pixel, x) => {
    if (pixel === '1') context.fillRect(index * 6 + x, y, 1, 1);
  })));
  TINTS.set(color, canvas);
  return canvas;
}

/** @param {CanvasRenderingContext2D} context @param {string} value @param {number} x @param {number} y
 * @param {{color?:string,shadow?:boolean,scale?:number,align?:'left'|'center'|'right',maxWidth?:number}} [options] */
export function text(context, value, x, y, options = {}) {
  const scale = options.scale ?? 1;
  let left = Math.round(x - (options.align === 'center' ? textWidth(value, scale) / 2 : options.align === 'right' ? textWidth(value, scale) : 0));
  const top = Math.round(y), start = left;
  const atlas = glyphAtlas(options.color ?? '#fffbe8');
  const shadow = options.shadow === false ? null : glyphAtlas('#172746');
  for (const character of Array.from(value)) {
    const width = characterWidth(character);
    if (options.maxWidth !== undefined && left - start + width * scale > options.maxWidth) break;
    if (character !== ' ') {
      const index = INDEX.get(normalize(character)) ?? INDEX.get('?') ?? 0;
      if (shadow) context.drawImage(shadow, index * 6, 0, 6, 9, left + scale, top + scale, 6 * scale, 9 * scale);
      context.drawImage(atlas, index * 6, 0, 6, 9, left, top, 6 * scale, 9 * scale);
    }
    left += width * scale;
  }
  return left - start;
}

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
  const prefixWidth=speaker?textWidth(`${speaker}: `)+1:0;
  /** @type {string[]} */const pages=[];
  /** @type {string[]} */let lines=[];
  let line='';
  const available=()=>Math.max(32,208-(lines.length===0?prefixWidth:0));
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

/** @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {number} width @param {number} height
 * @param {{opacity?:number,pink?:boolean}} [options] */
export function panel(context, x, y, width, height, options = {}) {
  context.save();
  context.globalAlpha = options.opacity ?? 0.9;
  context.fillStyle = '#203b65'; context.fillRect(x + 3, y + 3, width - 6, height - 6);
  context.globalAlpha = 1;
  context.fillStyle = options.pink ? '#cbb2dc' : '#98abd8';
  context.fillRect(x, y + 2, 3, height - 4); context.fillRect(x + width - 3, y + 2, 3, height - 4);
  context.fillRect(x + 2, y, width - 4, 3); context.fillRect(x + 2, y + height - 3, width - 4, 3);
  context.fillStyle = options.pink ? '#f0d1e9' : '#c4d2ed'; context.fillRect(x + 2, y + 1, width - 4, 1);
  context.fillStyle = options.pink ? '#704975' : '#5167a8';
  context.fillRect(x + 3, y + 3, width - 6, 1); context.fillRect(x + 3, y + 3, 1, height - 6);
  context.fillRect(x + width - 4, y + 3, 1, height - 6); context.fillRect(x + 3, y + height - 4, width - 6, 1);
  context.restore();
}

/** @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {string} [color] */
export function cursor(context, x, y, color = '#fff2a0') {
  context.fillStyle = '#27364e'; context.fillRect(x + 1, y + 1, 2, 7); context.fillRect(x + 3, y + 2, 2, 5); context.fillRect(x + 5, y + 3, 2, 3);
  context.fillStyle = color; context.fillRect(x, y, 2, 7); context.fillRect(x + 2, y + 1, 2, 5); context.fillRect(x + 4, y + 2, 2, 3);
}
