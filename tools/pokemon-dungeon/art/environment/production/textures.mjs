// Tileable original texture pixels. No input images, asset downloads or game code.
import { Raster } from '../../pixel/raster.mjs';
const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16));
const hex = values => `#${values.map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}`;
const mix = (a,b,t) => hex(rgb(a).map((v,i) => v*(1-t)+rgb(b)[i]*t));
function hash(x,y,seed) { let v = Math.imul(x+391,374761393) ^ Math.imul(y+173,668265263) ^ seed; v = Math.imul(v ^ v>>>13,1274126177); return ((v ^ v>>>16)>>>0)/4294967295; }
const seedOf = id => [...id].reduce((n,c) => Math.imul(n,31)+c.charCodeAt(0)|0,137);
export function texture(id, pattern, colors) {
  const r = new Raster(128,128), seed=seedOf(id);
  for(let y=0;y<128;y++) for(let x=0;x<128;x++) {
    const fine=hash(x,y,seed), coarse=hash(Math.floor(x/4),Math.floor(y/4),seed);
    let t=.27+coarse*.38+fine*.17, seam=false;
    if(pattern==='earth') { const moss=hash(Math.floor((x+Math.sin(y/9)*4)/16),Math.floor(y/16),seed)> .63; t=moss?t*.65:t; }
    if(pattern==='stone'||pattern==='basalt'||pattern==='cobbles'||pattern==='pavers') {
      const cell=pattern==='cobbles'?16:pattern==='pavers'?32:32, distances=[];
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        const cx=Math.floor(x/cell)+dx,cy=Math.floor(y/cell)+dy,px=(cx+.5)*cell+(hash((cx+8)%8,(cy+8)%8,seed)-.5)*cell*.6,py=(cy+.5)*cell+(hash((cy+8)%8,(cx+8)%8,seed+1)-.5)*cell*.6;
        distances.push(Math.hypot(x-px,y-py));
      }
      distances.sort((a,b)=>a-b);const gap=distances[1]-distances[0];seam=gap<1.1;t+=gap>1.1&&gap<2.6?.19:0;
      if(pattern==='basalt')t*=.83;
    }
    if(pattern==='sand'||pattern==='snow') { t=.4+Math.sin(y*Math.PI/16+Math.sin(x*Math.PI/64)*2)*.08+fine*.2; if(pattern==='snow')t+=.12; }
    if(pattern==='planks'||pattern==='timber') { const plank=Math.floor(x/16); seam=x%16<1;t=.42+Math.sin(y*.3+plank*1.7)*.08+fine*.14+(plank%3)*.045; if((y+plank*23)%64<1)t=.15; }
    if(pattern==='foliage') { const cluster=hash(Math.floor(x/5),Math.floor(y/5),seed);t=.28+cluster*.55; if((x+y)%5===0)t+=.12; }
    if(pattern==='roof') { const row=Math.floor(y/12),xx=(x+(row%2)*8)%16;seam=y%12<1||xx<1;t=.36+(y%12)/25+fine*.16; }
    if(pattern==='ornament') { t=.58+fine*.13; if(y%32===3||y%32===5)t=.34; if(x%32===4&&y%32>3&&y%32<20)t=.42; }
    if(pattern==='water') { const wave=Math.sin(x*Math.PI/16+Math.sin(y*Math.PI/32)*2);t=.38+wave*.12+fine*.05;if(wave>.93&&y%4<2)t=.84; }
    if(pattern==='lava') { const flow=Math.sin(x*Math.PI/32+Math.sin(y*Math.PI/32)*2)+Math.cos(y*Math.PI/16);t=flow>.55?.65+fine*.2:.05+fine*.18; }
    r.pixel(x,y,seam?colors[0]:mix(colors[1],colors[2],Math.max(0,Math.min(1,t))));
  }
  // Hand-authored tiny surface chips and leaves add readable, intentional clusters.
  if(['earth','stone','sand','snow'].includes(pattern)) for(let i=0;i<35;i++){const x=Math.floor(hash(i,2,seed)*124),y=Math.floor(hash(i,3,seed)*124);r.line(x,y,x+2+(i%3),y-1,colors[i%3],1);}
  return r;
}
