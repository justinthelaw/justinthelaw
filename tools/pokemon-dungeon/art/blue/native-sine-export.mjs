import {nativeBattleInputs,battleDigest} from './native-battle-inputs.mjs';

/** Export the exact native quarter-wave table and its four-quadrant lookup. */
export async function exportNativeSine({emit}){
  const {files}=await nativeBattleInputs();
  const header=files.get('src/data/math.h')?.toString();
  const math=files.get('src/math.c')?.toString();
  const body=header?.match(/static const s16 sFastSinLookup\[\] = \{([\s\S]*?)\n\};/)?.[1];
  const nativeFunction=math?.match(/s32 sin_4096\(s32 x\)\n\{([\s\S]*?)\n\}/)?.[1];
  if(!body||!nativeFunction)throw Error('Pinned native sine sources are absent.');
  const values=[...body.matchAll(/-?\d+/g)].map(match=>Number(match[0]));
  if(values.length!==1024||values.some((value,index)=>!Number.isInteger(value)||value<0||value>255||index>0&&value<values[index-1]))throw Error('Native sine quarter-wave changed.');
  const normalized=nativeFunction.replace(/\s+/g,'');
  const expected='switch(x&0xc00){case0x000:returnsFastSinLookup[x&0x3ff];case0x400:returnsFastSinLookup[0x3ff-(x&0x3ff)];case0x800:return-sFastSinLookup[x&0x3ff];case0xc00:return-sFastSinLookup[0x3ff-(x&0x3ff)];}return0;';
  if(normalized!==expected)throw Error('Native sine quadrant routing changed.');
  const rows=[];for(let index=0;index<values.length;index+=16)rows.push(`  ${values.slice(index,index+16).join(',')},`);
  const data='/** Generated from pinned Rescue Team Red src/data/math.h and src/math.c. */\n'+
    `export const NATIVE_FAST_SINE=Object.freeze([\n${rows.join('\n')}\n]);\n`+
    '/** Exact native sin_4096 quadrant lookup. @param {number} x */\n'+
    'export function nativeSin4096(x){switch(x&0xc00){case 0x000:return NATIVE_FAST_SINE[x&0x3ff]??0;case 0x400:return NATIVE_FAST_SINE[0x3ff-(x&0x3ff)]??0;case 0x800:return -(NATIVE_FAST_SINE[x&0x3ff]??0);case 0xc00:return -(NATIVE_FAST_SINE[0x3ff-(x&0x3ff)]??0);default:return 0;}}\n';
  const modulePath='src/blue/battle-native-sine-data.js';
  await emit(new URL(`../../../../games/pokemon-dungeon-reimagined/${modulePath}`,import.meta.url),data);
  return{modulePath,bytes:Buffer.byteLength(data),sha256:battleDigest(data),entries:values.length,min:values[0],max:values.at(-1),quarterWaveSha256:battleDigest(JSON.stringify(values)),quadrantBodySha256:battleDigest(normalized),sourcePaths:['src/data/math.h','src/math.c']};
}
