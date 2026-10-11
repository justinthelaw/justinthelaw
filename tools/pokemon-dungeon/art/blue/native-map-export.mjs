import {blueChannel} from './native-format.mjs';

/** Parse published literal minimap masks; never load a ROM or runtime module. */
export function nativeMapData(source,windowColor){
  const sections=new Map([...source.matchAll(/^(\w+):\n([\s\S]*?)(?=^\.global |$(?![\s\S]))/gm)].map(match=>[match[1],match[2]]));
  const bytes=name=>Buffer.from([...sections.get(name).matchAll(/0x([0-9a-fA-F]{2})/g)].map(match=>parseInt(match[1],16)));
  const names=[...sections.get('gUnknown_85005B8').matchAll(/\.4byte (\w+)/g)].map(match=>match[1]);
  if(names.length!==192*4)throw Error('Native minimap pattern inventory changed.');
  const patterns=[];
  for(let index=0;index<192;index++){
    let expected='';
    for(let quadrant=0;quadrant<4;quadrant++){
      const data=bytes(names[index*4+quadrant]);if(data.length!==64)throw Error('Native map quadrant dimensions changed.');
      const ox=quadrant%2*4,oy=Math.floor(quadrant/2)*4;let pixels='';
      for(let y=0;y<4;y++)for(let x=0;x<4;x++)pixels+=((data.readUInt32LE((y+oy)*8+4)>>>((x+ox)*4))&15).toString(16);
      if(quadrant===0)expected=pixels;else if(pixels!==expected)throw Error('Native map quadrants are not equivalent.');
    }
    patterns.push(expected);
  }
  const raw=bytes('gUnknown_85011B8');if(raw.length!==64)throw Error('Native map palette changed.');
  const palette=Array.from({length:16},(_,index)=>'#'+[...raw.subarray(index*4,index*4+3)].map(value=>blueChannel(value).toString(16).padStart(2,'0')).join(''));
  // LoadDungeonMapPalette substitutes the current window-body color at index14.
  palette[14]=windowColor;
  return{patterns,palette};
}
