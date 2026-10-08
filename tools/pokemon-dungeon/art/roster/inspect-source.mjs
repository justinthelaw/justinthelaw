// Authoring-only geometry inspection. Never imports game code.
import { characters,render } from './characters.mjs';
import { clips } from '../production/pose.mjs';
const hits=[];let count=0;
for(const c of characters.filter(c=>!c.starter)){let minX=96,minY=96,maxX=-1,maxY=-1,border=0;for(const clip of clips)for(let d=0;d<8;d++)for(let f=0;f<4;f++){const r=render(c,d,clip.id,f);for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(r.data[(y*96+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(x<2||x>93||y<2||y>93)border++;}}if(border)hits.push({name:c.identity.name,minX,minY,maxX,maxY,border});count++;if(count%50===0)console.log(`inspected ${count}`);}
console.log(JSON.stringify(hits));
